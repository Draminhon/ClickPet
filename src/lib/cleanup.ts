import dbConnect from './db';
import User from '@/models/User';

export async function cleanupGhostMarkers() {
    try {
        await dbConnect();
        // Skip Mongoose processing to prevent "bad decrypt" plugin crashes
        const users = await (User as any).collection.find({}).toArray();
        console.log(`[CLEAN_DRY] Checking ${users.length} users...`);

        for (const u of users) {
            const unsetObj: any = {};
            // Look at ALL keys in the raw document
            for (const key of Object.keys(u)) {
                if (key.startsWith('__enc_')) {
                    const fieldName = key.replace('__enc_', '').replace(/_/g, '.');
                    const val = fieldName.split('.').reduce((obj, key) => obj?.[key], u);

                    // If field is missing, null, empty string, or even if it's there but the "decryption" is what's failing
                    // For now, let's target truly empty fields
                    if (val === undefined || val === null || (typeof val === 'string' && (val as any).trim() === '')) {
                        console.log(`[CLEANUP] Purging marker ${key} for ${u.email} (Field is: ${JSON.stringify(val)})`);
                        unsetObj[key] = "";
                    }
                }
            }

            if (Object.keys(unsetObj).length > 0) {
                await (User as any).collection.updateOne(
                    { _id: u._id },
                    { $unset: unsetObj }
                );
            }
        }
    } catch (error: any) {
        console.error('[CLEANUP] Error:', error);
    }
}
