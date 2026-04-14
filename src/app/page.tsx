import HeroBanner from '@/components/home/HeroBanner';
import Image from 'next/image';
import DynamicHomeContent from '@/components/home/DynamicHomeContent';
import LoggedInHomeContent from '@/components/home/LoggedInHomeContent';
import BottomBanner from '@/components/home/BottomBanner';
import styles from './Home.module.css';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

async function getFeaturedPartners(isClinic = false) {
    await dbConnect();
    
    const generalCount = await User.countDocuments({ role: 'partner', specialization: { $not: { $regex: /Veterinária|Hospital|Clínica/i } } });
    const clinicCount = await User.countDocuments({ role: 'partner', specialization: { $regex: /Veterinária|Hospital|Clínica/i } });
    
    // Force re-seed if we don't have enough of each to fill the carousels to exactly 15
    if (generalCount < 15 || clinicCount < 15) {
        await User.deleteMany({ role: 'partner' });
        const mockPartners = [
            // General Partners (15) - Using unique Unsplash IDs and unique emails
            { 
                name: 'Pet Feliz Central', role: 'partner', email: 'contato@petfeliz.com.br', shopLogo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&h=100&fit=crop', specialization: 'Petshop',
                address: { street: 'Rua Raimundo Moreira Lima', city: 'Paracuru', coordinates: { type: 'Point', coordinates: [-39.0306, -3.4111] } }
            },
            { 
                name: 'Canto das Aves', role: 'partner', email: 'aves@cantodasaves.com', shopLogo: 'https://images.unsplash.com/photo-1543466835-00a732f2c038?w=100&h=100&fit=crop', specialization: 'Aves & Gaiolas',
                address: { street: 'Rua Principal', city: 'Paracuru', coordinates: { type: 'Point', coordinates: [-39.0310, -3.4115] } }
            },
            { 
                name: 'Mundo Submarino', role: 'partner', email: 'sub@mundosubmarino.net', shopLogo: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=100&h=100&fit=crop', specialization: 'Aquarismo Profissional',
                address: { street: 'Av. Antonio Sales', city: 'Paracuru', coordinates: { type: 'Point', coordinates: [-39.0250, -3.4100] } }
            },
            { 
                name: 'Casa do Criador', role: 'partner', email: 'vendas@casadocriador.com', shopLogo: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=100&h=100&fit=crop', specialization: 'Casa de Ração',
                address: { street: 'Rua do Sol', city: 'Paracuru', coordinates: { type: 'Point', coordinates: [-39.0298, -3.4110] } }
            },
            { 
                name: 'Dog Style Grooming', role: 'partner', email: 'groom@dogstyle.com', shopLogo: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=100&h=100&fit=crop', specialization: 'Banho e Tosa',
                address: { street: 'Avenida Pedro II', city: 'Paracuru', coordinates: { type: 'Point', coordinates: [-39.0285, -3.4095] } }
            },
            { 
                name: 'Gato Mania', role: 'partner', email: 'gato@gatomania.com', shopLogo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop', specialization: 'Artigos Felinos',
                address: { street: 'Praça da Matriz', city: 'Paracuru', coordinates: { type: 'Point', coordinates: [-39.0300, -3.4125] } }
            },
            { 
                name: 'Reino Animal', role: 'partner', email: 'reino@animal.com.br', shopLogo: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=100&h=100&fit=crop', specialization: 'Petshop Geral',
                address: { street: 'Avenida Principal', city: 'Paracuru', coordinates: { type: 'Point', coordinates: [-39.0270, -3.4130] } }
            },
            { 
                name: 'Pet Shop Alegria', role: 'partner', email: 'alegria@petshop.com', shopLogo: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=100&h=100&fit=crop', specialization: 'Petshop',
                address: { street: 'Rua das Flores', city: 'Paracuru', coordinates: { type: 'Point', coordinates: [-39.0322, -3.4105] } }
            },
            { name: 'Cantinho do Totó', role: 'partner', email: 'toto@cantinho.com', shopLogo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&h=100&fit=crop', specialization: 'Petshop' },
            { name: 'Bicho Mimado', role: 'partner', email: 'bicho@mimado.com', shopLogo: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=100&h=100&fit=crop', specialization: 'Petshop' },
            { name: 'Amigo Fiel', role: 'partner', email: 'amigo@fiel.com', shopLogo: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=100&h=100&fit=crop', specialization: 'Petshop' },
            { name: 'Planeta Pet', role: 'partner', email: 'planeta@pet.com', shopLogo: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=100&h=100&fit=crop', specialization: 'Petshop' },
            { name: 'Espaço Animal', role: 'partner', email: 'espaco@animal.com', shopLogo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop', specialization: 'Petshop' },
            { name: 'Pet Center', role: 'partner', email: 'center@pet.com', shopLogo: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&h=100&fit=crop', specialization: 'Petshop' },
            { name: 'Mania de Cão', role: 'partner', email: 'mania@cao.com', shopLogo: 'https://images.unsplash.com/photo-1581888227599-779811939961?w=100&h=100&fit=crop', specialization: 'Petshop' },

            // Veterinary Clinics (15) - Using unique Unsplash IDs and unique emails
            { 
                name: 'Vila dos Bichos', role: 'partner', email: 'vila@bichos.vet', shopLogo: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=100&h=100&fit=crop', specialization: 'Clínica Veterinária',
                address: { street: 'Rua Antônio Célio', city: 'Paracuru', coordinates: { type: 'Point', coordinates: [-39.0280, -3.4116] } }
            },
            { 
                name: 'Saúde Animal', role: 'partner', email: 'saude@animal.vet', shopLogo: 'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?w=100&h=100&fit=crop', specialization: 'Hospital 24h',
                address: { street: 'Praça de Eventos', city: 'Paracuru', coordinates: { type: 'Point', coordinates: [-39.0305, -3.4102] } }
            },
            { name: 'Dr. Pet Care', role: 'partner', email: 'dr@petcare.vet', shopLogo: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=100&h=100&fit=crop', specialization: 'Veterinária Geral' },
            { name: 'Gato e Sapato', role: 'partner', email: 'sac@gatoesapato.vet', shopLogo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop', specialization: 'Clínica de Felinos' },
            { name: 'Vet Life', role: 'partner', email: 'life@vet.com', shopLogo: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=100&h=100&fit=crop', specialization: 'Clínica Veterinária' },
            { name: 'Centro MedVet', role: 'partner', email: 'centro@medvet.com', shopLogo: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=100&h=100&fit=crop', specialization: 'Clínica Veterinária' },
            { name: 'Pet Health', role: 'partner', email: 'health@pet.vet', shopLogo: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=100&h=100&fit=crop', specialization: 'Hospital Veterinário' },
            { name: 'Clínica Amigo', role: 'partner', email: 'amigo@vet.com', shopLogo: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=100&h=100&fit=crop', specialization: 'Veterinária' },
            { name: 'Hovet Central', role: 'partner', email: 'central@hovet.com', shopLogo: 'https://images.unsplash.com/photo-151673412186-a967f81ad0d7?w=100&h=100&fit=crop', specialization: 'Hospital Veterinário' },
            { name: 'Dr. Bichinho', role: 'partner', email: 'bichinho@dr.vet', shopLogo: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=100&h=100&fit=crop', specialization: 'Clínica Veterinária' },
            { name: 'Vet Care+', role: 'partner', email: 'care@vetplus.com', shopLogo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop', specialization: 'Clínica Veterinária' },
            { name: 'Pet Prime', role: 'partner', email: 'prime@pet.vet', shopLogo: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&h=100&fit=crop', specialization: 'Veterinária' },
            { name: 'Clinicão', role: 'partner', email: 'contato@clinicao.vet', shopLogo: 'https://images.unsplash.com/photo-1581888227599-779811939961?w=100&h=100&fit=crop', specialization: 'Clínica Veterinária' },
            { name: 'Vet & Cia', role: 'partner', email: 'vet@cia.com', shopLogo: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=100&h=100&fit=crop', specialization: 'Veterinária' },
            { name: 'Pata Amiga', role: 'partner', email: 'pata@amiga.vet', shopLogo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&h=100&fit=crop', specialization: 'Clínica Veterinária' },
        ];
        await User.insertMany(mockPartners);
    }

    const query: any = {
        role: 'partner',
        shopLogo: { $exists: true, $nin: [null, ''] }
    };

    if (isClinic) {
        query.specialization = { $regex: /Veterinária|Hospital|Clínica/i };
    } else {
        query.specialization = { $not: { $regex: /Veterinária|Hospital|Clínica/i } };
    }

    const partners = await User.find(query)
        .select('name shopLogo specialization workingHours')
        .limit(15)
        .lean();

    return partners.map((p: any) => ({
        ...p,
        _id: p._id.toString(),
    }));
}

function ensureCount(arr: any[], count: number) {
    if (!arr || arr.length === 0) return [];
    let result = [...arr];
    while (result.length < count) {
        result = [...result, ...arr];
    }
    return result.slice(0, count);
}

export default async function HomePage() {
    const session = await getServerSession(authOptions);

    if (session?.user?.role === 'admin') {
        redirect('/admin');
    }

    if (session?.user?.role === 'partner') {
        redirect('/partner/dashboard');
    }

    const [allFeaturedPartners, allVeterinaryClinics] = await Promise.all([
        getFeaturedPartners(false),
        getFeaturedPartners(true)
    ]);

    // Force exactly 15 items for symmetry and speed synchronization
    const featuredPartners = ensureCount(allFeaturedPartners, 15);
    const veterinaryClinics = ensureCount(allVeterinaryClinics, 15);

    return (
        <div className={styles.homeContainer}>
            {/* Hero Section */}
            <HeroBanner />

            {/* Logged in users get specialized content */}
            {session && (
                <LoggedInHomeContent defaultPartners={featuredPartners} />
            )}

            {/* Everything below is strictly for non-logged-in users */}
            {!session && (
                <>
                    <DynamicHomeContent 
                        defaultPartners={featuredPartners} 
                        defaultClinics={veterinaryClinics} 
                    />

                    {/* CTA Row and Divider - Grouped so they don't get separated by the flex gap */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <div className={styles.ctaRow}>
                            <div className={styles.ctaIconContainer}>
                                <span className={styles.ctaChevron}>&gt;</span>
                            </div>
                            <span className={styles.ctaText}>Faça sua compra agora mesmo!</span>
                        </div>
                        
                        <div className={styles.dividerWrapper}>
                            <hr className={styles.pageDivider} />
                        </div>
                    </div>

                    {/* Juntos Branding Section */}
                    <section className={styles.juntosSection}>
                        <div className={styles.juntosLeft}>
                            <div className={styles.juntosTextContainer}>
                                <span className={styles.juntosPart1}>Juntos<span className={styles.juntosComma}>,</span></span>
                                <span className={styles.juntosPart2}>somos a ClickPet.</span>
                            </div>
                            
                            <div className={styles.ctaRow} style={{ justifyContent: 'flex-start', margin: '0' }}>
                                <div className={styles.ctaIconContainer}>
                                    <span className={styles.ctaChevron}>&gt;</span>
                                </div>
                                <span className={styles.ctaText}>Quero empreender com a ClickPet</span>
                            </div>
                        </div>

                        <div className={styles.juntosRight}>
                            <div className={styles.imageButton}>
                                <Image 
                                    src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=200&h=300&fit=crop" 
                                    alt="Quero comprar" 
                                    fill
                                    sizes="200px"
                                    className={styles.imageButtonFill}
                                />
                                <div className={styles.imageOverlay} />
                                <span className={styles.imageButtonLabel}>Quero comprar</span>
                            </div>
                            <div className={styles.imageButton}>
                                <Image 
                                    src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&h=300&fit=crop" 
                                    alt="Quero vender" 
                                    fill
                                    sizes="200px"
                                    className={styles.imageButtonFill}
                                />
                                <div className={styles.imageOverlay} />
                                <span className={styles.imageButtonLabel}>Quero vender</span>
                            </div>
                            <div className={styles.imageButton}>
                                <Image 
                                    src="https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200&h=300&fit=crop" 
                                    alt="Saiba mais" 
                                    fill
                                    sizes="200px"
                                    className={styles.imageButtonFill}
                                />
                                <div className={styles.imageOverlay} />
                                <span className={styles.imageButtonLabel}>Saiba mais</span>
                            </div>
                        </div>
                    </section>

                    {/* Bottom Banner Section */}
                    <BottomBanner />
                </>
            )}
        </div>
    );
}
