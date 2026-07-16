import { GoogleGenAI } from "@google/genai";

// Cache for model check to avoid listing models every time
let cachedImageModel = null;

const PREFERRED_IMAGE_MODELS = [
  'gemini-3.1-flash-image',
  'gemini-3-pro-image',
  'gemini-2.5-flash-image'
];

async function getHighestQualityImageModel(ai) {
  if (process.env.GEMINI_IMAGE_MODEL) {
    return process.env.GEMINI_IMAGE_MODEL;
  }
  if (cachedImageModel) {
    return cachedImageModel;
  }
  try {
    const modelsResponse = await ai.models.list();
    const availableModelNames = [];
    for await (const m of modelsResponse) {
      availableModelNames.push(m.name);
    }
    
    for (const pref of PREFERRED_IMAGE_MODELS) {
      const matched = availableModelNames.find(name => 
        name === pref || name === `models/${pref}`
      );
      if (matched) {
        cachedImageModel = matched.replace(/^models\//, '');
        return cachedImageModel;
      }
    }
    
    const imageModels = availableModelNames
      .map(name => name.replace(/^models\//, ''))
      .filter(name => name.includes('image') && !name.includes('deprecated') && !name.includes('preview'));
      
    if (imageModels.length > 0) {
      cachedImageModel = imageModels[0];
      return cachedImageModel;
    }
  } catch (error) {
    console.error("Failed to dynamically check models:", error.message);
  }
  
  return 'gemini-3.1-flash-image'; // Default fallback
}

function isTransientError(error) {
  if (error.status) {
    const status = error.status;
    return status === 500 || status === 502 || status === 503 || status === 504;
  }
  
  const msg = (error.message || '').toLowerCase();
  
  if (msg.includes("quota") || msg.includes("429") || msg.includes("rate limit") || msg.includes("resource_exhausted")) {
    return false;
  }
  
  if (msg.includes("safety") || msg.includes("block") || msg.includes("flagged")) {
    return false;
  }
  
  if (error.code) {
    return [
      'ETIMEDOUT',
      'ECONNRESET',
      'EADDRINUSE',
      'ECONNREFUSED',
      'EPIPE',
      'ENOTFOUND',
      'ENETUNREACH'
    ].includes(error.code);
  }
  
  if (msg.includes("timeout") || msg.includes("network error") || msg.includes("fetch failed") || msg.includes("econnreset")) {
    return true;
  }
  
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt parameter" });
  }

  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Gemini API key not configured on server" });
  }

  const maskedKey = apiKey ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}` : "None";
  const sdkVersion = "^2.9.0";
  const endpoint = "generateContent";
  
  // Log configuration check internally
  console.log(`[Config Check]
    Current API key loaded: ${maskedKey}
    SDK Version: ${sdkVersion}
    Image Endpoint: ${endpoint}
  `);

  const ai = new GoogleGenAI({ apiKey });
  const modelToUse = await getHighestQualityImageModel(ai);
  console.log(`[Image Generation] Selected model: ${modelToUse} for prompt: "${prompt}"`);

  // Respect close event to abort API call
  const controller = new AbortController();
  req.on('close', () => {
    console.log('[Image Generation] Connection closed by client. Aborting active Gemini generation...');
    controller.abort();
  });

  let attempt = 1;
  const maxAttempts = 2; // Retry once if it fails and it is transient
  let lastError = null;

  while (attempt <= maxAttempts) {
    try {
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: prompt,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          abortSignal: controller.signal,
        },
      });

      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      let base64Data = null;
      let mimeType = 'image/png';

      for (const part of parts) {
        if (part.inlineData) {
          base64Data = part.inlineData.data;
          mimeType = part.inlineData.mimeType || mimeType;
          break;
        }
      }

      if (!base64Data) {
        throw new Error("The model did not return any image data in the response.");
      }

      const imageUrl = `data:${mimeType};base64,${base64Data}`;
      return res.status(200).json({ 
        imageUrl,
        modelUsed: modelToUse
      });

    } catch (error) {
      lastError = error;
      
      // Extract status and Gemini-specific fields for internal logging
      let status = error.status || 500;
      let geminiCode = "UNKNOWN";
      let errorReason = error.message || "Unknown error";
      let requestId = "N/A";
      
      try {
        const errorDetails = JSON.parse(error.message);
        if (errorDetails?.error) {
          status = errorDetails.error.code || status;
          geminiCode = errorDetails.error.status || geminiCode;
          errorReason = errorDetails.error.message || errorReason;
        }
      } catch (e) {
        // Error message was not JSON
      }

      // Log internally as requested
      console.error(`[Image Generation Error]
        Attempt: ${attempt}
        Model: ${modelToUse}
        HTTP Status: ${status}
        Gemini Error Code: ${geminiCode}
        Request ID: ${requestId}
        Reason: ${errorReason}
      `);

      if (attempt < maxAttempts && isTransientError(error)) {
        attempt++;
        // Wait slightly before retry (500ms)
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      break;
    }
  }

  // Process the final error after loop termination
  let status = lastError.status || 500;
  let geminiCode = "UNKNOWN";
  let errorReason = lastError.message || "Unknown error";
  
  try {
    const errorDetails = JSON.parse(lastError.message);
    if (errorDetails?.error) {
      status = errorDetails.error.code || status;
      geminiCode = errorDetails.error.status || geminiCode;
      errorReason = errorDetails.error.message || errorReason;
    }
  } catch (e) {
    // Error message was not JSON
  }

  const lowerMsg = errorReason.toLowerCase();
  
  // 1. Quota / Rate limit handling
  const isQuotaError = 
    status === 429 || 
    geminiCode === "RESOURCE_EXHAUSTED" || 
    lowerMsg.includes("quota") || 
    lowerMsg.includes("rate limit") ||
    lowerMsg.includes("resource_exhausted");

  if (isQuotaError) {
    let friendlyMessage = "Image generation is temporarily unavailable due to API limits. Please try again in a few moments.";
    
    if (lowerMsg.includes("free_tier") && lowerMsg.includes("limit: 0")) {
      friendlyMessage = "Image generation is disabled on the Free Tier for this model. Please enable billing on your Google AI Studio project to gain access.";
    } else if (lowerMsg.includes("billing") || lowerMsg.includes("plan")) {
      friendlyMessage = "Image generation is unavailable because billing is disabled or a billing plan is required.";
    } else if (lowerMsg.includes("per minute") || lowerMsg.includes("requests per minute") || lowerMsg.includes("rpm") || lowerMsg.includes("tpm")) {
      friendlyMessage = "Rate limit exceeded. Please wait a moment and try again.";
    } else if (lowerMsg.includes("per day") || lowerMsg.includes("requests per day") || lowerMsg.includes("rpd")) {
      friendlyMessage = "Daily request quota exceeded. Please check your project limits.";
    }
    
    return res.status(429).json({ 
      error: friendlyMessage, 
      details: errorReason 
    });
  }

  // 2. Permission Denied handling
  if (status === 403 || lowerMsg.includes("permission denied") || lowerMsg.includes("forbidden") || lowerMsg.includes("key is not valid")) {
    return res.status(403).json({
      error: "Access denied. Please verify that your Gemini API key has the necessary permissions and image generation is enabled on your project.",
      details: errorReason
    });
  }

  // 3. Unsupported Model handling
  if (status === 404 || lowerMsg.includes("not found") || lowerMsg.includes("not supported")) {
    return res.status(404).json({
      error: "The requested model was not found or is unsupported by this API key.",
      details: errorReason
    });
  }

  // 4. Safety block handling
  if (lowerMsg.includes("safety") || lowerMsg.includes("block") || lowerMsg.includes("flagged")) {
    return res.status(400).json({ 
      error: "⚠️ The prompt was flagged by content safety filters. Please try rephrasing.", 
      details: errorReason 
    });
  }

  // Fallback generic error
  return res.status(status).json({ 
    error: "⚠️ Image generation failed. Please try again.", 
    details: errorReason 
  });
}
