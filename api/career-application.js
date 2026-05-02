const Busboy = require('busboy');
const { validateApplication, getRoleDisplayName } = require('./lib/career-validation');
const { uploadResume } = require('./lib/google-drive');

const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_RESUME_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const fields = {};
    let resumeBuffer = null;
    let resumeFileName = null;
    let resumeMime = null;
    let resumeTooBig = false;
    let resumeBadType = false;

    const bb = Busboy({
      headers: req.headers,
      limits: { fileSize: MAX_RESUME_BYTES, files: 1 }
    });

    bb.on('field', (name, val) => { fields[name] = val; });

    bb.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      if (name !== 'resume') {
        file.resume();
        return;
      }
      if (!ALLOWED_RESUME_MIME.has(mimeType)) {
        resumeBadType = true;
        file.resume();
        return;
      }
      const chunks = [];
      file.on('data', c => chunks.push(c));
      file.on('limit', () => { resumeTooBig = true; });
      file.on('end', () => {
        if (!resumeTooBig && !resumeBadType) {
          resumeBuffer = Buffer.concat(chunks);
          resumeFileName = filename;
          resumeMime = mimeType;
        }
      });
    });

    bb.on('finish', () => resolve({ fields, resumeBuffer, resumeFileName, resumeMime, resumeTooBig, resumeBadType }));
    bb.on('error', reject);
    req.pipe(bb);
  });
}

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
    if (data?.meta?.contactId) return { contact: { id: data.meta.contactId } };
    throw new Error(JSON.stringify(data));
  }
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let parsed;
  try {
    parsed = await parseMultipart(req);
  } catch (e) {
    return res.status(400).json({ error: 'Could not parse the form. Please try again.' });
  }

  const { fields, resumeBuffer, resumeFileName, resumeMime, resumeTooBig, resumeBadType } = parsed;

  if (resumeTooBig) return res.status(413).json({ error: 'Resume is too large (10 MB max).' });
  if (resumeBadType) return res.status(415).json({ error: 'Resume must be a PDF or Word document.' });
  if (!resumeBuffer || !resumeBuffer.length) return res.status(400).json({ error: 'Please attach a resume.' });

  const validation = validateApplication(fields);
  if (!validation.ok) {
    return res.status(400).json({ error: 'Please fix the highlighted fields.', fieldErrors: validation.errors });
  }

  const roleDisplayName = getRoleDisplayName(fields.role);

  let resumeUrl = null;
  let contactId = null;

  try {
    const upload = await uploadResume({
      buffer: resumeBuffer,
      fileName: resumeFileName,
      mimeType: resumeMime,
      role: fields.role,
      applicantName: `${fields.firstName} ${fields.lastName}`
    });
    resumeUrl = upload.webViewLink;
  } catch (err) {
    console.error('career-application: drive upload failed:', err.message);
    return res.status(500).json({ error: 'Resume upload failed. Please try again.' });
  }

  try {
    const token = process.env.GHL_API_TOKEN;
    const locationId = process.env.GHL_LOCATION_ID;
    const pipelineId = process.env.GHL_CAREERS_PIPELINE_ID;
    const stageId = process.env.GHL_CAREERS_STAGE_NEW;

    const contactData = await ghl('/contacts/', {
      locationId,
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      phone: fields.phone,
      source: 'Careers Page',
      tags: ['Career Application', roleDisplayName],
      customFields: [
        { key: 'role_applying_for',      field_value: roleDisplayName },
        { key: 'years_experience',       field_value: String(fields.yearsExperience || '') },
        { key: 'zip_or_county',          field_value: String(fields.zip || '') },
        { key: 'has_md_license',         field_value: String(fields.hasMdLicense || '') },
        { key: 'has_vehicle',            field_value: String(fields.hasVehicle || '') },
        { key: 'comfortable_field_work', field_value: String(fields.comfortableFieldWork || '') },
        { key: 'referral_source',        field_value: String(fields.referralSource || '') },
        { key: 'resume_url',             field_value: resumeUrl || '' },
      ]
    }, token);

    contactId = contactData.contact?.id;
    if (!contactId) throw new Error('No contact ID returned from GHL');

    await ghl('/opportunities/', {
      locationId,
      pipelineId,
      pipelineStageId: stageId,
      contactId,
      name: `${fields.firstName} ${fields.lastName} — ${roleDisplayName}`,
      monetaryValue: 0,
      status: 'open'
    }, token);

    if (fields.tellUsAboutYou) {
      try {
        await ghl(`/contacts/${contactId}/notes`, {
          body: `About the applicant:\n\n${fields.tellUsAboutYou}\n\nResume: ${resumeUrl || '(upload pending)'}`,
          userId: process.env.GHL_USER_ID || undefined
        }, token);
      } catch (noteErr) {
        console.error('career-application: HighLevel note failed:', noteErr.message);
      }
    }
  } catch (err) {
    console.error('career-application: HighLevel push failed:', err.message);
    // Continue — the resume is already saved in Drive.
  }

  return res.status(200).json({ success: true, contactId });
};

module.exports.config = { api: { bodyParser: false } };
