/**
 * PromptEnhancer cleans and normalizes prompt inputs before sending them to AI providers.
 */
export class PromptEnhancer {
  /**
   * Cleans, normalizes, and slightly expands simple prompts.
   * @param {string} prompt - Raw prompt from user
   * @returns {string} Cleaned and normalized prompt
   */
  static enhance(prompt) {
    if (!prompt) return "";

    // 1. Remove duplicate whitespaces and trim
    let cleaned = prompt.replace(/\s+/g, " ").trim();

    // 2. Normalize common punctuation and spacing
    cleaned = cleaned.replace(/\s*([,.!?;:])\s*/g, "$1 "); // Ensure exactly 1 space after punctuation
    cleaned = cleaned.replace(/\s+/g, " ").trim(); // Trim again in case spaces were introduced

    // 3. Capitalize first letter of sentences
    cleaned = cleaned.replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, prefix, char) => {
      return prefix + char.toUpperCase();
    });

    // 4. Expand extremely vague prompts slightly without changing intent
    const vagueExpansions = {
      "hi": "Hello! How can I assist you today?",
      "hello": "Hello! How can I assist you today?",
      "help": "Could you provide assistance or guidance on how to use this application?",
      "explain": "Please provide a detailed explanation of this topic.",
      "code": "Please generate code for this request.",
    };

    const lowerCleaned = cleaned.toLowerCase();
    if (vagueExpansions[lowerCleaned]) {
      return vagueExpansions[lowerCleaned];
    }

    return cleaned;
  }

  /**
   * Enhances prompts specifically for image generation, adding details for lighting,
   * composition, quality, and style while preserving the original user intent.
   * @param {string} prompt 
   * @returns {string} Enhanced image prompt
   */
  static enhanceImagePrompt(prompt) {
    if (!prompt) return "";
    
    let cleaned = prompt.replace(/\s+/g, " ").trim();
    if (cleaned.length === 0) return "";
    
    const detailKeywords = [
      "photorealistic", "hyperrealistic", "detailed", "4k", "8k", "cinematic",
      "lighting", "studio", "masterpiece", "rendered", "octane", "unreal engine",
      "bokeh", "depth of field", "style", "digital art", "illustration"
    ];
    
    const hasDetails = detailKeywords.some(kw => cleaned.toLowerCase().includes(kw));
    
    if (cleaned.length < 50 && !hasDetails) {
      const promptLower = cleaned.toLowerCase();
      
      if (promptLower.includes("dog") || promptLower.includes("cat") || promptLower.includes("animal") || promptLower.includes("bird")) {
        cleaned = `A beautiful, highly detailed portrait of a ${cleaned}, professional animal photography, studio lighting, sharp focus, 8k resolution, photorealistic.`;
      } else if (promptLower.includes("city") || promptLower.includes("street") || promptLower.includes("building") || promptLower.includes("cyberpunk")) {
        cleaned = `A stunning cinematic rendering of a ${cleaned}, detailed architecture, ambient street lighting, dramatic clouds, Unreal Engine 5 render, highly detailed, 8k.`;
      } else if (promptLower.includes("person") || promptLower.includes("woman") || promptLower.includes("man") || promptLower.includes("girl") || promptLower.includes("boy") || promptLower.includes("portrait")) {
        cleaned = `A photorealistic portrait of ${cleaned}, soft studio lighting, high detail skin texture, detailed eyes, professional photography, cinematic composition, 8k.`;
      } else if (promptLower.includes("landscape") || promptLower.includes("mountain") || promptLower.includes("forest") || promptLower.includes("lake") || promptLower.includes("nature")) {
        cleaned = `A breathtaking landscape of ${cleaned}, volumetric lighting, vivid natural colors, realistic textures, detailed scenery, high dynamic range, masterpiece.`;
      } else {
        cleaned = `A beautiful digital artwork of ${cleaned}, highly detailed, vibrant color palette, clear details, volumetric lighting, artistic style, 8k resolution.`;
      }
    } else {
      if (!cleaned.toLowerCase().includes("highly detailed") && !cleaned.toLowerCase().includes("resolution")) {
        cleaned = `${cleaned}, highly detailed, cinematic lighting, 8k resolution`;
      }
    }
    
    return cleaned;
  }
}
export default PromptEnhancer;
