export const generateImage = (prompt) => {
  if (!prompt?.trim()) {
    throw new Error("Image prompt is required.");
  }

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
};