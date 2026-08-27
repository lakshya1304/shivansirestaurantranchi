import { FastifyReply, FastifyRequest } from "fastify";
import { fastifyApp } from "../config/serverConfig";

export type FastifyApp = typeof fastifyApp;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface User {
  id: string;
  email: string;
  role: string;

}

export type MailTemplate = Record<
  string,
  {
    subject: string;
    html: string;
  }
>;


export type RegisterRequest = FastifyRequest<{
  Body: RegisterBody;
}>;
export type LoginRequest = FastifyRequest<{
  Body: LoginBody;
}>;
export type RefreshTokenRequest = FastifyRequest<{
  Body: { refreshToken: string };
}>;

export type GoogleCallbackRequest = FastifyRequest<{
  Querystring: {
    code?: string;
    state?: string;
    error?: string;
  };
}>;

export type RegisterBody = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  gender: string;
};
export type LoginBody = {
  email: string;
  password: string;
  totpToken: string | any;
};

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuditLogEntry {
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  details?: Record<string, any>;
}

export type { TestUser } from "./testUser";
export { testUser } from "./testUser";
