// // import cookieParser from "cookie-parser";
// // import express from "express";
// // import helmet from "helmet";
import { STATUS_CODES } from "./core/utils/common/constants";
import { NODE_ENV } from "./core/config/envConfig";
import moduleRoutes from "./modules/index.routes";
import { sendError } from "./core/utils/common/response";
import fastifyApp from "./core/config/serverConfig";

import { FastifyReply, FastifyRequest } from "fastify";
const app = fastifyApp;

// NOTE: Do NOT add an abort listener here that calls sendError().
// By the time a request is aborted the Fastify reply is already finalised,
// calling sendError() on it throws "fulfilled is not a function" which kills
// the Bun process and causes a 502 crash loop on Render.

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
