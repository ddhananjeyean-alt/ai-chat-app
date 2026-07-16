import { ModelSelector } from "./utils/ModelSelector.js";

/**
 * AIRouter routes intents to the correct primary provider and model.
 */
export class AIRouter {
  /**
   * Determine the best provider and model for a given intent.
   * @param {string} intent - Detected intent
   * @returns {Object} { provider, model }
   */
  static route(intent) {
    let provider = "groq";

    switch (intent) {
      case "general":
      case "programming":
      case "summarization":
      case "reasoning":
        // Groq handles general chat, coding/programming, summarization, and reasoning.
        provider = "groq";
        break;
      
      case "image_analysis":
      case "ocr":
      case "translation":
      case "documents":
        // Gemini handles vision, OCR, multilingual translation, and document content.
        provider = "gemini";
        break;
      
      case "image_generation":
        // Hugging Face handles image generation.
        provider = "huggingface";
        break;
        
      default:
        provider = "groq";
        break;
    }

    const model = ModelSelector.select(provider, intent);

    return { provider, model };
  }
}
export default AIRouter;
