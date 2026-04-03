import HeroBanner from '@/components/home/HeroBanner';
import AnimalSpecies from '@/components/home/AnimalSpecies';
import OffersCarousel from '@/components/home/OffersCarousel';
import BottomBanner from '@/components/home/BottomBanner';
import styles from './Home.module.css';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Link from 'next/link';


import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

async function getOfferProducts() {
    await dbConnect();
    const products = await Product.find({ discount: { $gt: 0 } })
        .sort({ discount: -1 })
        .limit(10)
        .populate('partnerId', 'name')
        .lean();

    return products.map((product: any) => ({
        ...product,
        _id: product._id.toString(),
        partnerId: product.partnerId ? {
            ...product.partnerId,
            _id: product.partnerId._id.toString()
        } : null
    }));
}

export default async function HomePage() {
    const session = await getServerSession(authOptions);

    if (session?.user?.role === 'admin') {
        redirect('/admin');
    }

    if (session?.user?.role === 'partner') {
        redirect('/partner/dashboard');
    }

    const offerProducts = await getOfferProducts();

    return (
        <div>
            {/* Hero Section */}
            <HeroBanner />

            {/* Species Section */}
            <AnimalSpecies />

            {/* Offers Section */}
            <OffersCarousel products={offerProducts} />

            {/* Bottom Banner Section */}
            <BottomBanner />
        </div>
    );
}
