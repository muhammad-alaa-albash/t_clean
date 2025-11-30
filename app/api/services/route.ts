import { NextRequest } from "next/server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getPaginationParams, buildPaginationMeta } from "@/lib/pagination";
import { serviceCreateSchema } from "@/lib/validation/services";

export async function GET(req: NextRequest) {
  const { page, limit } = getPaginationParams(req);
  const { searchParams } = req.nextUrl;

  const companyIdParam = searchParams.get("companyId");
  const companyId = companyIdParam ? Number(companyIdParam) : undefined;

  const where: Prisma.ServiceWhereInput = {
    isDeleted: false,
  };

  if (companyId && Number.isInteger(companyId) && companyId > 0) {
    where.companyId = companyId;
  }

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.service.count({ where }),
  ]);

  return successResponse("Services fetched successfully", {
    items: services,
    meta: buildPaginationMeta(total, page, limit),
  });
}

export async function POST(req: NextRequest) {
  const authResult = await authenticateRequest(req, { requireAdmin: true });

  if ("error" in authResult) {
    return authResult.error;
  }

  const json = await req.json();
  const parseResult = serviceCreateSchema.safeParse(json);

  if (!parseResult.success) {
    return errorResponse(
      400,
      "Validation error",
      "VALIDATION_ERROR",
      parseResult.error.format()
    );
  }

  const data = parseResult.data;

  const company = await prisma.company.findFirst({
    where: {
      id: data.companyId,
      isDeleted: false,
    },
  });

  if (!company) {
    return errorResponse(400, "Invalid companyId", "VALIDATION_ERROR");
  }

  const service = await prisma.service.create({
    data,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return successResponse("Service created successfully", { service });
}
