import { User } from '../../types';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (document.getElementById('razorpay-script')) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = RAZORPAY_SCRIPT_URL;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export const handlePayment = async (
    amount: number,
    user: User,
    onSuccess: (paymentId: string) => void,
    onError: (error: any) => void
) => {
    const res = await loadRazorpayScript();

    if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
    }

    // 1. Create Order
    // 1. Create Order
    try {
        let order;
        try {
            const orderResponse = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }),
            });

            if (!orderResponse.ok) {
                // Check if we are on localhost (Vite dev server doesn't handle /api)
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    console.warn("Backend API not found (likely Vite dev server). Simulating Razorpay flow for testing.");
                    // Mock Order
                    order = {
                        id: 'order_test_' + Date.now(),
                        amount: amount * 100,
                        currency: 'INR'
                    };
                } else {
                    const err = await orderResponse.json();
                    throw new Error(err.error || 'Failed to create order');
                }
            } else {
                order = await orderResponse.json();
            }
        } catch (apiError) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.warn("API Call Failed locally. Simulating.", apiError);
                order = {
                    id: 'order_test_' + Date.now(),
                    amount: amount * 100,
                    currency: 'INR'
                };
            } else {
                throw apiError;
            }
        }

        // 2. Options for Razorpay
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_RnTtCvZ6xfaVUQ', // Public key
            amount: order.amount,
            currency: order.currency,
            name: 'Taxi Booking Ladakh',
            description: 'Wallet Deposit',
            image: '/logo.png', // Ensure this exists or use placeholder
            order_id: order.id,
            handler: async function (response: any) {
                // 3. Verify Payment
                try {
                    // If we mocked the order, we must mock verification too
                    if (order.id.startsWith('order_test_')) {
                        console.log("Simulating Verification Success for Test Order");
                        onSuccess(response.razorpay_payment_id || 'pay_test_' + Date.now());
                        return;
                    }

                    const verifyResponse = await fetch('/api/verify-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });

                    const verifyData = await verifyResponse.json();

                    if (verifyData.status === 'success') {
                        onSuccess(response.razorpay_payment_id);
                    } else {
                        onError(verifyData.message);
                    }
                } catch (error) {
                    onError(error);
                }
            },
            prefill: {
                name: user.name,
                email: 'user@example.com', // We might want to add email to User type
                contact: user.mobile,
            },
            theme: {
                color: '#3399cc',
            },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
    } catch (error) {
        console.error("Payment Error:", error);
        onError(error);
    }
};
