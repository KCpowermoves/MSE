const PIPELINE_ID        = 't5GXCnSn3dyLTJuvhJCV';
const STAGE_PROSPECT     = '9fabf423-3f93-4ae7-ad93-d9eece6e658b'; // Prospect
const STAGE_PAID_DEPOSIT = 'c94ca8b9-f125-4862-bafa-a368ee0a1fe2'; // Customer Paid Deposit

const RESIDENTIAL_PIPELINE_ID = 'Zz4fuPR58XlwuLfJu6lH';
const RESIDENTIAL_STAGE_NEW_LEAD = 'e81087e1-3ffd-4b93-a09f-846357e53da4';

const { appendResidentialLead } = require('./lib/google-sheets');

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

async function handleResidential(req, res) {
  try {
    const { firstName, lastName, email, phone, address, utility, bestTimeToCall } = req.body;
    const token = process.env.GHL_API_TOKEN;
    const locationId = process.env.GHL_LOCATION_ID;

    const contactData = await ghl('/contacts/', {
      locationId,
      firstName,
      lastName,
      email,
      phone,
      address1: address,
      source: 'Pricing Page Residential',
      tags: ['Residential', 'Pricing Page'],
      customFields: [
        { key: 'utility', field_value: String(utility || '') },
        { key: 'best_time_to_call', field_value: String(bestTimeToCall || '') },
        { key: 'customer_type', field_value: 'Residential' }
      ]
    }, token);

    const contactId = contactData.contact?.id;
    if (!contactId) throw new Error('No contact ID returned from GHL');

    const oppName = `${[firstName, lastName].filter(Boolean).join(' ').trim() || 'Residential lead'} — ${utility || 'unknown utility'}`;

    await ghl('/opportunities/', {
      locationId,
      pipelineId: RESIDENTIAL_PIPELINE_ID,
      pipelineStageId: RESIDENTIAL_STAGE_NEW_LEAD,
      contactId,
      name: oppName,
      monetaryValue: 0,
      status: 'open'
    }, token);

    try {
      await appendResidentialLead({ firstName, lastName, email, phone, address, utility, bestTimeToCall });
    } catch (sheetErr) {
      console.error('residential sheet append error:', sheetErr.message);
    }

    res.json({ success: true, contactId });
  } catch (err) {
    console.error('capture-lead residential error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (req.body && req.body.customerType === 'residential') {
    return handleResidential(req, res);
  }

  try {
    const { businessName, firstName, lastName, email, phone, address, utility, units, plan, amountPaid, source } = req.body;
    const token = process.env.GHL_API_TOKEN;
    const locationId = process.env.GHL_LOCATION_ID;
    const isPaid = source === 'pricing-page-payment-complete';

    // 1. Create / upsert contact
    const contactData = await ghl('/contacts/', {
      locationId,
      firstName,
      lastName,
      companyName: businessName,
      email,
      phone,
      address1: address,
      source: 'Pricing Page',
      tags: isPaid ? ['Paid Deposit', 'Pricing Page'] : ['Pricing Lead', 'Pricing Page'],
      customFields: [
        { key: 'num_of_units', field_value: String(units || '') },
        { key: 'utility', field_value: String(utility || '') }
      ]
    }, token);

    const contactId = contactData.contact?.id;
    if (!contactId) throw new Error('No contact ID returned from GHL');

    // 2. Create opportunity in Service Contracts pipeline
    const planLabel = plan === 'zero-cost' ? 'Zero-Cost Tune-Up'
                    : plan === 'standard'  ? 'Standard Tune-Up'
                    : plan === 'premium'   ? 'Total Building Energy Plan'
                    : 'HVAC Tune-Up';

    const businessLabel = (businessName && businessName.trim()) || `${firstName} ${lastName}`.trim();
    const oppName = `${businessLabel} (${units} unit${units !== 1 ? 's' : ''}) — ${planLabel}`;

    await ghl('/opportunities/', {
      locationId,
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
