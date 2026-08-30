import { prismaAdmin, prismaApp } from "../src/core/config/databaseConfig.js";
import env from "../src/core/config/envConfig.js";

async function main() {
  console.log("🚀 Starting database seeding for Maa Tara Sweets...");

  // ==========================================
  // 1. SEED ADMIN DATABASE (prismaAdmin)
  // ==========================================
  console.log("\n📦 Seeding Admin Database...");

  const adminEmail = "nishanrajak01@gmail.com";
  const existingAdmin = await prismaAdmin.admin.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const admin = await prismaAdmin.admin.create({
      data: {
        name: "Nishan Rajak",
        email: adminEmail,
        password: "Nishur31@",
        role: "SUPERADMIN",
        phone: "+919876543210",
        isActive: true,
      },
    });
    console.log(` ✅ Created SuperAdmin: ${admin.email}`);
  } else {
    await prismaAdmin.admin.update({
      where: { email: adminEmail },
      data: {
        role: "SUPERADMIN",
        password: "Nishur31@",
      },
    });
    console.log(` ℹ️  Updated SuperAdmin (${adminEmail}) role and password.`);
  }

  // Restaurant Settings
  const existingSettings = await prismaAdmin.restaurantSettings.findFirst();
  if (!existingSettings) {
    await prismaAdmin.restaurantSettings.create({
      data: {
        name: env.BUSINESS_NAME || "Maa Tara Sweets",
        tagline: "Authentic Indian Sweets & Fine Dining",
        address: "Main Road, Near Overbridge, Ranchi, Jharkhand 834001",
        phone: "+91 98765 43210",
        gst_number: "20AAAAA0000A1Z5",
        opening_time: "08:00 AM",
        closing_time: "10:30 PM",
        upi_id: "maatara@upi",
        tax_percent: 5.0,
        packing_charge: 10.0,
        delivery_charge: 30.0,
        currency: "₹",
        theme: "default",
      },
    });
    console.log(" ✅ Created Restaurant Settings.");
  } else {
    console.log(" ℹ️  Restaurant Settings already exist.");
  }

  // App Config
  const existingAppConfig = await prismaAdmin.appConfig.findFirst();
  if (!existingAppConfig) {
    await prismaAdmin.appConfig.create({
      data: {
        owner_email: adminEmail,
      },
    });
    console.log(" ✅ Created App Config.");
  } else {
    console.log(" ℹ️  App Config already exists.");
  }

  // ==========================================
  // 2. SEED APPLICATION DATABASE (prismaApp)
  // ==========================================
  console.log("\n📦 Seeding Application Database...");

  // Categories
  const categoryData = [
    { name: "Sweets", slug: "sweets", description: "Fresh handcrafted traditional Indian sweets", sort_order: 1 },
    { name: "Snacks & Savories", slug: "snacks", description: "Crispy, hot & savory street snacks", sort_order: 2 },
    { name: "Beverages", slug: "beverages", description: "Hot teas, cold lassis and refreshing drinks", sort_order: 3 },
    { name: "Thali & Meals", slug: "thali-meals", description: "Hearty North Indian meals and thalis", sort_order: 4 },
    { name: "Desserts", slug: "desserts", description: "Kulfi, rabdi and sweet delights", sort_order: 5 },
  ];

  const categories: Record<string, string> = {};

  for (const cat of categoryData) {
    const createdCat = await prismaApp.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sort_order: cat.sort_order },
      create: cat,
    });
    categories[cat.slug] = createdCat.id;
  }
  console.log(` ✅ Seeded ${Object.keys(categories).length} Categories.`);

  // Products
  const products = [
    {
      name: "Gulab Jamun (2 Pcs)",
      category_id: categories["sweets"],
      price: 60,
      description: "Soft, melt-in-mouth milk solid balls soaked in aromatic cardamom sugar syrup.",
      image_url: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=600&q=80",
      rating: 4.9,
      review_count: 42,
      prep_time_mins: 5,
      is_veg: true,
      is_special: true,
      is_popular: true,
    },
    {
      name: "Kesar Rasgulla (2 Pcs)",
      category_id: categories["sweets"],
      price: 50,
      description: "Spongy cottage cheese balls infused with saffron flavoured sugar syrup.",
      image_url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&q=80",
      rating: 4.8,
      review_count: 35,
      prep_time_mins: 5,
      is_veg: true,
      is_popular: true,
    },
    {
      name: "Kaju Katli (250g)",
      category_id: categories["sweets"],
      price: 260,
      offer_price: 240,
      description: "Premium cashew fudge crafted with silver vark garnish.",
      image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80",
      rating: 5.0,
      review_count: 88,
      prep_time_mins: 5,
      sold_by_weight: true,
      price_per_kg: 960,
      is_veg: true,
      is_special: true,
    },
    {
      name: "Samosa (2 Pcs)",
      category_id: categories["snacks"],
      price: 30,
      description: "Crispy golden pastry filled with spiced mashed potatoes and green peas.",
      image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80",
      rating: 4.7,
      review_count: 120,
      prep_time_mins: 10,
      is_veg: true,
      is_spicy: true,
      is_popular: true,
    },
    {
      name: "Kachori Chaat",
      category_id: categories["snacks"],
      price: 60,
      description: "Crushed khasta kachori topped with curd, sweet chutney, spicy mint chutney & sev.",
      image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80",
      rating: 4.6,
      review_count: 29,
      prep_time_mins: 10,
      is_veg: true,
      is_spicy: true,
    },
    {
      name: "Special Veg Thali",
      category_id: categories["thali-meals"],
      price: 220,
      offer_price: 199,
      description: "Paneer Sabzi, Dal Tadka, Seasonal Veg, Jeera Rice, 3 Butter Rotis, Sweet & Salad.",
      image_url: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&q=80",
      rating: 4.9,
      review_count: 150,
      prep_time_mins: 20,
      is_veg: true,
      is_recommended: true,
      is_popular: true,
    },
    {
      name: "Kulhad Masala Chai",
      category_id: categories["beverages"],
      price: 25,
      description: "Aromatic brewed Indian tea with ginger, cardamom, and spices served in earthen clay cup.",
      image_url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80",
      rating: 4.8,
      review_count: 65,
      prep_time_mins: 5,
      is_veg: true,
    },
    {
      name: "Mango Lassi",
      category_id: categories["beverages"],
      price: 70,
      description: "Creamy whipped yogurt drink blended with fresh Alphanso mango pulp.",
      image_url: "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&q=80",
      rating: 4.7,
      review_count: 51,
      prep_time_mins: 5,
      is_veg: true,
      is_popular: true,
    },
  ];

  for (const prod of products) {
    const existing = await prismaApp.product.findFirst({ where: { name: prod.name } });
    if (!existing) {
      await prismaApp.product.create({ data: prod });
    }
  }
  console.log(` ✅ Seeded ${products.length} Products.`);

  // Restaurant Tables (Tables 1 to 10)
  for (let i = 1; i <= 10; i++) {
    const seats = i <= 4 ? 2 : i <= 8 ? 4 : 6;
    await prismaApp.restaurantTable.upsert({
      where: { table_number: i },
      update: { seats },
      create: { table_number: i, seats, is_active: true },
    });
  }
  console.log(" ✅ Seeded Restaurant Tables 1 through 10.");

  // Loyalty Rules
  const rules = [
    { visits_required: 5, discount_percent: 10, reward_points: 50, expiry_days: 30 },
    { visits_required: 10, discount_percent: 20, reward_points: 150, expiry_days: 60 },
  ];
  for (const rule of rules) {
    const existing = await prismaApp.loyaltyRule.findFirst({
      where: { visits_required: rule.visits_required },
    });
    if (!existing) {
      await prismaApp.loyaltyRule.create({ data: rule });
    }
  }
  console.log(" ✅ Seeded Loyalty Rules.");

  // Offers & Coupons
  const offers = [
    {
      title: "Festive Season Discount",
      description: "Get 20% flat discount on orders above ₹500",
      coupon_code: "MAATARA20",
      discount_percent: 20,
      is_active: true,
    },
    {
      title: "Welcome Special",
      description: "Enjoy 10% off your order",
      coupon_code: "WELCOME10",
      discount_percent: 10,
      is_active: true,
    },
  ];

  for (const offer of offers) {
    await prismaApp.offer.upsert({
      where: { coupon_code: offer.coupon_code },
      update: { title: offer.title, discount_percent: offer.discount_percent },
      create: {
        title: offer.title,
        description: offer.description,
        coupon_code: offer.coupon_code,
        discount_percent: offer.discount_percent,
        category_ids: [],
        product_ids: [],
        is_active: true,
      },
    });
  }
  console.log(" ✅ Seeded Promotional Coupons & Offers.");

  // Demo Customer User
  const demoCustomerEmail = "customer@maatara.com";
  const existingUser = await prismaApp.user.findUnique({
    where: { email: demoCustomerEmail },
  });

  if (!existingUser) {
    await prismaApp.user.create({
      data: {
        name: "Ankit Kumar",
        email: demoCustomerEmail,
        phone: "+919123456789",
        password: "CustomerPassword123!",
        role: "USER",
        visits: 4,
        reward_points: 40,
        total_spend: 1250,
        favourite_item: "Gulab Jamun",
        saved_address: "Bariatu Road, Ranchi, Jharkhand",
      },
    });
    console.log(` ✅ Created Demo Customer User: ${demoCustomerEmail}`);
  } else {
    console.log(` ℹ️  Demo Customer (${demoCustomerEmail}) already exists.`);
  }

  console.log("\n🎉 Database seeding completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Database Seeding Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prismaAdmin.$disconnect();
    await prismaApp.$disconnect();
  });
