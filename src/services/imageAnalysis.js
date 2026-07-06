import ai from "./gemini";

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-1.5-pro";
const TRANSIENT_STATUS_CODES = [429, 500, 503];
const RETRY_DELAYS_MS = [1000, 2000, 4000];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStatusCode(error) {
  if (!error) return null;
  if (typeof error.status === "number") return error.status;
  if (error.response?.status) return error.response.status;
  if (error?.response?.statusCode) return error.response.statusCode;
  const codeMatch = String(error.message || "").match(/\b(429|500|503)\b/);
  return codeMatch ? Number(codeMatch[1]) : null;
}

function isTransientError(error) {
  const status = getStatusCode(error);
  if (status && TRANSIENT_STATUS_CODES.includes(status)) {
    return true;
  }

  if (error?.code === "ECONNRESET" || error?.code === "ETIMEDOUT" || error?.code === "EAI_AGAIN") {
    return true;
  }

  const message = String(error?.message || "").toLowerCase();
  return message.includes("503") || message.includes("429") || message.includes("500") || message.includes("busy");
}

async function generateImageAnalysis(model, imageBase64, prompt, mimeType) {
  return ai.models.generateContent({
    model,
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
            text: prompt,
          },
        ],
      },
    ],
  });
}

export async function analyzeImage(
  imageBase64,
  prompt,
  mimeType = "image/jpeg",
  onRetry = () => {}
) {
  const modelCandidates = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError = null;

  for (const model of modelCandidates) {
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        const response = await generateImageAnalysis(model, imageBase64, prompt, mimeType);
        return response?.text || response?.outputText || "Image analysis completed with no text output.";
      } catch (error) {
        lastError = error;
        const retryNumber = attempt + 1;
        const status = getStatusCode(error);
        const transient = isTransientError(error);

        if (!transient || attempt === RETRY_DELAYS_MS.length) {
          break;
        }

        const retryMessage = "Gemini is busy, retrying...";
        console.warn(retryMessage, { model, attempt: retryNumber, status, error });
        onRetry(retryMessage, { model, attempt: retryNumber, status });
        await sleep(RETRY_DELAYS_MS[attempt]);
      }
    }

    if (model === PRIMARY_MODEL) {
      console.warn("Primary Gemini model failed, falling back to secondary model.");
      onRetry("Gemini primary model failed, trying a fallback model.", { model });
    }
  }

  console.error("Gemini image analysis failed after retries:", lastError);
  return "Image analysis temporarily unavailable. Please try again later.";
}
