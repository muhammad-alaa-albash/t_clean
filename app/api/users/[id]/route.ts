import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { userUpdateSchema } from "@/lib/validation/users";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const authResult = await authenticateRequest(_req, { requireAdmin: true });

  if ("error" in authResult) {
    return authResult.error;
  }

  const id = Number(context.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return errorResponse(400, "Invalid user id", "VALIDATION_ERROR");
  }

  const user = await prisma.user.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return errorResponse(404, "User not found", "NOT_FOUND");
  }

  return successResponse("User fetched successfully", { user });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const authResult = await authenticateRequest(req, { requireAdmin: true });

  if ("error" in authResult) {
    return authResult.error;
  }

  const id = Number(context.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return errorResponse(400, "Invalid user id", "VALIDATION_ERROR");
  }

  const json = await req.json();
  const parseResult = userUpdateSchema.safeParse(json);

  if (!parseResult.success) {
    return errorResponse(
      400,
      "Validation error",
      "VALIDATION_ERROR",
      parseResult.error.format()
    );
  }

  const existing = await prisma.user.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existing) {
    return errorResponse(404, "User not found", "NOT_FOUND");
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: parseResult.data,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse("User updated successfully", { user: updated });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return errorResponse(409, "Email already in use", "EMAIL_IN_USE");
    }

    return errorResponse(500, "Internal server error", "INTERNAL_SERVER_ERROR");
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const authResult = await authenticateRequest(req, { requireAdmin: true });

  if ("error" in authResult) {
    return authResult.error;
  }

  const id = Number(context.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return errorResponse(400, "Invalid user id", "VALIDATION_ERROR");
  }

  const existing = await prisma.user.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existing) {
    return errorResponse(404, "User not found", "NOT_FOUND");
  }

  await prisma.user.update({
    where: { id },
    data: {
      isDeleted: true,
    },
  });

  return successResponse("User deleted successfully");
}
