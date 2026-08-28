import { FastifyInstance } from "fastify";
import * as dataController from "../../controllers/dataController";
import * as orderController from "../../controllers/orderController";
import * as crudController from "../../controllers/crudController";
import * as settingsController from "../../controllers/settingsController";
import { authenticate } from "../../middlewares/authMiddleware";
import { requireSuperAdmin } from "../../middlewares/requireRole";

export default async function dataRoutes(app: FastifyInstance) {
  app.get("/settings", dataController.getSettings);
  app.get("/categories", dataController.getCategories);
  app.get("/products", dataController.getProducts);
  app.get("/offers", dataController.getOffers);
  app.get("/discounts", dataController.getDiscounts);
  app.get("/loyalty", dataController.getLoyaltyRules);
  app.get("/tables", dataController.getTables);
  app.get("/reviews", dataController.getReviews);
  app.get("/inventory", dataController.getInventory);
  app.get("/customers", dataController.getCustomers);
  app.get("/orders", dataController.getOrders);
  app.get("/notifications", dataController.getNotifications);
  
  // Google Places integration
  app.get("/ratings/google", dataController.getGoogleRatings);

  // Orders mutations
  app.post("/orders/place", orderController.placeOrder);
  app.get("/orders/public", orderController.getPublicOrder);
  app.post("/orders/history/request-code", orderController.requestOrderHistoryCode);
  app.post("/orders/history/verify", orderController.getOrdersByPhone);
  
  // Product ratings
  app.post("/ratings", orderController.submitRating);

  // Customer profile (phone-verified, no JWT required)
  app.get("/customer-profile", orderController.getCustomerProfile);
  app.patch("/customer-profile", orderController.updateCustomerProfile);
  app.patch("/orders/:id/status", orderController.updateOrderStatus);
  app.patch("/orders/:id/payment", orderController.updatePaymentStatus);

  // Generic Admin CRUD
  app.post("/crud/:table", crudController.saveRow);
  app.delete("/crud/:table/:id", crudController.deleteRow);

  // Owner Settings
  app.get(
    "/settings/owner",
    { preHandler: [authenticate as any, requireSuperAdmin as any] },
    settingsController.getOwnerSettings
  );
  app.post(
    "/settings/owner",
    { preHandler: [authenticate as any, requireSuperAdmin as any] },
    settingsController.saveOwnerSettings
  );
}
