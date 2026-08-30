import { FastifyInstance } from "fastify";
import * as systemController from "./system.controller";

export default async function systemRoutes(app: FastifyInstance) {
  app.post("/crud/:table", systemController.saveRow);
  app.delete("/crud/:table/:id", systemController.deleteRow);
}
