import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { serviceUpdateSchema } from "@/lib/validation/services";

// interface RouteContext {
//   params: {
//     id: string;
//   };
// }

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return errorResponse(400, "Invalid service id", "VALIDATION_ERROR");
  }

  const service = await prisma.service.findFirst({
    where: {
      id,
      isDeleted: false,
    },
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

  if (!service) {
    return errorResponse(404, "Service not found", "NOT_FOUND");
  }

  return successResponse("Service fetched successfully", { service });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authenticateRequest(req, { requireAdmin: true });

  if ("error" in authResult) {
    return authResult.error;
  }

  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return errorResponse(400, "Invalid service id", "VALIDATION_ERROR");
  }

  const json = await req.json();
  const parseResult = serviceUpdateSchema.safeParse(json);

  if (!parseResult.success) {
    return errorResponse(
      400,
      "Validation error",
      "VALIDATION_ERROR",
      parseResult.error.format()
    );
  }

  const existing = await prisma.service.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existing) {
    return errorResponse(404, "Service not found", "NOT_FOUND");
  }

  if (parseResult.data.companyId) {
    const company = await prisma.company.findFirst({
      where: {
        id: parseResult.data.companyId,
        isDeleted: false,
      },
    });

    if (!company) {
      return errorResponse(400, "Invalid companyId", "VALIDATION_ERROR");
    }
  }

  const updated = await prisma.service.update({
    where: { id },
    data: parseResult.data,
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

  return successResponse("Service updated successfully", { service: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(req, { requireAdmin: true });

  if ("error" in authResult) {
    return authResult.error;
  }

  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return errorResponse(400, "Invalid service id", "VALIDATION_ERROR");
  }

  const existing = await prisma.service.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existing) {
    return errorResponse(404, "Service not found", "NOT_FOUND");
  }

  await prisma.service.update({
    where: { id },
    data: {
      isDeleted: true,
    },
  });

  return successResponse("Service deleted successfully");
}
