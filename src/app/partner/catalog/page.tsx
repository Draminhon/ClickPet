"use client";

import { useEffect, useState } from 'react';
import { Plus, Package } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function Catalog() {
    const { data: session } = useSession();
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        if (session?.user?.id) {
            fetch(`/api/products?partnerId=${session.user.id}`)
                .then(res => res.json())
                .then(data => setProducts(data));
        }
    }, [session]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="section-title" style={{ marginBottom: 0 }}>Catálogo de Produtos</h1>
                <Link href="/partner/catalog/new" className="btn btn-primary">
                    <Plus size={20} style={{ marginRight: '0.5rem' }} />
                    Novo Produto
                </Link>
            </div>

            {products.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <Package size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#666' }}>
                        Nenhum produto cadastrado. Comece adicionando seus produtos!
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {products.map(product => (
                        <div key={product._id} style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative' }}>
                            <Link href={`/partner/catalog/edit/${product._id}`} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#6CC551', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
                                Editar
                            </Link>
                            <div style={{ height: '150px', background: '#f0f0f0', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {product.image ? (
                                    <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '2rem' }}>📦</span>
                                )}
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{product.title}</h3>
                            <div>
                                {product.discount > 0 ? (
                                    <>
                                        <p style={{ color: '#6CC551', fontWeight: 800, marginBottom: '0.2rem' }}>
                                            R$ {(product.price * (1 - product.discount / 100)).toFixed(2)}
                                        </p>
                                        <p style={{ fontSize: '0.85rem', color: '#999', textDecoration: 'line-through' }}>
                                            R$ {product.price.toFixed(2)}
                                        </p>
                                        <span style={{ background: '#FFC107', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                            -{product.discount}%
                                        </span>
                                    </>
                                ) : (
                                    <p style={{ color: '#6CC551', fontWeight: 800 }}>R$ {product.price.toFixed(2)}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
