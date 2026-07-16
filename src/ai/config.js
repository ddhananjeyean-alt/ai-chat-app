const getEnv = (key) => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  try {
    // Check if import.meta.env is defined
    if (typeof import.meta !== "undefined" && import.meta.env) {
      return import.meta.env[key] || "";
    }
  } catch (e) {
    // Safe fallback if import.meta is not accessible in some environments
  }
  return "";
};

export const CONFIG = {
  providers: {
    groq: {
      apiKey: getEnv("VITE_GROQ_API_KEY"),
      baseUrl: "/api/groq", // Proxy route to bypass browser CORS
      defaultModel: "llama-3.3-70b-versatile",
      fallbackModel: "llama-3.1-8b-instant",
    },
    gemini: {
      apiKey: getEnv("VITE_GEMINI_API_KEY"),
      baseUrl: "https://generativelanguage.googleapis.com",
      defaultModel: "gemini-2.5-flash",
      fallbackModel: "gemini-1.5-pro",
      imageModel: "gemini-3.1-flash-image", // Fallback image generation model
    },
    openrouter: {
      apiKey: getEnv("VITE_OPENROUTER_API_KEY"),
      baseUrl: "https://openrouter.ai/api/v1",
      defaultModel: "openrouter/free",
      fallbackModel: "google/gemma-2-9b-it:free",
      defaultImageModel: "black-forest-labs/flux.2-klein-4b",
    },
    huggingface: {
      apiKey: getEnv("VITE_HUGGINGFACE_API_KEY"),
      baseUrl: "https://router.huggingface.co/hf-inference/models",
      defaultImageModel: "black-forest-labs/FLUX.1-schnell",
      fallbackImageModel: "stabilityai/stable-diffusion-xl-base-1.0",
    },
  },
  timeouts: {
    text: 15000,       // 15 seconds
    image: 25000,      // 25 seconds
    analysis: 25000,   // 25 seconds
  },
  defaults: {
    temperature: 0.7,
    maxTokens: 2048,
  }
};
