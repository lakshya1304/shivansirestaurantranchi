import rateLimit, { FastifyRateLimitOptions } from "@fastify/rate-limit";
import { FastifyInstance } from "fastify";
import { rateLimit as limit } from "../config/redisConfig";

/**
 * Fastify plugin to register rate limiting globally.
 * Limits are applied per route using the `rateLimit` option.
 */
export default async function rateLimiter(
  fastify: FastifyInstance,
  opts: FastifyRateLimitOptions,
) {
  await fastify.register(rateLimit, {
    redis: limit,
    max: 100, // default max requests per window per IP
    timeWindow: "1 minute",
    allowList: [], // add trusted IPs if needed
    ...opts,
    errorResponseBuilder(req, context) {
      return {
        success: false,
        statusCode: 429,
        message: "Too many requests",
        error: "Too many requests",
        retryAfter: context.after,
      };
    },
  });
}
