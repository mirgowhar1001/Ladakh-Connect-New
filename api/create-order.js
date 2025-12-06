import Razorpay from 'razorpay';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, currency = 'INR' } = req.body;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.warn("Razorpay keys missing. Using test mode simulation if needed or failing.");
        // For now, let's fail if keys are missing to prompt user
        // return res.status(500).json({ error: 'Razorpay keys not configured' });
    }

    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RnTtCvZ6xfaVUQ',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'wrIVOk5gRnDhL7TaPOA0zTZs',
    });

    try {
        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency,
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Error creating order', details: error.message });
    }
}
