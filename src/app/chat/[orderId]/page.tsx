"use client";

import { useState, useEffect, useRef, use } from 'react';
import { useParams } from 'next/navigation';
import { Send, ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ChatPage({ params: paramsPromise }: { params: Promise<{ orderId: string }> }) {
    const params = use(paramsPromise);
    const orderId = params.orderId;
    const { data: session } = useSession();
    const router = useRouter();

    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (orderId) {
            fetchOrder();
            fetchMessages();
            markAsRead();

            // Poll for new messages every 3 seconds
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [orderId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchOrder = () => {
        fetch(`/api/orders/${orderId}`)
            .then(res => res.json())
            .then(data => setOrder(data));
    };

    const fetchMessages = () => {
        fetch(`/api/messages?orderId=${orderId}`)
            .then(res => res.json())
            .then(data => setMessages(data))
            .catch(() => { });
    };

    const markAsRead = () => {
        fetch(`/api/messages?orderId=${orderId}`, {
            method: 'PUT',
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !order) return;

        setLoading(true);

        try {
            const receiverId = session?.user.role === 'partner'
                ? order.userId._id
                : order.partnerId;

            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    receiverId,
                    content: newMessage,
                }),
            });

            if (res.ok) {
                setNewMessage('');
                fetchMessages();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 0', maxWidth: '800px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => router.back()}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                        Chat - Pedido #{orderId.slice(-6)}
                    </h1>
                    {order && (
                        <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                            {session?.user.role === 'partner' ? order.userId?.name : order.partnerId?.name}
                        </p>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '600px' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#999', padding: '3rem' }}>
                            <p>Nenhuma mensagem ainda</p>
                            <p style={{ fontSize: '0.9rem' }}>Inicie a conversa!</p>
                        </div>
                    ) : (
                        messages.map((message) => {
                            const isOwn = message.senderId._id === session?.user.id;
                            return (
                                <div
                                    key={message._id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    <div
                                        style={{
                                            maxWidth: '70%',
                                            padding: '0.8rem 1rem',
                                            borderRadius: '12px',
                                            background: isOwn ? '#6CC551' : '#f0f0f0',
                                            color: isOwn ? 'white' : '#333',
                                        }}
                                    >
                                        {!isOwn && (
                                            <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.3rem', opacity: 0.8 }}>
                                                {message.senderId.name}
                                            </p>
                                        )}
                                        <p style={{ margin: 0, wordBreak: 'break-word' }}>{message.content}</p>
                                        <p style={{ fontSize: '0.7rem', marginTop: '0.3rem', opacity: 0.7, margin: 0 }}>
                                            {new Date(message.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                    onSubmit={handleSend}
                    style={{
                        padding: '1rem',
                        borderTop: '1px solid #eee',
                        display: 'flex',
                        gap: '0.5rem',
                    }}
                >
                    <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        maxLength={1000}
                        style={{
                            flex: 1,
                            padding: '0.8rem',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading || !newMessage.trim()}
                        style={{
                            padding: '0.8rem 1.5rem',
                            background: '#6CC551',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 600,
                        }}
                    >
                        <Send size={18} />
                        Enviar
                    </button>
                </form>
            </div>
        </div>
    );
}
