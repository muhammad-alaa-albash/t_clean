import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { companyUpdateSchema } from "@/lib/validation/companies";

// interface RouteContext {
//   params: {
//     id: string;
//   };
// }

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return errorResponse(400, "Invalid company id", "VALIDATION_ERROR");
  }

  const company = await prisma.company.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!company) {
    return errorResponse(404, "Company not found", "NOT_FOUND");
  }

  return successResponse("Company fetched successfully", { company });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authenticateRequest(req, { requireAdmin: true });

  if ("error" in authResult) {
    return authResult.error;
  }

  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return errorResponse(400, "Invalid company id", "VALIDATION_ERROR");
  }

  const json = await req.json();
  const parseResult = companyUpdateSchema.safeParse(json);

  if (!parseResult.success) {
    return errorResponse(
      400,
      "Validation error",
      "VALIDATION_ERROR",
      parseResult.error.format()
    );
  }

  const existing = await prisma.company.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existing) {
    return errorResponse(404, "Company not found", "NOT_FOUND");
  }

  if (parseResult.data.ownerId) {
    const owner = await prisma.user.findFirst({
      where: {
        id: parseResult.data.ownerId,
        isDeleted: false,
      },
    });

    if (!owner) {
      return errorResponse(400, "Invalid ownerId", "VALIDATION_ERROR");
    }
  }

  const updated = await prisma.company.update({
    where: { id },
    data: parseResult.data,
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return successResponse("Company updated successfully", { company: updated });
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
    return errorResponse(400, "Invalid company id", "VALIDATION_ERROR");
  }

  const existing = await prisma.company.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existing) {
    return errorResponse(404, "Company not found", "NOT_FOUND");
  }

  await prisma.$transaction([
    prisma.company.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    }),
    prisma.service.updateMany({
      where: {
        companyId: id,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
      },
    }),
  ]);

  return successResponse("Company deleted successfully");
}
