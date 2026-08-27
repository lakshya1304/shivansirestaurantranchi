// import { Request, Response } from "express";

import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "../config/databaseConfig";

import AuthService from "../services/authService";
import asyncHandler from "../utils/common/asyncHandler";
import { UnauthorizedError } from "../utils/errors/error";
import { sendSuccess } from "../utils/common/response";
import { STATUS_CODES } from "../utils/common/constants";
import { LoginBody, RegisterBody } from "../types";
import cookieOption from "../utils/common/cookieOptions";
import { sendPasswordlessLoginEmail } from "../utils/helpers/email";
import { buildUrl } from "../utils/helpers/buildUrl";

const authService = new AuthService();

type RegisterRequest = FastifyRequest<{
  Body: RegisterBody;
}>;
type LoginRequest = FastifyRequest<{
  Body: LoginBody;
}>;
type RefreshTokenRequest = FastifyRequest<{
  Body: { refreshToken: string };
}>;

type GoogleCallbackRequest = FastifyRequest<{
  Querystring: {
    code?: string;
    state?: string;
    error?: string;
  };
}>;

export const googleLogin = asyncHandler(
  async (_req: FastifyRequest, res: FastifyReply) => {
    const state = authService.generateOAuthState();
    const authUrl = authService.getGoogleAuthUrl(state);

    res.setCookie("oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 5 * 60 * 1000,
    });

    return res.redirect(authUrl);
  },
);

export const googleCallback = asyncHandler(
  async (req: GoogleCallbackRequest, res: FastifyReply) => {
    const { code, state, error } = req.query;

    if (error) {
      throw new UnauthorizedError("Google OAuth was denied.", { error });
    }

    if (!code || !state) {
      throw new UnauthorizedError("Missing Google OAuth callback parameters.");
    }

    const cookieState = req.cookies?.oauth_state;
    if (!cookieState || cookieState !== state) {
      throw new UnauthorizedError("Invalid OAuth state.");
    }

    res.clearCookie("oauth_state");

    const result = await authService.loginWithGoogleCode(code);
    res.setCookie("refreshToken", result.tokens.refreshToken, cookieOption("refresh"));

    return sendSuccess(
      res,
      "Google login successful",
      STATUS_CODES.OK,
      {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
    );
  },
);

export const passless = asyncHandler(
  async (req: FastifyRequest<{ Body: { email: string } }>, res: FastifyReply) => {
    let { email, name, token, role } = await authService.passless(req.body.email);
    let link = buildUrl(req, {
      prefix: "/api/v1/auth",
      path: "/magic/verify",
      query: { token, role },
    });
    await sendPasswordlessLoginEmail(email, name ?? "User", 5, link);
    sendSuccess(res, "Passwordless login link successfully send", 200, link);
  },
);
export const testPassless = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    let { email, name, token, role } = await authService.testPassless();

    let link = buildUrl(req, {
      prefix: "/api/v1/auth",
      path: "/test/magic/verify",
      query: { token, role },
    });
    await sendPasswordlessLoginEmail(email, name ?? "User", 5, link);
    sendSuccess(res, "Test Passwordless login link successfully send", 200, link);
  },
);
export const passlessVerify = asyncHandler(
  async (
    req: FastifyRequest<{
      Querystring: {
        token: string;
        role: string;
      };
    }>,
    res: FastifyReply,
  ) => {
    let { token, role } = req.query;
    let response = await authService.passlessVerify(token, role);

    sendSuccess(res, "Welcome back", 200, response);
  },
);
export const testPasslessVerify = asyncHandler(
  async (
    req: FastifyRequest<{
      Querystring: {
        token: string;
        role: string;
      };
    }>,
    res: FastifyReply,
  ) => {
    let { token, role } = req.query;
    let response = await authService.testPasslessVerify(token, role);

    sendSuccess(res, "Test Welcome back", 200, response);
  },
);

