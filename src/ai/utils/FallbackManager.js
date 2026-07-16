/**
 * FallbackManager resolves fallback provider chains for automatic recovery.
 */
export class FallbackManager {
  /**
   * Resolves the fallback chain for a given provider and request type.
   * @param {string} currentProvider - Current failing provider
   * @param {string} [type='text'] - Type of request ('text', 'image', 'analysis')
   * @returns {Array<string>} List of fallback provider names in preference order
   */
  static getFallbackChain(currentProvider, type = "text") {
    const provider = currentProvider.toLowerCase();

    if (type === "image") {
      if (provider === "huggingface") {
        return ["gemini"];
      }
      if (provider === "gemini") {
        return ["huggingface"];
      }
      return ["huggingface"];
    }

    if (type === "analysis") {
      // Primary analysis is Gemini, no direct local fallback since others don't have Vision
      // but OpenRouter can serve vision models if configured. We fall back to OpenRouter.
      if (provider === "gemini") {
        return ["openrouter"];
      }
      return ["gemini"];
    }

    // Default text fallback chains
    switch (provider) {
      case "groq":
        return ["openrouter", "gemini"];
      case "openrouter":
        return ["gemini", "groq"];
      case "gemini":
        return ["openrouter", "groq"];
      default:
        return ["groq", "openrouter", "gemini"];
    }
  }
}
export default FallbackManager;
