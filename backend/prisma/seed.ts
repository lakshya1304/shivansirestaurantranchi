import { PrismaClient, Role } from '../src/generated/prisma';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config();
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset');

  if (shouldReset) {
    console.log('Resetting database (deleting all data)...');
    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.loyaltyRule.deleteMany();
    await prisma.discount.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.restaurantTable.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.appConfig.deleteMany();
    await prisma.restaurantSettings.deleteMany();
    await prisma.user.deleteMany();
    console.log('Database reset complete.');
  }


  // 1. Users
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const nishuPassword = await bcrypt.hash('Nishur31@', 10);

  const nishuSuperadmin = await prisma.user.upsert({
    where: { email: 'nishanrajak01@gmail.com' },
    update: { password: nishuPassword },
    create: {
      name: 'Nishan Rajak',
      email: 'nishanrajak01@gmail.com',
      password: nishuPassword,
      role: Role.SUPERADMIN,
      phone: '+918888888888'
    }
  });


  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@shivansi.in' },
    update: { password: hashedPassword },
    create: {
      name: 'Super Admin',
      email: 'superadmin@shivansi.in',
      password: hashedPassword,
      role: 'SUPERADMIN',
      phone: '+919999999999'
    }
  });

  const admin1 = await prisma.user.upsert({
    where: { email: 'riya@shivansi.in' },
    update: { password: hashedPassword },
    create: {
      name: 'Riya Sharma',
      email: 'riya@shivansi.in',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+919999999998'
    }
  });

  const admin2 = await prisma.user.upsert({
    where: { email: 'aman@shivansi.in' },
    update: { password: hashedPassword },
    create: {
      name: 'Aman Verma',
      email: 'aman@shivansi.in',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+919999999997'
    }
  });

  const normalUser1 = await prisma.user.upsert({
    where: { email: 'user1@shivansi.in' },
    update: { password: hashedPassword },
    create: {
      name: 'Test User 1',
      email: 'user1@shivansi.in',
      password: hashedPassword,
      role: Role.USER,
      phone: '+917777777771'
    }
  });

  const normalUser2 = await prisma.user.upsert({
    where: { email: 'user2@shivansi.in' },
    update: { password: hashedPassword },
    create: {
      name: 'Test User 2',
      email: 'user2@shivansi.in',
      password: hashedPassword,
      role: Role.USER,
      phone: '+917777777772'
    }
  });
  console.log('Users seeded');

  // 2. Restaurant Settings (just one, id is fixed or we find first)
  let settings = await prisma.restaurantSettings.findFirst();
  if (!settings) {
    settings = await prisma.restaurantSettings.create({
      data: {
        name: 'Maa Tara Sweets Restaurant',
        tagline: 'Authentic Flavours of Ranchi',
        address: 'Main Road, Ranchi, Jharkhand - 834001',
        phone: '+919876543210',
        gst_number: '20ABCDE1234F1ZX',
        opening_time: '10:00',
        closing_time: '22:30',
        upi_id: 'shivansi@upi',
        tax_percent: 5,
        packing_charge: 20,
        currency: 'INR',
      }
    });
  } else {
    await prisma.restaurantSettings.update({
      where: { id: settings.id },
      data: { name: 'Maa Tara Sweets Restaurant' }
    })
  }
  console.log('Settings seeded');

  // 3. App Config
  let appConfig = await prisma.appConfig.findFirst();
  if (!appConfig) {
    appConfig = await prisma.appConfig.create({
      data: {
        owner_email: 'superadmin@shivansi.in',
        whatsapp_token: 'PLACEHOLDER_TOKEN',
        whatsapp_phone_number_id: 'PLACEHOLDER_PHONE_ID'
      }
    });
  }
  console.log('App Config seeded');

  // 4. Categories
  const categoriesData = [
    { name: 'South Indian', slug: 'south-indian', sort_order: 1 },
    { name: 'Sweets', slug: 'sweets', sort_order: 2 },
    { name: 'Snacks', slug: 'snacks', sort_order: 3 },
    { name: 'Drinks', slug: 'drinks', sort_order: 4 },
    { name: 'Ice Creams', slug: 'ice-creams', sort_order: 5 },
    { name: 'Desserts', slug: 'desserts', sort_order: 6 },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat
    });
  }
  console.log('Categories seeded');

  // 5. Products
  const southIndian = await prisma.category.findUnique({ where: { slug: 'south-indian' } });
  const sweets = await prisma.category.findUnique({ where: { slug: 'sweets' } });
  const snacks = await prisma.category.findUnique({ where: { slug: 'snacks' } });
  const drinks = await prisma.category.findUnique({ where: { slug: 'drinks' } });
  const iceCreams = await prisma.category.findUnique({ where: { slug: 'ice-creams' } });
  const desserts = await prisma.category.findUnique({ where: { slug: 'desserts' } });

  const productsData = [
    { name: 'Masala Dosa', category_id: southIndian?.id, price: 120, offer_price: 99, is_veg: true, is_spicy: true, is_special: true },
    { name: 'Idli Sambhar', category_id: southIndian?.id, price: 80, offer_price: null, is_veg: true, is_spicy: false, is_special: false },
    { name: 'Gulab Jamun', category_id: sweets?.id, price: 60, offer_price: 49, is_veg: true, is_spicy: false, is_special: true },
    { name: 'Rasgulla', category_id: sweets?.id, price: 70, offer_price: null, is_veg: true, is_spicy: false, is_special: false },
    { name: 'Kaju Katli', category_id: sweets?.id, price: 200, offer_price: 180, is_veg: true, is_spicy: false, is_special: true },
    { name: 'Motichoor Ladoo', category_id: sweets?.id, price: 50, offer_price: 45, is_veg: true, is_spicy: false, is_special: false },
    { name: 'Jalebi', category_id: sweets?.id, price: 40, offer_price: null, is_veg: true, is_spicy: false, is_special: true },
    { name: 'Samosa (2pc)', category_id: snacks?.id, price: 40, offer_price: 30, is_veg: true, is_spicy: true, is_special: false },
    { name: 'Paneer Tikka', category_id: snacks?.id, price: 180, offer_price: 150, is_veg: true, is_spicy: true, is_special: true },
    { name: 'Kachori (2pc)', category_id: snacks?.id, price: 35, offer_price: null, is_veg: true, is_spicy: true, is_special: false },
    { name: 'Dhokla', category_id: snacks?.id, price: 60, offer_price: 50, is_veg: true, is_spicy: false, is_special: false },
    { name: 'Mango Lassi', category_id: drinks?.id, price: 90, offer_price: 75, is_veg: true, is_spicy: false, is_special: true },
    { name: 'Masala Chai', category_id: drinks?.id, price: 30, offer_price: null, is_veg: true, is_spicy: false, is_special: false },
    { name: 'Vanilla Scoop', category_id: iceCreams?.id, price: 80, offer_price: 60, is_veg: true, is_spicy: false, is_special: false },
    { name: 'Chocolate Sundae', category_id: iceCreams?.id, price: 120, offer_price: 99, is_veg: true, is_spicy: false, is_special: true },
    { name: 'Malpua', category_id: desserts?.id, price: 100, offer_price: 80, is_veg: true, is_spicy: false, is_special: true },
    { name: 'Kheer', category_id: desserts?.id, price: 70, offer_price: null, is_veg: true, is_spicy: false, is_special: false },
  ];

  for (const prod of productsData) {
    const existing = await prisma.product.findFirst({ where: { name: prod.name } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: prod });
    } else {
      await prisma.product.create({ data: prod });
    }
  }
  console.log('Products seeded');

  // 6. Tables
  for (let i = 1; i <= 6; i++) {
    const seats = i === 1 ? 2 : i <= 3 ? 4 : i <= 5 ? 6 : 8;
    await prisma.restaurantTable.upsert({
      where: { table_number: i },
      update: { seats },
      create: { table_number: i, seats }
    });
  }
  console.log('Tables seeded');

  // 7. Offers
  const weekendOffer = await prisma.offer.findFirst({ where: { title: 'Weekend Special' } });
  if (!weekendOffer) {
    await prisma.offer.create({
      data: {
        title: 'Weekend Special',
        description: '20% off on all South Indian items every weekend',
        discount_percent: 20,
        coupon_code: null,
        is_active: true,
      }
    });
  }
  const welcomeOffer = await prisma.offer.findFirst({ where: { coupon_code: 'WELCOME10' } });
  if (!welcomeOffer) {
    await prisma.offer.create({
      data: {
        title: 'Welcome Offer',
        description: 'Flat 10% off on your first order',
        discount_percent: 10,
        coupon_code: 'WELCOME10',
        is_active: true,
      }
    });
  }
  console.log('Offers seeded');

  // 8. Discounts (Coupons)
  const discountsData = [
    { name: 'Flat 50 Off', type: 'flat', coupon_code: 'FLAT50', value: 50, min_order_amount: 299, max_discount: 50 },
    { name: 'Save 15%', type: 'percent', coupon_code: 'SAVE15', value: 15, min_order_amount: 199, max_discount: 100 },
    { name: 'Free Drink', type: 'flat', coupon_code: 'FREEDRINK', value: 30, min_order_amount: 150, max_discount: 30 },
  ];
  for (const disc of discountsData) {
    await prisma.discount.upsert({
      where: { coupon_code: disc.coupon_code },
      update: disc,
      create: disc
    });
  }
  console.log('Discounts seeded');

  // 9. Loyalty Rules
  const loyaltyData = [
    { visits_required: 25, discount_percent: 5, reward_points: 50, expiry_days: 30 },
    { visits_required: 50, discount_percent: 10, reward_points: 100, expiry_days: 30 },
    { visits_required: 75, discount_percent: 15, reward_points: 150, expiry_days: 30 },
    { visits_required: 100, discount_percent: 20, reward_points: 200, expiry_days: 60 },
  ];
  for (const rule of loyaltyData) {
    const existing = await prisma.loyaltyRule.findFirst({ where: { visits_required: rule.visits_required } });
    if (existing) {
      await prisma.loyaltyRule.update({ where: { id: existing.id }, data: rule });
    } else {
      await prisma.loyaltyRule.create({ data: rule });
    }
  }
  console.log('Loyalty Rules seeded');

  // 10. Customers
  const customersData = [
    { name: 'Priya Singh', phone: '+919811111111', visits: 24, reward_points: 240, total_spend: 4800 },
    { name: 'Rahul Gupta', phone: '+919822222222', visits: 50, reward_points: 500, total_spend: 10000 },
    { name: 'Anjali Das', phone: '+919833333333', visits: 3, reward_points: 30, total_spend: 600 },
  ];
  for (const cust of customersData) {
    await prisma.customer.upsert({
      where: { phone: cust.phone },
      update: cust,
      create: cust
    });
  }
  console.log('Customers seeded');

  // 11. Inventory
  const inventoryData = [
    { name: 'Rice', unit: 'kg', quantity: 50, low_stock_threshold: 10, cost_per_unit: 45 },
    { name: 'Milk', unit: 'litre', quantity: 20, low_stock_threshold: 5, cost_per_unit: 60 },
    { name: 'Paneer', unit: 'kg', quantity: 8, low_stock_threshold: 2, cost_per_unit: 350 },
    { name: 'Maida', unit: 'kg', quantity: 30, low_stock_threshold: 5, cost_per_unit: 40 },
  ];
  for (const item of inventoryData) {
    const existing = await prisma.inventoryItem.findFirst({ where: { name: item.name } });
    if (existing) {
      await prisma.inventoryItem.update({ where: { id: existing.id }, data: item });
    } else {
      await prisma.inventoryItem.create({ data: item });
    }
  }
  console.log('Inventory seeded');

  // 12. Orders
  const priya = await prisma.customer.findUnique({ where: { phone: '+919811111111' } });
  const rahul = await prisma.customer.findUnique({ where: { phone: '+919822222222' } });
  const anjali = await prisma.customer.findUnique({ where: { phone: '+919833333333' } });

  const ordersData = [
    { order_number: 'ORD-TEST-001', session_token: 'tok_1', table_number: 2, customer_id: priya?.id, customer_name: 'Priya Singh', customer_phone: '+919811111111', status: 'SERVING', payment_method: 'COD', payment_status: 'PENDING', subtotal: 300, discount: 0, tax: 15, packing_charge: 4, delivery_charge: 0, total: 319, items: [{ name: 'Masala Dosa', unit_price: 99, quantity: 2, line_total: 198 }] },
    { order_number: 'ORD-TEST-002', session_token: 'tok_2', table_number: 4, customer_id: rahul?.id, customer_name: 'Rahul Gupta', customer_phone: '+919822222222', status: 'COMPLETED', payment_method: 'PREPAID', payment_status: 'PAID', subtotal: 500, discount: 50, tax: 25, packing_charge: 65, delivery_charge: 0, total: 540, items: [{ name: 'Paneer Tikka', unit_price: 150, quantity: 2, line_total: 300 }] },
    { order_number: 'ORD-TEST-003', session_token: 'tok_3', table_number: 1, customer_id: anjali?.id, customer_name: 'Anjali Das', customer_phone: '+919833333333', status: 'PENDING', payment_method: 'COD', payment_status: 'PENDING', subtotal: 110, discount: 0, tax: 5, packing_charge: 5, delivery_charge: 0, total: 120, items: [{ name: 'Samosa (2pc)', unit_price: 30, quantity: 2, line_total: 60 }] }
  ];

  for (const order of ordersData) {
    const { items, ...orderInfo } = order;
    const existing = await prisma.order.findUnique({ where: { order_number: order.order_number } });
    if (!existing) {
      const createdOrder = await prisma.order.create({ data: orderInfo });
      for (const item of items) {
        const prod = await prisma.product.findFirst({ where: { name: item.name } });
        await prisma.orderItem.create({
          data: {
            order_id: createdOrder.id,
            product_id: prod?.id,
            name: item.name,
            unit_price: item.unit_price,
            quantity: item.quantity,
            line_total: item.line_total
          }
        });
      }
    }
  }
  console.log('Orders seeded');

  // 13. Reviews
  const reviewsData = [
    { product: 'Masala Dosa', rating: 5, comment: 'Crispy and perfect!', is_published: true },
    { product: 'Gulab Jamun', rating: 4, comment: 'Soft and sweet, loved it.', is_published: true },
    { product: 'Mango Lassi', rating: 5, comment: 'Best lassi in Ranchi!', is_published: true },
    { product: 'Paneer Tikka', rating: 4, comment: 'Perfectly spiced.', is_published: true },
    { product: 'Samosa (2pc)', rating: 2, comment: 'Was cold when served.', is_published: false },
  ];

  for (const rev of reviewsData) {
    const prod = await prisma.product.findFirst({ where: { name: rev.product } });
    const existing = await prisma.review.findFirst({ where: { customer_name: 'Seed User', product_id: prod?.id, comment: rev.comment } });
    if (!existing) {
      await prisma.review.create({
        data: {
          product_id: prod?.id,
          customer_name: 'Seed User',
          rating: rev.rating,
          comment: rev.comment,
          is_published: rev.is_published
        }
      });
    }
  }
  console.log('Reviews seeded');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
