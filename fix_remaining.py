import os

# 1. catalog.controller.ts
catalog_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/modules/catalog/catalog.controller.ts"
if os.path.exists(catalog_path):
    with open(catalog_path, "r") as f:
        content = f.read()
    content = content.replace(
        'import prisma from "../../core/config/databaseConfig";',
        'import { prismaApp } from "../../core/config/databaseConfig";'
    )
    content = content.replace('prisma.', 'prismaApp.')
    with open(catalog_path, "w") as f:
        f.write(content)

# 2. review.controller.ts
review_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/modules/reviews/review.controller.ts"
if os.path.exists(review_path):
    with open(review_path, "r") as f:
        content = f.read()
    content = content.replace(
        'import prisma from "../../core/config/databaseConfig";',
        'import { prismaApp } from "../../core/config/databaseConfig";'
    )
    content = content.replace('prisma.', 'prismaApp.')
    with open(review_path, "w") as f:
        f.write(content)

# 3. settings.controller.ts
settings_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/modules/settings/settings.controller.ts"
if os.path.exists(settings_path):
    with open(settings_path, "r") as f:
        content = f.read()
    content = content.replace(
        'import prisma from "../../core/config/databaseConfig";',
        'import { prismaAdmin } from "../../core/config/databaseConfig";'
    )
    content = content.replace('prisma.', 'prismaAdmin.')
    with open(settings_path, "w") as f:
        f.write(content)

# 4. health.ts
health_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/modules/system/health.ts"
if os.path.exists(health_path):
    with open(health_path, "r") as f:
        content = f.read()
    content = content.replace(
        'import prisma from "../../core/config/databaseConfig.js";',
        'import { prismaApp, prismaAdmin } from "../../core/config/databaseConfig.js";'
    )
    content = content.replace('await prisma.$queryRaw`SELECT 1`;', 'await prismaApp.$queryRaw`SELECT 1`; await prismaAdmin.$queryRaw`SELECT 1`;')
    with open(health_path, "w") as f:
        f.write(content)

# 5. system.controller.ts
system_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/modules/system/system.controller.ts"
if os.path.exists(system_path):
    with open(system_path, "r") as f:
        content = f.read()
    content = content.replace(
        'import prisma from "../../core/config/databaseConfig";',
        'import { prismaApp, prismaAdmin } from "../../core/config/databaseConfig";'
    )
    content = content.replace(
        'const delegate = (prisma as any)[modelName];',
        'let delegate = (prismaApp as any)[modelName];\n    if (!delegate) delegate = (prismaAdmin as any)[modelName];'
    )
    with open(system_path, "w") as f:
        f.write(content)

print("Updated remaining controllers")
