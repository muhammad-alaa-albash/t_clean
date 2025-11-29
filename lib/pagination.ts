import { NextRequest } from "next/server";

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta extends PaginationParams {
  total: number;
  totalPages: number;
}

export function getPaginationParams(
  req: NextRequest,
  defaultLimit = 10,
  maxLimit = 100
): PaginationParams {
  const { searchParams } = req.nextUrl;

  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit") ?? searchParams.get("pageSize");

  let page = pageParam ? Number(pageParam) : 1;
  let limit = limitParam ? Number(limitParam) : defaultLimit;

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  return { page, limit };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    total,
    page,
    limit,
    totalPages,
  };
}
