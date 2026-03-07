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

        // Explicitly allowed fields to prevent mass assignment
        const allowedFields = ['name', 'species', 'breed', 'age', 'weight', 'photo', 'gender', 'size', 'temperament', 'medicalNotes', 'isVaccinated', 'notes'];
        const petData: any = { ownerId: session.user.id };

        allowedFields.forEach(field => {
            if (body[field] !== undefined) petData[field] = body[field];
        });

        const pet = await Pet.create(petData);

        return NextResponse.json(pet, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: 'Error saving pet' }, { status: 500 });
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

        // Explicitly allowed fields for update
        const allowedFields = ['name', 'species', 'breed', 'age', 'weight', 'photo', 'gender', 'size', 'temperament', 'medicalNotes', 'isVaccinated', 'notes'];
        const updateData: any = {};

        allowedFields.forEach(field => {
            if (body[field] !== undefined) updateData[field] = body[field];
        });

        const pet = await Pet.findOneAndUpdate(
            { _id: petId, ownerId: session.user.id },
            updateData,
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
