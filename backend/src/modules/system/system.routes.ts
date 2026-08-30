import { FastifyInstance } from "fastify";
import * as systemController from "./system.controller";
import { authenticate } from "../../core/middlewares/authMiddleware";
import { requireAdmin } from "../../core/middlewares/requireRole";

export default async function systemRoutes(app: FastifyInstance) {
  app.post(
    "/crud/:table",
    {
      preHandler: [authenticate as any, requireAdmin as any],
    },
    systemController.saveRow
  );
  app.delete(
    "/crud/:table/:id",
    {
      preHandler: [authenticate as any, requireAdmin as any],
    },
    systemController.deleteRow
  );
}
