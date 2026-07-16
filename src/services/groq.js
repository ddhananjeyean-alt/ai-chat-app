import { aiEngine } from "../ai/AIEngine";

export const getAIResponse = async (messages, summary, signal, documentName, documentText) => {
  try {
    if (!messages || messages.length === 0) return "";
    
    // The history mapping is handled internally by AIEngine
    const history = messages.slice(0, -1);
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage ? lastMessage.text : "";

    return await aiEngine.generateText(prompt, { history, summary, signal, documentName, documentText });
  } catch (error) {
    console.error("AI Engine Client Error (getAIResponse):", error);
    return "⚠️ AI service unavailable. Please check your internet connection and try again.";
  }
};

export const generateConversationTitle = async (prompt, responseText) => {
  try {
    const textToSummarize = `User prompt: "${prompt}"\nAssistant response: "${responseText ? responseText.substring(0, 300) : ''}"`;
    
    const title = await aiEngine.generateText(textToSummarize, {
      systemPrompt: `You are an expert conversation title generator. Analyze the text and generate a highly concise, natural, human-readable title. 
Rules:
- Title must be between 2 and 5 words maximum.
- Title must be maximum 35 characters long.
- Title must be in sentence case (meaning capitalize ONLY the first word and proper nouns).
- Never wrap the title in quotes.
- Do not use emojis.
- Do not use trailing punctuation.
Return ONLY the title text itself. Do not include any formatting or quotes.`,
    });

    // Basic sanitization similar to api/title.js
    let cleaned = title.replace(/^["']|["']$/g, "").trim();
    cleaned = cleaned.replace(/["'“”‘’]/g, "");
    cleaned = cleaned.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]+$/, "").trim();
    if (cleaned) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      if (cleaned.length > 35) {
        cleaned = cleaned.substring(0, 35).trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]+$/, "").trim();
      }
    }
    return cleaned || "New Conversation";
  } catch (error) {
    console.error("generateConversationTitle Error:", error);
    const words = prompt.split(/\s+/).slice(0, 4).join(" ");
    return words ? words + "..." : "New Conversation";
  }
};