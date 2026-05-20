import { processPartnerPayout } from '@/lib/split-service';
import Order from '@/models/Order';
import User from '@/models/User';
import mongoose from 'mongoose';
import { sendPix } from '@/lib/abacatepay';

// Mock the sendPix function from abacatepay
jest.mock('@/lib/abacatepay', () => ({
    sendPix: jest.fn().mockResolvedValue({ id: 'mock-pix-id-123' }),
    mapPixKeyType: (type: string) => type === 'TELEFONE' ? 'PHONE' : type,
}));

describe('Split Payment Service with 15% commission / 85% pure partner share', () => {
    let partnerId: mongoose.Types.ObjectId;

    beforeEach(async () => {
        jest.clearAllMocks();
        partnerId = new mongoose.Types.ObjectId();

        // Create partner user with CPF Pix Key
        await User.create({
            _id: partnerId,
            name: 'Petshop Central',
            email: 'parceiro@petshop.com',
            role: 'partner',
            pixConfig: {
                key: '123.456.789-10',
                keyType: 'CPF',
            },
        });
    });

    it('should split R$ 20.00 order: partner gets R$ 17.00 pure, sendPix gets R$ 17.80 to absorb fees, clickpet net is R$ 1.40', async () => {
        // Create an approved order
        const order = await Order.create({
            userId: new mongoose.Types.ObjectId(),
            partnerId: partnerId,
            items: [{ title: 'Serviço de Teste', price: 20, quantity: 1 }],
            total: 20.00,
            paymentStatus: 'approved',
            abacatepayBillingId: 'bill_abc123',
            splitStatus: 'pending',
        });

        // Run split service
        const result = await processPartnerPayout(order);

        // Verify return value
        expect(result.success).toBe(true);
        expect(result.splitAmount).toBe(17.00); // 85% of R$ 20.00
        expect(result.platformFee).toBe(3.00); // 15% of R$ 20.00
        expect(result.pixId).toBe('mock-pix-id-123');

        // Verify database updates
        const updatedOrder = await Order.findById(order._id);
        expect(updatedOrder?.splitStatus).toBe('completed');
        expect(updatedOrder?.splitAmount).toBe(17.00);
        expect(updatedOrder?.platformFee).toBe(3.00);
        expect(updatedOrder?.splitPixId).toBe('mock-pix-id-123');

        // Verify sendPix was called with R$ 17.80 (1780 centavos = 1700 partner share + 80 payout fee)
        expect(sendPix).toHaveBeenCalledWith({
            amount: 1780, // R$ 17.80
            pixKey: '12345678910', // Stripped of formatting
            pixKeyType: 'CPF',
            externalId: `split-${order._id}`,
            description: `Repasse pedido #${order._id.toString().slice(-6).toUpperCase()} - ClickPet`,
        });
    });

    it('should skip split if partner share is less than R$ 1.00 (e.g. order of R$ 1.17)', async () => {
        // 85% of R$ 1.17 is R$ 0.9945 (99 centavos) -> Below R$ 1.00 minimum
        const order = await Order.create({
            userId: new mongoose.Types.ObjectId(),
            partnerId: partnerId,
            items: [{ title: 'Barato', price: 1.17, quantity: 1 }],
            total: 1.17,
            paymentStatus: 'approved',
            abacatepayBillingId: 'bill_abc124',
            splitStatus: 'pending',
        });

        const result = await processPartnerPayout(order);

        expect(result.success).toBe(false);
        expect(result.error).toContain('menor que o mínimo de R$ 1,00');
        expect(sendPix).not.toHaveBeenCalled();

        const updatedOrder = await Order.findById(order._id);
        expect(updatedOrder?.splitStatus).toBe('skipped');
    });

    it('should succeed with R$ 1.18 order (partner share is exactly R$ 1.00, sending R$ 1.80)', async () => {
        // 85% of R$ 1.18 is R$ 1.003 (100 centavos) -> Exactly R$ 1.00 minimum
        const order = await Order.create({
            userId: new mongoose.Types.ObjectId(),
            partnerId: partnerId,
            items: [{ title: 'Limite', price: 1.18, quantity: 1 }],
            total: 1.18,
            paymentStatus: 'approved',
            abacatepayBillingId: 'bill_abc125',
            splitStatus: 'pending',
        });

        const result = await processPartnerPayout(order);

        expect(result.success).toBe(true);
        expect(result.splitAmount).toBe(1.00); // 85% of R$ 1.18 is rounded to R$ 1.00
        expect(result.platformFee).toBe(0.18);

        // Should call sendPix with R$ 1.80 (180 centavos = 100 partner share + 80 payout fee)
        expect(sendPix).toHaveBeenCalledWith({
            amount: 180,
            pixKey: '12345678910',
            pixKeyType: 'CPF',
            externalId: `split-${order._id}`,
            description: `Repasse pedido #${order._id.toString().slice(-6).toUpperCase()} - ClickPet`,
        });
    });
});
