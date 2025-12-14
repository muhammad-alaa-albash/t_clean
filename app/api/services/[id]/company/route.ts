import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return errorResponse(400, "Invalid service id", "VALIDATION_ERROR");
  }

  const service = await prisma.service.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      companies: {
        where: {
          company: {
            isDeleted: false,
          },
        },
        include: {
          company: true,
        },
      },
    },
  });

  if (!service || !service.companies.length) {
    return errorResponse(
      404,
      "Company not found for this service",
      "NOT_FOUND"
    );
  }

  const firstCompany = service.companies[0].company;

  const company = {
    id: firstCompany.id,
    name: firstCompany.name,
    description: firstCompany.description,
    ownerId: firstCompany.ownerId,
    createdAt: firstCompany.createdAt,
    updatedAt: firstCompany.updatedAt,
  };

  return successResponse("Service company fetched successfully", { company });
}
