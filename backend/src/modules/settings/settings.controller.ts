import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../../core/config/databaseConfig";
import logger from "../../core/config/loggerConfig";
import env from "../../core/config/envConfig";

import { fetchWithCache } from "../../core/config/redisConfig";

export const getSettings = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const PUBLIC_SETTINGS_COLUMNS = {
      id: true, name: true, tagline: true, logo_url: true, banner_url: true, 
      address: true, phone: true, opening_time: true, closing_time: true, 
      tax_percent: true, packing_charge: true, delivery_charge: true, 
      currency: true, theme: true, is_suspended: true
    };
    const settings = await fetchWithCache("data:settings", 60, () => 
      prisma.restaurantSettings.findFirst({ select: PUBLIC_SETTINGS_COLUMNS })
    );
    return res.send(settings || null);
  } catch (error: any) {
    logger.error(`Error in getSettings: ${error.message}`);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getOwnerSettings = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const settings = await prisma.restaurantSettings.findFirst();
    const config = await prisma.appConfig.findFirst();

    return res.send({
      ownerEmail: config?.owner_email ?? "",
      whatsappPhoneNumberId: config?.whatsapp_phone_number_id ?? "",
      whatsappToken: config?.whatsapp_token ? "***" : "", // do not expose actual token
    });
  } catch (error: any) {
    logger.error(`Error in getOwnerSettings: ${error.message}`);
    return res.status(500).send({ error: error.message });
  }
};

export const saveOwnerSettings = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { ownerEmail, whatsappPhoneNumberId, whatsappToken } = req.body as any;

    const settings = await prisma.restaurantSettings.findFirst();
    if (!settings) {
      await prisma.restaurantSettings.create({
        data: { name: env.BUSINESS_NAME }
      });
    }

    const config = await prisma.appConfig.findFirst();
    const configData: any = {
      whatsapp_phone_number_id: whatsappPhoneNumberId
    };
    if (whatsappToken) {
      configData.whatsapp_token = whatsappToken;
    }

    if (config) {
      await prisma.appConfig.update({
        where: { id: config.id },
        data: configData
      });
    } else {
      await prisma.appConfig.create({
        data: configData
      });
    }

    return res.send({ ok: true });
  } catch (error: any) {
    logger.error(`Error in saveOwnerSettings: ${error.message}`);
    return res.status(500).send({ error: error.message });
  }
};
