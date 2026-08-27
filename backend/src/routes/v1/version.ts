import type { FastifyInstance } from "fastify";
import currentVersion from "../../utils/helpers/version.js";
import { sendSuccess } from "../../utils/common/response.js";

export async function version(app: FastifyInstance) {
    app.get("/version", (req: any, res: any) => {
        return sendSuccess(res, `Version : ${currentVersion}`, 200, { currentVersion });
    });
}