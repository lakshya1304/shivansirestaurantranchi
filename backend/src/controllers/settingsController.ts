import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../config/databaseConfig";
import logger from "../config/loggerConfig";
import env from "../config/envConfig";

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
