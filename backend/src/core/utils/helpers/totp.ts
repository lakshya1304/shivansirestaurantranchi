import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { TOTP_ISSUER } from "../../config/envConfig";

export function generateTotpSecret(): string {
  const secret = speakeasy.generateSecret({ length: 20, name: TOTP_ISSUER });
  // Some authenticator apps struggle with base32 padding, strip it just in case
  return secret.base32.replace(/=/g, "");
}

export async function verifyTotpToken(token: string, secret: string): Promise<boolean> {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token.trim(),
    window: 10, // 10 = +/- 5 minutes window to account for large clock drifts
  });
}

export async function generateTotpQrCode(email: string, secret: string): Promise<string> {
  const otpauth = speakeasy.otpauthURL({
    secret: secret,
    label: email,
    issuer: TOTP_ISSUER,
    encoding: "base32",
  });

  return QRCode.toDataURL(otpauth);
}
