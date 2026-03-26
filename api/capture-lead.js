module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { firstName, lastName, email, phone, address, utility, units, plan, amountPaid, source } = req.body;

    const tags = source === 'pricing-page-payment-complete'
      ? ['Paid Deposit', 'Pricing Page']
      : ['Pricing Lead', 'Pricing Page'];

    const customFields = [
      { key: 'utility_provider', field_value: utility || '' },
      { key: 'hvac_units',       field_value: String(units || '') },
    ];
    if (plan)       customFields.push({ key: 'selected_plan',   field_value: plan });
    if (amountPaid) customFields.push({ key: 'deposit_amount',  field_value: String(amountPaid) });

    const payload = {
      locationId: process.env.GHL_LOCATION_ID,
      firstName,
      lastName,
      email,
      phone,
      address1: address,
      source,
      tags,
      customFields
    };

    const ghlRes = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_TOKEN}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await ghlRes.json();
    if (!ghlRes.ok) {
      console.error('GHL API error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Failed to create contact in HighLevel' });
    }

    res.json({ success: true, contactId: data.contact?.id });
  } catch (err) {
    console.error('capture-lead error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
