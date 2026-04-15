import { MongoClient } from 'mongodb';

const uri = "mongodb://localhost:27017/clickpet";
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const database = client.db('clickpet');
        const users = database.collection('users');

        const mockEmails = [
            'contato@petfeliz.com.br', 'aves@cantodasaves.com', 'sub@mundosubmarino.net',
            'vendas@casadocriador.com', 'groom@dogstyle.com', 'gato@gatomania.com',
            'reino@animal.com.br', 'alegria@petshop.com', 'toto@cantinho.com',
            'bicho@mimado.com', 'amigo@fiel.com', 'planeta@pet.com',
            'espaco@animal.com', 'center@pet.com', 'mania@cao.com',
            'vila@bichos.vet', 'saude@animal.vet', 'dr@petcare.vet',
            'sac@gatoesapato.vet', 'life@vet.com', 'centro@medvet.com',
            'health@pet.vet', 'amigo@vet.com', 'central@hovet.com',
            'bichinho@dr.vet', 'care@vetplus.com', 'prime@pet.vet',
            'contato@clinicao.vet', 'vet@cia.com', 'pata@amiga.vet'
        ];

        const result = await users.deleteMany({ 
            role: 'partner', 
            email: { $in: mockEmails } 
        });

        console.log(`${result.deletedCount} mock partners deleted.`);

    } finally {
        await client.close();
    }
}

run().catch(console.dir);
