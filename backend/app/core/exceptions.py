from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


class AppError(HTTPException):
    def __init__(self, code: str, message: str, status: int):
        self.code = code
        self.error_message = message
        super().__init__(status_code=status, detail={"code": code, "message": message, "status": status})


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__("NOT_FOUND", message, 404)


class ValidationError(AppError):
    def __init__(self, message: str = "Invalid request"):
        super().__init__("VALIDATION_ERROR", message, 400)


class DuplicateError(AppError):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__("DUPLICATE", message, 409)


class ExternalApiError(AppError):
    def __init__(self, message: str = "External API request failed"):
        super().__init__("EXTERNAL_API_ERROR", message, 502)


class AiServiceError(AppError):
    def __init__(self, message: str = "AI service error"):
        super().__init__("AI_SERVICE_ERROR", message, 503)


# Exception handlers — registered in main.py
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )


async def general_error_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": str(exc), "status": 500}},
    )
