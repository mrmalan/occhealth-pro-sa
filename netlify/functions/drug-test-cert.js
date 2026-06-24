import PDFDocument from "pdfkit";

const MM = 2.8346;
const DARK       = "#04342C";
const TEAL       = "#0F6E56";
const TEAL_LIGHT = "#E1F5EE";
const GRAY       = "#6B7280";
const FIELD_BG   = "#F9FAFB";
const WHITE      = "#FFFFFF";
const RED        = "#DC2626";
const RED_LIGHT  = "#FEF2F2";
const GREEN_LIGHT= "#F0FDF4";
const GREEN      = "#15803D";

async function generateDrugTestCert(data) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: "Drug & Alcohol Test Certificate" } });
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const m = 15 * MM;

    // ── Header ────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 22*MM).fill(DARK);
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(13)
       .text(data.practice_name || "OccHealth Pro SA", m, 4.5*MM, { lineBreak: false });
    doc.font("Helvetica").fontSize(8).fillColor("#5DCAA5")
       .text("Occupational Health Services", m, 11*MM, { lineBreak: false });
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(8)
       .text(`Cert No: ${(data.cert_id || "DT-001").slice(0,10).toUpperCase()}`, 0, 4.5*MM, { align: "right", width: W - m, lineBreak: false });
    doc.font("Helvetica").fontSize(7).fillColor("#5DCAA5")
       .text(`Test date: ${data.tested_at || ""}`, 0, 11*MM, { align: "right", width: W - m, lineBreak: false });

    // ── Title bar ─────────────────────────────────────────────────────
    doc.rect(0, 22*MM, W, 10*MM).fill(TEAL);
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(12)
       .text("DRUG & ALCOHOL TEST CERTIFICATE", 0, 24.5*MM, { align: "center", width: W, lineBreak: false });

    // ── Result banner ─────────────────────────────────────────────────
    const result = data.result || "negative";
    const refusal = data.refusal;
    const bannerColor = refusal ? "#111827" : result === "negative" ? GREEN : RED;
    const bannerLabel = refusal ? "REFUSAL TO TEST" : result === "negative" ? "NEGATIVE" : result === "positive" ? "POSITIVE" : result.toUpperCase();
    doc.rect(m, 34*MM, W - 2*m, 14*MM).fill(bannerColor);
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(18)
       .text(bannerLabel, m, 37.5*MM, { align: "center", width: W - 2*m, lineBreak: false });

    let y = 51*MM;

    function sectionHeader(title) {
      doc.rect(m, y, W - 2*m, 7.5*MM).fill(TEAL_LIGHT);
      doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(9)
         .text(title.toUpperCase(), m + 3*MM, y + 1.5*MM, { lineBreak: false });
      y += 9*MM;
    }

    function fieldBox(label, value, x, yPos, w_pts, h_pts = 7*MM) {
      doc.fillColor(GRAY).font("Helvetica").fontSize(6.5)
         .text(label.toUpperCase(), x, yPos, { lineBreak: false });
      doc.rect(x, yPos + 3*MM, w_pts - 1*MM, h_pts).fill(FIELD_BG);
      doc.rect(x, yPos + 3*MM, w_pts - 1*MM, h_pts).strokeColor("#E5E7EB").lineWidth(0.3).stroke();
      doc.fillColor(DARK).font("Helvetica").fontSize(9)
         .text(String(value || ""), x + 1.5*MM, yPos + 4.5*MM, { width: w_pts - 4*MM, lineBreak: false });
    }

    function row(fields) {
      const totalFlex = fields.reduce((s, f) => s + (f.flex || 1), 0);
      const availW = W - 2*m;
      let x = m;
      fields.forEach(f => {
        const fw = (availW * (f.flex || 1)) / totalFlex;
        fieldBox(f.label, f.value || "", x, y, fw, f.h || 7*MM);
        x += fw;
      });
      y += (fields[0]?.h || 7*MM) + 5*MM;
    }

    function checkBox(label, checked) {
      doc.rect(0, 0, 3.5*MM, 3.5*MM).fillAndStroke(checked ? TEAL : WHITE, "#9CA3AF");
      if (checked) {
        doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(7).text("✓", 0.5*MM, 0.2*MM, { lineBreak: false });
      }
      doc.fillColor(DARK).font("Helvetica").fontSize(8).text(label, 5*MM, 0.2*MM, { lineBreak: false });
    }

    // ══ SECTION 1: EMPLOYEE ════════════════════════════════════════════
    sectionHeader("1. Employee details");
    row([
      { label: "Surname",           value: data.person_last_name,  flex: 2 },
      { label: "First names",       value: data.person_first_name, flex: 2 },
      { label: "Employee number",   value: data.employee_number,   flex: 1 },
    ]);
    row([
      { label: "Employer",          value: data.employer_name,     flex: 2 },
      { label: "Job title",         value: data.job_title,         flex: 2 },
      { label: "Site",              value: data.site,              flex: 2 },
    ]);

    // ══ SECTION 2: TEST DETAILS ════════════════════════════════════════
    sectionHeader("2. Test details");
    row([
      { label: "Date of test",      value: data.tested_at?.slice(0,10), flex: 1 },
      { label: "Time of test",      value: data.tested_at?.slice(11,16) || "", flex: 1 },
      { label: "Test location",     value: data.site || data.employer_name || "", flex: 2 },
    ]);
    row([
      { label: "Reason for test",   value: (data.test_reason || "").replace(/_/g," "), flex: 2 },
      { label: "Specimen type",     value: data.specimen_type || "urine",              flex: 1 },
      { label: "Testing device",    value: data.device_brand || "",                    flex: 1 },
      { label: "Device lot number", value: data.device_lot || "",                      flex: 1 },
    ]);

    // Substances tested
    y += 1*MM;
    doc.fillColor(GRAY).font("Helvetica").fontSize(6.5)
       .text("SUBSTANCES TESTED", m, y, { lineBreak: false });
    y += 4*MM;
    const substances = data.substances_tested || ["cannabis", "cocaine", "opiates", "amphetamines"];
    const subCols = 4;
    const subW = (W - 2*m) / subCols;
    substances.forEach((sub, i) => {
      const col = i % subCols;
      const row_i = Math.floor(i / subCols);
      const x = m + col * subW;
      const yy = y + row_i * 6*MM;
      const positive = (data.substances_positive || []).includes(sub);
      doc.rect(x, yy + 0.5*MM, 3*MM, 3*MM)
         .fillAndStroke(positive ? RED : "#15803D", positive ? RED : GREEN);
      doc.fillColor(positive ? RED : DARK).font(positive ? "Helvetica-Bold" : "Helvetica").fontSize(8)
         .text(`${sub.charAt(0).toUpperCase() + sub.slice(1)}${positive ? " ⚠" : " ✓"}`, x + 5*MM, yy, { lineBreak: false });
    });
    y += (Math.ceil(substances.length / subCols)) * 6*MM + 4*MM;

    // ══ SECTION 3: CHAIN OF CUSTODY ════════════════════════════════════
    sectionHeader("3. Chain of custody");
    row([
      { label: "Collector name",       value: data.collector_name || data.practitioner_name || "", flex: 2 },
      { label: "Collector SANC no.",   value: data.collector_sanc || data.sanc_number || "",       flex: 1 },
    ]);
    row([
      { label: "Witness name",         value: data.witness_name || "", flex: 2 },
      { label: "Witness designation",  value: data.witness_title || "Supervisor", flex: 1 },
    ]);

    // Consent
    y += 1*MM;
    const consentBg = data.consent_given ? GREEN_LIGHT : RED_LIGHT;
    const consentColor = data.consent_given ? GREEN : RED;
    doc.rect(m, y, W - 2*m, 8*MM).fill(consentBg);
    doc.fillColor(consentColor).font("Helvetica-Bold").fontSize(9)
       .text(data.consent_given ? "✓  Employee gave informed consent prior to testing" : "⚠  Employee consent was NOT obtained", m + 3*MM, y + 2*MM, { lineBreak: false });
    y += 11*MM;

    // Refusal
    if (data.refusal) {
      doc.rect(m, y, W - 2*m, data.refusal_reason ? 14*MM : 8*MM).fill(RED_LIGHT);
      doc.fillColor(RED).font("Helvetica-Bold").fontSize(9)
         .text("⚠  EMPLOYEE REFUSED TO SUBMIT TO TESTING", m + 3*MM, y + 2*MM, { lineBreak: false });
      if (data.refusal_reason) {
        doc.fillColor(DARK).font("Helvetica").fontSize(8)
           .text(`Reason: ${data.refusal_reason}`, m + 3*MM, y + 7*MM, { lineBreak: false });
      }
      y += data.refusal_reason ? 18*MM : 12*MM;
    }

    // ══ SECTION 4: RESULT SUMMARY ══════════════════════════════════════
    sectionHeader("4. Result & declaration");
    const resultBg = result === "negative" ? GREEN_LIGHT : RED_LIGHT;
    const resultColor = result === "negative" ? GREEN : RED;
    doc.rect(m, y, W - 2*m, 10*MM).fill(resultBg);
    doc.fillColor(resultColor).font("Helvetica-Bold").fontSize(11)
       .text(`RESULT: ${bannerLabel}`, m + 3*MM, y + 2.5*MM, { lineBreak: false });
    y += 13*MM;

    row([
      { label: "Practitioner name",    value: data.practitioner_name || "", flex: 2 },
      { label: "Qualification",        value: data.qualification || "",     flex: 1 },
      { label: "SANC number",          value: data.sanc_number || "",       flex: 1 },
    ]);

    // Declaration text — BEFORE signature lines
    doc.rect(m, y, W - 2*m, 10*MM).fill(FIELD_BG);
    doc.rect(m, y, W - 2*m, 10*MM).strokeColor("#E5E7EB").lineWidth(0.3).stroke();
    doc.fillColor(DARK).font("Helvetica").fontSize(8)
       .text("I certify that the specimen was collected and tested in accordance with chain-of-custody procedures", m + 2*MM, y + 1.5*MM, { lineBreak: false });
    doc.text("and that the result stated above is accurate to the best of my knowledge.", m + 2*MM, y + 6*MM, { lineBreak: false });
    y += 15*MM;

    // Signature lines — AFTER declaration with clear space
    y += 6*MM;
    const sigColW = (W - 2*m) / 3;
    ["Collector signature", "Witness signature", "Employee signature"].forEach((label, i) => {
      const x = m + i * sigColW;
      doc.moveTo(x + 2*MM, y).lineTo(x + sigColW - 4*MM, y)
         .strokeColor(DARK).lineWidth(0.5).stroke();
      doc.fillColor(GRAY).font("Helvetica").fontSize(7)
         .text(label, x + 2*MM, y + 2*MM, { lineBreak: false });
    });
    y += 14*MM;

    // CCMA note
    doc.rect(m, y, W - 2*m, 8*MM).fill(TEAL_LIGHT);
    doc.fillColor(TEAL).font("Helvetica").fontSize(7)
       .text("This certificate constitutes a legally defensible chain-of-custody document for CCMA and Labour Court proceedings. Retain for a minimum of 5 years.", m + 2*MM, y + 2*MM, { width: W - 2*m - 4*MM, lineBreak: false });

    // ── Footer ────────────────────────────────────────────────────────
    doc.rect(0, H - 12*MM, W, 12*MM).fill(DARK);
    doc.fillColor(WHITE).font("Helvetica").fontSize(7)
       .text("Drug & Alcohol Test Certificate · Generated by OccHealth Pro SA · POPIA compliant", m, H - 8*MM, { lineBreak: false });
    doc.text(new Date().toLocaleDateString("en-ZA"), 0, H - 8*MM, { align: "right", width: W - m, lineBreak: false });

    doc.end();
  });
}

import { uploadDoc } from "./_upload_doc.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const data = JSON.parse(event.body);
    const pdfBuffer = await generateDrugTestCert(data);
    const dateStr = (data.tested_at ? data.tested_at.slice(0,10) : new Date().toISOString().slice(0,10)).replace(/-/g,"");
    const nameStr = (data.employee_last_name || data.person_last_name || "unknown").slice(0,12).replace(/[^a-z0-9]/gi,"-");
    const filename = `DrugTest-${dateStr}-${nameStr}.pdf`;
    const storagePath = await uploadDoc(pdfBuffer, "drug_test", filename);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        ...(storagePath ? { "X-Storage-Path": storagePath } : {}),
      },
      body: pdfBuffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("Drug test cert error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
