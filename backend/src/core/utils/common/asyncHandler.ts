import { FastifyReply, FastifyRequest } from "fastify";

const asyncHandler =
  (fn: any) => async (req: FastifyRequest<any>, reply: FastifyReply) => {
    return Promise.resolve(fn(req, reply)).catch((err: Error) => {
      throw err;
    });
  };

export default asyncHandler;
