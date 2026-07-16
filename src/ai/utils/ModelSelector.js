import { CONFIG } from "../config.js";

/**
 * ModelSelector resolves the appropriate model ID for a given provider, intent, and fallback status.
 */
export class ModelSelector {
  /**
   * Select a model based on provider, intent, and fallback status.
   * @param {string} providerName - e.g., 'groq', 'gemini', 'openrouter', 'huggingface'
   * @param {string} intent - Detected intent
   * @param {boolean} [isFallback=false] - Whether to get the fallback model
   * @returns {string} Model name/identifier
   */
  static select(providerName, intent, isFallback = false) {
    const provider = providerName.toLowerCase();
    const pConfig = CONFIG.providers[provider];

    if (!pConfig) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    if (provider === "huggingface") {
      return isFallback ? pConfig.fallbackImageModel : pConfig.defaultImageModel;
    }

    if (provider === "gemini" && intent === "image_generation") {
      return pConfig.imageModel;
    }

    if (provider === "openrouter" && (intent === "image_analysis" || intent === "ocr")) {
      return "meta-llama/llama-3.2-11b-vision-instruct";
    }

    if (provider === "openrouter" && intent === "image_generation") {
      return pConfig.defaultImageModel;
    }

    // Default routing mapping for text models
    return isFallback ? pConfig.fallbackModel : pConfig.defaultModel;
  }
}
export default ModelSelector;
