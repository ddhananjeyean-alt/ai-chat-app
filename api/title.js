import axios from "axios";

const SYSTEM_PROMPT = `You are an expert conversation title generator. Analyze the user's prompt and generate a highly concise, natural, human-readable title. 
Rules:
- Title must be between 2 and 5 words maximum.
- Title must be maximum 35 characters long.
- Title must be in sentence case (meaning capitalize ONLY the first word and proper nouns, keep all other words lowercase. E.g. 'Python login system', 'Japan travel plan', 'Quantum computing basics', 'Alien–human handshake', 'Portfolio website').
- Never wrap the title in quotes or use quotation marks inside it.
- Do not use emojis.
- Do not use ellipsis or any punctuation at the end (like periods, question marks, exclamation marks).
- Must summarize the topic of the conversation.

Return ONLY the title text itself. Do not include any formatting, quotes, or conversational phrases.`;

function sanitizeTitle(title) {
  if (!title) return "";
  // Remove wrapping and internal quotes
  let cleaned = title.replace(/^["']|["']$/g, "").trim();
  cleaned = cleaned.replace(/["'“”‘’]/g, "");
  // Remove emojis
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27BF}\u{E000}-\u{F8FF}\u{FE0F}\u{2011}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");
  // Remove punctuation at the end (trailing period, question, exclamation, comma, colon, semicolon)
  cleaned = cleaned.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]+$/, "").trim();
  
  if (cleaned) {
    // Enforce sentence case: capitalize first letter, make the rest as is
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    // Truncate to max 35 characters
    if (cleaned.length > 35) {
      cleaned = cleaned.substring(0, 35).trim();
      // Ensure we don't end with a punctuation after truncation
      cleaned = cleaned.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]+$/, "").trim();
    }
  }
  return cleaned;
}

function generateFallbackTitle(prompt) {
  if (!prompt) return "New Conversation";
  // Clean up prompt: remove emojis, special characters
  let clean = prompt.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27BF}\u{E000}-\u{F8FF}\u{FE0F}\u{2011}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");
  clean = clean.replace(/["'“”‘’]/g, ""); // Remove quotes
  clean = clean.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " "); // Replace punctuation with space
  
  // Split into words, filter empty
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "New Conversation";
  
  // Take 2 to 5 words
  const selectedWords = words.slice(0, Math.min(Math.max(words.length, 2), 5));
  
  // Form sentence case title
  let title = selectedWords.map((word, idx) => {
    if (idx === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    // If it looks like a proper noun (e.g. Python, Japan, Mars, JavaScript), keep its case. Otherwise lowercase.
    const lower = word.toLowerCase();
    const properNouns = ["python", "japan", "mars", "javascript", "html", "css", "react", "vite", "nextjs", "node", "sql", "git", "api"];
    if (properNouns.includes(lower)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return lower;
  }).join(" ");
  
  // Limit to 35 characters
  if (title.length > 35) {
    title = title.substring(0, 35).trim();
    const lastSpace = title.lastIndexOf(" ");
    if (lastSpace > 0) {
      title = title.substring(0, lastSpace);
    }
  }
  
  return title || "New Conversation";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, responseText } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt parameter" });
  }

  const groqKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  const geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  const contentText = `User prompt: "${prompt}"\nAssistant response snippet: "${responseText ? responseText.substring(0, 300) : ''}"`;

  // Try Groq first
  if (groqKey) {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: contentText }
          ],
          temperature: 0.5,
          max_tokens: 30,
        },
        {
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );
      let title = response.data.choices[0].message.content.trim();
      const cleaned = sanitizeTitle(title);
      if (cleaned) {
        return res.status(200).json({ title: cleaned });
      }
    } catch (err) {
      console.warn("Groq title generation failed, falling back to Gemini:", err.message);
    }
  }

  // Try Gemini fallback
  if (geminiKey) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          contents: [
            { role: "user", parts: [{ text: contentText }] }
          ],
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 30,
          }
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 5000,
        }
      );
      let title = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      const cleaned = sanitizeTitle(title);
      if (cleaned) {
        return res.status(200).json({ title: cleaned });
      }
    } catch (err) {
      console.warn("Gemini title generation failed:", err.message);
    }
  }

  // Final fallback: local formatting of prompt
  const fallback = generateFallbackTitle(prompt);
  return res.status(200).json({ title: fallback });
}
