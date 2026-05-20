import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { logAction } from "@/lib/audit";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: true });
        }

        await dbConnect();
        const userId = session.user.id;
        const userRole = session.user.role || 'customer';
        
        // Faz o update direto no banco ao invés de buscar e salvar o documento completo
        await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
        
        // Registra o log em background de forma assíncrona (não-bloqueante) e evita nova descriptografia de token
        logAction(req, 'logout', { userId }, { id: userId, role: userRole })
            .catch(err => console.error('[AUDIT] Failed to log logout in background:', err));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Logout error", error);
        return NextResponse.json({ error: "Erro ao tentar sair" }, { status: 500 });
    }
}
