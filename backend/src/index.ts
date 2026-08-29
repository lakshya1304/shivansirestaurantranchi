import app from "./app";
import { API_PORT, NODE_ENV } from "./core/config/envConfig";
import logger from "./core/config/loggerConfig";
import redis, { connectRedis } from "./core/config/redisConfig";

const startServer = async () => {
  try {
    await connectRedis();
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
      await redis.disconnect();
    } catch (err) {
      logger.error("Error dismounting RAM", { error: err });
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
  logger.error("Unhandled Rejection", { error: reason?.message || reason });
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
