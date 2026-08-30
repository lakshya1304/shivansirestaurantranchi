import { FastifyReply, FastifyRequest } from "fastify";
import logger from "../../core/config/loggerConfig";

const activeClients = new Set<FastifyReply>();

export const handleOrderStream = (req: FastifyRequest, res: FastifyReply) => {
  // Set headers for Server-Sent Events
  res.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Send an initial ping to establish connection
  res.raw.write("event: connected\ndata: ok\n\n");

  activeClients.add(res);

  // Remove client on disconnect
  req.raw.on("close", () => {
    activeClients.delete(res);
  });
  
  // Keep the connection open
  return new Promise(() => {});
};

export const broadcastOrderEvent = (event: string, data: any = {}) => {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of activeClients) {
    try {
      client.raw.write(payload);
    } catch (err: any) {
      logger.error(`Failed to broadcast to a client: ${err.message}`);
      activeClients.delete(client);
    }
  }
};
