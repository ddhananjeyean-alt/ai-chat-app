/**
 * RetryManager handles retries for transient errors.
 */
export class RetryManager {
  /**
   * Checks if an error is transient (e.g. server error, network drop, timeout).
   * @param {Error} error 
   * @returns {boolean} True if the error is transient and should be retried.
   */
  static isTransient(error) {
    const status = error.status || error.response?.status;
    
    // Explicit non-transient status codes
    if (status) {
      if ([401, 403, 404, 422, 429].includes(status)) {
        return false;
      }
      if (status >= 500 && status <= 504) {
        return true;
      }
    }

    const message = (error.message || "").toLowerCase();
    
    // Explicit client-side errors to NOT retry
    if (
      message.includes("quota") ||
      message.includes("rate limit") ||
      message.includes("unauthorized") ||
      message.includes("forbidden") ||
      message.includes("key is not valid") ||
      message.includes("safety") ||
      message.includes("block") ||
      message.includes("flagged")
    ) {
      return false;
    }

    // Network errors, timeouts, fetch failures are transient
    if (
      message.includes("timeout") ||
      message.includes("network error") ||
      message.includes("fetch failed") ||
      message.includes("econnreset") ||
      error.name === "AbortError" ||
      error.code === "ETIMEDOUT" ||
      error.code === "ECONNRESET"
    ) {
      return true;
    }

    // Default: assume transient if status is unknown/server-side
    return !status || status >= 500;
  }

  /**
   * Executes a function with a maximum of one retry for transient failures.
   * @param {Function} fn - Async function to execute
   * @param {number} [delayMs=500] - Delay before retrying
   * @returns {Promise<any>}
   */
  static async execute(fn, delayMs = 500) {
    try {
      return await fn();
    } catch (error) {
      if (this.isTransient(error)) {
        console.warn(`Transient error encountered. Retrying in ${delayMs}ms... Error:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return await fn(); // Retry once
      }
      throw error; // Propagate non-transient error immediately
    }
  }
}
export default RetryManager;
