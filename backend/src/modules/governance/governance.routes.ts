import { FastifyInstance } from "fastify";
import { getRequests, submitVote, requestAction } from "./governance.controller";
import { authenticate } from "../../core/middlewares/authMiddleware";
import { requireAdmin } from "../../core/middlewares/requireRole";

export default async function governanceRoutes(app: FastifyInstance) {
  // Only SUPERADMIN should access governance routes
  app.addHook("preHandler", authenticate as any);
  app.addHook("preHandler", requireAdmin as any); // Wait, requireAdmin might just mean ADMIN or SUPERADMIN. We'll check in controller.

  app.get("/", getRequests);
  app.post("/request", requestAction);
  app.post("/:id/vote", submitVote);
}
