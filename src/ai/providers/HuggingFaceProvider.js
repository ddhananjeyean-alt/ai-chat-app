import { AIProvider } from "../AIProvider.js";

export class HuggingFaceProvider extends AIProvider {
  constructor(config) {
    super("HuggingFace", config);
    this._lastFailureTime = 0;
  }

  async getHealthStatus(forceRefresh = false) {
    // Health Cache: If HF failed within the last 30 seconds, avoid repeated expensive requests.
    if (Date.now() - this._lastFailureTime < 30000) {
      return { 
        status: "unhealthy", 
        error: "Hugging Face is in a 30-second cooldown period due to a recent failure." 
      };
    }
    return super.getHealthStatus(forceRefresh);
  }

  async _checkModelAvailability(model) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const url = `${this.config.baseUrl}/${model}`;
      
      const res = await fetch(url, {
        method: "HEAD",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      // If endpoint returns 404, 401, or 403, it's not supported or unauthorized
      return res.status !== 404 && res.status !== 401 && res.status !== 403;
    } catch (e) {
      return false;
    }
  }

  async generateImage(prompt, options = {}) {
    const isDev = (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") || 
                  (typeof window !== "undefined" && window.localStorage?.getItem("debug") === "true");

    const primaryModel = options.model || this.config.defaultImageModel || "black-forest-labs/FLUX.1-schnell";
    const fallbackModel = this.config.fallbackImageModel || "stabilityai/stable-diffusion-xl-base-1.0";
    
    // Model fallback sequence
    const modelsToTry = [primaryModel, fallbackModel];
    let lastError = null;

    for (const model of modelsToTry) {
      // Check availability before trying the model
      if (model !== primaryModel) {
        if (isDev) {
          console.log(`[HF Diagnostic] Checking availability for fallback model: ${model}`);
        }
        const available = await this._checkModelAvailability(model);
        if (!available) {
          if (isDev) {
            console.warn(`[HF Diagnostic] Fallback model ${model} is not available. Skipping.`);
          }
          continue;
        }
      }

      const maxAttempts = 3;
      const retryDelays = [1000, 2000, 0]; // Delays before attempt 2 and attempt 3

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const url = `${this.config.baseUrl}/${model}`;
        
        // Increase default timeout to 45 seconds to let FLUX models warm up
        const requestTimeout = options.timeout || 45000;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

        let abortHandler = null;
        if (options.signal) {
          abortHandler = () => controller.abort();
          options.signal.addEventListener("abort", abortHandler);
        }

        const startTime = Date.now();

        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.config.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: prompt }),
            signal: controller.signal,
          });

          const latency = Date.now() - startTime;
          const status = response.status;

          // Better Logging: Developer mode logging
          if (isDev) {
            console.log(`[HF Developer Log]
              Selected model: ${model}
              Endpoint: ${url}
              Latency: ${latency}ms
              Retries: ${attempt - 1}
              Status Code: ${status}
            `);
          }

          if (response.ok) {
            const blob = await response.blob();
            const base64Data = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });

            return {
              imageUrl: base64Data,
              modelUsed: model,
            };
          }

          const responseText = await response.text().catch(() => "");
          if (isDev) {
            console.log(`[HF Developer Log] Response Body: ${responseText.substring(0, 500)}`);
          }

          lastError = new Error(
            `Hugging Face image generation failed with status ${status}: ${responseText || response.statusText}`
          );

          // Never retry on 401, 403, 404
          if (status === 401 || status === 403 || status === 404) {
            this._lastFailureTime = Date.now();
            throw lastError;
          }

          // Retry automatically on 502, 503, 504
          const isTransient = status === 502 || status === 503 || status === 504;
          if (!isTransient) {
            this._lastFailureTime = Date.now();
            break; // Stop retrying this model, proceed to fallback model
          }

          if (attempt < maxAttempts) {
            const delay = retryDelays[attempt - 1];
            if (isDev) {
              console.warn(`[HF Diagnostic] Attempt ${attempt} failed (HTTP ${status}). Retrying in ${delay}ms...`);
            }
            if (options.onProgress) {
              options.onProgress("Image service temporarily busy. Retrying...");
            }
            await new Promise(resolve => setTimeout(resolve, delay));
          }

        } catch (err) {
          const latency = Date.now() - startTime;
          const isTimeout = err.name === "AbortError" || err.message?.includes("aborted");

          if (isDev) {
            console.error(`[HF Developer Log]
              Attempt ${attempt} Error: ${err.message}
              Latency: ${latency}ms
              Is Timeout: ${isTimeout}
            `);
          }

          lastError = err;
          this._lastFailureTime = Date.now();

          // Propagate abort if requested by the client signal
          if (options.signal?.aborted) {
            throw err;
          }

          if (attempt < maxAttempts) {
            const delay = retryDelays[attempt - 1];
            if (options.onProgress) {
              options.onProgress("Image service temporarily busy. Retrying...");
            }
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } finally {
          clearTimeout(timeoutId);
          if (options.signal && abortHandler) {
            options.signal.removeEventListener("abort", abortHandler);
          }
        }
      }

      if (isDev) {
        console.warn(`[HF Diagnostic] Model ${model} failed after all attempts. Fallback reason: ${lastError.message}`);
      }
    }

    throw lastError || new Error("Hugging Face image generation failed on all models.");
  }

  async healthCheck() {
    if (!this.config.apiKey) {
      return { status: "unhealthy", error: "Hugging Face API key not configured." };
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const model = this.config.defaultImageModel || "black-forest-labs/FLUX.1-schnell";
      const url = `${this.config.baseUrl}/${model}`;
      const res = await fetch(url, {
        method: "HEAD",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        return { status: "healthy" };
      }
      return { status: "unhealthy", error: `HF API check returned status ${res.status}` };
    } catch (e) {
      return { status: "unhealthy", error: `Network connection failed: ${e.message}` };
    }
  }
}
export default HuggingFaceProvider;
