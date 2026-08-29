import type { FastifyInstance } from "fastify";
import currentVersion from "../../core/utils/helpers/version.js";
import { sendSuccess } from "../../core/utils/common/response.js";

export async function version(app: FastifyInstance) {
    app.get("/version", (req: any, res: any) => {
        return sendSuccess(res, `Version : ${currentVersion}`, 200, { currentVersion });
    });
}