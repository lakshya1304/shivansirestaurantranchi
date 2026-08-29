import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../../core/config/databaseConfig";
import logger from "../../core/config/loggerConfig";

// Map frontend table names to Prisma model names
const modelMap: Record<string, any> = {
  products: "product",
  categories: "category",
  offers: "offer",
  discounts: "discount",
  loyalty_rules: "loyaltyRule",
  inventory_items: "inventoryItem",
  restaurant_tables: "restaurantTable",
  restaurant_settings: "restaurantSettings",
  orders: "order",
  reviews: "review",
  notifications: "appNotification",
  customers: "customer",
  app_config: "appConfig"
};

export const saveRow = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { table } = req.params as any;
    const data = req.body as any;
    
    const modelName = modelMap[table];
    if (!modelName) {
      return res.status(400).send({ error: `Invalid table: ${table}` });
    }

    const delegate = (prisma as any)[modelName];
    
    if (data.id) {
      // Update
      const updated = await delegate.update({
        where: { id: data.id },
        data
      });
      return res.send(updated);
    } else {
      // Insert
      const inserted = await delegate.create({
        data
      });
      return res.send(inserted);
    }
  } catch (error: any) {
    logger.error(`Error in saveRow (${(req.params as any).table}): ${error.message}`);
    return res.status(500).send({ error: error.message });
  }
};

export const deleteRow = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { table, id } = req.params as any;
    
    const modelName = modelMap[table];
    if (!modelName) {
      return res.status(400).send({ error: `Invalid table: ${table}` });
    }

    const delegate = (prisma as any)[modelName];
    
    await delegate.delete({
      where: { id }
    });
    
    return res.send({ ok: true });
  } catch (error: any) {
    logger.error(`Error in deleteRow (${(req.params as any).table}): ${error.message}`);
    return res.status(500).send({ error: error.message });
  }
};
