import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET() {
    try {
        await dbConnect();

        // Fetch up to 15 partners who have a shop logo
        let partners = await User.find({
            role: 'partner',
            shopLogo: { $exists: true, $nin: [null, ''] }
        })
            .select('name shopLogo specialization')
            .limit(15)
            .lean();

        // Auto-seed if we have fewer than 30 partners (ensuring 15 for each carousel)
        // We check for 30 because we want 15 general and 15 clinics
        const totalPartners = await User.countDocuments({ role: 'partner' });

        if (totalPartners < 30) {
            // Clear existing partners to avoid duplicates and ensure clean 15/15 split
            await User.deleteMany({ role: 'partner' });
            
            const mockPartners = [
                // General Partners (15)
                { name: 'Pet Feliz Central', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&h=100&fit=crop', specialization: 'Petshop & Clínica' },
                { name: 'Canto das Aves', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1552728089-57bdde30fc3b?w=100&h=100&fit=crop', specialization: 'Aves & Gaiolas' },
                { name: 'Mundo Submarino', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=100&h=100&fit=crop', specialization: 'Aquarismo Profissional' },
                { name: 'Casa do Criador', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=100&h=100&fit=crop', specialization: 'Casa de Ração' },
                { name: 'Dog Style Grooming', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=100&h=100&fit=crop', specialization: 'Banho e Tosa' },
                { name: 'Gato Mania', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop', specialization: 'Artigos Felinos' },
                { name: 'Reino Animal', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=100&h=100&fit=crop', specialization: 'Petshop Geral' },
                { name: 'Pet Shop Alegria', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1552728089-57bdde30fc3b?w=100&h=100&fit=crop', specialization: 'Petshop' },
                { name: 'Cantinho do Totó', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&h=100&fit=crop', specialization: 'Petshop' },
                { name: 'Bicho Mimado', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=100&h=100&fit=crop', specialization: 'Petshop' },
                { name: 'Amigo Fiel', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=100&h=100&fit=crop', specialization: 'Petshop' },
                { name: 'Planeta Pet', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=100&h=100&fit=crop', specialization: 'Petshop' },
                { name: 'Espaço Animal', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop', specialization: 'Petshop' },
                { name: 'Pet Center', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&h=100&fit=crop', specialization: 'Petshop' },
                { name: 'Mania de Cão', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1581888227599-779811939961?w=100&h=100&fit=crop', specialization: 'Petshop' },

                // Veterinary Clinics (15)
                { name: 'Vila dos Bichos', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=100&h=100&fit=crop', specialization: 'Clínica Veterinária' },
                { name: 'Saúde Animal', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?w=100&h=100&fit=crop', specialization: 'Hospital 24h' },
                { name: 'Dr. Pet Care', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1576201836106-ca1756a1dc3b?w=100&h=100&fit=crop', specialization: 'Veterinária Geral' },
                { name: 'Gato e Sapato', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop', specialization: 'Clínica de Felinos' },
                { name: 'Vet Life', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=100&h=100&fit=crop', specialization: 'Clínica Veterinária' },
                { name: 'Centro MedVet', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=100&h=100&fit=crop', specialization: 'Clínica Veterinária' },
                { name: 'Pet Health', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=100&h=100&fit=crop', specialization: 'Hospital Veterinário' },
                { name: 'Clínica Amigo', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=100&h=100&fit=crop', specialization: 'Veterinária' },
                { name: 'Hovet Central', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1576201836106-ca1756a1dc3b?w=100&h=100&fit=crop', specialization: 'Hospital Veterinário' },
                { name: 'Dr. Bichinho', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?w=100&h=100&fit=crop', specialization: 'Clínica Veterinária' },
                { name: 'Vet Care+', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=100&h=100&fit=crop', specialization: 'Clínica Veterinária' },
                { name: 'Pet Prime', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=100&h=100&fit=crop', specialization: 'Veterinária' },
                { name: 'Clinicão', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=100&h=100&fit=crop', specialization: 'Clínica Veterinária' },
                { name: 'Vet & Cia', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=100&h=100&fit=crop', specialization: 'Veterinária' },
                { name: 'Pata Amiga', role: 'partner', shopLogo: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=100&h=100&fit=crop', specialization: 'Clínica Veterinária' },
            ];

            for (const p of mockPartners) {
                await User.create(p);
            }

            // Refetch to get updated list
            partners = await User.find({
                role: 'partner',
                shopLogo: { $exists: true, $nin: [null, ''] }
            })
                .select('name shopLogo specialization')
                .limit(15)
                .lean();
        }

        return NextResponse.json(partners);
    } catch (error: any) {
        console.error('Failed to fetch featured partners:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
