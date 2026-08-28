type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: boolean | "lax" | "none" | "strict" | undefined;
  maxAge?: number;
};

let cookieOption = (mode: "access" | "refresh" = "refresh"): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: mode === "refresh" ? 7 * 24 * 60 * 60 : 1 * 24 * 60 * 60,
});

export default cookieOption;
