import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { resolve } from 'path';

const MONGODB_URI = "mongodb+srv://administracaoclickpet_db_user:PYgHVUkzWq9ldaTT@cluster01.iuygqeu.mongodb.net/clickpet?retryWrites=true&w=majority";
const ENCRYPTION_KEY = "38e6789f2c8d4a5b9e12345678901234";

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    role: { type: String, default: 'customer' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function promoteAdmin() {
    try {
        console.log('--- PROMOVENDO ADMINISTRADOR (PRODUÇÃO) ---');
        console.log('Conectando ao MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado com sucesso.');

        const email = 'administracao.clickpet@gmail.com';
        
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            console.log(`Usuário encontrado: ${user.name} (${user.email})`);
            user.role = 'admin';
            await user.save();
            console.log(`🚀 PERMISSÃO CONCEDIDA! O e-mail ${email} agora é ADMINISTRADOR.`);
        } else {
            console.log(`❌ ERRO: O e-mail ${email} não foi encontrado no banco de dados.`);
            console.log(`Por favor, certifique-se de que você já fez o primeiro login no site clickpet.shop antes de rodar este script.`);
        }

    } catch (error) {
        console.error('Erro na promoção:', error);
    } finally {
        await mongoose.disconnect();
    }
}

promoteAdmin();
