import axios from "axios";

const SYSTEM_PROMPT = `You are an expert visual analysis AI. Analyze the uploaded image in detail.
Requirements:
1. Describe every visible object and explain relationships between them.
2. Detect user intent based on the image and accompanying prompt.
3. Recognize and process:
   - Text/Handwriting/Documents: Extract all text/OCR content accurately.
   - Charts/Tables/Diagrams: Analyze structure, data points, and context.
   - UI/Screenshots: Identify components, evaluate layout usability, identify possible bugs or discrepancies, and suggest improvements.
   - Code screenshots: Extract and format the source code properly inside Markdown code blocks.
   - Logos/Errors: Identify logos/brands, or error messages and codes visible.
4. Produce a detailed, premium, structured description. Ensure correct markdown formatting.`;

async function callGeminiVision(model, apiKey, imageBase64, prompt, mimeType) {
  return axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            {
              text: prompt || "Describe this image in detail.",
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 20000, // 20s timeout for images
    }
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { image, prompt, mimeType } = req.body;
  if (!image) {
    return res.status(400).json({ error: "Missing image base64 parameter" });
  }

  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Gemini API key not configured on server" });
  }

  const modelCandidates = ["gemini-2.5-flash", "gemini-1.5-pro"];
  let lastError = null;

  for (const model of modelCandidates) {
    try {
      console.log(`[Image Analysis] Running analysis using model: ${model}`);
      const response = await callGeminiVision(model, apiKey, image, prompt, mimeType || "image/jpeg");
      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return res.status(200).json({ reply: text });
      }
      throw new Error("No text returned by Gemini Vision");
    } catch (error) {
      console.warn(`Gemini Vision model ${model} failed:`, error.message);
      lastError = error;
    }
  }

  console.error("Gemini image analysis failed after fallback models:", lastError);
  return res.status(500).json({
    error: "Image analysis failed",
    message: lastError?.message || "Failed to analyze image using Gemini Vision."
  });
}
