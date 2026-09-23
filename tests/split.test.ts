import { processPartnerPayout } from '@/lib/split-service';
import Order from '@/models/Order';
import User from '@/models/User';
import mongoose from 'mongoose';
import { createPixTransfer } from '@/lib/asaas';

// Mock the createPixTransfer function from asaas
jest.mock('@/lib/asaas', () => ({
    createPixTransfer: jest.fn().mockResolvedValue({ id: 'mock-transfer-id-123', status: 'PENDING' }),
    mapPixKeyTypeAsaas: (type: string) => type === 'TELEFONE' ? 'PHONE' : type,
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
            bio: 'Petshop de teste',
            pixConfig: {
                key: '123.456.789-10',
                keyType: 'CPF',
            },
        });
    });

    it('should split R$ 20.00 order: partner gets R$ 17.00 pure, ClickPet keeps R$ 3.00', async () => {
        // Create an approved order
        const order = await Order.create({
            userId: new mongoose.Types.ObjectId(),
            partnerId: partnerId,
            items: [{ title: 'Serviço de Teste', price: 20, quantity: 1 }],
            total: 20.00,
            paymentStatus: 'approved',
            asaasPaymentId: 'pay_abc123',
            splitStatus: 'pending',
        });

        // Run split service
        const result = await processPartnerPayout(order);

        // Verify return value
        expect(result.success).toBe(true);
        expect(result.splitAmount).toBe(17.00); // 85% of R$ 20.00
        expect(result.platformFee).toBe(3.00); // 15% of R$ 20.00
        expect(result.pixId).toBe('mock-transfer-id-123');

        // Verify database updates
        const updatedOrder = await Order.findById(order._id);
        expect(updatedOrder?.splitStatus).toBe('completed');
        expect(updatedOrder?.splitAmount).toBe(17.00);
        expect(updatedOrder?.platformFee).toBe(3.00);
        expect(updatedOrder?.splitPixId).toBe('mock-transfer-id-123');

        // Verify createPixTransfer was called with the pure partner share (no fee inflation)
        expect(createPixTransfer).toHaveBeenCalledWith({
            value: 17.00,
            pixKey: '12345678910', // Stripped of formatting
            pixKeyType: 'CPF',
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
            asaasPaymentId: 'pay_abc124',
            splitStatus: 'pending',
        });

        const result = await processPartnerPayout(order);

        expect(result.success).toBe(false);
        expect(result.error).toContain('menor que o mínimo de R$ 1,00');
        expect(createPixTransfer).not.toHaveBeenCalled();

        const updatedOrder = await Order.findById(order._id);
        expect(updatedOrder?.splitStatus).toBe('skipped');
    });

    it('should succeed with R$ 1.18 order (partner share is exactly R$ 1.00)', async () => {
        // 85% of R$ 1.18 is R$ 1.003 (100 centavos) -> Exactly R$ 1.00 minimum
        const order = await Order.create({
            userId: new mongoose.Types.ObjectId(),
            partnerId: partnerId,
            items: [{ title: 'Limite', price: 1.18, quantity: 1 }],
            total: 1.18,
            paymentStatus: 'approved',
            asaasPaymentId: 'pay_abc125',
            splitStatus: 'pending',
        });

        const result = await processPartnerPayout(order);

        expect(result.success).toBe(true);
        expect(result.splitAmount).toBe(1.00); // 85% of R$ 1.18 is rounded to R$ 1.00
        expect(result.platformFee).toBe(0.18);

        // Should call createPixTransfer with the pure R$ 1.00 partner share
        expect(createPixTransfer).toHaveBeenCalledWith({
            value: 1.00,
            pixKey: '12345678910',
            pixKeyType: 'CPF',
            description: `Repasse pedido #${order._id.toString().slice(-6).toUpperCase()} - ClickPet`,
        });
    });

    it('should send the PIX transfer only once when two callers race on the same order (TOCTOU regression)', async () => {
        const order = await Order.create({
            userId: new mongoose.Types.ObjectId(),
            partnerId: partnerId,
            items: [{ title: 'Corrida', price: 20, quantity: 1 }],
            total: 20.00,
            paymentStatus: 'approved',
            asaasPaymentId: 'pay_race1',
            splitStatus: 'pending',
        });

        // Mimic the real scenario: the ASAAS webhook and the app's
        // check-status polling each fetch their own independent copy of the
        // order before either one has written 'processing' back.
        const orderCopyA = await Order.findById(order._id);
        const orderCopyB = await Order.findById(order._id);

        const [resultA, resultB] = await Promise.all([
            processPartnerPayout(orderCopyA),
            processPartnerPayout(orderCopyB),
        ]);

        // Regardless of which caller "wins", the partner must be paid exactly
        // once — the loser either reports "already in progress" or, if it
        // re-checks after the winner already finished, correctly reflects
        // the single transfer that was sent. Either way, no second transfer.
        expect(createPixTransfer).toHaveBeenCalledTimes(1);
        for (const r of [resultA, resultB]) {
            if (r.pixId) expect(r.pixId).toBe('mock-transfer-id-123');
        }

        const updatedOrder = await Order.findById(order._id);
        expect(updatedOrder?.splitStatus).toBe('completed');
        expect(updatedOrder?.splitAmount).toBe(17.00);
    });
});
