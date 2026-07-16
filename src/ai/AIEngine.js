import { CONFIG } from "./config.js";
import { GroqProvider } from "./providers/GroqProvider.js";
import { GeminiProvider } from "./providers/GeminiProvider.js";
import { OpenRouterProvider } from "./providers/OpenRouterProvider.js";
import { HuggingFaceProvider } from "./providers/HuggingFaceProvider.js";

import { IntentDetector } from "./utils/IntentDetector.js";
import { ModelSelector } from "./utils/ModelSelector.js";
import { PromptEnhancer } from "./utils/PromptEnhancer.js";
import { ContextManager } from "./utils/ContextManager.js";
import { RetryManager } from "./utils/RetryManager.js";
import { ResponseValidator } from "./utils/ResponseValidator.js";
import { FallbackManager } from "./utils/FallbackManager.js";
import { Logger } from "./utils/Logger.js";
import { DocumentChunker } from "./utils/DocumentChunker.js";
import { AIRouter } from "./AIRouter.js";

export class AIEngine {
  constructor() {
    this.providers = {
      groq: new GroqProvider(CONFIG.providers.groq),
      gemini: new GeminiProvider(CONFIG.providers.gemini),
      openrouter: new OpenRouterProvider(CONFIG.providers.openrouter),
      huggingface: new HuggingFaceProvider(CONFIG.providers.huggingface),
    };
  }

  /**
   * Helper to format history mapping to client format [{role, content}]
   */
  _formatHistory(history) {
    if (!history) return [];
    return history.map(msg => {
      let content = msg.text || msg.content || "";
      if (msg.metadata && msg.metadata.documentName && msg.metadata.documentText) {
        content = `[Attached Document: ${msg.metadata.documentName}]\n---\n${msg.metadata.documentText}\n---\nUser prompt: ${content}`;
      }
      return {
        role: msg.sender === "user" ? "user" : (msg.role || "assistant"),
        content,
      };
    });
  }

