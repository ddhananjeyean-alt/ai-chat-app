import { AIProvider } from "../AIProvider.js";
import { StreamingManager } from "../utils/StreamingManager.js";

export class GeminiProvider extends AIProvider {
  constructor(config) {
    super("Gemini", config);
    this._quotaExhaustedUntil = 0;
  }

  async getHealthStatus(forceRefresh = false) {
    if (Date.now() < this._quotaExhaustedUntil) {
      return { status: "unhealthy", error: "Image generation is temporarily unavailable on the fallback provider." };
    }
    return super.getHealthStatus(forceRefresh);
  }

  _handleQuotaError(status, message) {
    const msg = (message || "").toLowerCase();
    const isQuota = status === 429 ||
                    msg.includes("resource_exhausted") ||
                    msg.includes("quota exceeded") ||
                    msg.includes("quota") ||
                    msg.includes("rate limit");
    if (isQuota) {
      this._quotaExhaustedUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
    }
    return isQuota;
  }

  _formatMessages(messages) {
    let systemInstruction = undefined;
    const contents = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        systemInstruction = {
          parts: [{ text: msg.content }],
        };
      } else {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    return { contents, systemInstruction };
  }

  async generateText(messages, options = {}) {
    const model = options.model || this.config.defaultModel;
    const { contents, systemInstruction } = this._formatMessages(messages);

    const payload = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    };

    if (systemInstruction) {
      payload.systemInstruction = systemInstruction;
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), options.timeout || 15000);
    let abortHandler = null;
    if (options.signal) {
      abortHandler = () => controller.abort();
      options.signal.addEventListener("abort", abortHandler);
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `Gemini API failed with status ${response.status}`;
        this._handleQuotaError(response.status, errMsg);
        throw new Error(errMsg);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Gemini API returned an empty response.");
      }
      return text;
    } finally {
      clearTimeout(id);
      if (options.signal && abortHandler) {
        options.signal.removeEventListener("abort", abortHandler);
      }
    }
  }

  async streamResponse(messages, onChunk, options = {}) {
    const model = options.model || this.config.defaultModel;
    const { contents, systemInstruction } = this._formatMessages(messages);

    const payload = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    };

    if (systemInstruction) {
      payload.systemInstruction = systemInstruction;
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), options.timeout || 15000);
    let abortHandler = null;
    if (options.signal) {
      abortHandler = () => controller.abort();
      options.signal.addEventListener("abort", abortHandler);
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v1beta/models/${model}:streamGenerateContent?key=${this.config.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `Gemini Stream failed with status ${response.status}`;
        this._handleQuotaError(response.status, errMsg);
        throw new Error(errMsg);
      }

      await StreamingManager.consumeGeminiStream(response, onChunk, options.signal);
    } finally {
      clearTimeout(id);
      if (options.signal && abortHandler) {
        options.signal.removeEventListener("abort", abortHandler);
      }
    }
  }

  async analyzeImage(imageBase64, prompt, mimeType = "image/jpeg", options = {}) {
    const model = options.model || this.config.defaultModel;
    
    // Format payload for multi-modal Vision request
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            {
              text: prompt || "Describe this image in detail.",
            },
          ],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.4,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    };

    const systemPrompt = options.systemPrompt || "You are an expert visual analysis AI. Analyze the uploaded image in detail.";
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), options.timeout || 25000);
    let abortHandler = null;
    if (options.signal) {
      abortHandler = () => controller.abort();
      options.signal.addEventListener("abort", abortHandler);
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `Gemini Vision failed with status ${response.status}`;
        this._handleQuotaError(response.status, errMsg);
        throw new Error(errMsg);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Gemini Vision returned an empty description.");
      }
      return text;
    } finally {
      clearTimeout(id);
      if (options.signal && abortHandler) {
        options.signal.removeEventListener("abort", abortHandler);
      }
    }
  }

  async generateImage(prompt, options = {}) {
    if (Date.now() < this._quotaExhaustedUntil) {
      throw new Error("Image generation is temporarily unavailable on the fallback provider.");
    }

    const model = options.model || this.config.imageModel;
    const payload = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        imageConfig: {
          aspectRatio: options.aspectRatio || "1:1",
        }
      },
    };

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), options.timeout || 25000);
    let abortHandler = null;
    if (options.signal) {
      abortHandler = () => controller.abort();
      options.signal.addEventListener("abort", abortHandler);
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `Gemini Image Generation failed with status ${response.status}`;
        this._handleQuotaError(response.status, errMsg);
        if (Date.now() < this._quotaExhaustedUntil) {
          throw new Error("Image generation is temporarily unavailable on the fallback provider.");
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      let base64Data = null;
      let mimeType = "image/png";

      for (const part of parts) {
        if (part.inlineData) {
          base64Data = part.inlineData.data;
          mimeType = part.inlineData.mimeType || mimeType;
          break;
        }
      }

      if (!base64Data) {
        throw new Error("Gemini did not return any image data.");
      }

      return {
        imageUrl: `data:${mimeType};base64,${base64Data}`,
        modelUsed: model,
      };
    } finally {
      clearTimeout(id);
      if (options.signal && abortHandler) {
        options.signal.removeEventListener("abort", abortHandler);
      }
    }
  }

  async healthCheck() {
    try {
      await this.generateText(
        [{ role: "user", content: "ping" }],
        { maxTokens: 1, timeout: 3000 }
      );
      return { status: "healthy", latency: 0 };
    } catch (e) {
      return { status: "unhealthy", error: e.message };
    }
  }

  async summarize(text, options = {}) {
    const prompt = `Summarize the following text concisely. Keep the main points:\n\n${text}`;
    return this.generateText([{ role: "user", content: prompt }], options);
  }

  async translate(text, targetLang, options = {}) {
    const prompt = `Translate the following text to ${targetLang}. Return ONLY the translation, no extra text:\n\n${text}`;
    return this.generateText([{ role: "user", content: prompt }], options);
  }
}
export default GeminiProvider;
