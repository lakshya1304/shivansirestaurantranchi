import { FastifyPluginAsync } from "fastify";
import { getAllUsers, createUser, updateUser, updateRole, deleteUser } from "../../controllers/userController";
import { authenticate } from "../../middlewares/authMiddleware";
import { requireAdmin, requireSuperAdmin } from "../../middlewares/requireRole";

const userRoutes: FastifyPluginAsync = async (app) => {
  // GET  /data/users         — Admin + SuperAdmin: list all users
  app.get("/", { preHandler: [authenticate as any, requireAdmin as any] }, getAllUsers);

  // POST /data/users         — Admin + SuperAdmin: create a new user
  app.post("/", { preHandler: [authenticate as any, requireAdmin as any] }, createUser);

  // PATCH /data/users/:id    — Admin + SuperAdmin: update name/email/isActive
  app.patch("/:id", { preHandler: [authenticate as any, requireAdmin as any] }, updateUser);

  // PATCH /data/users/:id/role — SuperAdmin only: change role
  app.patch("/:id/role", { preHandler: [authenticate as any, requireSuperAdmin as any] }, updateRole);

  // DELETE /data/users/:id   — SuperAdmin only: delete any user
  app.delete("/:id", { preHandler: [authenticate as any, requireSuperAdmin as any] }, deleteUser);
};

export default userRoutes;
