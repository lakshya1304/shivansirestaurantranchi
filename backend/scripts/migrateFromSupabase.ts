import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const DATABASE_URL = process.env.DATABASE_URL || "postgres://...";
const pool = new pg.Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SUPABASE_URL = "https://ufwmfboxsosfqveiijil.supabase.co";
const SUPABASE_KEY = "sb_publishable_R5bbiiemOO0d5R8VH7ttmw_lYg1YPiu";

async function fetchSupabaseTable(table: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${table}: ${response.statusText}`);
  }
  return response.json();
}

async function migrateData() {
  console.log("Prisma object:", Object.keys(prisma));
  console.log("Starting migration from Supabase...");

  try {
    // 1. Categories
    const categories = await fetchSupabaseTable("categories");
    console.log(`Fetched ${categories.length} categories.`);
    for (const cat of categories) {
      await prisma.category.upsert({
        where: { id: cat.id || cat.slug },
        update: cat,
        create: cat,
      });
    }

    // 2. Products
    const products = await fetchSupabaseTable("products");
    console.log(`Fetched ${products.length} products.`);
    for (const prod of products) {
      await prisma.product.upsert({
        where: { id: prod.id },
        update: prod,
        create: prod,
      });
    }

    // 3. Restaurant Settings
    const settings = await fetchSupabaseTable("restaurant_settings");
    console.log(`Fetched ${settings.length} restaurant settings.`);
    for (const setting of settings) {
      await prisma.restaurantSettings.upsert({
        where: { id: setting.id },
        update: setting,
        create: setting,
      });
    }

    // 4. Offers
    const offers = await fetchSupabaseTable("offers");
    console.log(`Fetched ${offers.length} offers.`);
    for (const offer of offers) {
      await prisma.offer.upsert({
        where: { id: offer.id },
        update: offer,
        create: offer,
      });
    }

    // 5. Discounts
    const discounts = await fetchSupabaseTable("discounts");
    console.log(`Fetched ${discounts.length} discounts.`);
    for (const discount of discounts) {
      // Prisma arrays don't accept null. Supabase might send null for array columns.
      if (!discount.category_ids) discount.category_ids = [];
      if (!discount.product_ids) discount.product_ids = [];
      
      await prisma.discount.upsert({
        where: { id: discount.id },
        update: discount,
        create: discount,
      });
    }

    // 6. Loyalty Rules
    const rules = await fetchSupabaseTable("loyalty_rules");
    console.log(`Fetched ${rules.length} loyalty rules.`);
    for (const rule of rules) {
      await prisma.loyaltyRule.upsert({
        where: { id: rule.id },
        update: rule,
        create: rule,
      });
    }

    // 7. Restaurant Tables
    const tables = await fetchSupabaseTable("restaurant_tables");
    console.log(`Fetched ${tables.length} restaurant tables.`);
    for (const table of tables) {
      await prisma.restaurantTable.upsert({
        where: { id: table.id },
        update: table,
        create: table,
      });
    }

    // 8. Reviews
    const reviews = await fetchSupabaseTable("reviews");
    console.log(`Fetched ${reviews.length} reviews.`);
    for (const review of reviews) {
      await prisma.review.upsert({
        where: { id: review.id },
        update: review,
        create: review,
      });
    }

    // 9. Customers
    const customers = await fetchSupabaseTable("customers");
    console.log(`Fetched ${customers.length} customers.`);
    for (const customer of customers) {
      await prisma.customer.upsert({
        where: { id: customer.id },
        update: customer,
        create: customer,
      });
    }

    // 10. Orders
    const orders = await fetchSupabaseTable("orders");
    console.log(`Fetched ${orders.length} orders.`);
    for (const order of orders) {
      await prisma.order.upsert({
        where: { id: order.id },
        update: order,
        create: order,
      });
    }

    // 11. Order Items
    const orderItems = await fetchSupabaseTable("order_items");
    console.log(`Fetched ${orderItems.length} order items.`);
    for (const item of orderItems) {
      await prisma.orderItem.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }

    // 12. Seed Root SUPERADMIN
    console.log("Seeding root SUPERADMIN...");
    const rootAdminEmail = "nishanrajak01@gmail.com";
    const existingRoot = await prisma.user.findUnique({ where: { email: rootAdminEmail } });
    
    if (!existingRoot) {
      await prisma.user.create({
        data: {
          name: "Nishan Rajak",
          email: rootAdminEmail,
          password: "Nishur31@", // NOTE: ensure your prisma middleware hashes this!
          role: "SUPERADMIN",
        }
      });
      console.log(`Created root SUPERADMIN: ${rootAdminEmail}`);
    } else {
      console.log(`Root SUPERADMIN ${rootAdminEmail} already exists.`);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
