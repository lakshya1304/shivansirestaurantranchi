import os, re

# -------------------------------------------------------------------
# 1. baseRepository.ts — fix Prisma import from removed path
# -------------------------------------------------------------------
base_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/core/repositories/baseRepository.ts"
with open(base_path) as f:
    txt = f.read()

txt = txt.replace(
    'import { Prisma } from "../../generated/prisma";',
    'import { Prisma } from "../../generated/prismaApp";'
)
with open(base_path, "w") as f:
    f.write(txt)
print("✅ baseRepository.ts")

# -------------------------------------------------------------------
# 2. core/types/index.ts — AuditLogEntry uses 'userId', admin schema uses 'adminId'
#    => make userId optional and add adminId alias so both work
# -------------------------------------------------------------------
types_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/core/types/index.ts"
with open(types_path) as f:
    txt = f.read()

old_auditlog = """export interface AuditLogEntry {
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  details?: Record<string, any>;
}"""
new_auditlog = """export interface AuditLogEntry {
  action: string;
  entity: string;
  entityId: string;
  userId?: string;
  adminId?: string;
  details?: Record<string, any>;
}"""
txt = txt.replace(old_auditlog, new_auditlog)
with open(types_path, "w") as f:
    f.write(txt)
print("✅ types/index.ts")

# -------------------------------------------------------------------
# 3. auditLogRepository.ts — the admin schema uses 'adminId', not 'userId'
# -------------------------------------------------------------------
audit_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/core/repositories/auditLogRepository.ts"
with open(audit_path) as f:
    txt = f.read()

txt = txt.replace(
    """  async logAction(entry: AuditLogEntry): Promise<AuditLog> {
    return this.create({
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      userId: entry.userId,
      details: entry.details || {},
    });
  }""",
    """  async logAction(entry: AuditLogEntry): Promise<AuditLog> {
    return this.create({
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      adminId: entry.adminId ?? entry.userId,
      details: entry.details || {},
    });
  }"""
)
with open(audit_path, "w") as f:
    f.write(txt)
print("✅ auditLogRepository.ts")

# -------------------------------------------------------------------
# 4. user.controller.ts — auditLog uses adminId; role enum mismatch fix
# -------------------------------------------------------------------
user_ctrl_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/modules/users/user.controller.ts"
with open(user_ctrl_path) as f:
    txt = f.read()

# fix userId -> adminId in auditLog creates
txt = txt.replace("userId: requestor.id", "adminId: requestor.id")
# fix Role enum: use prismaAdmin's Role enum alias
txt = txt.replace(
    'import { NotFoundError, ForbiddenError, BadRequestError } from "../../core/utils/errors/error";',
    'import { NotFoundError, ForbiddenError, BadRequestError } from "../../core/utils/errors/error";\nimport { $Enums } from "../../generated/prismaAdmin";'
)
# fix role assignment — cast to $Enums.Role
txt = txt.replace(
    "data: { name: name || \"\", email, password: passwordHash, role },",
    "data: { name: name || \"\", email, password: passwordHash, role: role as $Enums.Role },"
)
txt = txt.replace(
    "data: { role },",
    "data: { role: role as $Enums.Role },"
)

with open(user_ctrl_path, "w") as f:
    f.write(txt)
print("✅ user.controller.ts")

# -------------------------------------------------------------------
# 5. catalog.controller.ts — 'customer' model replaced by 'user' in appDB
# -------------------------------------------------------------------
catalog_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/modules/catalog/catalog.controller.ts"
with open(catalog_path) as f:
    txt = f.read()

txt = txt.replace(
    "prismaApp.customer.findMany({ orderBy: { total_spend: \"desc\" } })",
    "prismaApp.user.findMany({ where: { role: 'USER' }, orderBy: { total_spend: \"desc\" } })"
)
with open(catalog_path, "w") as f:
    f.write(txt)
print("✅ catalog.controller.ts (customers → users)")

# -------------------------------------------------------------------
# 6. databaseConfig.ts — 'user' extension hook refers to non-existent model in admin
#    Admin DB has 'admin' not 'user'. Fix the $extends hook.
# -------------------------------------------------------------------
db_conf_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/core/config/databaseConfig.ts"
with open(db_conf_path) as f:
    txt = f.read()

old_admin_extend = """export const prismaAdmin = basePrismaAdmin.$extends({
  query: {
    user: {
      async create({ args, query }: any) {
        await hashUserPassword(args.data);
        return query(args);
      },
      async update({ args, query }: any) {
        await hashUserPassword(args.data);
        return query(args);
      },
    },
  },
}) as unknown as PrismaAdminClient;"""
new_admin_extend = """export const prismaAdmin = basePrismaAdmin.$extends({
  query: {
    admin: {
      async create({ args, query }: any) {
        await hashUserPassword(args.data);
        return query(args);
      },
      async update({ args, query }: any) {
        await hashUserPassword(args.data);
        return query(args);
      },
    },
  },
}) as unknown as PrismaAdminClient;"""
txt = txt.replace(old_admin_extend, new_admin_extend)
with open(db_conf_path, "w") as f:
    f.write(txt)
