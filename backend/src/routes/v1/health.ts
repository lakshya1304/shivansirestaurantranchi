import type { FastifyInstance } from "fastify";
import prisma from "../../config/databaseConfig.js";
import env from "../../config/envConfig.js";
import currentVersion from "../../utils/helpers/version.js";
import { sendSuccess } from "../../utils/common/response.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (req: any, res: any) => {
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(res, "Health OK", 200, { service: env.BUSINESS_NAME || "RanchiKart", version: currentVersion });
  });
}
