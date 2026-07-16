/**
 * IntentDetector classifies user requests to determine the best provider and model.
 */
export class IntentDetector {
  /**
   * Automatically classify user prompts.
   * @param {string} prompt 
   * @param {Array} [history=[]] 
   * @returns {string} One of: 'general', 'programming', 'image_generation', 'image_analysis', 'ocr', 'translation', 'summarization', 'documents', 'reasoning'
   */
  static detect(prompt, history = []) {
    const text = (prompt || "").trim().toLowerCase();
    if (!text) return "general";

    // 1. Image Generation Intent
    const imageGenRegex = /(?:generate|create|draw|paint|make|sketch)\s+(?:an?\s+)?(?:image|picture|art|drawing|painting|photo|portrait|sketch|logo|illustration|render)/i;
    const imageGenKeywords = ["stable diffusion", "flux", "render of", "generate image", "create image"];
    if (imageGenRegex.test(text) || imageGenKeywords.some(kw => text.includes(kw))) {
      return "image_generation";
    }

    // 2. OCR Intent
    const ocrKeywords = ["ocr", "extract text", "read the text", "transcribe", "text from image", "read text from", "what is written"];
    if (ocrKeywords.some(kw => text.includes(kw))) {
      return "ocr";
    }

    // 3. Image Analysis Intent
    const imageAnalysisKeywords = ["analyze image", "describe image", "look at this image", "explain this image", "about this picture", "what is in this photo"];
    if (imageAnalysisKeywords.some(kw => text.includes(kw))) {
      return "image_analysis";
    }

    // 4. Translation Intent
    const translationKeywords = [
      "translate", "in spanish", "in french", "in german", "in japanese",
      "in chinese", "in russian", "in italian", "translate to", "how do you say"
    ];
    if (translationKeywords.some(kw => text.includes(kw))) {
      return "translation";
    }

    // 5. Summarization Intent
    const summaryKeywords = [
      "summarize", "summary of", "tldr", "tl;dr", "wrap up", "main points of",
      "condense this", "bullet points of"
    ];
    if (summaryKeywords.some(kw => text.includes(kw))) {
      return "summarization";
    }

    // 6. Documents Intent
    const documentKeywords = [
      "document", "file", "pdf", "docx", "xlsx", "csv", "spreadsheet",
      "attached document", "read document", "summarize file", "attached file"
    ];
    const hasDocKeyword = documentKeywords.some(kw => text.includes(kw));
    const hasDocInHistory = history.some(msg => {
      const content = (msg.content || msg.text || "").toLowerCase();
      return content.includes("[attached document:") || (msg.metadata && msg.metadata.documentName);
    });
    if (hasDocKeyword || hasDocInHistory) {
      return "documents";
    }

    // 7. Programming Intent (including Debugging)
    const programmingKeywords = [
      "code", "write a function", "javascript", "typescript", "python", "html",
      "css", "react component", "write a script", "git command", "npm i",
      "how to code", "class in", "algorithm", "regular expression", "regex",
      "error in", "bug in", "crash on", "failed to run", "nullpointer",
      "compile error", "runtime error", "why does this fail", "stack trace",
      "exception in", "fix this error", "undefined is not a function"
    ];
    if (programmingKeywords.some(kw => text.includes(kw)) || text.includes("```")) {
      return "programming";
    }

    // 8. Reasoning Intent (including Math)
    const reasoningKeywords = [
      "riddle", "logic puzzle", "prove that", "reasoning", "philosophical",
      "why does", "explain the difference between", "step-by-step logic",
      "calculate", "equation", "solve for x", "integral", "derivative",
      "fraction", "geometry", "algebra", "trigonometry", "matrix multiplication",
      "square root"
    ];
    if (reasoningKeywords.some(kw => text.includes(kw))) {
      return "reasoning";
    }

    // Default
    return "general";
  }
}
export default IntentDetector;
