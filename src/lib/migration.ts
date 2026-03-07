import dbConnect from './db';
import User from '@/models/User';
import Pet from '@/models/Pet';
import Order from '@/models/Order';
import DeliveryPerson from '@/models/DeliveryPerson';
import Message from '@/models/Message';

/**
 * Migration script to encrypt existing plain-text data.
 * Also Repairs records that fail decryption (bad decrypt) by unsetting corrupted fields.
 */
export async function migrateToEncryption() {
    try {
        await dbConnect();
        console.log('[MIGRATION] Starting database encryption migration and repair...');

        const models = [
            {
                model: User,
                name: 'User',
                encField: '__enc_cnpj',
                sensitiveFields: ['cnpj', 'cpf', 'phone', 'address.street', 'address.number', 'address.complement', 'address.neighborhood', 'address.city', 'address.state', 'address.zip', 'twoFactorSecret'],
                encMarkers: ['__enc_cnpj', '__enc_cpf', '__enc_phone', '__enc_address_street', '__enc_address_number', '__enc_address_complement', '__enc_address_neighborhood', '__enc_address_city', '__enc_address_state', '__enc_address_zip', '__enc_twoFactorSecret']
            },
            {
                model: Pet,
                name: 'Pet',
                encField: '__enc_medicalNotes',
                sensitiveFields: ['medicalNotes', 'notes', 'microchipId'],
                encMarkers: ['__enc_medicalNotes', '__enc_notes', '__enc_microchipId']
            },
            {
                model: DeliveryPerson,
                name: 'DeliveryPerson',
                encField: '__enc_phone',
                sensitiveFields: ['phone', 'licensePlate'],
                encMarkers: ['__enc_phone', '__enc_licensePlate']
            },
            {
                model: Order,
                name: 'Order',
                encField: '__enc_address_street',
                sensitiveFields: ['address.street', 'address.number', 'address.complement', 'address.neighborhood', 'address.city', 'address.state', 'address.zip'],
                encMarkers: ['__enc_address_street', '__enc_address_number', '__enc_address_complement', '__enc_address_neighborhood', '__enc_address_city', '__enc_address_state', '__enc_address_zip']
            },
            {
                model: Message,
                name: 'Message',
                encField: '__enc_content',
                sensitiveFields: ['content'],
                encMarkers: ['__enc_content']
            }
        ];

        for (const item of models) {
            // Bypass Mongoose to prevent decryption crashes on raw reads
            const allRecords = await (item.model as any).collection.find({}).project({ _id: 1 }).toArray();
            console.log(`[MIGRATION] Checking ${allRecords.length} ${item.name} records...`);

            for (const rec of allRecords) {
                try {
                    // Test decryption by fetching the full document
                    const doc = await item.model.findById(rec._id);
                    if (!doc) continue;

                    const isEncrypted = (doc as any)[item.encField];

                    if (!isEncrypted) {
                        // Force encryption for plain-text record
                        console.log(`[MIGRATION] Encrypting plain-text ${item.name}: ${rec._id}`);
                        const raw = await (item.model as any).collection.findOne({ _id: rec._id });
                        doc.set(raw);
                        item.sensitiveFields.forEach(f => {
                            // Only mark as modified if the field actually has a value to avoid creating empty encrypted entries
                            const value = f.split('.').reduce((obj, key) => obj?.[key], raw);
                            if (value !== undefined && value !== null) {
                                doc.markModified(f);
                            }
                        });
                        await doc.save();
                    } else {
                        // It's encrypted, let's trigger a read to verify "bad decrypt"
                        try {
                            // Accessing a property triggers decryption
                            const test = (doc as any)[item.sensitiveFields[0].split('.')[0]];
                        } catch (decryptErr: any) {
                            if (decryptErr.message.includes('bad decrypt')) {
                                console.warn(`[MIGRATION] Repairing corrupted ${item.name}: ${rec._id} (reason: bad decrypt)`);
                                // UNSET corrupted markers and fields to "reset" the record
                                const unsetObj: any = {};
                                item.encMarkers.forEach(m => unsetObj[m] = "");
                                item.sensitiveFields.forEach(f => unsetObj[f] = "");

                                await (item.model as any).collection.updateOne(
                                    { _id: rec._id },
                                    { $unset: unsetObj }
                                );
                                console.log(`[MIGRATION] ${item.name} ${rec._id} repaired (sensitive data cleared).`);
                            } else {
                                throw decryptErr;
                            }
                        }
                    }
                } catch (err: any) {
                    console.error(`[MIGRATION] Failed to process ${item.name} ${rec._id}:`, err.message);
                }
            }
        }

        console.log('[MIGRATION] Migration and potential repairs completed successfully.');
    } catch (error: any) {
        console.error('[MIGRATION] Global migration failure:', error);
    }
}
