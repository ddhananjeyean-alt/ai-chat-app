import axios from "axios";

// In-memory cache for repeated requests
const cache = new Map();
const MAX_CACHE_SIZE = 100;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedResponse(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return cached.reply;
}

function setCachedResponse(key, reply) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { reply, timestamp: Date.now() });
}

function makeCacheKey(messages, route) {
  const recent = messages.slice(-3).map(m => `${m.role}:${m.content}`).join("|");
  return `${route}:${recent}`;
}

// System Prompts for AI Quality Enhancement
const GENERAL_SYSTEM_PROMPT = `You are a premium, state-of-the-art AI assistant.
Language Rule: Detect the user's language automatically and reply in the EXACT SAME language.
Requirements:
1. Provide a direct, factual, and highly accurate answer.
2. Structure your response clearly using appropriate Markdown headers, short paragraphs, bold text, bullet lists, and tables where relevant.
3. Be professional, engaging, and thorough, ensuring high grammar quality.
4. Conclude your response with a section "### Follow-up Suggestions" containing 2-3 interactive, highly relevant questions the user might want to ask next. Do not number the follow-up suggestions, use bullet points.`;

const GEMINI_SYSTEM_PROMPT = `You are a premium, state-of-the-art AI assistant specializing in complex reasoning, mathematics, and creative writing.
Language Rule: Detect the user's language automatically and reply in the EXACT SAME language.
Requirements:
1. Solve problems step-by-step internally, breaking down complex tasks into logical stages. Return only the final polished, complete answer.
2. Provide exceptionally clear and accurate explanations, using formatting like LaTeX for math equations if needed.
3. Use rich Markdown elements (tables, blocks, lists) to format your response beautifully.
4. For creative tasks, use highly engaging and descriptive language.
5. Conclude your response with a section "### Follow-up Suggestions" containing 2-3 interactive, highly relevant follow-up questions for the user. Use bullet points.`;

const CODING_GEN_PROMPT = `You are an expert senior software developer. Generate production-ready, highly optimized, and maintainable code.
Requirements:
1. Avoid placeholders (e.g. "// rest of your code here", "..."). Write COMPLETE components, functions, imports, and setups.
2. Ensure proper error handling, comments only where useful, optimized React hook usage, clean TypeScript/JavaScript/CSS.
3. Ensure UI code is modern, fully responsive, and follows accessibility best practices.
4. Never hallucinate APIs; use current best practices.
5. Provide a short introduction, complete code fences with syntax highlighting, and a clear explanation of design decisions.
6. Conclude your response with a section "### Follow-up Suggestions" containing 2-3 interactive follow-up questions. Use bullet points.`;

const getCodingVerifyPrompt = (geminiResponse) => `You are a premium senior code auditor and linter.
Analyze the following AI-generated response:
<GEMINI_RESPONSE>
${geminiResponse}
</GEMINI_RESPONSE>

Verify, lint, and refine this response:
1. Ensure all code blocks are completely syntax-valid and contain complete components, functions, and proper imports with NO placeholders.
2. Fix any formatting, broken markdown, broken code blocks, and syntax errors.
3. Optimize performance and accessibility of code where possible.
4. Return ONLY the final polished response with explanations, code blocks, and follow-up suggestions. Do NOT include meta-commentary, reviews, or introductory phrases like "Here is the reviewed code:".`;

// API Call Wrappers with Retry & Fallback
async function callGroqWithRetry(messages, systemPrompt, attempt = 1) {
  const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq API key not configured on server.");

  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages
  ];

  const modelCandidates = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  let lastErr = null;

  for (const model of modelCandidates) {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model,
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 2048,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );
      return response.data.choices[0].message.content;
    } catch (err) {
      console.warn(`Groq model ${model} failed (attempt ${attempt}):`, err.message);
      lastErr = err;
    }
  }

  if (attempt < 2) {
    return callGroqWithRetry(messages, systemPrompt, attempt + 1);
  }
  throw lastErr;
}

