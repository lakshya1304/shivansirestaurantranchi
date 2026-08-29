import { FastifyInstance } from "fastify";
import * as catalogController from "./catalog.controller";

export default async function catalogRoutes(app: FastifyInstance) {
  app.get("/categories", catalogController.getCategories);
  app.get("/products", catalogController.getProducts);
  app.get("/offers", catalogController.getOffers);
  app.get("/discounts", catalogController.getDiscounts);
  app.get("/loyalty", catalogController.getLoyaltyRules);
  app.get("/tables", catalogController.getTables);
  app.get("/inventory", catalogController.getInventory);
  app.get("/customers", catalogController.getCustomers);
  app.get("/notifications", catalogController.getNotifications);
}
