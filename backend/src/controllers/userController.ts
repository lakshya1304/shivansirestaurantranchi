import { FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import prisma from "../config/databaseConfig";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors/error";

const ROOT_EMAIL = "nishanrajak01@gmail.com";

// ─── Helpers ────────────────────────────────────────────────────────────────

function assertCanModify(
  requestorRole: string,
  targetRole: string,
  targetId: string,
  requestorId: string,
) {
  if (requestorRole === "ADMIN") {
    if (targetRole === "SUPERADMIN") throw new ForbiddenError("Admins cannot modify a SUPERADMIN");
    if (targetRole === "ADMIN" && targetId !== requestorId)
      throw new ForbiddenError("Admins cannot modify other Admins. Ask a SUPERADMIN.");
  }
}

// ─── GET /data/users ─────────────────────────────────────────────────────────

export const getAllUsers = async (req: FastifyRequest, reply: FastifyReply) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      isActive: true,
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
  return reply.send({ success: true, users });
};

// ─── POST /data/users ─────────────────────────────────────────────────────────

export const createUser = async (
  req: FastifyRequest<{
    Body: { name?: string; email: string; password: string; role: "USER" | "ADMIN" | "SUPERADMIN" };
  }>,
  reply: FastifyReply,
) => {
  const { name, email, password, role } = req.body;
  const requestor = req.user!;

  if (!["USER", "ADMIN", "SUPERADMIN"].includes(role)) throw new BadRequestError("Invalid role");
  if (!email || !password) throw new BadRequestError("Email and password are required");

  // Admin cannot create a SUPERADMIN
  if (requestor.role === "ADMIN" && role === "SUPERADMIN")
    throw new ForbiddenError("Admins cannot create SUPERADMIN accounts");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new BadRequestError("A user with this email already exists");

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: { name: name || null, email, password: passwordHash, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true, isActive: true },
  });

  return reply.status(201).send({ success: true, user });
};

// ─── PATCH /data/users/:id ────────────────────────────────────────────────────

export const updateUser = async (
  req: FastifyRequest<{
    Params: { id: string };
    Body: { name?: string; email?: string; isActive?: boolean };
  }>,
  reply: FastifyReply,
) => {
  const { id } = req.params;
  const { name, email, isActive } = req.body;
  const requestor = req.user!;

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) throw new NotFoundError("User not found");

  assertCanModify(requestor.role, targetUser.role, targetUser.id, requestor.id);

  // If changing email, make sure it's not taken
  if (email && email !== targetUser.email) {
    const clash = await prisma.user.findUnique({ where: { email } });
    if (clash) throw new BadRequestError("Email already in use by another account");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(isActive !== undefined && { isActive }),
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true, isActive: true },
  });

  return reply.send({ success: true, user: updated });
};

// ─── PATCH /data/users/:id/role ───────────────────────────────────────────────

export const updateRole = async (
  req: FastifyRequest<{
    Params: { id: string };
    Body: { role: "USER" | "ADMIN" | "SUPERADMIN" };
  }>,
  reply: FastifyReply,
) => {
  const { id } = req.params;
  const { role } = req.body;
  const requestor = req.user!;

  if (!["USER", "ADMIN", "SUPERADMIN"].includes(role)) throw new BadRequestError("Invalid role");

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) throw new NotFoundError("User not found");

  if (requestor.role === "ADMIN") {
    if (role === "SUPERADMIN") throw new ForbiddenError("Admins cannot grant SUPERADMIN role");
    if (targetUser.role === "SUPERADMIN") throw new ForbiddenError("Admins cannot modify a SUPERADMIN");
    if (targetUser.role === "ADMIN" && targetUser.id !== requestor.id)
      throw new ForbiddenError("Admins cannot demote other Admins. Ask a SUPERADMIN.");
  }

  // Protect root superadmin
  if (targetUser.email === ROOT_EMAIL && role !== "SUPERADMIN")
    throw new ForbiddenError("The root SUPERADMIN cannot be demoted.");

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true, createdAt: true, isActive: true },
  });

  return reply.send({ success: true, user: updated });
};

// ─── DELETE /data/users/:id ───────────────────────────────────────────────────

export const deleteUser = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const { id } = req.params;
  const requestor = req.user!;

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) throw new NotFoundError("User not found");

  if (targetUser.id === requestor.id) throw new ForbiddenError("You cannot delete your own account");
  if (targetUser.email === ROOT_EMAIL) throw new ForbiddenError("The root SUPERADMIN cannot be deleted");

  assertCanModify(requestor.role, targetUser.role, targetUser.id, requestor.id);

  // Additional check: Admins cannot delete other Admins
  if (requestor.role === "ADMIN" && targetUser.role === "ADMIN")
    throw new ForbiddenError("Admins cannot delete other Admins. Ask a SUPERADMIN.");

  await prisma.user.delete({ where: { id } });

  return reply.send({ success: true, message: "User deleted successfully" });
};
