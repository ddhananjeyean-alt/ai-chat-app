import { AIProvider } from "../AIProvider.js";
import { StreamingManager } from "../utils/StreamingManager.js";

export class OpenRouterProvider extends AIProvider {
  constructor(config) {
    super("OpenRouter", config);
  }

  async _request(payload, timeout, signal) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    let abortHandler = null;
    if (signal) {
      abortHandler = () => controller.abort();
      signal.addEventListener("abort", abortHandler);
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          // OpenRouter specific headers (optional but recommended)
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "Premium AI Chat App",
        },
        body: JSON.stringify({
          ...payload,
          model: payload.model || this.config.defaultModel,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
          errorData.message ||
          `OpenRouter request failed with status ${response.status}`
        );
      }

      return response;
    } finally {
      clearTimeout(id);
      if (signal && abortHandler) {
        signal.removeEventListener("abort", abortHandler);
      }
    }
  }

  async generateText(messages, options = {}) {
    const payload = {
      messages,
      model: options.model || this.config.defaultModel,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      stream: false,
    };

    const response = await this._request(payload, options.timeout || 15000, options.signal);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async streamResponse(messages, onChunk, options = {}) {
    const payload = {
      messages,
      model: options.model || this.config.defaultModel,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      stream: true,
    };

    const response = await this._request(payload, options.timeout || 15000, options.signal);
    await StreamingManager.consumeOpenAISSE(response, onChunk, options.signal);
  }

  async analyzeImage(imageBase64, prompt, mimeType = "image/jpeg", options = {}) {
    const model = options.model || "meta-llama/llama-3.2-11b-vision-instruct";
    const payload = {
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt || "Describe this image in detail.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 2048,
    };

    const response = await this._request(payload, options.timeout || 25000, options.signal);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async generateImage(prompt, options = {}) {
    const model = options.model || this.config.defaultImageModel || "black-forest-labs/flux.2-klein-4b";
    const url = `${this.config.baseUrl}/images`;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), options.timeout || 25000);
    let abortHandler = null;
    if (options.signal) {
      abortHandler = () => controller.abort();
      options.signal.addEventListener("abort", abortHandler);
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "Premium AI Chat App",
        },
        body: JSON.stringify({
          model,
          prompt,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `OpenRouter image generation failed with status ${response.status}: ${errorText || response.statusText}`
        );
      }

      const data = await response.json();
      const base64Data = data.data?.[0]?.b64_json;
      const mediaType = data.data?.[0]?.media_type || "image/png";

      if (!base64Data) {
        throw new Error("OpenRouter did not return any image data.");
      }

      const imageUrl = base64Data.startsWith("data:") 
        ? base64Data 
        : `data:${mediaType};base64,${base64Data}`;

      return {
        imageUrl,
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
export default OpenRouterProvider;