export const register = asyncHandler(
  async (req: RegisterRequest, res: FastifyReply): Promise<any> => {
    // console.log(req)
    const result = await authService.register(req.body);

    res.setCookie("refreshToken", result.tokens.refreshToken, cookieOption("refresh"));
    res.setCookie("accessToken", result.tokens.accessToken, cookieOption("access"));

    sendSuccess(
      res,
      "Registration successful",
      STATUS_CODES.CREATED,
      {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
    );
  },
);

export const login = asyncHandler(async (req: LoginRequest, res: FastifyReply) => {
  const { email, password, totpToken } = req.body;
  const result = await authService.login(email, password, totpToken);

  if (result.requireTotp) {
    sendSuccess(
      res,
      "TOTP required",
      STATUS_CODES.OK,
      { requireTotp: true, userId: result.user.id },
    );
    return;
  }

  res.setCookie("refreshToken", result.tokens.refreshToken, cookieOption("refresh"));
  res.setCookie("accessToken", result.tokens.accessToken, cookieOption("access"));

  sendSuccess(
    res,
    "Login successful",
    STATUS_CODES.OK,
    { user: result.user, accessToken: result.tokens.accessToken },
  );
});

export const logout = asyncHandler(async (req: FastifyRequest, res: FastifyReply) => {
  const token =
    req.headers.authorization?.split(" ")[1] || req.cookies.refreshToken || "";
  await authService.logout(req.user!.id, token);

  // Must pass matching options used at set-time so the browser actually deletes the cookie.
  const clearOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  res.clearCookie("refreshToken", clearOpts);
  res.clearCookie("accessToken", clearOpts);
  sendSuccess(res, "Logout successful", STATUS_CODES.OK, null);
});

export const refreshToken = asyncHandler(
  async (req: RefreshTokenRequest, res: FastifyReply) => {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    const tokens = await authService.refreshTokens(token as string);

    res.setCookie("refreshToken", tokens.refreshToken, cookieOption("refresh"));
    res.setCookie("accessToken", tokens.accessToken, cookieOption("access"));

    sendSuccess(
      res,
      "Token refreshed",
      STATUS_CODES.OK,
      { accessToken: tokens.accessToken },
    );
  },
);

export const changePassword = asyncHandler(
  async (
    req: FastifyRequest<{ Body: { currentPassword: string; newPassword: string } }>,
    res: FastifyReply,
  ) => {
    const token =
      req.headers.authorization?.split(" ")[1] || req.cookies.accessToken || "";
    await authService.changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword,
      token,
    );
    res.clearCookie("refreshToken");
    sendSuccess(res, "Password changed successfully", STATUS_CODES.OK, null);
  },
);

export const enableTotp = asyncHandler(
  async (
    req: FastifyRequest<{ Body: { userId: string; password: string } }>,
    res: FastifyReply,
  ) => {
    const result = await authService.enableTotp(req.user!.id, req.body.password);
    sendSuccess(
      res,
      "TOTP setup initiated. Scan QR code and verify.",
      STATUS_CODES.OK,
      result,
    );
  },
);

export const verifyTotp = asyncHandler(
  async (
    req: FastifyRequest<{ Body: { userId: string; token: string } }>,
    res: FastifyReply,
  ) => {
    await authService.verifyAndActivateTotp(req.user!.id, req.body.token);
    sendSuccess(res, "TOTP enabled successfully", STATUS_CODES.OK, null);
  },
);

export const disableTotp = asyncHandler(
  async (
    req: FastifyRequest<{ Body: { userId: string; password: string } }>,
    res: FastifyReply,
  ) => {
    await authService.disableTotp(req.user!.id, req.body.password);
    sendSuccess(res, "TOTP disabled successfully", STATUS_CODES.OK, null);
  },
);

export const generateWebAuthnRegistration = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const options = await authService.generateWebAuthnRegistration(req.user!.id);
    sendSuccess(res, "WebAuthn registration options generated", STATUS_CODES.OK, options);
  }
);

export const verifyWebAuthnRegistration = asyncHandler(
  async (req: any, res: FastifyReply) => {
    const result = await authService.verifyWebAuthnRegistration(req.user!.id, req.body);
    sendSuccess(res, "WebAuthn registration verified", STATUS_CODES.OK, result);
  }
);

export const generateWebAuthnAuthentication = asyncHandler(
  async (req: FastifyRequest<{ Body: { email: string } }>, res: FastifyReply) => {
    const options = await authService.generateWebAuthnAuthentication(req.body.email);
    sendSuccess(res, "WebAuthn authentication options generated", STATUS_CODES.OK, options);
  }
);

export const verifyWebAuthnAuthentication = asyncHandler(
  async (req: FastifyRequest<{ Body: { email: string, response: any } }>, res: FastifyReply) => {
    const result = await authService.verifyWebAuthnAuthentication(req.body.email, req.body.response);

    res.cookie("refreshToken", result.tokens.refreshToken, cookieOption("refresh"));

    sendSuccess(
      res,
      "Passkey login successful",
      STATUS_CODES.OK,
      { user: result.user, accessToken: result.tokens.accessToken },
    );
  }
);

export const getMe = asyncHandler(async (req: FastifyRequest, res: FastifyReply) => {
  const user = req.user;
  if (!user) {
    throw new UnauthorizedError("Not authenticated");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id }
  });

  sendSuccess(res, "Session details", STATUS_CODES.OK, {
    user: dbUser,
    isAdmin: dbUser?.role === "ADMIN" || dbUser?.role === "SUPERADMIN",
    mfaSatisfied: true,
    hasMfaEnrolled: dbUser?.isTotpEnabled ?? false
  });
});
