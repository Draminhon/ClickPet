import LoyaltyPoints, { TIER_THRESHOLDS } from '@/models/LoyaltyPoints';
import PointsTransaction from '@/models/PointsTransaction';
import Referral from '@/models/Referral';
import { Types } from 'mongoose';

// Points configuration
const POINTS_PER_REAL = 1; // 1 point per R$1 spent
const POINTS_TO_REAL = 0.1; // 100 points = R$10 (0.1 reais per point)
const REFERRAL_BONUS_REFERRER = 100; // Points for referrer
const REFERRAL_BONUS_REFERRED = 50; // Points for new user

class LoyaltyService {
    /**
     * Get or create loyalty account for user
     */
    async getLoyaltyAccount(userId: string | Types.ObjectId) {
        let account = await LoyaltyPoints.findOne({ userId });

        if (!account) {
            account = await LoyaltyPoints.create({
                userId,
                totalPoints: 0,
                currentTier: 'bronze',
                lifetimePoints: 0,
                tierProgress: 0,
                nextTier: 'silver',
            });
        }

        return account;
    }

    /**
     * Calculate tier based on lifetime points
     */
    calculateTier(lifetimePoints: number): { tier: string; nextTier: string; progress: number } {
        if (lifetimePoints >= TIER_THRESHOLDS.platinum) {
            return { tier: 'platinum', nextTier: 'max', progress: 100 };
        } else if (lifetimePoints >= TIER_THRESHOLDS.gold) {
            const progress = ((lifetimePoints - TIER_THRESHOLDS.gold) / (TIER_THRESHOLDS.platinum - TIER_THRESHOLDS.gold)) * 100;
            return { tier: 'gold', nextTier: 'platinum', progress };
        } else if (lifetimePoints >= TIER_THRESHOLDS.silver) {
            const progress = ((lifetimePoints - TIER_THRESHOLDS.silver) / (TIER_THRESHOLDS.gold - TIER_THRESHOLDS.silver)) * 100;
            return { tier: 'silver', nextTier: 'gold', progress };
        } else {
            const progress = (lifetimePoints / TIER_THRESHOLDS.silver) * 100;
            return { tier: 'bronze', nextTier: 'silver', progress };
        }
    }

    /**
     * Award points for an order
     */
    async awardPointsForOrder(userId: string | Types.ObjectId, orderId: string, orderTotal: number) {
        const points = Math.floor(orderTotal * POINTS_PER_REAL);

        if (points <= 0) return null;

        const account = await this.getLoyaltyAccount(userId);

        // Update points
        account.totalPoints += points;
        account.lifetimePoints += points;

        // Update tier
        const tierInfo = this.calculateTier(account.lifetimePoints);
        account.currentTier = tierInfo.tier as any;
        account.nextTier = tierInfo.nextTier as any;
        account.tierProgress = tierInfo.progress;

        await account.save();

        // Create transaction record
        const transaction = await PointsTransaction.create({
            userId,
            points,
            type: 'earned',
            orderId,
            description: `Pontos ganhos na compra de R$${orderTotal.toFixed(2)}`,
            balanceAfter: account.totalPoints,
        });

        return { account, transaction, pointsEarned: points };
    }

    /**
     * Redeem points for discount
     */
    async redeemPoints(userId: string | Types.ObjectId, pointsToRedeem: number) {
        const account = await this.getLoyaltyAccount(userId);

        if (account.totalPoints < pointsToRedeem) {
            throw new Error('Pontos insuficientes');
        }

        if (pointsToRedeem < 100) {
            throw new Error('Mínimo de 100 pontos para resgatar');
        }

        // Calculate discount value
        const discountValue = pointsToRedeem * POINTS_TO_REAL;

        // Deduct points
        account.totalPoints -= pointsToRedeem;
        await account.save();

        // Create transaction record
        const transaction = await PointsTransaction.create({
            userId,
            points: -pointsToRedeem,
            type: 'redeemed',
            description: `Resgate de ${pointsToRedeem} pontos por R$${discountValue.toFixed(2)}`,
            balanceAfter: account.totalPoints,
        });

        return { account, transaction, discountValue };
    }

