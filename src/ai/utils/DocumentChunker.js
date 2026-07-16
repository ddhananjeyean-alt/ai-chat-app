/**
 * Utility for chunking large documents and retrieving relevant portions based on query term frequency.
 */
export class DocumentChunker {
  /**
   * Split text into overlapping chunks
   * @param {string} text 
   * @param {number} chunkSize 
   * @param {number} overlap 
   * @returns {Array<string>} Chunks
   */
  static chunkText(text, chunkSize = 3000, overlap = 500) {
    if (!text) return [];
    if (text.length <= chunkSize) return [text];
    
    const chunks = [];
    let start = 0;
    while (start < text.length) {
      const end = start + chunkSize;
      chunks.push(text.substring(start, end));
      start += chunkSize - overlap;
    }
    return chunks;
  }

  /**
   * Extract keywords from a query string, filtering out standard stop words
   * @param {string} queryText 
   * @returns {Array<string>} Keywords
   */
  static extractKeywords(queryText) {
    if (!queryText) return [];
    const words = queryText.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .split(/\s+/);
    
    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "be", "been", "being",
      "in", "on", "at", "to", "for", "of", "with", "about", "against", "between", "into", "through",
      "during", "before", "after", "above", "below", "up", "down", "from", "further", "then", "once",
      "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more",
      "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than",
      "too", "very", "s", "t", "can", "will", "just", "don", "should", "now", "i", "me", "my",
      "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves",
      "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself",
      "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this",
      "that", "these", "those", "am", "have", "has", "had", "do", "does", "did", "please", "show", "get"
    ]);
    
    return words.filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Score and select relevant chunks of text for a query
   * @param {string} text 
   * @param {string} queryText 
   * @param {number} maxTotalLength 
   * @returns {string} Selected relevant chunks joined together
   */
  static getRelevantChunks(text, queryText, maxTotalLength = 15000) {
    if (!text) return "";
    if (text.length <= maxTotalLength) return text;
    
    const chunks = this.chunkText(text, 3000, 500);
    const keywords = this.extractKeywords(queryText);
    
    if (keywords.length === 0) {
      // If no keywords found, return first few chunks that fit within limit
      let result = "";
      for (const chunk of chunks) {
        if ((result + chunk).length > maxTotalLength) break;
        result += chunk + "\n\n";
      }
      return result.trim();
    }
    
    // Score each chunk
    const scoredChunks = chunks.map((chunk, index) => {
      let score = 0;
      const lowerChunk = chunk.toLowerCase();
      keywords.forEach(keyword => {
        // Safe regex escape
        const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escapedKeyword, "g");
        const matches = lowerChunk.match(regex);
        if (matches) {
          score += matches.length;
        }
      });
      return { chunk, index, score };
    });
    
    // Sort by score descending
    scoredChunks.sort((a, b) => b.score - a.score);
    
    // Pick the top scoring chunks that fit in the budget
    const selected = [];
    let currentLength = 0;
    
    for (const item of scoredChunks) {
      if (item.score === 0 && selected.length >= 2) continue;
      
      if (currentLength + item.chunk.length > maxTotalLength) {
        continue;
      }
      selected.push(item);
      currentLength += item.chunk.length;
    }
    
    // Sort selected chunks back into their original order
    selected.sort((a, b) => a.index - b.index);
    
    let result = selected.map(item => `[Document Section ${item.index + 1} (Relevance Score: ${item.score})]\n${item.chunk}`).join("\n\n---\n\n");
    
    return result || text.substring(0, maxTotalLength);
  }
}
export default DocumentChunker;
