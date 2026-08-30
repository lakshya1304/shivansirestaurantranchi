import { FastifyInstance } from "fastify";
import authRoutes from "./auth/auth.routes";
import userRoutes from "./users/user.routes";
import orderRoutes from "./orders/order.routes";
import catalogRoutes from "./catalog/catalog.routes";
import reviewRoutes from "./reviews/review.routes";
import settingsRoutes from "./settings/settings.routes";
import systemRoutes from "./system/system.routes";
import { healthRoutes } from "./system/health";
import { pingRoutes } from "./system/ping";
import { version } from "./system/version";

export default async function moduleRoutes(app: FastifyInstance) {
  // Registering domain-based routes
  app.register(authRoutes, { prefix: "/auth" });
  app.register(userRoutes, { prefix: "/data/users" });
  app.register(orderRoutes, { prefix: "/data/orders" });
  app.register(catalogRoutes, { prefix: "/data" });
  app.register(reviewRoutes, { prefix: "/data/reviews" });
  app.register(settingsRoutes, { prefix: "/data/settings" });
  app.register(systemRoutes, { prefix: "/data" });

  // System status endpoints
  app.register(healthRoutes);
  app.register(pingRoutes);
  app.register(version);
}
