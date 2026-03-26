const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { amountCents, metadata } = req.body;

    if (!amountCents || amountCents < 50) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: metadata || {}
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('PaymentIntent error:', err.message);
    res.status(500).json({ error: 'Payment initialization failed. Please try again.' });
  }
};
