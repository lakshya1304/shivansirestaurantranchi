import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const opts = { $refStrategy: "none" } as const;

// ─── Zod definitions ────────────────────────────────────────────────────────

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character.");

const _registerZod = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: passwordSchema,
  phone: z.string().optional(),
  gender: z.string().min(1),
});

const _loginZod = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpToken: z.string().length(6).optional(),
});

const _refreshTokenZod = z.object({
  refreshToken: z.string().optional(),
});

const _changePasswordZod = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

const _googleCallbackZod = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

const _passlessZod = z.object({
  email: z.string().email(),
});

const _passlessVerifyZod = z.object({
  token: z.string().min(1),
  role: z.string().min(1),
});

const _enableTotpZod = z.object({
  password: z.string().min(1),
});

const _verifyTotpZod = z.object({
  token: z.string().length(6),
});

const _disableTotpZod = z.object({
  password: z.string().min(1),
});

const _webAuthnGenerateRegistrationZod = z.object({}); // Typically GET or empty POST

const _webAuthnVerifyRegistrationZod = z.any(); // Expects RegistrationResponseJSON

const _webAuthnGenerateAuthZod = z.object({
  email: z.string().email(),
});

const _webAuthnVerifyAuthZod = z.object({
  email: z.string().email(),
  response: z.any(), // AuthenticationResponseJSON
});

// ─── JSON Schema exports ─────────────────────────────────────────────────────

export const registerSchema = zodToJsonSchema(_registerZod as any, opts);
export const loginSchema = zodToJsonSchema(_loginZod as any, opts);
export const refreshTokenSchema = zodToJsonSchema(_refreshTokenZod as any, opts);
export const changePasswordSchema = zodToJsonSchema(_changePasswordZod as any, opts);
export const googleCallbackSchema = zodToJsonSchema(_googleCallbackZod as any, opts);
export const passlessSchema = zodToJsonSchema(_passlessZod as any, opts);
export const passlessVerifySchema = zodToJsonSchema(_passlessVerifyZod as any, opts);
export const enableTotpSchema = zodToJsonSchema(_enableTotpZod as any, opts);
export const verifyTotpSchema = zodToJsonSchema(_verifyTotpZod as any, opts);
export const disableTotpSchema = zodToJsonSchema(_disableTotpZod as any, opts);
export const webAuthnGenerateRegistrationSchema = zodToJsonSchema(_webAuthnGenerateRegistrationZod as any, opts);
export const webAuthnVerifyRegistrationSchema = zodToJsonSchema(_webAuthnVerifyRegistrationZod as any, opts);
export const webAuthnGenerateAuthSchema = zodToJsonSchema(_webAuthnGenerateAuthZod as any, opts);
export const webAuthnVerifyAuthSchema = zodToJsonSchema(_webAuthnVerifyAuthZod as any, opts);
