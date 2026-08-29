import { FastifyReply, FastifyRequest } from "fastify";
import { ForbiddenError } from "../utils/errors/error";

export const requireSuperAdmin = async (req: FastifyRequest, res: FastifyReply) => {
  if (!req.user || req.user.role !== "SUPERADMIN") {
    throw new ForbiddenError("Access denied. SuperAdmin role required.");
  }
};

export const requireAdmin = async (req: FastifyRequest, res: FastifyReply) => {
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "SUPERADMIN")) {
    throw new ForbiddenError("Access denied. Admin or SuperAdmin role required.");
  }
};

export const requireUser = async (req: FastifyRequest, res: FastifyReply) => {
  if (!req.user) {
    throw new ForbiddenError("Access denied. Authentication required.");
  }
};
