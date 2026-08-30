import { FastifyInstance } from "fastify";
import * as orderController from "./order.controller";
import { getOrders } from "../catalog/catalog.controller";
import { authenticate } from "../../core/middlewares/authMiddleware";
import { requireAdmin } from "../../core/middlewares/requireRole";

export default async function orderRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [authenticate as any, requireAdmin as any] }, getOrders);
  app.post("/place", orderController.placeOrder);
  app.get("/public", orderController.getPublicOrder);
  app.post(
    "/history/request-code",
    { config: { rateLimit: { max: 3, timeWindow: "10 minute" } } },
    orderController.requestOrderHistoryCode
  );
  app.post(
    "/history/verify",
    { config: { rateLimit: { max: 10, timeWindow: "10 minute" } } },
    orderController.getOrdersByPhone
  );
  
  // Also register customer profile endpoints here (frontend uses /customer-profile but we prefix with /data in index.routes? No, we should register it on root or whatever index.routes provides)
  // Let's register it in data.routes or just here. In index.routes.ts: app.register(orderRoutes, { prefix: "/data/orders" });
  // Wait, frontend fetches `/customer-profile` directly from `/api/v1/customer-profile`.
  // Wait, let's look at index.routes.ts again to see where to add `/customer-profile`.
  app.patch(
    "/:id/status",
    { preHandler: [authenticate as any, requireAdmin as any] },
    orderController.updateOrderStatus
  );
  app.patch(
    "/:id/payment",
    { preHandler: [authenticate as any, requireAdmin as any] },
    orderController.updatePaymentStatus
  );
}
