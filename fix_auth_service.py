import os

auth_service_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/modules/auth/auth.service.ts"
with open(auth_service_path, "r") as f:
    content = f.read()

# Import AdminRepository
content = content.replace(
    'import UserRepository from "../../core/repositories/userRepository";',
    'import UserRepository from "../../core/repositories/userRepository";\nimport AdminRepository from "../../core/repositories/adminRepository";'
)

# Instantiate AdminRepository
content = content.replace(
    'const userRepo = new UserRepository();',
    'const userRepo = new UserRepository();\nconst adminRepo = new AdminRepository();'
)

# Update passkeys table reference
content = content.replace(
    'import prisma from "../../core/config/databaseConfig";',
    'import { prismaAdmin } from "../../core/config/databaseConfig";'
)
content = content.replace('prisma.passkey', 'prismaAdmin.passkey')

# Refactor login logic to check adminRepo then userRepo
login_old = """  async login(
    email: string,
    password: string,
    totpToken?: string,
  ): Promise<{ user: any; tokens: TokenPair; requireTotp?: boolean }> {
    const user = await userRepo.findByEmail(email);
    if (!user) throw new UnauthorizedError("Invalid email or password.");
    if (!user.isActive) {
      throw new UnauthorizedError("Account is deactivated. Contact admin.");
    }"""
login_new = """  async login(
    email: string,
    password: string,
    totpToken?: string,
  ): Promise<{ user: any; tokens: TokenPair; requireTotp?: boolean }> {
    let user: any = await adminRepo.findByEmail(email);
    let repo: any = adminRepo;
    if (!user) {
      user = await userRepo.findByEmail(email);
      repo = userRepo;
    }
    if (!user) throw new UnauthorizedError("Invalid email or password.");
    if (!user.isActive) {
      throw new UnauthorizedError("Account is deactivated. Contact admin.");
    }"""
content = content.replace(login_old, login_new)

# In login(), update updateRefreshToken
content = content.replace('await userRepo.updateRefreshToken(user.id, tokens.refreshToken);', 'await repo.updateRefreshToken(user.id, tokens.refreshToken);')
content = content.replace('await userRepo.updateLastLogin(user.id);', 'await repo.updateLastLogin(user.id);')


# Refactor logout
logout_old = """  async logout(userId: string, accessToken: string): Promise<void> {
    await blacklistToken(accessToken);
    await removeRefreshToken(userId);
    await userRepo.updateRefreshToken(userId, null);
    logger.info(`User ${userId} logged out.`);
  }"""
logout_new = """  async logout(userId: string, accessToken: string, role?: string): Promise<void> {
    await blacklistToken(accessToken);
    await removeRefreshToken(userId);
    if (role === "ADMIN" || role === "SUPERADMIN") {
        await adminRepo.updateRefreshToken(userId, null);
    } else {
        await userRepo.updateRefreshToken(userId, null);
    }
    logger.info(`User/Admin ${userId} logged out.`);
  }"""
content = content.replace(logout_old, logout_new)


# Refactor changePassword
cp_old = """  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    accessToken: string,
  ): Promise<void> {
    const user = await userRepo.findById(userId);"""
cp_new = """  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    accessToken: string,
    role?: string
  ): Promise<void> {
    const repo: any = (role === "ADMIN" || role === "SUPERADMIN") ? adminRepo : userRepo;
    const user = await repo.findById(userId);"""
content = content.replace(cp_old, cp_new)
content = content.replace('await userRepo.update(userId, { password: newPassword });', 'await repo.update(userId, { password: newPassword });')
# In cp_new, we already replaced userRepo with repo on the findById line. Now for the rest of changePassword:
content = content.replace('await userRepo.updateRefreshToken(userId, null);', 'await repo.updateRefreshToken(userId, null);')


# Refactor refreshTokens
rt_old = """  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const decoded = await verifyRefreshToken(refreshToken);

    const storedToken = await getStoredRefreshToken(decoded.id);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedError("Refresh token is invalid or has been revoked.");
    }

    const user = await userRepo.findById(decoded.id);"""
rt_new = """  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const decoded = await verifyRefreshToken(refreshToken);

    const storedToken = await getStoredRefreshToken(decoded.id);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedError("Refresh token is invalid or has been revoked.");
    }

    const repo: any = (decoded.role === "ADMIN" || decoded.role === "SUPERADMIN") ? adminRepo : userRepo;
    const user = await repo.findById(decoded.id);"""
content = content.replace(rt_old, rt_new)

content = content.replace('await userRepo.updateRefreshToken(user.id, tokens.refreshToken);', 'await repo.updateRefreshToken(user.id, tokens.refreshToken);', 1)


# Register: don't allow SUPERADMIN creation in authService register, because it's for customers!
reg_old = """    const isSuperAdmin = data.email === "nishanrajak01@gmail.com";
    const role = isSuperAdmin ? "SUPERADMIN" : "USER";

    const user = await userRepo.create({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      role,
    });"""
reg_new = """    const role = "USER";

    const user = await userRepo.create({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      role,
    });"""
content = content.replace(reg_old, reg_new)

with open(auth_service_path, "w") as f:
    f.write(content)
print("Updated auth.service.ts")
