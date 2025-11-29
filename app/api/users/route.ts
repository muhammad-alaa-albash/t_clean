// import { NextRequest } from "next/server";

// import { prisma } from "@/lib/prisma";
// import { authenticateRequest } from "@/lib/auth";
// import { successResponse, errorResponse } from "@/lib/api-response";
// import { getPaginationParams, buildPaginationMeta } from "@/lib/pagination";

// export async function GET(req: NextRequest) {
//   const authResult = await authenticateRequest(req, { requireAdmin: true });

//   if ("error" in authResult) {
//     return authResult.error;
//   }

//   const { page, limit } = getPaginationParams(req);
//   const { searchParams } = req.nextUrl;

//   const search = searchParams.get("search") ?? undefined;
//   const sortByParam = searchParams.get("sortBy") ?? "createdAt";
//   const sortOrderParam = searchParams.get("sortOrder") ?? "desc";

//   const allowedSortFields = ["createdAt", "fullName", "email"] as const;
//   const sortBy = allowedSortFields.includes(sortByParam as any)
//     ? (sortByParam as (typeof allowedSortFields)[number])
//     : "createdAt";
//   const sortOrder = sortOrderParam === "asc" ? "asc" : "desc";

//   const where: any = {
//     isDeleted: false,
//   };

//   if (search) {
//     where.OR = [
//       { fullName: { contains: search, mode: "insensitive" } },
//       { email: { contains: search, mode: "insensitive" } },
//     ];
//   }

//   const [users, total] = await Promise.all([
//     prisma.user.findMany({
//       where,
//       select: {
//         id: true,
//         fullName: true,
//         email: true,
//         role: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//       orderBy: {
//         [sortBy]: sortOrder,
//       },
//       skip: (page - 1) * limit,
//       take: limit,
//     }),
//     prisma.user.count({ where }),
//   ]);

//   return successResponse("Users fetched successfully", {
//     items: users,
//     meta: buildPaginationMeta(total, page, limit),
//   });
// }
