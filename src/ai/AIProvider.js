/**
 * Base AIProvider interface. All concrete provider classes must extend this
 * and implement these methods identically to support provider hot-swapping.
 */
export class AIProvider {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this._lastHealthCheck = null;
    this._lastHealthCheckTime = 0;
  }

  async getHealthStatus(forceRefresh = false) {
    const now = Date.now();
    const cacheTTL = 30000;
    
    if (!forceRefresh && this._lastHealthCheck && (now - this._lastHealthCheckTime < cacheTTL)) {
      return this._lastHealthCheck;
    }
    
    try {
      const res = await this.healthCheck();
      this._lastHealthCheck = res;
      this._lastHealthCheckTime = now;
      return res;
    } catch (e) {
      const errRes = { status: "unhealthy", error: e.message };
      this._lastHealthCheck = errRes;
      this._lastHealthCheckTime = now;
      return errRes;
    }
  }

  async generateText(messages, options = {}) {
    throw new Error(`generateText() not implemented for provider: ${this.name}`);
  }

  async generateCode(messages, options = {}) {
    throw new Error(`generateCode() not implemented for provider: ${this.name}`);
  }

  async generateImage(prompt, options = {}) {
    throw new Error(`generateImage() not implemented for provider: ${this.name}`);
  }

  async analyzeImage(imageBase64, prompt, mimeType, options = {}) {
    throw new Error(`analyzeImage() not implemented for provider: ${this.name}`);
  }

  async streamResponse(messages, onChunk, options = {}) {
    throw new Error(`streamResponse() not implemented for provider: ${this.name}`);
  }

  async healthCheck() {
    throw new Error(`healthCheck() not implemented for provider: ${this.name}`);
  }

  async summarize(text, options = {}) {
    throw new Error(`summarize() not implemented for provider: ${this.name}`);
  }

  async translate(text, targetLang, options = {}) {
    throw new Error(`translate() not implemented for provider: ${this.name}`);
  }
}
