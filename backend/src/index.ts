import app from "./app";
import { API_PORT, NODE_ENV } from "./core/config/envConfig";
import logger from "./core/config/loggerConfig";
import {
  cache,
  connectRedisCache,
  connectRedisRateLimit,
  rateLimit,
} from "./core/config/redisConfig";

const startServer = async () => {
  try {
    Promise.all([connectRedisCache(), connectRedisRateLimit()]);
    const address = await app.listen({ port: API_PORT, host: "0.0.0.0" });
  } catch (err: any) {
    logger.error(err?.message || err);
    process.exit(1);
  }
};

startServer();
async function gracefulShutdown(signal: string) {
  logger.info(`\n Received ${signal}. Shutting down gracefully…`);

  app.close(async () => {
    logger.info("HTTP server closed.");

    try {
      Promise.all([cache.disconnect(), rateLimit.disconnect()]);
    } catch (err) {
      logger.error({ error: err }, "Error dismounting RAM");
    }

    logger.info("All connections closed. Goodbye!");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("unhandledRejection", (reason: any) => {
  logger.error({ error: reason?.message || reason }, "Unhandled Rejection");
});

process.on("uncaughtException", (error: Error) => {
  logger.error(
    {
      error: error.message,
      stack: error.stack,
    },
    "Uncaught Exception",
  );
  process.exit(1);
});
