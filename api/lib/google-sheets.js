const { google } = require('googleapis');

let cachedAuth = null;

function getAuth() {
  if (cachedAuth) return cachedAuth;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
  const key = rawKey.replace(/\\n/g, '\n');
  cachedAuth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  return cachedAuth;
}

function pickResidentialSheet(utility) {
  if (utility === 'BGE') {
    return { id: process.env.RESIDENTIAL_SHEET_BRYAN, partner: 'Bryan Mechanical Services' };
  }
  if (utility === 'Pepco' || utility === 'Delmarva Power') {
    return { id: process.env.RESIDENTIAL_SHEET_AGHS, partner: 'Advanced Green Home Solutions' };
  }
  return { id: process.env.RESIDENTIAL_SHEET_WAITLIST, partner: 'Waitlist - no partner' };
}

async function appendResidentialLead(payload) {
  const { id: spreadsheetId, partner } = pickResidentialSheet(payload.utility);
  if (!spreadsheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    console.warn(`Sheet append skipped (utility=${payload.utility}, sheetId set=${!!spreadsheetId}, auth set=${!!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL})`);
    return { skipped: true };
  }
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  const row = [
    new Date().toISOString(),
    payload.firstName || '',
    payload.lastName || '',
    payload.email || '',
    payload.phone || '',
    payload.address || '',
    payload.utility || '',
    payload.bestTimeToCall || '',
    partner,
    ''
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A:J',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] }
  });
  return { spreadsheetId, partner };
}

module.exports = { appendResidentialLead };
