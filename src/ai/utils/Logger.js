/**
 * Logger provides central, structured logging for all AI Engine operations.
 * It ensures API keys are never exposed.
 */
export class Logger {
  /**
   * Logs a successful AI request.
   * @param {Object} info 
   * @param {string} info.provider
   * @param {string} info.model
   * @param {number} info.duration - Latency in ms
   * @param {number} [info.tokens] - Tokens used
   * @param {number} [info.retries] - Number of retries
   * @param {string} [info.intent] - Detected intent
   */
  static logRequest(info) {
    const { provider, model, duration, tokens, retries, intent } = info;
    console.groupCollapsed(
      `%c[AI Engine] ${provider} Request Success - ${duration}ms`,
      "color: #10b981; font-weight: bold;"
    );
    console.log(`Provider: ${provider}`);
    console.log(`Model: ${model}`);
    console.log(`Latency: ${duration}ms`);
    console.log(`Intent: ${intent || "N/A"}`);
    console.log(`Tokens Used: ${tokens !== undefined ? tokens : "N/A"}`);
    console.log(`Retries: ${retries || 0}`);
    console.groupEnd();
  }

  /**
   * Logs a failure.
   * @param {Object} info 
   * @param {string} info.provider
   * @param {string} info.model
   * @param {Error} info.error
   * @param {number} [info.retries]
   */
  static logFailure(info) {
    const { provider, model, error, retries } = info;
    const cleanMessage = this.maskAPIKeys(error.message || String(error));
    
    console.group(
      `%c[AI Engine] ${provider} Request Failed`,
      "color: #ef4444; font-weight: bold;"
    );
    console.log(`Provider: ${provider}`);
    console.log(`Model: ${model || "Unknown"}`);
    console.log(`Retries: ${retries || 0}`);
    console.error(`Error: ${cleanMessage}`);
    console.groupEnd();
  }

  /**
   * Masks any potential API keys in log strings.
   * @param {string} text 
   * @returns {string} Cleaned text
   */
  static maskAPIKeys(text) {
    if (!text) return "";
    
    // Mask typical API key pattern like AIzaSy..., gsk_..., sk-or-...
    let masked = text;
    masked = masked.replace(/gsk_[a-zA-Z0-9]{40,}/g, "[GROQ_KEY_MASKED]");
    masked = masked.replace(/sk-or-v1-[a-zA-Z0-9]{64}/g, "[OPENROUTER_KEY_MASKED]");
    masked = masked.replace(/AIzaSy[a-zA-Z0-9\-_]{33}/g, "[GEMINI_KEY_MASKED]");
    masked = masked.replace(/hf_[a-zA-Z0-9]{34,}/g, "[HUGGINGFACE_KEY_MASKED]");
    return masked;
  }
}
export default Logger;
