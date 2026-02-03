import dbConnect from './db';
import Subscription from '@/models/Subscription';
import Product from '@/models/Product';
import Service from '@/models/Service';

/**
 * Check if a partner's subscription is active
 */
export async function isSubscriptionActive(partnerId: string): Promise<boolean> {
    try {
        await dbConnect();
        const subscription = await Subscription.findOne({ partnerId });

        if (!subscription) {
            return false;
        }

        return subscription.isActive();
    } catch (error) {
        console.error('Error checking subscription status:', error);
        return false;
    }
}

/**
 * Check if a partner can add more products based on their subscription plan
 */
export async function canAddProduct(partnerId: string): Promise<{ allowed: boolean; message?: string; current?: number; limit?: number }> {
    try {
        await dbConnect();
        const subscription = await Subscription.findOne({ partnerId });

        if (!subscription) {
            return { allowed: false, message: 'Nenhuma assinatura encontrada' };
        }

        if (!subscription.isActive()) {
            return { allowed: false, message: 'Assinatura inativa ou expirada' };
        }

        const maxProducts = subscription.features.maxProducts;

        // -1 means unlimited
        if (maxProducts === -1) {
            return { allowed: true };
        }

        const currentProductCount = await Product.countDocuments({ partnerId });

        if (currentProductCount >= maxProducts) {
            return {
                allowed: false,
                message: `Limite de produtos atingido. Seu plano permite até ${maxProducts} produtos.`,
                current: currentProductCount,
                limit: maxProducts
            };
        }

        return { allowed: true, current: currentProductCount, limit: maxProducts };
    } catch (error) {
        console.error('Error checking product limit:', error);
        return { allowed: false, message: 'Erro ao verificar limite de produtos' };
    }
}

/**
 * Check if a partner can add more services based on their subscription plan
 */
export async function canAddService(partnerId: string): Promise<{ allowed: boolean; message?: string; current?: number; limit?: number }> {
    try {
        await dbConnect();
        const subscription = await Subscription.findOne({ partnerId });

        if (!subscription) {
            return { allowed: false, message: 'Nenhuma assinatura encontrada' };
        }

        if (!subscription.isActive()) {
            return { allowed: false, message: 'Assinatura inativa ou expirada' };
        }

        const maxServices = subscription.features.maxServices;

        // -1 means unlimited
        if (maxServices === -1) {
            return { allowed: true };
        }

        const currentServiceCount = await Service.countDocuments({ partnerId });

        if (currentServiceCount >= maxServices) {
            return {
                allowed: false,
                message: `Limite de serviços atingido. Seu plano permite até ${maxServices} serviços.`,
                current: currentServiceCount,
                limit: maxServices
            };
        }

        return { allowed: true, current: currentServiceCount, limit: maxServices };
    } catch (error) {
        console.error('Error checking service limit:', error);
        return { allowed: false, message: 'Erro ao verificar limite de serviços' };
    }
}

/**
 * Check if a partner has access to a specific feature
 */
export async function hasFeature(partnerId: string, feature: string): Promise<boolean> {
    try {
        await dbConnect();
        const subscription = await Subscription.findOne({ partnerId });

        if (!subscription || !subscription.isActive()) {
            return false;
        }

        // Check if feature exists in subscription features
        if (feature in subscription.features) {
            return subscription.features[feature] === true || subscription.features[feature] === -1;
        }

        return false;
    } catch (error) {
        console.error('Error checking feature access:', error);
        return false;
    }
}

/**
 * Get subscription details for a partner
 */
export async function getSubscriptionDetails(partnerId: string) {
    try {
        await dbConnect();
        const subscription = await Subscription.findOne({ partnerId });

        if (!subscription) {
            return null;
        }

        return {
            plan: subscription.plan,
            status: subscription.status,
            isActive: subscription.isActive(),
            isExpiringSoon: subscription.isExpiringSoon(),
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            features: subscription.features,
            autoRenew: subscription.autoRenew,
        };
    } catch (error) {
        console.error('Error getting subscription details:', error);
        return null;
    }
}

/**
 * Get usage statistics for a partner
 */
export async function getUsageStats(partnerId: string) {
    try {
        await dbConnect();
        const subscription = await Subscription.findOne({ partnerId });

        if (!subscription) {
            return null;
        }

        const [productCount, serviceCount] = await Promise.all([
            Product.countDocuments({ partnerId }),
            Service.countDocuments({ partnerId }),
        ]);

        return {
            products: {
                current: productCount,
                limit: subscription.features.maxProducts,
                percentage: subscription.features.maxProducts === -1 ? 0 : (productCount / subscription.features.maxProducts) * 100,
            },
            services: {
                current: serviceCount,
                limit: subscription.features.maxServices,
                percentage: subscription.features.maxServices === -1 ? 0 : (serviceCount / subscription.features.maxServices) * 100,
            },
        };
    } catch (error) {
        console.error('Error getting usage stats:', error);
        return null;
    }
}
