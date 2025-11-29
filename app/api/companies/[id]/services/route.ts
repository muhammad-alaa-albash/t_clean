// import { NextRequest } from "next/server";

// import { prisma } from "@/lib/prisma";
// import { successResponse, errorResponse } from "@/lib/api-response";
// import { getPaginationParams, buildPaginationMeta } from "@/lib/pagination";

// interface RouteContext {
//   params: {
//     id: string;
//   };
// }

// export async function GET(req: NextRequest, context: RouteContext) {
//   const id = Number(context.params.id);

//   if (!Number.isInteger(id) || id <= 0) {
//     return errorResponse(400, "Invalid company id", "VALIDATION_ERROR");
//   }

//   const company = await prisma.company.findFirst({
//     where: {
//       id,
//       isDeleted: false,
//     },
//   });

//   if (!company) {
//     return errorResponse(404, "Company not found", "NOT_FOUND");
//   }

//   const { page, limit } = getPaginationParams(req);

//   const [services, total] = await Promise.all([
//     prisma.service.findMany({
//       where: {
//         companyId: id,
//         isDeleted: false,
//       },
//       select: {
//         id: true,
//         name: true,
//         description: true,
//         price: true,
//         companyId: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//       skip: (page - 1) * limit,
//       take: limit,
//     }),
//     prisma.service.count({
//       where: {
//         companyId: id,
//         isDeleted: false,
//       },
//     }),
//   ]);

//   return successResponse("Company services fetched successfully", {
//     items: services,
//     meta: buildPaginationMeta(total, page, limit),
//   });
// }
