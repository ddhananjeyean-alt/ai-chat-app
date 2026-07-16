import { aiEngine } from "../ai/AIEngine";

export async function analyzeImage(
  imageBase64,
  prompt,
  mimeType = "image/jpeg",
  onRetry = () => {}
) {
  try {
    return await aiEngine.analyzeImage(imageBase64, prompt, mimeType, {
      systemPrompt: `You are an expert visual analysis, handwriting recognition, and multilingual OCR AI.
You must analyze the uploaded image and structure your response into exactly four sections, using these exact headings:

### 1. Description
Provide a detailed description of the visuals, scene, entities, layout, or diagrams in the image.

### 2. Extracted Text
Perform a transcription of all text present in the image (both typed/printed text and handwritten text).
- Support English, Tamil (தமிழ்), Hindi (हिन्दी), Japanese (日本語), Arabic (العربية), and mixed-language images.
- Always output text in its original native script/characters (do not transliterate or Romanize).
- If handwriting is detected, carefully transcribe the letters/scripts. If confidence is low or characters are illegible, use "[illegible]" or "[unclear]" and state: "Handwriting recognition confidence is low. Some parts may be illegible."
- Never hallucinate or guess text.

### 3. Detected Languages
List all languages identified in the image (e.g. English, Tamil, Hindi, Japanese, Arabic, etc.).

### 4. Answer to the User's Question
Provide a clear, direct answer to the user's question: "${prompt}" based on your visual understanding and extracted text.`
    });
  } catch (error) {
    console.error("Image analysis client error:", error);
    return "⚠️ Image analysis temporarily unavailable. Please try again later.";
  }
}
