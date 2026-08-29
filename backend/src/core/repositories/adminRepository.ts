import { prismaAdmin } from "../config/databaseConfig";
import { Admin } from "../../generated/prismaAdmin";
import BaseRepository from "./baseRepository";

export default class AdminRepository extends BaseRepository<Admin> {
  constructor() {
    super("admin", prismaAdmin);
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return this.findOne({ email });
  }

  async updateRefreshToken(adminId: string, refreshToken: string | null): Promise<Admin> {
    return this.update(adminId, { refreshToken });
  }

  async updateLastLogin(adminId: string): Promise<Admin> {
    return this.update(adminId, { lastLogin: new Date() });
  }

  async updateTotpSecret(
    adminId: string,
    totpSecret: string | null,
    isTotpEnabled: boolean,
  ): Promise<Admin> {
    return this.update(adminId, { totpSecret, isTotpEnabled });
  }

  async updateAvatar(adminId: string, avatarUrl: string): Promise<Admin> {
    return this.update(adminId, { avatarUrl });
  }

  async deactivateAdmin(adminId: string): Promise<Admin> {
    return this.update(adminId, { isActive: false });
  }

  async activateAdmin(adminId: string): Promise<Admin> {
    return this.update(adminId, { isActive: true });
  }
}
