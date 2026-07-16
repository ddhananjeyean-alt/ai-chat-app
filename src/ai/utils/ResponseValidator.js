/**
 * ResponseValidator cleans up and validates AI outputs.
 */
export class ResponseValidator {
  /**
   * Cleans and validates response text.
   * @param {string} text - The raw response text
   * @param {Object} [options={}] - Validation options
   * @param {boolean} [options.json=false] - If true, ensures JSON is valid
   * @returns {string} Cleaned/repaired text
   */
  static validate(text, options = {}) {
    if (!text) return "";

    let validatedText = text;

    // 1. Repair broken markdown code fences
    validatedText = this.repairCodeFences(validatedText);

    // 2. Validate JSON structure if expected
    if (options.json) {
      validatedText = this.repairAndValidateJSON(validatedText);
    }

    return validatedText;
  }

  /**
   * Automatically closes unclosed code fences.
   */
  static repairCodeFences(text) {
    const fenceRegex = /```/g;
    const matches = text.match(fenceRegex);
    const count = matches ? matches.length : 0;

    // If the count of ``` is odd, it means a code block was left open
    if (count % 2 !== 0) {
      console.warn("Detected unclosed markdown code fence, auto-closing.");
      return text + "\n```";
    }
    return text;
  }

  /**
   * Attempts to clean up and validate JSON blocks.
   */
  static repairAndValidateJSON(text) {
    let cleanText = text.trim();

    // Extract JSON if it is wrapped in markdown code fences
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = cleanText.match(jsonBlockRegex);
    if (match) {
      cleanText = match[1].trim();
    }

    try {
      // Validate by parsing
      JSON.parse(cleanText);
      return cleanText;
    } catch (e) {
      console.warn("JSON validation failed. Attempting basic repairs.", e.message);
      
      // Simple repair: add missing brackets at the end
      if (cleanText.startsWith("{") && !cleanText.endsWith("}")) {
        try {
          const repaired = cleanText + "}";
          JSON.parse(repaired);
          return repaired;
        } catch (_) {}
      }
      if (cleanText.startsWith("[") && !cleanText.endsWith("]")) {
        try {
          const repaired = cleanText + "]";
          JSON.parse(repaired);
          return repaired;
        } catch (_) {}
      }

      // Return raw text if we cannot parse it, but log validation failure
      return cleanText;
    }
  }
}
export default ResponseValidator;
