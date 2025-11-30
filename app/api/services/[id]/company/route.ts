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
      company: true,
    },
  });

  if (!service || !service.company || service.company.isDeleted) {
    return errorResponse(
      404,
      "Company not found for this service",
      "NOT_FOUND"
    );
  }

  const company = {
    id: service.company.id,
    name: service.company.name,
    description: service.company.description,
    ownerId: service.company.ownerId,
    createdAt: service.company.createdAt,
    updatedAt: service.company.updatedAt,
  };

  return successResponse("Service company fetched successfully", { company });
}
