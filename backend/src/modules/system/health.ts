import type { FastifyInstance } from "fastify";
import { prismaApp, prismaAdmin } from "../../core/config/databaseConfig.js";
import env from "../../core/config/envConfig.js";
import currentVersion from "../../core/utils/helpers/version.js";
import { sendSuccess } from "../../core/utils/common/response.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_req, res) => {
    try {
      await prismaApp.$queryRaw`SELECT 1`;
    } catch (error) {
      return sendSuccess(res, "User database unavailable", 503, {
        service: env.BUSINESS_NAME || "Maa Tara Sweets",
        version: currentVersion,
        database: "app",
        status: "down",
      });
    }

    try {
      await prismaAdmin.$queryRaw`SELECT 1`;
    } catch (error) {
      return sendSuccess(res, "Admin database unavailable", 503, {
        service: env.BUSINESS_NAME || "Maa Tara Sweets",
        version: currentVersion,
        database: "admin",
        status: "down",
      });
    }

    return sendSuccess(res, "Health OK", 200, {
      service: env.BUSINESS_NAME || "Maa Tara Sweets",
      version: currentVersion,
      databases: {
        app: "up",
        admin: "up",
      },
    });
  })
}
