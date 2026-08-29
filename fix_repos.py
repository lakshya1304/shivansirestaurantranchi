import os

# 1. BaseRepository
base_repo_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/core/repositories/baseRepository.ts"
with open(base_repo_path, "r") as f:
    base_repo_content = f.read()

base_repo_content = base_repo_content.replace(
    'import prisma from "../config/databaseConfig";',
    'import { prismaApp, prismaAdmin } from "../config/databaseConfig";'
)
base_repo_content = base_repo_content.replace(
    'constructor(modelName: string) {',
    'constructor(modelName: string, prismaClient: any) {'
)
base_repo_content = base_repo_content.replace(
    'this.model = (prisma as any)[modelName];',
    'this.model = prismaClient[modelName];'
)

with open(base_repo_path, "w") as f:
    f.write(base_repo_content)


# 2. UserRepository
user_repo_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/core/repositories/userRepository.ts"
with open(user_repo_path, "r") as f:
    user_repo_content = f.read()

user_repo_content = 'import { prismaApp } from "../config/databaseConfig";\n' + user_repo_content
user_repo_content = user_repo_content.replace(
    'super("user");',
    'super("user", prismaApp);'
)
user_repo_content = user_repo_content.replace(
    'import { User } from "../../generated/prisma";',
    'import { User } from "../../generated/prismaApp";'
)

with open(user_repo_path, "w") as f:
    f.write(user_repo_content)


# 3. AuditLogRepository
audit_repo_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/core/repositories/auditLogRepository.ts"
with open(audit_repo_path, "r") as f:
    audit_repo_content = f.read()

audit_repo_content = 'import { prismaAdmin } from "../config/databaseConfig";\n' + audit_repo_content
audit_repo_content = audit_repo_content.replace(
    'super("auditLog");',
    'super("auditLog", prismaAdmin);'
)
audit_repo_content = audit_repo_content.replace(
    'import { AuditLog } from "../../generated/prisma";',
    'import { AuditLog } from "../../generated/prismaAdmin";'
)

with open(audit_repo_path, "w") as f:
    f.write(audit_repo_content)

print("Updated Repositories")
