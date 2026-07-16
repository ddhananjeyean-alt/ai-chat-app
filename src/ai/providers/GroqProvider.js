import { AIProvider } from "../AIProvider.js";
import { StreamingManager } from "../utils/StreamingManager.js";

export class GroqProvider extends AIProvider {
  constructor(config) {
    super("Groq", config);
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
      const response = await fetch(this.config.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
          `Groq API request failed with status ${response.status}`
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

  async healthCheck() {
    try {
      await this.generateText(
        [{ role: "user", content: "ping" }],
        { maxTokens: 1, timeout: 3000 }
      );
      return { status: "healthy", latency: 0 }; // latency calculation if needed
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
export default GroqProvider;
