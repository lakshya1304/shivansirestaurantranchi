import type { FastifyInstance } from "fastify";
import { prismaApp, prismaAdmin } from "../../core/config/databaseConfig.js";
import env from "../../core/config/envConfig.js";
import currentVersion from "../../core/utils/helpers/version.js";
import { sendSuccess } from "../../core/utils/common/response.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (req: any, res: any) => {
    await prismaApp.$queryRaw`SELECT 1`;
    await prismaAdmin.$queryRaw`SELECT 1`;
    return sendSuccess(res, "Health OK", 200, {
      service: env.BUSINESS_NAME || "RanchiKart",
      version: currentVersion,
    });
  });
}
