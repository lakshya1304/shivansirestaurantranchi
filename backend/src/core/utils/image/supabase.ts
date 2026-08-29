import {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET,
} from "../../config/envConfig.js";

export interface SupabaseUploadResult {
    url: string;
    displayUrl: string;
    deleteUrl: string;
    size: number;
    path: string;
}

export default async function uploadToSupabase(
    buffer: Buffer,
    filename: string,
): Promise<SupabaseUploadResult> {
    const supabaseUrl = SUPABASE_URL;
    const serviceRoleKey = SUPABASE_SERVICE_ROLE_KEY;
    const bucket = SUPABASE_STORAGE_BUCKET;

    if (!supabaseUrl) {
        throw new Error(
            "SUPABASE_URL is not set in environment variables",
        );
    }

    if (!serviceRoleKey) {
        throw new Error(
            "SUPABASE_SERVICE_ROLE_KEY is not set in environment variables",
        );
    }

    if (!bucket) {
        throw new Error(
            "SUPABASE_STORAGE_BUCKET is not set in environment variables",
        );
    }

    const path = `images/${Date.now()}-${filename}.webp`;

    const uploadUrl =
        `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

    const response = await fetch(uploadUrl, {
        method: "POST",

        headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
            "Content-Type": "image/webp",
            "x-upsert": "false",
        },

        body: new Uint8Array(buffer),
    });

    if (!response.ok) {
        const text = await response.text();

        throw new Error(
            `Supabase upload failed (${response.status}): ${text}`,
        );
    }

    const publicUrl =
        `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

    return {
        url: publicUrl,
        displayUrl: publicUrl,
        deleteUrl: uploadUrl,
        size: buffer.length,
        path,
    };
}