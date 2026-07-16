/**
 * StreamingManager standardizes chunk streams from all AI providers
 * so that the UI receives a uniform callback.
 */
export class StreamingManager {
  /**
   * Consume a Response stream and decode standard OpenAI/OpenRouter SSE lines.
   * @param {Response} response 
   * @param {Function} onChunk - Callback receiving string chunks
   * @param {AbortSignal} [signal]
   */
  static async consumeOpenAISSE(response, onChunk, signal) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        if (signal?.aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last partial line in buffer
        buffer = lines.pop();

        for (const line of lines) {
          const cleanedLine = line.trim();
          if (!cleanedLine) continue;

          if (cleanedLine === "data: [DONE]") {
            return;
          }

          if (cleanedLine.startsWith("data: ")) {
            const jsonText = cleanedLine.slice(6);
            try {
              const parsed = JSON.parse(jsonText);
              const chunkText = parsed.choices?.[0]?.delta?.content || "";
              if (chunkText) {
                onChunk(chunkText);
              }
            } catch (e) {
              // Ignore incomplete JSON chunks in SSE stream
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Consume a Response stream and decode Gemini-style chunked JSON arrays.
   * @param {Response} response 
   * @param {Function} onChunk - Callback receiving string chunks
   * @param {AbortSignal} [signal]
   */
  static async consumeGeminiStream(response, onChunk, signal) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        if (signal?.aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Gemini returns a JSON array of candidates.
        // We use a regex to extract text fragments from candidate parts.
        const textRegex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
        let match;
        let lastMatchEnd = 0;
        
        while ((match = textRegex.exec(buffer)) !== null) {
          try {
            const rawText = match[1];
            const parsedText = JSON.parse(`"${rawText}"`);
            if (parsedText) {
              onChunk(parsedText);
            }
            lastMatchEnd = textRegex.lastIndex;
          } catch (e) {
            // Ignore parse errors if regex matched in incomplete JSON
          }
        }

        // Slice the buffer to remove processed segments
        if (lastMatchEnd > 0) {
          buffer = buffer.substring(lastMatchEnd);
        }

        if (buffer.length > 50000) {
          buffer = ""; // Emergency fallback
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
export default StreamingManager;
