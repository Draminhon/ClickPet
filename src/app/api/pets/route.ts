import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Pet from '@/models/Pet';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const pets = await Pet.find({ ownerId: session.user.id });

        return NextResponse.json(pets);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        const pet = await Pet.create({
            ...body,
            ownerId: session.user.id,
        });

        return NextResponse.json(pet, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const petId = searchParams.get('id');
        if (!petId) {
            return NextResponse.json({ message: 'Pet ID required' }, { status: 400 });
        }

        await dbConnect();
        const body = await req.json();

        const pet = await Pet.findOneAndUpdate(
            { _id: petId, ownerId: session.user.id },
            { ...body },
            { new: true }
        );

        if (!pet) {
            return NextResponse.json({ message: 'Pet not found' }, { status: 404 });
        }

        return NextResponse.json(pet);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const petId = searchParams.get('id');

        await dbConnect();
        await Pet.findOneAndDelete({ _id: petId, ownerId: session.user.id });

        return NextResponse.json({ message: 'Pet deleted' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
