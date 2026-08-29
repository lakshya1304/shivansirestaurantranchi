// // import cookieParser from "cookie-parser";
// // import express from "express";
// // import helmet from "helmet";
import { STATUS_CODES } from "./core/utils/common/constants";
import { NODE_ENV } from "./core/config/envConfig";
import moduleRoutes from "./modules/index.routes";
import { sendError, sendSuccess } from "./core/utils/common/response";
import fastifyApp from "./core/config/serverConfig";

import { FastifyReply, FastifyRequest } from "fastify";
const app = fastifyApp;

app.addHook("onRequest", async (req: FastifyRequest, res: FastifyReply) => { req.signal.addEventListener("abort", () => { return sendError(res, `Request to ${req.url} was aborted`) }) })

app.register(moduleRoutes, { prefix: "/api/v1" });


app.setNotFoundHandler((req: FastifyRequest, res: FastifyReply) => {
  return sendError(res, "Route not found", STATUS_CODES.NOT_FOUND);
});

app.setErrorHandler((err: any, req: FastifyRequest, res: FastifyReply) => {
  const statusCode = err?.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
  return sendError(res, err?.message || "Something went wrong", statusCode, {
    name: err?.name,
    details: err?.details || {},
    ...(NODE_ENV === "development" ? { stack: err?.stack } : {}),
  });
});

export default app;
