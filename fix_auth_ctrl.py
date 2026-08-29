import os

auth_ctrl_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/modules/auth/auth.controller.ts"
with open(auth_ctrl_path, "r") as f:
    content = f.read()

content = content.replace(
    'import prisma from "../../core/config/databaseConfig";',
    'import { prismaApp, prismaAdmin } from "../../core/config/databaseConfig";'
)

# update logout call
content = content.replace(
    'await authService.logout(req.user!.id, token);',
    'await authService.logout(req.user!.id, token, req.user!.role);'
)

# update changePassword call
content = content.replace(
    """await authService.changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword,
      token,
    );""",
    """await authService.changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword,
      token,
      req.user!.role
    );"""
)

# update getMe
getme_old = """  const dbUser = await prisma.user.findUnique({
    where: { id: user.id }
  });

  sendSuccess(res, "Session details", STATUS_CODES.OK, {
    user: dbUser,
    isAdmin: dbUser?.role === "ADMIN" || dbUser?.role === "SUPERADMIN",
    mfaSatisfied: true,
    hasMfaEnrolled: dbUser?.isTotpEnabled ?? false
  });"""
getme_new = """  let dbUser: any;
  if (user.role === "ADMIN" || user.role === "SUPERADMIN") {
    dbUser = await prismaAdmin.admin.findUnique({ where: { id: user.id } });
  } else {
    dbUser = await prismaApp.user.findUnique({ where: { id: user.id } });
  }

  sendSuccess(res, "Session details", STATUS_CODES.OK, {
    user: dbUser,
    isAdmin: dbUser?.role === "ADMIN" || dbUser?.role === "SUPERADMIN",
    mfaSatisfied: true,
    hasMfaEnrolled: dbUser?.isTotpEnabled ?? false
  });"""
content = content.replace(getme_old, getme_new)

with open(auth_ctrl_path, "w") as f:
    f.write(content)
print("Updated auth.controller.ts")
