import { aiEngine } from "../ai/AIEngine";

export const generateImage = async (prompt, signal, onProgress) => {
  if (!prompt?.trim()) {
    throw new Error("Image prompt is required.");
  }

  // AIEngine.generateImage returns { imageUrl, modelUsed }
  return await aiEngine.generateImage(prompt, { signal, onProgress });
};