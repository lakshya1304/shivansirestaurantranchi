import authRouter from "./authRoutes";
import { FastifyInstance } from "fastify";
import { healthRoutes } from "./health";
import { pingRoutes } from "./ping";
import { version } from "./version";
import userRoutes from "./userRoutes";
import dataRoutes from "./dataRoutes";

const v1Router = async (app: FastifyInstance) => {
  app.register(authRouter, { prefix: "/auth" });
  app.register(userRoutes, { prefix: "/data/users" });
  app.register(healthRoutes);
  app.register(pingRoutes);
  app.register(version);
  app.register(dataRoutes, { prefix: "/data" });
};

export default v1Router;
