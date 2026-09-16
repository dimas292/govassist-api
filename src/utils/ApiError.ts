export class ApiError extends Error {
  statusCode: number;
  errors: unknown[];

  constructor(
    statusCode: number,
    message: string,
    errors: unknown[] = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = "Bad Request", errors?: unknown[]) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message = "Not Found") {
    return new ApiError(404, message);
  }

  static internal(message = "Internal Server Error") {
    return new ApiError(500, message);
  }

  static tooMany(message = "Too Many Requests") {
    return new ApiError(429, message);
  }
}
