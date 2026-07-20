export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "membership_missing"
  | "membership_inactive"
  | "not_found"
  | "database_unavailable"
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

  return {
    statusCode: 500,
    code: "internal_error",
    message: "Erro interno ao processar a requisicao.",
  };
}
