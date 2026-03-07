import dbConnect from './db';
import User from '@/models/User';
import Pet from '@/models/Pet';
import Order from '@/models/Order';
import DeliveryPerson from '@/models/DeliveryPerson';

/**
 * Forcefully unsets ALL encryption markers to reset the plugin state.
 */
export async function fullEncryptionReset() {
    try {
        await dbConnect();
        const models = [User, Pet, Order, DeliveryPerson];
        console.log('[RESET] Starting full encryption marker purge...');

        for (const model of models) {
            // CRITICAL: Must use raw collection methods! 
            // model.find().lean() still triggers mongoose-field-encryption hooks which crash on bad decrypt.
            const records = await (model as any).collection.find({}).toArray();
            console.log(`[RESET] Processing ${records.length} records for ${model.modelName}...`);

            for (const rec of records) {
                const unsetObj: any = {};
                Object.keys(rec).forEach(key => {
                    if (key.startsWith('__enc_')) {
                        unsetObj[key] = "";
                    }
                });

                if (Object.keys(unsetObj).length > 0) {
                    await (model as any).collection.updateOne(
                        { _id: rec._id },
                        { $unset: unsetObj }
                    );
                }
            }
        }
        console.log('[RESET] Done. All markers purged.');
    } catch (error: any) {
        console.error('[RESET] Failed:', error);
    }
}
