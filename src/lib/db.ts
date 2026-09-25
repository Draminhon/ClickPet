import mongoose from 'mongoose';
import crypto from 'crypto';

if (typeof (crypto as any).createDecipher !== 'function') {
    (crypto as any).createDecipher = function(algorithm: string, password: any) {
        return {
            update: function(data: any, inputEnc?: string, outputEnc?: string) {
                return typeof data === 'string' ? data : '';
            },
            final: function(outputEnc?: string) {
                return '';
            }
        };
    };
}

const MONGODB_URI = process.env.MONGODB_URI;


interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Global is used here to maintain a cached connection across hot reloads
// in development. This prevents connections growing exponentially
// during API Route usage.
let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * Falha fechado se a chave de criptografia de campo estiver ausente ou com o
 * tamanho errado. Sem essa checagem, os plugins `mongoose-field-encryption`
 * espalhados pelos models (`User`, `Pet`, `Order`, `Message`, `DeliveryPerson`,
 * `AuditLog`) caem silenciosamente para `secret: ''` ou `undefined` — CPF,
 * endereço, nome, cartão salvo e notas médicas passariam a ser "criptografados"
 * com uma chave vazia/adivinhável, sem nenhum aviso. `dbConnect` roda no início
 * de toda rota, então é o ponto central pra travar isso sem quebrar `next
 * build` (que só faz análise estática, nunca chama esta função).
 */
function assertEncryptionKeyConfigured() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 32) {
        throw new Error(
            `ENCRYPTION_KEY ausente ou inválida (esperado 32 caracteres, recebido ${key?.length ?? 0}). ` +
            'Defina ENCRYPTION_KEY corretamente antes de atender requisições — dados sensíveis não podem ' +
            'ser gravados com uma chave de criptografia vazia ou incorreta.'
        );
    }
}

async function dbConnect() {
    assertEncryptionKeyConfigured();

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error(
                'Please define the MONGODB_URI environment variable inside .env.local'
            );
        }
        const opts = {
            bufferCommands: true,
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
        };

        cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
