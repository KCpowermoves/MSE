const PIPELINE_ID        = 't5GXCnSn3dyLTJuvhJCV';
const STAGE_PROSPECT     = '9fabf423-3f93-4ae7-ad93-d9eece6e658b'; // Prospect
const STAGE_PAID_DEPOSIT = 'c94ca8b9-f125-4862-bafa-a368ee0a1fe2'; // Customer Paid Deposit

async function ghl(path, body, token) {
  const res = await fetch(`https://services.leadconnectorhq.com${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    // GHL returns existing contactId on duplicate — extract and reuse it
    if (data?.meta?.contactId) return { contact: { id: data.meta.contactId } };
    throw new Error(JSON.stringify(data));
  }
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { firstName, lastName, email, phone, address, utility, units, plan, amountPaid, source } = req.body;
    const token = process.env.GHL_API_TOKEN;
    const isPaid = source === 'pricing-page-payment-complete';

    // 1. Create / upsert contact
    const contactData = await ghl('/contacts/', {
      locationId: process.env.GHL_LOCATION_ID,
      firstName,
      lastName,
      email,
      phone,
      address1: address,
      source: 'Pricing Page',
      tags: isPaid ? ['Paid Deposit', 'Pricing Page'] : ['Pricing Lead', 'Pricing Page'],
      customFields: [
        { key: 'num_of_units', field_value: String(units || '') }
      ]
    }, token);

    const contactId = contactData.contact?.id;
    if (!contactId) throw new Error('No contact ID returned from GHL');

    // 2. Create opportunity in Service Contracts pipeline
    const planLabel = plan === 'zero-cost' ? 'Zero-Cost Tune-Up'
                    : plan === 'standard'  ? 'Standard Tune-Up'
                    : plan === 'premium'   ? 'Total Building Energy Plan'
                    : 'HVAC Tune-Up';

    const oppName = `${planLabel} — ${units} unit${units !== 1 ? 's' : ''} — ${firstName} ${lastName}`;

    await ghl('/opportunities/', {
      pipelineId: PIPELINE_ID,
      pipelineStageId: isPaid ? STAGE_PAID_DEPOSIT : STAGE_PROSPECT,
      contactId,
      name: oppName,
      monetaryValue: amountPaid || 0,
      status: 'open'
    }, token);

    res.json({ success: true, contactId });
  } catch (err) {
    console.error('capture-lead error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
