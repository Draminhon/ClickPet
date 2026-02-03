'use client';

import { useState, useEffect } from 'react';
import { Trophy, Gift, TrendingUp, Users, Copy, Check, Star } from 'lucide-react';

interface LoyaltyAccount {
    totalPoints: number;
    currentTier: string;
    lifetimePoints: number;
    tierProgress: number;
    nextTier: string;
}

interface Transaction {
    _id: string;
    points: number;
    type: string;
    description: string;
    createdAt: string;
    balanceAfter: number;
}

export default function LoyaltyPage() {
    const [account, setAccount] = useState<LoyaltyAccount | null>(null);
    const [benefits, setBenefits] = useState<string[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [referralCode, setReferralCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [pointsToRedeem, setPointsToRedeem] = useState(100);

    useEffect(() => {
        fetchLoyaltyData();
        fetchReferralCode();
    }, []);

    const fetchLoyaltyData = async () => {
        try {
            const [loyaltyRes, transactionsRes] = await Promise.all([
                fetch('/api/loyalty'),
                fetch('/api/loyalty/transactions?limit=10'),
            ]);

            const loyaltyData = await loyaltyRes.json();
            const transactionsData = await transactionsRes.json();

            setAccount(loyaltyData.account);
            setBenefits(loyaltyData.benefits);
            setTransactions(transactionsData.transactions);
        } catch (error) {
            console.error('Error fetching loyalty data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReferralCode = async () => {
        try {
            const res = await fetch('/api/referrals');
            const data = await res.json();
            setReferralCode(data.code);
        } catch (error) {
            console.error('Error fetching referral code:', error);
        }
    };

    const handleRedeemPoints = async () => {
        try {
            const res = await fetch('/api/loyalty', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pointsToRedeem }),
            });

            if (res.ok) {
                fetchLoyaltyData();
                alert('Pontos resgatados com sucesso!');
            } else {
                const error = await res.json();
                alert(error.error || 'Erro ao resgatar pontos');
            }
        } catch (error) {
            console.error('Error redeeming points:', error);
            alert('Erro ao resgatar pontos');
        }
    };

    const copyReferralCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando...</p>
                </div>
            </div>
        );
    }

    const tierColors: Record<string, string> = {
        bronze: 'from-orange-400 to-orange-600',
        silver: 'from-gray-300 to-gray-500',
        gold: 'from-yellow-400 to-yellow-600',
        platinum: 'from-purple-400 to-purple-600',
    };

    const tierIcons: Record<string, string> = {
        bronze: '🥉',
        silver: '🥈',
        gold: '🥇',
        platinum: '💎',
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-purple-600" />
                    Programa de Fidelidade
                </h1>

                {/* Tier Card */}
                <div className={`bg-gradient-to-r ${tierColors[account?.currentTier || 'bronze']} rounded-xl shadow-lg p-8 text-white mb-8`}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-white/80 text-sm uppercase tracking-wide">Seu Nível</p>
                            <h2 className="text-4xl font-bold capitalize flex items-center gap-2">
                                {tierIcons[account?.currentTier || 'bronze']} {account?.currentTier}
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="text-white/80 text-sm">Pontos Disponíveis</p>
                            <p className="text-5xl font-bold">{account?.totalPoints || 0}</p>
                        </div>
                    </div>

                    {account?.nextTier !== 'max' && (
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Progresso para {account?.nextTier}</span>
                                <span>{Math.round(account?.tierProgress || 0)}%</span>
                            </div>
                            <div className="w-full bg-white/30 rounded-full h-3">
                                <div
                                    className="bg-white rounded-full h-3 transition-all duration-500"
                                    style={{ width: `${account?.tierProgress || 0}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* Benefits */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5 text-purple-600" />
                            Seus Benefícios
                        </h3>
                        <ul className="space-y-3">
                            {benefits.map((benefit, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Redeem Points */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Gift className="w-5 h-5 text-purple-600" />
                            Resgatar Pontos
                        </h3>
                        <p className="text-gray-600 mb-4">
                            100 pontos = R$ 10,00 de desconto
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantidade de Pontos
                                </label>
                                <input
                                    type="number"
                                    min="100"
                                    step="100"
                                    value={pointsToRedeem}
                                    onChange={(e) => setPointsToRedeem(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Desconto: R$ {(pointsToRedeem * 0.1).toFixed(2)}
                                </p>
                            </div>
                            <button
                                onClick={handleRedeemPoints}
                                disabled={!account || account.totalPoints < pointsToRedeem}
                                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Resgatar Pontos
                            </button>
                        </div>
                    </div>
                </div>

                {/* Referral */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-8 text-white mb-8">
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                        <Users className="w-6 h-6" />
                        Indique e Ganhe!
                    </h3>
                    <p className="text-white/90 mb-4">
                        Compartilhe seu código e ganhe 100 pontos quando seu amigo fizer a primeira compra. Seu amigo ganha 50 pontos!
                    </p>
                    <div className="flex gap-2">
                        <div className="flex-1 bg-white/20 rounded-lg px-4 py-3 font-mono text-xl font-bold">
                            {referralCode}
                        </div>
                        <button
                            onClick={copyReferralCode}
                            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        Histórico de Pontos
                    </h3>
                    <div className="space-y-3">
                        {transactions.map((transaction) => (
                            <div
                                key={transaction._id}
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">{transaction.description}</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-lg font-bold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {transaction.points > 0 ? '+' : ''}{transaction.points}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Saldo: {transaction.balanceAfter}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