print("✅ databaseConfig.ts")

# -------------------------------------------------------------------
# 7. auth.service.ts — fix 'repo' scoping (refreshTokens) + passkey userId -> adminId
#    + auth.service prismaAdmin.passkey userId -> adminId
# -------------------------------------------------------------------
auth_svc_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/modules/auth/auth.service.ts"
with open(auth_svc_path) as f:
    txt = f.read()

# Fix refreshTokens: repo is not in scope after the if block — declare it at function level
old_rt = """  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const decoded = await verifyRefreshToken(refreshToken);

    const storedToken = await getStoredRefreshToken(decoded.id);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedError("Refresh token is invalid or has been revoked.");
    }

    const repo: any = (decoded.role === "ADMIN" || decoded.role === "SUPERADMIN") ? adminRepo : userRepo;
    const user = await repo.findById(decoded.id);
    if (!user.isActive) throw new UnauthorizedError("Account is deactivated");

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const tokens = generateTokenPair(payload);

    await storeRefreshToken(user.id, tokens.refreshToken);
    await repo.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }"""
new_rt = """  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const decoded = await verifyRefreshToken(refreshToken);

    const storedToken = await getStoredRefreshToken(decoded.id);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedError("Refresh token is invalid or has been revoked.");
    }

    const tokenRepo: any = (decoded.role === "ADMIN" || decoded.role === "SUPERADMIN") ? adminRepo : userRepo;
    const user = await tokenRepo.findById(decoded.id);
    if (!user.isActive) throw new UnauthorizedError("Account is deactivated");

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const tokens = generateTokenPair(payload);

    await storeRefreshToken(user.id, tokens.refreshToken);
    await tokenRepo.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }"""
txt = txt.replace(old_rt, new_rt)

# Fix WebAuthn: passkeys in Admin DB use 'adminId' not 'userId'
txt = txt.replace('adminId: user.id,\n        }', 'adminId: user.id,\n        }')  # no-op if already correct
# Force correct field on passkey create
txt = re.sub(r'(prismaAdmin\.passkey\.create\(\{\s+data: \{[^}]*)userId: user\.id', r'\1adminId: user.id', txt)
txt = re.sub(r'(prismaAdmin\.passkey\.findMany\(\{ where: \{) userId: user\.id', r'\1 adminId: user.id', txt)
txt = re.sub(r'(prismaAdmin\.passkey\.update\(\{[^}]+where:[^}]+\},[^}]+data: \{[^}]*)userId:', r'\1adminId:', txt)

with open(auth_svc_path, "w") as f:
    f.write(txt)
print("✅ auth.service.ts")

# -------------------------------------------------------------------
# 8. email.ts — check what's at line 12 that has a prisma import issue
#    (The error was "12" in email.ts — let's check)
# -------------------------------------------------------------------
email_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/core/utils/helpers/email.ts"
with open(email_path) as f:
    txt = f.read()

if "generated/prisma\"" in txt:
    txt = txt.replace('from "../../generated/prisma"', 'from "../../generated/prismaApp"')
    with open(email_path, "w") as f:
        f.write(txt)
    print("✅ email.ts")
else:
    print("⚠ email.ts — no stale import found, checking...")

# -------------------------------------------------------------------
# 9. jwt.ts — check what's at line 51 (redis import probably fine)
# -------------------------------------------------------------------
jwt_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/core/utils/helpers/jwt.ts"
with open(jwt_path) as f:
    jwt_txt = f.read()

if "generated/prisma\"" in jwt_txt:
    jwt_txt = jwt_txt.replace('from "../../generated/prisma"', 'from "../../generated/prismaApp"')
    with open(jwt_path, "w") as f:
        f.write(jwt_txt)
    print("✅ jwt.ts")
else:
    print("⚠ jwt.ts — no stale import found")

# -------------------------------------------------------------------
# 10. supabase.ts — check if has stale prisma import
# -------------------------------------------------------------------
supabase_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/core/utils/image/supabase.ts"
with open(supabase_path) as f:
    sup_txt = f.read()

if "generated/prisma\"" in sup_txt:
    sup_txt = sup_txt.replace('from "../../generated/prisma"', 'from "../../generated/prismaApp"')
    with open(supabase_path, "w") as f:
        f.write(sup_txt)
    print("✅ supabase.ts")
else:
    print("⚠ supabase.ts — no stale import found")

print("\nAll fixes applied. Running build...")
