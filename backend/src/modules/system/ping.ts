import type { FastifyInstance } from "fastify";
import env from "../../core/config/envConfig.js";
import currentVersion from "../../core/utils/helpers/version.js";
import { sendSuccess } from "../../core/utils/common/response.js";

export async function pingRoutes(app: FastifyInstance) {
  app.get("/ping", async (req: any, res: any) => {
    return sendSuccess(res, "pong", 200, {
      service: env.BUSINESS_NAME || "RanchiKart",
      version: currentVersion,
    });
  });
}
