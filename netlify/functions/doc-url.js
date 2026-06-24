// doc-url.js — returns a signed download URL for a stored document
// POST { path: "wcl2/WCl2-20260610-Mokoena.pdf" }
// Returns { url: "https://..." }

import { getSignedUrl } from "./_upload_doc.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  try {
    const { path } = JSON.parse(event.body);
    if (!path) return { statusCode: 400, body: "path required" };
    const url = await getSignedUrl(path);
    if (!url) return { statusCode: 404, body: JSON.stringify({ error: "Document not found or storage unavailable" }) };
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}
