import { NextResponse } from "next/server";

export type ApiSuccessResponse<T = unknown> = {
  status: "success";
  message: string;
  data?: T;
};

export type ApiErrorDetail = {
  code: string;
  details?: unknown;
};

export type ApiErrorResponse = {
  status: "error";
  message: string;
  error?: ApiErrorDetail;
};

export function successResponse<T>(
  message: string,
  data?: T,
  init?: ResponseInit
) {
  const body: ApiSuccessResponse<T> = {
    status: "success",
    message,
    ...(data !== undefined ? { data } : {}),
  };

  return NextResponse.json(body, init);
}

export function errorResponse(
  statusCode: number,
  message: string,
  code = "UNKNOWN_ERROR",
  details?: unknown
) {
  const body: ApiErrorResponse = {
    status: "error",
    message,
    error: {
      code,
      ...(details !== undefined ? { details } : {}),
    },
  };

  return NextResponse.json(body, { status: statusCode });
}
