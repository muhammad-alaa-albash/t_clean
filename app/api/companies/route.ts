import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getPaginationParams, buildPaginationMeta } from "@/lib/pagination";
import {
  companyCreateSchema,
  companyUpdateSchema,
} from "@/lib/validation/companies";

export async function GET(req: NextRequest) {
  const { page, limit } = getPaginationParams(req);
  const { searchParams } = req.nextUrl;

  const search = searchParams.get("search") ?? undefined;

  const where: any = {
    isDeleted: false,
  };

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.company.count({ where }),
  ]);

  return successResponse("Companies fetched successfully", {
    items: companies,
    meta: buildPaginationMeta(total, page, limit),
  });
}

export async function POST(req: NextRequest) {
  const authResult = await authenticateRequest(req, { requireAdmin: true });

  if ("error" in authResult) {
    return authResult.error;
  }

  const json = await req.json();
  const parseResult = companyCreateSchema.safeParse(json);

  if (!parseResult.success) {
    return errorResponse(
      400,
      "Validation error",
      "VALIDATION_ERROR",
      parseResult.error.format()
    );
  }

  const data = parseResult.data;

  if (data.ownerId) {
    const owner = await prisma.user.findFirst({
      where: {
        id: data.ownerId,
        isDeleted: false,
      },
    });

    if (!owner) {
      return errorResponse(400, "Invalid ownerId", "VALIDATION_ERROR");
    }
  }

  const company = await prisma.company.create({
    data,
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return successResponse("Company created successfully", { company });
}
