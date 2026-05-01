const { google } = require('googleapis');

let cachedAuth = null;
let cachedDrive = null;
const subfolderCache = new Map();

function getAuth() {
  if (cachedAuth) return cachedAuth;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
  const key = rawKey.replace(/\\n/g, '\n');
  cachedAuth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  return cachedAuth;
}

function getDrive() {
  if (cachedDrive) return cachedDrive;
  cachedDrive = google.drive({ version: 'v3', auth: getAuth() });
  return cachedDrive;
}

async function findOrCreateRoleFolder(parentId, roleSlug) {
  const cacheKey = `${parentId}:${roleSlug}`;
  if (subfolderCache.has(cacheKey)) return subfolderCache.get(cacheKey);

  const drive = getDrive();
  const safeName = roleSlug.replace(/[^a-z0-9-]/gi, '');
  const q = `name='${safeName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const list = await drive.files.list({
    q,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: 'allDrives'
  });

  let folderId = list.data.files?.[0]?.id;
  if (!folderId) {
    const created = await drive.files.create({
      requestBody: {
        name: safeName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      },
      fields: 'id',
      supportsAllDrives: true
    });
    folderId = created.data.id;
  }

  subfolderCache.set(cacheKey, folderId);
  return folderId;
}

function sanitizeFileNamePart(s) {
  return String(s || '').replace(/[^a-z0-9-]/gi, '_').slice(0, 60);
}

/**
 * Upload a resume buffer to the Careers Applications folder, under a per-role
 * subfolder. Returns { fileId, webViewLink }.
 */
async function uploadResume({ buffer, fileName, mimeType, role, applicantName }) {
  const parentId = process.env.CAREERS_DRIVE_FOLDER_ID;
  if (!parentId) throw new Error('CAREERS_DRIVE_FOLDER_ID is not set');
  if (!buffer || !buffer.length) throw new Error('Resume buffer is empty');

  const drive = getDrive();
  const roleFolderId = await findOrCreateRoleFolder(parentId, role);

  const ext = (fileName.match(/\.[a-z0-9]+$/i) || [''])[0];
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const finalName = `${ts}-${sanitizeFileNamePart(applicantName)}-${sanitizeFileNamePart(role)}${ext}`;

  const { Readable } = require('stream');
  const stream = Readable.from(buffer);

  const created = await drive.files.create({
    requestBody: {
      name: finalName,
      parents: [roleFolderId]
    },
    media: { mimeType, body: stream },
    fields: 'id, webViewLink',
    supportsAllDrives: true
  });

  return { fileId: created.data.id, webViewLink: created.data.webViewLink };
}

module.exports = { uploadResume };
