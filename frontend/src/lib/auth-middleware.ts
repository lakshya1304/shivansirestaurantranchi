import { createMiddleware } from "@tanstack/react-start";
import { fetchAPI } from "./db";

/** Server-side middleware to ensure the request has a valid Fastify session. */
export const requireAuth = createMiddleware({ type: "server" }).server(async () => {
  try {
    const session = await fetchAPI<any>("/auth/me");
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }
    return {
      user: session.user,
      isAdmin: session.isAdmin,
      mfaSatisfied: session.mfaSatisfied,
    };
  } catch (error: any) {
    throw new Error(error.message || "Unauthorized");
  }
});
