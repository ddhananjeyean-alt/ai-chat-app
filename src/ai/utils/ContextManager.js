/**
 * ContextManager optimizes conversation context sent to the provider.
 * Slices message history and manages token/character limits.
 */
export class ContextManager {
  /**
   * Optimizes messages for API transmission.
   * @param {Array} messages - Array of standard messages { role, content }
   * @param {number} [maxRecent=10] - Number of recent messages to retain
   * @param {string} [conversationSummary=""] - Optional summary of older messages
   * @returns {Array} Optimized message array
   */
  static optimize(messages, maxRecent = 10, conversationSummary = "") {
    if (!messages || messages.length === 0) return [];

    // Separate system prompt if any
    const systemPrompt = messages.find(m => m.role === "system");
    const chatMessages = messages.filter(m => m.role !== "system");

    // Slice to keep only recent messages
    const recentMessages = chatMessages.slice(-maxRecent);

    const optimized = [];

    // Prepend system prompt if present
    if (systemPrompt) {
      optimized.push(systemPrompt);
    }

    // Prepend context summary of earlier messages if available
    if (conversationSummary && chatMessages.length > maxRecent) {
      optimized.push({
        role: "system",
        content: `[Previous Conversation Summary: ${conversationSummary}]`
      });
    }

    // Append recent messages
    optimized.push(...recentMessages);

    return optimized;
  }

  /**
   * Generates a local text summary snippet of messages (fallback if LLM summary is unavailable).
   * @param {Array} messages 
   * @returns {string} Simple summary text
   */
  static generateLocalSummary(messages) {
    const userPrompts = messages
      .filter(m => m.role === "user")
      .map(m => m.content)
      .slice(0, 3);
    
    if (userPrompts.length === 0) return "No history";
    return `Discussed: ${userPrompts.map(p => p.substring(0, 20) + "...").join(", ")}`;
  }
}
export default ContextManager;
