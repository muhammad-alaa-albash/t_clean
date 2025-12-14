import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getPaginationParams, buildPaginationMeta } from "@/lib/pagination";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { id: idParam } = await context.params;

  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return errorResponse(400, "Invalid company id", "VALIDATION_ERROR");
  }

  const company = await prisma.company.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!company) {
    return errorResponse(404, "Company not found", "NOT_FOUND");
  }

  const { page, limit } = getPaginationParams(req);

  const where = {
    isDeleted: false,
    companies: {
      some: {
        companyId: id,
        company: {
          isDeleted: false,
        },
      },
    },
  };

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        createdAt: true,
        updatedAt: true,
        companies: {
          where: {
            company: {
              isDeleted: false,
            },
          },
          select: {
            companyId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.service.count({ where }),
  ]);

  const items = services.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    price: service.price,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
    companyIds: service.companies.map((c) => c.companyId),
  }));

  return successResponse("Company services fetched successfully", {
    items,
    meta: buildPaginationMeta(total, page, limit),
  });
}
