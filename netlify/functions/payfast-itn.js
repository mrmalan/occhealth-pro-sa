// payfast-itn.js — Instant Transaction Notification webhook from PayFast
// PayFast POSTs here after every payment event (success, cancel, subscription renewal)
// We verify the payment and upgrade the user's Supabase account_type

import crypto from "crypto";

const SANDBOX    = process.env.PAYFAST_SANDBOX !== "false";
const PASSPHRASE = process.env.PAYFAST_PASSPHRASE || "";
const SUPABASE_URL       = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// PayFast sandbox IPs
const VALID_IPS_SANDBOX = ["127.0.0.1", "::1"];
// PayFast production IPs (as of 2024 — check PayFast docs for updates)
const VALID_IPS_PROD = [
  "197.97.145.144", "197.97.145.145", "197.97.145.146", "197.97.145.147",
  "41.74.179.193", "41.74.179.194", "41.74.179.195", "41.74.179.196",
];

function generateSignature(data, passphrase) {
  let pfOutput = "";
  for (const key in data) {
    if (key !== "signature" && data[key] !== "" && data[key] !== undefined) {
      pfOutput += `${key}=${encodeURIComponent(String(data[key]).trim())}&`;
    }
  }
  pfOutput = pfOutput.slice(0, -1);
  if (passphrase && passphrase !== "") {
    pfOutput += `&passphrase=${encodeURIComponent(passphrase.trim())}`;
  }
  return crypto.createHash("md5").update(pfOutput).digest("hex");
}

async function upgradeUser(userId, tier) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn("Supabase credentials not set — cannot upgrade user");
    return false;
  }
  // Update user metadata via Supabase Admin API
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_metadata: {
        account_type: "full",
        subscription_tier: tier || "ohp",
        subscribed_at: new Date().toISOString(),
        onboarding_complete: false, // trigger onboarding wizard
      }
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Supabase upgrade failed:", err);
    return false;
  }
  return true;
}

export async function handler(event) {
  // PayFast sends POST with URL-encoded body
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Respond 200 immediately — PayFast requires this
  // (we process asynchronously below, but Netlify functions are synchronous — just be fast)

  try {
    // Parse URL-encoded body
    const params = new URLSearchParams(event.body);
    const data = {};
    for (const [key, val] of params.entries()) {
      data[key] = val;
    }

    console.log("PayFast ITN received:", {
      payment_status: data.payment_status,
      m_payment_id: data.m_payment_id,
      amount_gross: data.amount_gross,
      custom_str1: data.custom_str1,
      custom_str2: data.custom_str2,
    });

    // 1. Verify IP (skip in sandbox)
    const clientIp = event.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "";
    const validIPs = SANDBOX ? [...VALID_IPS_SANDBOX, ...VALID_IPS_PROD] : VALID_IPS_PROD;
    if (!SANDBOX && !validIPs.includes(clientIp)) {
      console.warn("ITN from unexpected IP:", clientIp);
      // Don't hard-reject — log and continue (PayFast sometimes adds IPs)
    }

    // 2. Verify signature
    const receivedSig = data.signature;
    const expectedSig = generateSignature(data, PASSPHRASE);
    if (receivedSig !== expectedSig) {
      console.error("Signature mismatch. Received:", receivedSig, "Expected:", expectedSig);
      return { statusCode: 200, body: "Signature mismatch — ignored" };
    }

    // 3. Check payment status
    const status = data.payment_status;
    if (status !== "COMPLETE") {
      console.log("Payment not complete, status:", status);
      return { statusCode: 200, body: `Status: ${status} — no action` };
    }

    // 4. Upgrade user in Supabase
    const userId = data.custom_str1;
    const tier   = data.custom_str2 || "ohp";

    if (!userId) {
      console.error("No user_id in custom_str1");
      return { statusCode: 200, body: "No user_id — ignored" };
    }

    const upgraded = await upgradeUser(userId, tier);
    console.log(`User ${userId} upgrade ${upgraded ? "SUCCESS" : "FAILED"}`);

    return { statusCode: 200, body: "OK" };

  } catch (err) {
    console.error("ITN processing error:", err);
    // Always return 200 to PayFast to prevent retry storms
    return { statusCode: 200, body: "Error logged" };
  }
}
