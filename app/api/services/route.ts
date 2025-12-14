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
    ...(companyId && Number.isInteger(companyId) && companyId > 0
      ? {
          companies: {
            some: {
              companyId,
              company: {
                isDeleted: false,
              },
            },
          },
        }
      : {}),
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

  return successResponse("Services fetched successfully", {
    items,
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

  const { companyIds, ...serviceData } = parseResult.data;
  const uniqueCompanyIds = Array.from(new Set(companyIds));

  const companies = await prisma.company.findMany({
    where: {
      id: {
        in: uniqueCompanyIds,
      },
      isDeleted: false,
    },
    select: {
      id: true,
    },
  });

  if (companies.length !== uniqueCompanyIds.length) {
    const validIds = new Set(companies.map((c) => c.id));
    const invalidIds = uniqueCompanyIds.filter((id) => !validIds.has(id));

    return errorResponse(400, "Invalid companyIds", "VALIDATION_ERROR", {
      invalidCompanyIds: invalidIds,
    });
  }

  const service = await prisma.service.create({
    data: {
      ...serviceData,
      companies: {
        createMany: {
          data: uniqueCompanyIds.map((companyId) => ({ companyId })),
        },
      },
    },
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
  });

  const responseService = {
    id: service.id,
    name: service.name,
    description: service.description,
    price: service.price,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
    companyIds: service.companies.map((c) => c.companyId),
  };

  return successResponse("Service created successfully", {
    service: responseService,
  });
}
