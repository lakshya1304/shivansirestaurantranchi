import { FastifyInstance } from "fastify";
import * as orderController from "./order.controller";
import { getOrders } from "../catalog/catalog.controller";

export default async function orderRoutes(app: FastifyInstance) {
  app.get("/", getOrders);
  app.post("/place", orderController.placeOrder);
  app.get("/public", orderController.getPublicOrder);
  app.post("/history/request-code", orderController.requestOrderHistoryCode);
  app.post("/history/verify", orderController.getOrdersByPhone);
  app.patch("/:id/status", orderController.updateOrderStatus);
  app.patch("/:id/payment", orderController.updatePaymentStatus);
}
