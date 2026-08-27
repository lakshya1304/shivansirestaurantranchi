import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../config/databaseConfig";
import logger from "../config/loggerConfig";
import { fetchWithCache } from "../config/redisConfig";

export const getSettings = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const PUBLIC_SETTINGS_COLUMNS = {
      id: true, name: true, tagline: true, logo_url: true, banner_url: true, 
      address: true, phone: true, opening_time: true, closing_time: true, 
      tax_percent: true, packing_charge: true, delivery_charge: true, 
      currency: true, theme: true, is_suspended: true
    };
    const settings = await fetchWithCache("data:settings", 60, () => 
      prisma.restaurantSettings.findFirst({ select: PUBLIC_SETTINGS_COLUMNS })
    );
    return res.send(settings || null);
  } catch (error: any) {
    logger.error(`Error in getSettings: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getCategories = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const categories = await fetchWithCache("data:categories", 60, () =>
      prisma.category.findMany({ orderBy: { sort_order: "asc" } })
    );
    return res.send(categories);
  } catch (error: any) {
    logger.error(`Error in getCategories: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getProducts = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const products = await fetchWithCache("data:products", 60, () =>
      prisma.product.findMany({
        orderBy: [{ sort_order: "asc" }, { name: "asc" }]
      })
    );
    return res.send(products);
  } catch (error: any) {
    logger.error(`Error in getProducts: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getOffers = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const offers = await fetchWithCache("data:offers", 60, () =>
      prisma.offer.findMany({ orderBy: { id: "desc" } })
    );
    return res.send(offers);
  } catch (error: any) {
    logger.error(`Error in getOffers: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getDiscounts = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const discounts = await fetchWithCache("data:discounts", 60, () =>
      prisma.discount.findMany({ orderBy: { id: "desc" } })
    );
    return res.send(discounts);
  } catch (error: any) {
    logger.error(`Error in getDiscounts: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getLoyaltyRules = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const rules = await fetchWithCache("data:loyaltyRules", 60, () =>
      prisma.loyaltyRule.findMany({ orderBy: { visits_required: "asc" } })
    );
    return res.send(rules);
  } catch (error: any) {
    logger.error(`Error in getLoyaltyRules: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getTables = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const tables = await fetchWithCache("data:tables", 60, () =>
      prisma.restaurantTable.findMany({ orderBy: { table_number: "asc" } })
    );
    return res.send(tables);
  } catch (error: any) {
    logger.error(`Error in getTables: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getReviews = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const reviews = await fetchWithCache("data:reviews", 60, () =>
      prisma.review.findMany({ orderBy: { created_at: "desc" } })
    );
    return res.send(reviews);
  } catch (error: any) {
    logger.error(`Error in getReviews: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getInventory = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const inventory = await fetchWithCache("data:inventory", 60, () =>
      prisma.inventoryItem.findMany({ orderBy: { name: "asc" } })
    );
    return res.send(inventory);
  } catch (error: any) {
    logger.error(`Error in getInventory: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getCustomers = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const customers = await fetchWithCache("data:customers", 60, () =>
      prisma.customer.findMany({ orderBy: { total_spend: "desc" } })
    );
    return res.send(customers);
  } catch (error: any) {
    logger.error(`Error in getCustomers: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getOrders = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const orders = await fetchWithCache("data:orders", 15, () =>
      prisma.order.findMany({
        include: { order_items: true },
        orderBy: { created_at: "desc" },
        take: 100
      })
    );
    return res.send(orders);
  } catch (error: any) {
    logger.error(`Error in getOrders: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getNotifications = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const notifications = await fetchWithCache("data:notifications", 15, () =>
      prisma.appNotification.findMany({
        orderBy: { created_at: "desc" },
        take: 60
      })
    );
    return res.send(notifications);
  } catch (error: any) {
    logger.error(`Error in getNotifications: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};
