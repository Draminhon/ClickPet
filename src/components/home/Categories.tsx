import Link from 'next/link';
import { Bone, Dribbble, Pill, Bath, Stethoscope, Fish } from 'lucide-react';
import styles from './Categories.module.css';

const categories = [
    { name: 'Rações', icon: Bone, href: '/search?cat=food' },
    { name: 'Brinquedos', icon: Dribbble, href: '/search?cat=toys' },
    { name: 'Farmácia', icon: Pill, href: '/search?cat=pharma' },
    { name: 'Banho', icon: Bath, href: '/search?cat=bath' },
    { name: 'Vet', icon: Stethoscope, href: '/search?cat=vet' },
    { name: 'Aquarismo', icon: Fish, href: '/search?cat=aquarismo' },
];

export default function Categories() {
    return (
        <section className={styles.categories}>
            {categories.map((cat) => (
                <Link href={cat.href} key={cat.name} className={styles.category}>
                    <div className={styles.iconContainer}>
                        <cat.icon size={32} color="var(--text-dark)" />
                    </div>
                    <span className={styles.label}>{cat.name}</span>
                </Link>
            ))}
        </section>
    );
}
