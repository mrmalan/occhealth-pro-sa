// payfast-create.js — generates a PayFast subscription payment URL
// Called by the app when user clicks "Upgrade to Pro"
// Returns a redirect URL to PayFast's hosted checkout

import crypto from "crypto";

const SANDBOX = process.env.PAYFAST_SANDBOX !== "false"; // default sandbox until explicitly disabled
const PF_HOST = SANDBOX ? "sandbox.payfast.co.za" : "www.payfast.co.za";
const APP_URL = process.env.URL || "https://occhealth-pro-sa.netlify.app";

function generateSignature(data, passphrase) {
  // Build query string in exact field order PayFast requires
  // CRITICAL: field order matters for MD5 signature
  let pfOutput = "";
  for (const key in data) {
    if (data[key] !== "" && data[key] !== undefined && data[key] !== null) {
      pfOutput += `${key}=${encodeURIComponent(String(data[key]).trim())}&`;
    }
  }
  // Remove trailing &
  pfOutput = pfOutput.slice(0, -1);
  // Append passphrase if set
  if (passphrase && passphrase !== "") {
    pfOutput += `&passphrase=${encodeURIComponent(passphrase.trim())}`;
  }
  return crypto.createHash("md5").update(pfOutput).digest("hex");
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { user_id, email, name, tier = "ohp" } = JSON.parse(event.body);

    if (!user_id || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: "user_id and email required" }) };
    }

    const MERCHANT_ID  = process.env.PAYFAST_MERCHANT_ID  || "10000100"; // sandbox default
    const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || "46f0cd694581a";
    const PASSPHRASE   = process.env.PAYFAST_PASSPHRASE   || "";

    const PRICES = {
      ohp:    "1800.00",
      employer: "4200.00",
      bureau: "9500.00",
    };

    const LABELS = {
      ohp:      "OccHealth Pro SA — Independent OHP (monthly)",
      employer: "OccHealth Pro SA — Employer Clinic (monthly)",
      bureau:   "OccHealth Pro SA — Bureau/Network (monthly)",
    };

    const amount = PRICES[tier] || PRICES.ohp;
    const itemName = LABELS[tier] || LABELS.ohp;
    const nameParts = (name || email).split(" ");
    const firstName = nameParts[0] || "";
    const lastName  = nameParts.slice(1).join(" ") || "";

    // Payment data — field order CRITICAL for MD5 signature
    // Must match PayFast's expected order exactly
    const paymentData = {
      // Merchant details
      merchant_id:  MERCHANT_ID,
      merchant_key: MERCHANT_KEY,
      // URLs
      return_url: `${APP_URL}/?payment=success&user_id=${user_id}&tier=${tier}`,
      cancel_url: `${APP_URL}/?payment=cancelled`,
      notify_url: `${APP_URL}/.netlify/functions/payfast-itn`,
      // Buyer details
      name_first:    firstName,
      name_last:     lastName,
      email_address: email,
      // Transaction details
      m_payment_id: `ohp_${user_id}_${Date.now()}`,
      amount:       amount,
      item_name:    itemName,
      item_description: `Monthly subscription — OccHealth Pro SA. Renews automatically.`,
      // Subscription fields
      subscription_type: "1",    // recurring
      billing_date: new Date().toISOString().slice(0, 10), // start today
      recurring_amount: amount,
      frequency: "3",            // monthly
      cycles: "0",               // indefinite
      subscription_notify_email: "true",
      subscription_notify_buyer: "true",
      // Custom data — pass user_id through for ITN
      custom_str1: user_id,
      custom_str2: tier,
      // Confirmation
      email_confirmation: "1",
      confirmation_address: email,
    };

    const signature = generateSignature(paymentData, PASSPHRASE);
    const paymentDataWithSig = { ...paymentData, signature };

    // Build the PayFast checkout URL
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(paymentDataWithSig)) {
      if (val !== "" && val !== undefined && val !== null) {
        params.append(key, String(val));
      }
    }

    const checkoutUrl = `https://${PF_HOST}/eng/process?${params.toString()}`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: checkoutUrl, sandbox: SANDBOX }),
    };
  } catch (err) {
    console.error("payfast-create error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
