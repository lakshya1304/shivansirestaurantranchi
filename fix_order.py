import os
import re

file_path = "/home/nishu/TechStack/codes/maaTaraSweets/backend/src/modules/orders/order.controller.ts"

with open(file_path, "r") as f:
    content = f.read()

# 1. Replace imports
content = content.replace(
    'import prisma from "../../core/config/databaseConfig";',
    'import { prismaApp, prismaAdmin } from "../../core/config/databaseConfig";'
)

# 2. General prisma -> prismaApp, but prisma.restaurantSettings -> prismaAdmin.restaurantSettings
content = content.replace("prisma.restaurantSettings", "prismaAdmin.restaurantSettings")
# Replace prisma.$transaction -> prismaApp.$transaction
content = content.replace("prisma.$transaction", "prismaApp.$transaction")
# Replace prisma. -> prismaApp.
content = content.replace("prisma.", "prismaApp.")

# 3. Customer -> User
content = content.replace("prismaApp.customer", "prismaApp.user")
content = content.replace("tx.customer", "tx.user")
content = content.replace("customer_id:", "user_id:")

# 4. User creation data injection for phone orders
customer_create_1 = """        customer = await tx.user.create({
          data: {
            name: data.customerName,
            phone: data.customerPhone,"""
customer_create_1_new = """        customer = await tx.user.create({
          data: {
            name: data.customerName,
            email: `${data.customerPhone}@guest.maatarasweets.com`,
            password: crypto.randomBytes(16).toString("hex"),
            role: "USER",
            phone: data.customerPhone,"""
content = content.replace(customer_create_1, customer_create_1_new)

customer_create_2 = """      customer = await prismaApp.user.create({
        data: {
          name: phone, // Provide a default name since it's required
          phone,"""
customer_create_2_new = """      customer = await prismaApp.user.create({
        data: {
          name: phone, // Provide a default name since it's required
          email: `${phone}@guest.maatarasweets.com`,
          password: crypto.randomBytes(16).toString("hex"),
          role: "USER",
          phone,"""
content = content.replace(customer_create_2, customer_create_2_new)

with open(file_path, "w") as f:
    f.write(content)

print("Updated order.controller.ts")
