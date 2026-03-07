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
        const user = await User.findById(session.user.id);
        if (user) {
            user.tokenVersion = (user.tokenVersion || 0) + 1;
            await user.save();
            await logAction(req, 'logout', { userId: user._id });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Logout error", error);
        return NextResponse.json({ error: "Erro ao tentar sair" }, { status: 500 });
    }
}
