class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;

    // Capture stack trace for debugging (only in non-production)
    if (process.env.NODE_ENV !== "production") {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Keep backward-compatible lowercase alias
export { ApiError, ApiError as apiError };
export default ApiError;