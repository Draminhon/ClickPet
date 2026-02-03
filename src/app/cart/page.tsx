"use client";

import Link from 'next/link';
import { Trash2, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
    const { items, removeFromCart, total, clearCart } = useCart();

    if (items.length === 0) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h1 className="section-title">Seu Carrinho</h1>
                <p style={{ color: '#666', marginBottom: '2rem' }}>Seu carrinho está vazio.</p>
                <Link href="/" className="btn btn-primary">
                    <ArrowLeft size={20} style={{ marginRight: '0.5rem' }} />
                    Voltar as compras
                </Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 className="section-title">Seu Carrinho</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    {items.map((item) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid #eee' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{item.title}</h3>
                                <p style={{ fontSize: '0.8rem', color: '#666' }}>{item.shopName}</p>
                                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    {item.quantity}x <strong>R$ {item.price.toFixed(2).replace('.', ',')}</strong>
                                </p>
                            </div>
                            <button
                                onClick={() => removeFromCart(item.id)}
                                style={{ color: '#dc3545', background: 'none', padding: '0.5rem' }}
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={clearCart}
                        style={{ marginTop: '1rem', color: '#666', background: 'none', fontSize: '0.9rem', textDecoration: 'underline' }}
                    >
                        Limpar Carrinho
                    </button>
                </div>

                <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Resumo do Pedido</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Subtotal</span>
                        <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#6CC551' }}>
                        <span>Frete</span>
                        <span>Grátis</span>
                    </div>
                    <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
                        <span>Total</span>
                        <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>

                    <Link href="/checkout" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', textAlign: 'center', display: 'block' }}>
                        Finalizar Compra
                    </Link>
                </div>
            </div>
        </div>
    );
}