  /**
   * Generate text response from the best routed provider with fallback.
   */
  async generateText(prompt, options = {}) {
    const isDev = (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") || (typeof window !== "undefined" && window.localStorage?.getItem("debug") === "true");
    const contextStart = Date.now();

    const formattedHistory = this._formatHistory(options.history || []);
    const intent = IntentDetector.detect(prompt, formattedHistory);
    const enhancedPrompt = PromptEnhancer.enhance(prompt);

    // Context management optimization
    const optimizedHistory = ContextManager.optimize(formattedHistory, 12, options.summary);
    
    let userContent = enhancedPrompt;
    if (options.documentName && options.documentText) {
      const relevantText = DocumentChunker.getRelevantChunks(options.documentText, prompt);
      userContent = `[Attached Document: ${options.documentName}]\n---\n${relevantText}\n---\nUser prompt: ${userContent}`;
    }

    // Add current user prompt
    const messages = [
      ...optimizedHistory,
      { role: "user", content: userContent }
    ];

    // Add optional default system instruction if not in history
    if (options.systemPrompt && !messages.some(m => m.role === "system")) {
      messages.unshift({ role: "system", content: options.systemPrompt });
    }

    const contextBuildDuration = Date.now() - contextStart;
    if (isDev) {
      console.log(`[AI Engine Performance] Context build time: ${contextBuildDuration}ms`);
    }

    const textIntent = intent === "image_generation" ? "general" : intent;
    const route = AIRouter.route(textIntent);
    let currentProviderName = options.provider || route.provider;
    let currentModel = options.model || (options.provider ? ModelSelector.select(options.provider, textIntent) : route.model);

    const fallbackChain = [
      currentProviderName,
      ...FallbackManager.getFallbackChain(currentProviderName, "text")
    ];

    const errors = [];
    let attemptCount = 0;

    for (const providerName of fallbackChain) {
      const provider = this.providers[providerName];
      if (!provider) continue;

      // Detect provider availability before making a request
      const status = await provider.getHealthStatus().catch(() => ({ status: "unhealthy" }));
      if (status.status === "unhealthy") {
        errors.push(`${provider.name}: Unavailable (${status.error || "Health check failed"})`);
        if (isDev) {
          console.warn(`[AI Engine] Skipping unavailable provider: ${provider.name}. Reason: ${status.error || "Unknown"}`);
        }
        
        attemptCount++;
        // On fallback, dynamically resolve the model for the new provider
        const nextIdx = fallbackChain.indexOf(providerName) + 1;
        if (nextIdx < fallbackChain.length) {
          const nextProviderName = fallbackChain[nextIdx];
          currentModel = ModelSelector.select(nextProviderName, textIntent);
        }
        continue;
      }

      const startTime = Date.now();
      try {
        const text = await RetryManager.execute(async () => {
          return await provider.generateText(messages, {
            ...options,
            model: currentModel,
          });
        });

        const duration = Date.now() - startTime;
        if (isDev) {
          console.log(`[AI Engine Performance] Provider response time for ${provider.name} (${currentModel}): ${duration}ms`);
        }
        const validatedText = ResponseValidator.validate(text, options);

        Logger.logRequest({
          provider: provider.name,
          model: currentModel,
          duration,
          retries: attemptCount,
          intent,
        });

        return validatedText;
      } catch (err) {
        errors.push(`${provider.name}: ${err.message || err}`);
        Logger.logFailure({
          provider: provider.name,
          model: currentModel,
          error: err,
          retries: attemptCount,
        });

        attemptCount++;
        // On fallback, dynamically resolve the model for the new provider
        const nextIdx = fallbackChain.indexOf(providerName) + 1;
        if (nextIdx < fallbackChain.length) {
          const nextProviderName = fallbackChain[nextIdx];
          currentModel = ModelSelector.select(nextProviderName, textIntent);
        }
      }
    }

    const isDebug = typeof window !== "undefined" && window.localStorage?.getItem("debug") === "true";
    if (isDebug) {
      throw new Error("Text generation failed across all providers:\n" + errors.map(e => `• ${e}`).join("\n"));
    } else {
      throw new Error("⚠️ The AI service is currently unavailable. Please check your connection or try again in a moment.");
    }
  }

  /**
   * Specifically route programming requests.
   */
  async generateCode(prompt, options = {}) {
    return this.generateText(prompt, {
      ...options,
      intentOverride: "programming",
    });
  }

  /**
   * Generate an image with fallbacks.
   */
  async generateImage(prompt, options = {}) {
    const isDev = (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") || (typeof window !== "undefined" && window.localStorage?.getItem("debug") === "true");
    const enhancedPrompt = PromptEnhancer.enhanceImagePrompt(prompt);
    
    // Default image route: HuggingFace (FLUX)
    let currentProviderName = options.provider || "huggingface";
    let currentModel = options.model || ModelSelector.select(currentProviderName, "image_generation");

    const fallbackChain = [
      currentProviderName,
      ...FallbackManager.getFallbackChain(currentProviderName, "image")
    ];

    const errors = [];
    let attemptCount = 0;

    for (const providerName of fallbackChain) {
      const provider = this.providers[providerName];
      if (!provider) continue;

      // Detect provider availability before making a request
      const status = await provider.getHealthStatus().catch(() => ({ status: "unhealthy" }));
      if (status.status === "unhealthy") {
        errors.push(`${provider.name}: Unavailable (${status.error || "Health check failed"})`);
        if (isDev) {
          console.warn(`[AI Engine] Skipping unavailable image provider: ${provider.name}. Reason: ${status.error || "Unknown"}`);
        }
        
        attemptCount++;
        const nextIdx = fallbackChain.indexOf(providerName) + 1;
        if (nextIdx < fallbackChain.length) {
          const nextProviderName = fallbackChain[nextIdx];
          currentModel = ModelSelector.select(nextProviderName, "image_generation");
        }
        continue;
      }

      const startTime = Date.now();
      try {
        const result = await RetryManager.execute(async () => {
          return await provider.generateImage(enhancedPrompt, {
            ...options,
            model: currentModel,
          });
        });

        const duration = Date.now() - startTime;
        if (isDev) {
          console.log(`[AI Engine Performance] Image generation response time for ${provider.name}: ${duration}ms`);
        }

        Logger.logRequest({
          provider: provider.name,
          model: currentModel,
          duration,
          retries: attemptCount,
          intent: "image_generation",
        });

        return result;
      } catch (err) {
        errors.push(`${provider.name}: ${err.message || err}`);
        Logger.logFailure({
          provider: provider.name,
          model: currentModel,
          error: err,
          retries: attemptCount,
        });

        attemptCount++;
        const nextIdx = fallbackChain.indexOf(providerName) + 1;
        if (nextIdx < fallbackChain.length) {
          const nextProviderName = fallbackChain[nextIdx];
          currentModel = ModelSelector.select(nextProviderName, "image_generation");
        }
      }
    }

    const geminiProvider = this.providers.gemini;
    const isGeminiQuotaExhausted = geminiProvider && (
      (geminiProvider._quotaExhaustedUntil && Date.now() < geminiProvider._quotaExhaustedUntil) ||
      errors.some(e => e.includes("Image generation is temporarily unavailable on the fallback provider."))
    );

    if (isGeminiQuotaExhausted) {
      throw new Error("Image generation is temporarily unavailable on the fallback provider.");
    }

    const isDebug = typeof window !== "undefined" && window.localStorage?.getItem("debug") === "true";
    if (isDebug) {
      throw new Error("Image generation failed across all providers:\n" + errors.map(e => `• ${e}`).join("\n"));
    } else {
      throw new Error("⚠️ Image generation service is currently unavailable. Please try again in a moment.");
    }
  }

  /**
   * Analyze image (OCR, descriptions) using Vision-capable providers (Gemini).
   */
  async analyzeImage(imageBase64, prompt, mimeType = "image/jpeg", options = {}) {
    const isDev = (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") || (typeof window !== "undefined" && window.localStorage?.getItem("debug") === "true");
    const contextStart = Date.now();
    const enhancedPrompt = PromptEnhancer.enhance(prompt || "Describe this image.");
    
    // Fix routing: Force vision-capable providers only.
    let currentProviderName = options.provider || "gemini";
    if (currentProviderName !== "gemini" && currentProviderName !== "openrouter") {
      currentProviderName = "gemini";
    }
    let currentModel = options.model || ModelSelector.select(currentProviderName, "image_analysis");

    // Filter fallback chain to only contain vision-capable providers.
    const fallbackChain = [
      currentProviderName,
      ...FallbackManager.getFallbackChain(currentProviderName, "analysis")
    ].filter(p => p === "gemini" || p === "openrouter");

    const errors = [];
    let attemptCount = 0;

    // Log visual analysis parameters as requested:
    console.log(`[AI Vision Request Details]
- Provider: ${currentProviderName}
- Model: ${currentModel}
- Image attached: ${imageBase64 ? "YES" : "NO"}
- Payload size: ${imageBase64 ? imageBase64.length : 0} bytes
- Image MIME type: ${mimeType}`);

    if (isDev) {
      console.log(`[AI Engine Performance] Vision context build time: ${Date.now() - contextStart}ms`);
    }

    for (const providerName of fallbackChain) {
      const provider = this.providers[providerName];
      if (!provider) continue;

      // Detect provider availability before making a request
      const status = await provider.getHealthStatus().catch(() => ({ status: "unhealthy" }));
      if (status.status === "unhealthy") {
        errors.push(`${provider.name}: Unavailable (${status.error || "Health check failed"})`);
        if (isDev) {
          console.warn(`[AI Engine] Skipping unavailable vision provider: ${provider.name}. Reason: ${status.error || "Unknown"}`);
        }
        
        attemptCount++;
        const nextIdx = fallbackChain.indexOf(providerName) + 1;
        if (nextIdx < fallbackChain.length) {
          const nextProviderName = fallbackChain[nextIdx];
          currentModel = ModelSelector.select(nextProviderName, "image_analysis");
        }
        continue;
      }

      const startTime = Date.now();
      try {
        const text = await RetryManager.execute(async () => {
          return await provider.analyzeImage(imageBase64, enhancedPrompt, mimeType, {
            ...options,
            model: currentModel,
          });
        });

        const duration = Date.now() - startTime;
        if (isDev) {
          console.log(`[AI Engine Performance] Vision analysis response time for ${provider.name}: ${duration}ms`);
        }
        const validatedText = ResponseValidator.validate(text, options);

        Logger.logRequest({
          provider: provider.name,
          model: currentModel,
          duration,
          retries: attemptCount,
          intent: "image_analysis",
        });

        return validatedText;
      } catch (err) {
        errors.push(`${provider.name}: ${err.message || err}`);
        Logger.logFailure({
          provider: provider.name,
          model: currentModel,
          error: err,
          retries: attemptCount,
        });

        attemptCount++;
        const nextIdx = fallbackChain.indexOf(providerName) + 1;
        if (nextIdx < fallbackChain.length) {
          const nextProviderName = fallbackChain[nextIdx];
          currentModel = ModelSelector.select(nextProviderName, "image_analysis");
        }
      }
    }

    const isDebug = typeof window !== "undefined" && window.localStorage?.getItem("debug") === "true";
    if (isDebug) {
      throw new Error("Image analysis failed across all Vision providers:\n" + errors.map(e => `• ${e}`).join("\n"));
    } else {
      throw new Error("⚠️ Vision analysis is currently unavailable. Please try again in a moment.");
    }
  }

  /**
   * Stream response to UI, supporting sequential provider fallbacks in real-time.
   */
  async streamResponse(prompt, onChunk, options = {}) {
    const isDev = (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") || (typeof window !== "undefined" && window.localStorage?.getItem("debug") === "true");
    const contextStart = Date.now();

    const formattedHistory = this._formatHistory(options.history || []);
    const intent = options.intentOverride || IntentDetector.detect(prompt, formattedHistory);
    const enhancedPrompt = PromptEnhancer.enhance(prompt);

    const optimizedHistory = ContextManager.optimize(formattedHistory, 12, options.summary);
    
    let userContent = enhancedPrompt;
    if (options.documentName && options.documentText) {
      const relevantText = DocumentChunker.getRelevantChunks(options.documentText, prompt);
      userContent = `[Attached Document: ${options.documentName}]\n---\n${relevantText}\n---\nUser prompt: ${userContent}`;
    }

    const messages = [
      ...optimizedHistory,
      { role: "user", content: userContent }
    ];

    if (options.systemPrompt && !messages.some(m => m.role === "system")) {
      messages.unshift({ role: "system", content: options.systemPrompt });
    }

    const contextBuildDuration = Date.now() - contextStart;
    if (isDev) {
      console.log(`[AI Engine Performance] Stream context build time: ${contextBuildDuration}ms`);
    }

    const route = AIRouter.route(intent);
    let currentProviderName = options.provider || route.provider;
    let currentModel = options.model || (options.provider ? ModelSelector.select(options.provider, intent) : route.model);

    const fallbackChain = [
      currentProviderName,
      ...FallbackManager.getFallbackChain(currentProviderName, "text")
    ];

    const errors = [];
    let attemptCount = 0;

    for (const providerName of fallbackChain) {
      const provider = this.providers[providerName];
      if (!provider) continue;

      // Detect provider availability before making a request
      const status = await provider.getHealthStatus().catch(() => ({ status: "unhealthy" }));
      if (status.status === "unhealthy") {
        errors.push(`${provider.name}: Unavailable (${status.error || "Health check failed"})`);
        if (isDev) {
          console.warn(`[AI Engine] Skipping unavailable streaming provider: ${provider.name}. Reason: ${status.error || "Unknown"}`);
        }
        
        attemptCount++;
        const nextIdx = fallbackChain.indexOf(providerName) + 1;
        if (nextIdx < fallbackChain.length) {
          const nextProviderName = fallbackChain[nextIdx];
          currentModel = ModelSelector.select(nextProviderName, intent);
        }
        continue;
      }

      const startTime = Date.now();
      try {
        await RetryManager.execute(async () => {
          return await provider.streamResponse(messages, onChunk, {
            ...options,
            model: currentModel,
          });
        });

        const duration = Date.now() - startTime;
        if (isDev) {
          console.log(`[AI Engine Performance] Streaming response time for ${provider.name} (${currentModel}): ${duration}ms`);
        }

        Logger.logRequest({
          provider: provider.name,
          model: currentModel,
          duration,
          retries: attemptCount,
          intent,
        });

        return; // Success
      } catch (err) {
        errors.push(`${provider.name}: ${err.message || err}`);
        Logger.logFailure({
          provider: provider.name,
          model: currentModel,
          error: err,
          retries: attemptCount,
        });

        attemptCount++;
        const nextIdx = fallbackChain.indexOf(providerName) + 1;
        if (nextIdx < fallbackChain.length) {
          const nextProviderName = fallbackChain[nextIdx];
          currentModel = ModelSelector.select(nextProviderName, intent);
        }
      }
    }

    const isDebug = typeof window !== "undefined" && window.localStorage?.getItem("debug") === "true";
    if (isDebug) {
      throw new Error("Streaming failed across all providers:\n" + errors.map(e => `• ${e}`).join("\n"));
    } else {
      throw new Error("⚠️ The AI service is currently unavailable. Please check your connection or try again in a moment.");
    }
  }

  /**
   * Health checks for configured providers.
   */
  async healthCheck() {
    const statuses = {};
    for (const [name, provider] of Object.entries(this.providers)) {
      try {
        statuses[name] = await provider.healthCheck();
      } catch (e) {
        statuses[name] = { status: "unhealthy", error: e.message };
      }
    }
    return statuses;
  }

  /**
   * Summarize a text block.
   */
  async summarize(text, options = {}) {
    return this.generateText(text, {
      ...options,
      intentOverride: "summarization",
    });
  }

  /**
   * Translate text to target language.
   */
  async translate(text, targetLang, options = {}) {
    return this.generateText(text, {
      ...options,
      intentOverride: "translation",
      targetLang,
    });
  }
}

// Single singleton instance export
export const aiEngine = new AIEngine();
export default aiEngine;
