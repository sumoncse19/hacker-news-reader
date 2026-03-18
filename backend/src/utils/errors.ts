export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request") {
    super("VALIDATION_ERROR", message, 400);
  }
}

export class ExternalApiError extends AppError {
  constructor(message = "External API request failed") {
    super("EXTERNAL_API_ERROR", message, 502);
  }
}

export class AiServiceError extends AppError {
  constructor(message = "AI service error") {
    super("AI_SERVICE_ERROR", message, 503);
  }
}