    /**
     * Generate unique referral code
     */
    async generateReferralCode(userId: string | Types.ObjectId): Promise<string> {
        const user = await LoyaltyPoints.findOne({ userId });
        const baseCode = `REF${userId.toString().slice(-6).toUpperCase()}`;

        let code = baseCode;
        let counter = 1;

        // Ensure uniqueness
        while (await Referral.findOne({ code })) {
            code = `${baseCode}${counter}`;
            counter++;
        }

        return code;
    }

    /**
     * Create referral
     */
    async createReferral(referrerId: string | Types.ObjectId, referredEmail?: string) {
        const code = await this.generateReferralCode(referrerId);

        const referral = await Referral.create({
            referrerId,
            referredEmail,
            code,
            status: 'pending',
        });

        return referral;
    }

    /**
     * Process referral when new user registers
     */
    async processReferralRegistration(referralCode: string, newUserId: string | Types.ObjectId) {
        const referral = await Referral.findOne({ code: referralCode, status: 'pending' });

        if (!referral) {
            throw new Error('Código de indicação inválido');
        }

        // Update referral
        referral.referredId = newUserId as any;
        referral.status = 'registered';
        await referral.save();

        // Award bonus points to new user
        const newUserAccount = await this.getLoyaltyAccount(newUserId);
        newUserAccount.totalPoints += REFERRAL_BONUS_REFERRED;
        newUserAccount.lifetimePoints += REFERRAL_BONUS_REFERRED;
        await newUserAccount.save();

        await PointsTransaction.create({
            userId: newUserId,
            points: REFERRAL_BONUS_REFERRED,
            type: 'referral',
            description: `Bônus de boas-vindas por indicação`,
            balanceAfter: newUserAccount.totalPoints,
        });

        return referral;
    }

    /**
     * Complete referral when referred user makes first purchase
     */
    async completeReferral(referredUserId: string | Types.ObjectId) {
        const referral = await Referral.findOne({
            referredId: referredUserId,
            status: 'registered',
            orderCompleted: false,
        });

        if (!referral) return null;

        // Award bonus points to referrer
        const referrerAccount = await this.getLoyaltyAccount(referral.referrerId);
        referrerAccount.totalPoints += REFERRAL_BONUS_REFERRER;
        referrerAccount.lifetimePoints += REFERRAL_BONUS_REFERRER;

        // Update tier
        const tierInfo = this.calculateTier(referrerAccount.lifetimePoints);
        referrerAccount.currentTier = tierInfo.tier as any;
        referrerAccount.nextTier = tierInfo.nextTier as any;
        referrerAccount.tierProgress = tierInfo.progress;

        await referrerAccount.save();

        await PointsTransaction.create({
            userId: referral.referrerId,
            points: REFERRAL_BONUS_REFERRER,
            type: 'referral',
            description: `Bônus por indicação bem-sucedida`,
            balanceAfter: referrerAccount.totalPoints,
        });

        // Update referral
        referral.status = 'completed';
        referral.orderCompleted = true;
        referral.pointsAwarded = REFERRAL_BONUS_REFERRER + REFERRAL_BONUS_REFERRED;
        referral.completedAt = new Date();
        await referral.save();

        return referral;
    }

    /**
     * Get points transaction history
     */
    async getTransactionHistory(userId: string | Types.ObjectId, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            PointsTransaction.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            PointsTransaction.countDocuments({ userId }),
        ]);

        return {
            transactions,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get tier benefits description
     */
    getTierBenefits(tier: string) {
        const benefits: Record<string, string[]> = {
            bronze: [
                '1 ponto por R$1 gasto',
                'Resgatar pontos por descontos',
            ],
            silver: [
                '1.2 pontos por R$1 gasto',
                'Frete grátis em pedidos acima de R$50',
                'Acesso a promoções exclusivas',
            ],
            gold: [
                '1.5 pontos por R$1 gasto',
                'Frete grátis em todos os pedidos',
                'Descontos especiais',
                'Prioridade no atendimento',
            ],
            platinum: [
                '2 pontos por R$1 gasto',
                'Frete grátis premium',
                'Descontos VIP',
                'Atendimento prioritário',
                'Brindes exclusivos',
            ],
        };

        return benefits[tier] || benefits.bronze;
    }
}

export default new LoyaltyService();
