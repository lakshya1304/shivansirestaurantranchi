import uploadToImgBB from "./imgbb.js";
import uploadToSupabase from "./supabase.js";

type UploadResult = {
    url: string;
    displayUrl: string;
    deleteUrl: string;
    size: number;
    path?: string;
};

async function uploadToService(
    serviceName: "supabase" | "imgbb",
    optimised: Buffer,
    filename: string,
): Promise<UploadResult> {
    switch (serviceName.toLowerCase()) {
        case "imgbb":
            return await uploadToImgBB(
                optimised,
                filename,
            );

        case "supabase":
            return await uploadToSupabase(
                optimised,
                filename,
            );

        default:
            throw new Error(
                `Invalid image upload provider: ${serviceName}`,
            );
    }
}

export { uploadToService };
export default uploadToService;