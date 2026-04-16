const mongoose = require('mongoose');

async function testCouponDuplication() {
    const uri = 'mongodb://localhost:27017/clickpet';
    console.log('Connecting to:', uri);
    
    try {
        await mongoose.connect(uri);
        console.log('Connected!');
        
        const db = mongoose.connection.db;
        const CouponCollection = db.collection('coupons');
        
        // 1. Setup two dummy partner IDs
        const partner1 = new mongoose.Types.ObjectId();
        const partner2 = new mongoose.Types.ObjectId();
        const couponCode = 'MULTITENANT_TEST_' + Date.now();

        console.log(`P1: ${partner1}, P2: ${partner2}, Code: ${couponCode}`);

        // 2. Create coupon for Partner 1
        console.log('Creating coupon for P1...');
        await CouponCollection.insertOne({
            code: couponCode,
            partnerId: partner1,
            discount: 10,
            type: 'percentage',
            isActive: true,
            expiresAt: new Date(Date.now() + 86400000)
        });
        console.log('P1 Coupon Created Successfully.');

        // 3. Create SAME coupon for Partner 2
        console.log('Creating SAME coupon for P2...');
        try {
            await CouponCollection.insertOne({
                code: couponCode,
                partnerId: partner2,
                discount: 10,
                type: 'percentage',
                isActive: true,
                expiresAt: new Date(Date.now() + 86400000)
            });
            console.log('P2 Coupon Created Successfully! Multi-tenancy works at DB level.');
        } catch (e) {
            console.error('FAILED to create P2 coupon:', e.message);
            if (e.code === 11000) {
                console.error('Duplicate Key Error Detail:', e.keyPattern);
            }
        }

        // Cleanup
        await CouponCollection.deleteMany({ code: couponCode });
        console.log('Cleanup done.');

    } catch (error) {
        console.error('Global Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

testCouponDuplication();
