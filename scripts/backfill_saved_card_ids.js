/**
 * Backfills a stable `_id` on `User.savedCards` subdocuments that predate
 * the schema change giving each saved card its own `_id` (the schema used
 * to be `{ _id: false }`).
 *
 * Why this matters: without a persisted `_id`, Mongoose generates a new,
 * unstable one in memory every time the document loads — so a GET (listing
 * cards) and a later DELETE (removing one) would each see a different
 * generated id for the same legacy card, and the delete would fail with
 * "Cartão não encontrado." This writes a real, permanent `_id` for every
 * saved card that doesn't have one yet, using the native MongoDB driver
 * directly (no Mongoose model, no encryption key needed — `_id` isn't an
 * encrypted field, so this never touches `cardholderName` or any other
 * sensitive value).
 *
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." node scripts/backfill_saved_card_ids.js --dry-run   # preview only
 *   MONGODB_URI="mongodb+srv://..." node scripts/backfill_saved_card_ids.js              # apply
 *
 * Safe to run more than once — it only touches savedCards entries that are
 * still missing an `_id`; already-backfilled or newly-added cards (which
 * always get one from Mongoose on creation) are left untouched.
 */
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/clickpet';
const dryRun = process.argv.includes('--dry-run');

async function main() {
    console.log(`Connecting to: ${uri.replace(/\/\/.*@/, '//<redacted>@')}`);
    console.log(dryRun ? 'Mode: DRY RUN (no writes)' : 'Mode: LIVE (will write)');

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();
        const users = db.collection('users');

        const cursor = users.find({
            savedCards: { $elemMatch: { _id: { $exists: false } } },
        });

        let usersScanned = 0;
        let usersFixed = 0;
        let cardsFixed = 0;

        for await (const user of cursor) {
            usersScanned++;
            let changed = false;

            const updatedCards = (user.savedCards || []).map((card) => {
                if (card._id) return card;
                changed = true;
                cardsFixed++;
                return { ...card, _id: new ObjectId() };
            });

            if (!changed) continue;

            console.log(
                `${dryRun ? '[DRY RUN] Would backfill' : 'Backfilling'} user ${user._id} — ` +
                `${updatedCards.filter((c) => c._id).length}/${updatedCards.length} card(s) will have an _id`
            );

            if (!dryRun) {
                await users.updateOne({ _id: user._id }, { $set: { savedCards: updatedCards } });
            }
            usersFixed++;
        }

        console.log('---');
        console.log(`Users scanned (with at least one card missing _id): ${usersScanned}`);
        console.log(`Users ${dryRun ? 'that would be updated' : 'updated'}: ${usersFixed}`);
        console.log(`Cards ${dryRun ? 'that would get' : 'given'} a new _id: ${cardsFixed}`);
        if (dryRun) console.log('\nRe-run without --dry-run to apply.');
    } finally {
        await client.close();
    }
}

main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
