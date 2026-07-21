export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "membership_missing"
  | "membership_inactive"
  | "not_found"
  | "database_unavailable"
  | "rate_limited"
  | "internal_error";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ApiErrorCode;

  constructor(statusCode: number, code: ApiErrorCode, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function toPublicError(error: unknown): { statusCode: number; code: ApiErrorCode; message: string } {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
    };
  }

  if (isHttpError(error) && error.statusCode >= 400 && error.statusCode < 500) {
    return {
      statusCode: error.statusCode,
      code: "bad_request",
      message: error.statusCode === 413 ? "Payload excede o limite permitido." : "Requisicao invalida.",
    };
  }

  return {
    statusCode: 500,
    code: "internal_error",
    message: "Erro interno ao processar a requisicao.",
  };
}

function isHttpError(error: unknown): error is { statusCode: number } {
  return Boolean(error) && typeof error === "object" && typeof (error as { statusCode?: unknown }).statusCode === "number";
}
