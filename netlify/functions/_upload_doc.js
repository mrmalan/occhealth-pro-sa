// _upload_doc.js — shared helper for uploading generated PDFs to Supabase Storage
// Called by wcl2.js, wcl4.js, drug-test-cert.js, fitness-cert.js, compliance-report.js
// Returns the public storage path (not a signed URL — use getSignedUrl in the app to retrieve)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

/**
 * Upload a PDF buffer to Supabase Storage and return the storage path.
 * @param {Buffer} pdfBuffer
 * @param {string} folder  e.g. "wcl2", "wcl4", "drug_test", "fitness_cert"
 * @param {string} filename  e.g. "WCl2-20260610-Mokoena.pdf"
 * @returns {Promise<string>} storage path e.g. "wcl2/WCl2-20260610-Mokoena.pdf"
 */
export async function uploadDoc(pdfBuffer, folder, filename) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.warn("_upload_doc: Supabase credentials not set — skipping storage upload");
    return null;
  }

  const path = `${folder}/${filename}`;
  const url  = `${SUPABASE_URL}/storage/v1/object/documents/${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/pdf",
      "x-upsert": "true",  // overwrite if same filename
    },
    body: pdfBuffer,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("_upload_doc: Storage upload failed:", err);
    return null;
  }

  return path;
}

/**
 * Get a signed URL for a stored document (valid 1 hour).
 * Called from the app via a Netlify function proxy.
 */
export async function getSignedUrl(path, expiresIn = 3600) {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/documents/${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
}
