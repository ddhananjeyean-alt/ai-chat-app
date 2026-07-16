import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are a premium, state-of-the-art prompt engineer for Gemini image generation models.
Your goal is to rewrite the user's raw prompt into a highly descriptive, professional prompt that yields stunning visual quality.

You must analyze the user's prompt for:
- Subject, actions, and relationships.
- Emotions and facial expressions.
- Clothing, appearance, and physical features.
- Environment, background, weather, and lighting.
- Camera angle, composition, depth, and perspective.
- Colors, textures, materials, shadows, and reflections.
- Realism level and artistic style (e.g. Photorealistic, Cinematic, Anime, 3D Render, Illustration, Concept Art, Fantasy, Oil Painting, Watercolor, Sketch, Pixel Art, Minimal, Comic, Cyberpunk, Sci-Fi).
- Requested text (if any) or aspect ratios.

Rules for Refinement:
1. **Prompt Expansion (Short Prompts)**: If the prompt is short or simple (e.g. "Robot", "Cute cat"), expand it into a highly detailed, professional visual description. Specify composition, lighting, environment, textures, and style to maximize visual appeal.
2. **Preserve Instructions (Detailed Prompts)**: If the user's prompt is already detailed, do NOT overwrite or discard their instructions. Only improve clarity, scene coherence, detail sharpness, and phrasing. Never change the requested core subject or user intent.
3. **Negative Handling**: Strictly respect negative instructions (e.g. "without helmet", "no text"). Ensure the refined description explicitly avoids these elements (e.g. do not describe a helmet, or mention any text or signs).
4. **Accuracy & Quality**: Maximize prompt accuracy (include all requested objects), composition, anatomical accuracy (especially hands, faces, eyes), textures, depth of field, and reflections.
5. **Consistency**: Improve coherence for multiple characters, body proportions, symmetry, and perspective.
6. **Output format**: Output ONLY the final enhanced prompt. Do NOT wrap it in quotes, do NOT write markdown backticks, and do NOT include any introductory or conversational text.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { rawPrompt, history } = req.body;
  if (!rawPrompt) {
    return res.status(400).json({ error: "Missing rawPrompt parameter" });
  }

  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Gemini API key not configured on server" });
  }

  const ai = new GoogleGenAI({ apiKey });

  // Format messages context if history is provided
  // In @google/genai, contents expects: { role: 'user' | 'model', parts: [{ text: '...' }] }
  const contents = (history || []).map(msg => ({
    role: msg.sender === "user" ? "user" : "model",
    parts: [{ text: msg.text || "" }]
  }));

  // Append user's raw prompt request
  contents.push({
    role: "user",
    parts: [{ text: `Refine this request into a clean image description: "${rawPrompt}"` }]
  });

  let attempt = 1;
  const maxAttempts = 2;

  while (attempt <= maxAttempts) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.6,
          maxOutputTokens: 300,
        }
      });

      let refinedPrompt = response.text?.trim() || "";
      // Clean up quotes or markdown
      refinedPrompt = refinedPrompt.replace(/^["']|["']$/g, "").trim();

      if (!refinedPrompt) {
        throw new Error("Empty prompt returned by Gemini");
      }

      return res.status(200).json({ refinedPrompt });

    } catch (error) {
      console.error(`[Refine Prompt] Attempt ${attempt} failed:`, error.message);
      if (attempt < maxAttempts) {
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }

      // Fallback: clean rawPrompt manually
      let clean = rawPrompt.replace(/^(generate|create|draw|make|paint|illustrate|render|design|sketch|show me)\b\s*(an?\s*(image|picture|photo|illustration|drawing|painting|artwork|portrait|sketch|logo|banner|poster|render)\s*(of)?)?/i, "");
      return res.status(200).json({ refinedPrompt: clean.trim() || rawPrompt });
    }
  }
}
