// import { Router } from "express";
import v1Router from "./v1/v1Routes";
import { FastifyInstance } from "fastify";

const apiRouter = async (app: FastifyInstance) => {
  app.register(v1Router, { prefix: "/v1" });
};

export default apiRouter;
