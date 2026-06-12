import dbConnect from './db';
import Product from '@/models/Product';
import Service from '@/models/Service';

/**
 * Check if a partner's subscription is active
 */
export async function isSubscriptionActive(partnerId: string): Promise<boolean> {
    return true;
}

/**
 * Check if a partner can add more products based on their subscription plan
 */
export async function canAddProduct(partnerId: string): Promise<{ allowed: boolean; message?: string; current?: number; limit?: number }> {
    try {
        await dbConnect();
        const currentProductCount = await Product.countDocuments({ partnerId });
        return { allowed: true, current: currentProductCount, limit: -1 };
    } catch (error) {
        console.error('Error checking product limit:', error);
        return { allowed: true, current: 0, limit: -1 };
    }
}

/**
 * Check if a partner can add more services based on their subscription plan
 */
export async function canAddService(partnerId: string): Promise<{ allowed: boolean; message?: string; current?: number; limit?: number }> {
    try {
        await dbConnect();
        const currentServiceCount = await Service.countDocuments({ partnerId });
        return { allowed: true, current: currentServiceCount, limit: -1 };
    } catch (error) {
        console.error('Error checking service limit:', error);
        return { allowed: true, current: 0, limit: -1 };
    }
}

/**
 * Check if a partner has access to a specific feature
 */
export async function hasFeature(partnerId: string, feature: string): Promise<boolean> {
    return true;
}

/**
 * Get subscription details for a partner
 */
export async function getSubscriptionDetails(partnerId: string) {
    return {
        plan: 'enterprise',
        status: 'active',
        isActive: true,
        isExpiringSoon: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 50 * 365 * 24 * 60 * 60 * 1000), // 50 years (permanent)
        features: {
            maxProducts: -1,
            maxServices: -1,
            maxImages: -1, // Unlimited images per product
            hasAnalytics: true,
            hasPrioritySupport: true,
            hasAdvancedReports: true,
        },
        autoRenew: true,
    };
}

/**
 * Get usage statistics for a partner
 */
export async function getUsageStats(partnerId: string) {
    try {
        await dbConnect();
        const [productCount, serviceCount] = await Promise.all([
            Product.countDocuments({ partnerId }),
            Service.countDocuments({ partnerId }),
        ]);

        return {
            products: {
                current: productCount,
                limit: -1,
                percentage: 0,
            },
            services: {
                current: serviceCount,
                limit: -1,
                percentage: 0,
            },
        };
    } catch (error) {
        console.error('Error getting usage stats:', error);
        return {
            products: { current: 0, limit: -1, percentage: 0 },
            services: { current: 0, limit: -1, percentage: 0 },
        };
    }
}
