import dbConnect from './db';
import User from '@/models/User';

/**
 * Diagnostic script to check raw user data and test decryption integrity.
 */
export async function diagnoseDatabase() {
    try {
        await dbConnect();
        console.log('[DIAGNOSE] Fetching users to check integrity...');
        const users = await User.find({}).lean(); // Fetch all as lean first

        for (const u of users) {
            console.log(`User: ${u.email} (${u.role})`);
            console.log(`- __enc_cnpj: ${u.__enc_cnpj}`);
            console.log(`- __enc_phone: ${u.__enc_phone}`);

            // Test if it can be loaded through Mongoose (triggers decryption)
            try {
                const fullUser = await User.findById(u._id);
                // Accessing properties to trigger decryption
                const testCnpj = fullUser?.cnpj;
                const testPhone = fullUser?.phone;
                const testAddress = fullUser?.address?.street;
                console.log(`- Decryption check: OK`);
            } catch (err: any) {
                console.log(`- Decryption check: FAILED (${err.message})`);
            }
            console.log('-------------------');
        }
    } catch (error: any) {
        console.error('[DIAGNOSE] Failed:', error);
    }
}
