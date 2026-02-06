import OSS from 'ali-oss';
import path from 'path';

// Initialize OSS Client
// Note: We use process.env directly here. Ensure these are set in .env
let ossClient: OSS | null = null;

try {
    const region = process.env.OSS_REGION;
    const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
    const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
    const bucket = process.env.OSS_BUCKET;

    if (region && accessKeyId && accessKeySecret && bucket) {
        ossClient = new OSS({
            region,
            accessKeyId,
            accessKeySecret,
            bucket,
            secure: true // Use HTTPS
        });
        console.log('[OSS] Client initialized successfully for bucket:', bucket);
    } else {
        console.warn('[OSS] Missing environment variables. OSS uploads will fail.');
    }
} catch (error) {
    console.error('[OSS] Failed to initialize client:', error);
}

export const ossService = {
    /**
     * Upload a file to Alibaba Cloud OSS
     * @param buffer File content buffer
     * @param destinationPath The path (key) in the bucket, e.g. "voice-enrollment/myfile.wav"
     * @returns Public HTTPS URL of the uploaded file
     */
    async uploadFile(buffer: Buffer, destinationPath: string): Promise<string> {
        if (!ossClient) {
            throw new Error("OSS Client not initialized. Check OSS_ env variables.");
        }

        try {
            console.log(`[OSS] Uploading ${buffer.length} bytes to ${destinationPath}...`);

            // OSS put method: put(name, file, options)
            // 'file' can be a buffer
            const result = await ossClient.put(destinationPath, buffer);

            console.log('[OSS] Upload success. Result:', result);

            // Generate Signed URL for private bucket access (DashScope needs to download it)
            // Expires in 3600 seconds (1 hour)
            const signedUrl = ossClient.signatureUrl(destinationPath, { expires: 3600 });

            // Ensure HTTPS
            let finalUrl = signedUrl;
            if (finalUrl.startsWith('http:')) {
                finalUrl = finalUrl.replace('http:', 'https:');
            }

            return finalUrl;
        } catch (error: any) {
            console.error('[OSS] Upload failed:', error);
            throw new Error(`OSS Upload Failed: ${error.message}`);
        }
    }
};
