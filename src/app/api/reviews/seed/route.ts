import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Product from '@/models/Product';
import User from '@/models/User';

export async function GET(req: Request) {
    try {
        await dbConnect();

        // 1. Find a product to review
        const product = await Product.findOne();
        if (!product) {
            return NextResponse.json({ message: 'No products found to seed reviews for.' }, { status: 404 });
        }

        // 2. Find or create a user to be the reviewer
        let user = await User.findOne({ email: 'seed_user@example.com' });
        if (!user) {
            user = await User.create({
                name: 'João Carlos',
                email: 'seed_user@example.com',
                password: 'password123', // In a real app, this should be hashed
                role: 'customer'
            });
        }

        // 3. Create some mock reviews
        const mockReviews = [
            {
                userId: user._id,
                productId: product._id,
                rating: 5,
                comment: 'Produto excelente! Meu pet ficou muito satisfeito com essa ração. A entrega foi super rápida.',
                verified: true
            },
            {
                userId: user._id,
                productId: product._id,
                rating: 4,
                comment: 'Gostei bastante da qualidade, mas o pacote veio levemente amassado. O produto em si é ótimo.',
                verified: true
            },
            {
                userId: user._id,
                productId: product._id,
                rating: 5,
                comment: 'Compro sempre por aqui, nunca tive problemas. Recomendo!',
                verified: true
            }
        ];

        // Clear existing reviews for this product to avoid duplicates during seed
        await Review.deleteMany({ productId: product._id, userId: user._id });

        // Insert new reviews
        const createdReviews = await Review.insertMany(mockReviews);

        return NextResponse.json({
            message: 'Reviews seeded successfully!',
            product: product.title,
            productId: product._id,
            reviewsCreated: createdReviews.length
        });
    } catch (error: any) {
        console.error('Seed Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
