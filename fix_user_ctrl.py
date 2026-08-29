import os

user_ctrl_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/modules/users/user.controller.ts"
with open(user_ctrl_path, "r") as f:
    content = f.read()

content = content.replace(
    'import prisma from "../../core/config/databaseConfig";',
    'import { prismaAdmin } from "../../core/config/databaseConfig";'
)

# User -> Admin replacements
content = content.replace("prisma.user", "prismaAdmin.admin")
content = content.replace("tx.user", "tx.admin")
content = content.replace("tx.auditLog", "tx.auditLog") # no change needed for auditLog table name
content = content.replace("prisma.$transaction", "prismaAdmin.$transaction")
content = content.replace("const users = await prismaAdmin.admin.findMany(", "const users = await prismaAdmin.admin.findMany(")

# We should make sure the return objects send "user" as key still to not break frontend.
# The code does `return reply.send({ success: true, user });` - this is fine.
# And `return reply.send({ success: true, users });` - this is fine.

with open(user_ctrl_path, "w") as f:
    f.write(content)
print("Updated user.controller.ts")