async function callGeminiWithRetry(messages, systemPrompt, attempt = 1) {
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key not configured on server.");

  const geminiMessages = messages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));

  const modelCandidates = ["gemini-2.5-flash", "gemini-1.5-pro"];
  let lastErr = null;

  for (const model of modelCandidates) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          contents: geminiMessages,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 12000,
        }
      );

      const candidate = response.data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      if (text) return text;

      throw new Error("Empty candidate content returned from Gemini.");
    } catch (err) {
      console.warn(`Gemini model ${model} failed (attempt ${attempt}):`, err.message);
      lastErr = err;
    }
  }

  if (attempt < 2) {
    return callGeminiWithRetry(messages, systemPrompt, attempt + 1);
  }
  throw lastErr;
}

// Router Logic
function routeRequest(messages) {
  const latestMessage = messages[messages.length - 1]?.content || "";
  const prompt = latestMessage.toLowerCase();

  const codingKeywords = [
    "code", "function", "bug", "error", "write a program", "javascript", "typescript",
    "react", "html", "css", "python", "c++", "java", "rust", "compiler", "algorithm",
    "import", "class", "component", "npm", "git", "install", "snippet", "syntax", "jsx"
  ];
  const isCoding = codingKeywords.some(keyword => prompt.includes(keyword)) ||
                   (prompt.includes("```") && prompt.includes("fix"));

  if (isCoding) {
    return "programming";
  }

  const mathKeywords = [
    "math", "calculate", "solve", "equation", "logic", "riddle", "reasoning",
    "proof", "theorem", "fraction", "integral", "derivative", "geometry", "algebra"
  ];
  if (mathKeywords.some(keyword => prompt.includes(keyword))) {
    return "reasoning";
  }

  const creativeKeywords = [
    "story", "poem", "essay", "creative", "draft an email", "write an article",
    "blog post", "fiction", "song", "lyrics", "script"
  ];
  if (creativeKeywords.some(keyword => prompt.includes(keyword))) {
    return "creative";
  }

  const totalLength = messages.reduce((sum, msg) => sum + (msg.content || "").length, 0);
  if (totalLength > 8000) {
    return "long_document";
  }

  if (latestMessage.length < 40) {
    return "fast_followup";
  }

  return "general";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages body" });
  }

  const route = routeRequest(messages);
  const cacheKey = makeCacheKey(messages, route);
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] returning cached response for route: ${route}`);
    return res.status(200).json({ reply: cached });
  }

  console.log(`[AI Router] Routing request to: ${route}`);
  let reply = "";

  try {
    if (route === "programming") {
      // Step 1: Call Gemini for code generation
      let geminiCode = "";
      try {
        geminiCode = await callGeminiWithRetry(messages, CODING_GEN_PROMPT);
      } catch (err) {
        console.error("Gemini failed in programming route, falling back directly to Groq:", err.message);
        reply = await callGroqWithRetry(messages, GENERAL_SYSTEM_PROMPT);
        setCachedResponse(cacheKey, reply);
        return res.status(200).json({ reply });
      }

      // Step 2: Use Groq for verification & linting
      try {
        const verifyPrompt = getCodingVerifyPrompt(geminiCode);
        reply = await callGroqWithRetry(messages, verifyPrompt);
      } catch (err) {
        console.error("Groq verification failed in programming route, returning raw Gemini code:", err.message);
        reply = geminiCode;
      }
    } else if (route === "reasoning" || route === "creative" || route === "long_document") {
      try {
        reply = await callGeminiWithRetry(messages, GEMINI_SYSTEM_PROMPT);
      } catch (err) {
        console.error("Gemini failed on reasoning/creative route, falling back to Groq:", err.message);
        reply = await callGroqWithRetry(messages, GENERAL_SYSTEM_PROMPT);
      }
    } else {
      try {
        reply = await callGroqWithRetry(messages, GENERAL_SYSTEM_PROMPT);
      } catch (err) {
        console.error("Groq failed on general/fast_followup route, falling back to Gemini:", err.message);
        reply = await callGeminiWithRetry(messages, GEMINI_SYSTEM_PROMPT);
      }
    }

    setCachedResponse(cacheKey, reply);
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("AI Router Execution Error:", error);
    return res.status(500).json({
      error: "AI Generation failed",
      message: error.message || "Something went wrong during generation."
    });
  }
}
