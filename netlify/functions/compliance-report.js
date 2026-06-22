import PDFDocument from "pdfkit";

const MM        = 2.8346;
const TEAL      = "#0F6E56";
const TEAL_DARK = "#04342C";
const TEAL_LT   = "#E1F5EE";
const GRAY      = "#6B7280";
const GRAY_LT   = "#F3F4F6";
const RED       = "#DC2626";
const AMBER     = "#D97706";
const WHITE     = "#FFFFFF";
const DARK      = "#111827";

function pct(n) {
  if (n == null || isNaN(n)) return "—";
  return `${Number(n).toFixed(1)}%`;
}
function num(n, fallback = "0") {
  if (n == null || isNaN(n)) return fallback;
  return String(Number(n));
}
function complianceColor(pctVal) {
  const v = Number(pctVal);
  if (isNaN(v)) return GRAY;
  if (v >= 90) return TEAL;
  if (v >= 70) return AMBER;
  return RED;
}

async function generateReport(data) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: "Occupational Health Compliance Report" } });
    doc.on("data", c => chunks.push(c));
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const L = 40;  // left margin
    const R = W - 40; // right edge
    const CW = R - L; // content width

    const {
      employer = {},
      practice = {},
      surveillance = {},
      fitness     = {},
      iod         = {},
      drug        = {},
      period_label = "Last 12 months",
      generated_at = new Date().toISOString(),
    } = data;

    // ── HEADER BAR ──
    doc.rect(0, 0, W, 72).fill(TEAL_DARK);
    doc.rect(0, 72, W, 4).fill(TEAL);

    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(16)
       .text("OCCUPATIONAL HEALTH", L, 18, { lineBreak: false });
    doc.font("Helvetica").fontSize(16)
       .text(" COMPLIANCE REPORT", { lineBreak: false, continued: false });

    doc.font("Helvetica").fontSize(9).fillColor("#9FE1CB")
       .text(`Period: ${period_label}`, L, 40);
    doc.text(`Generated: ${new Date(generated_at).toLocaleDateString("en-ZA", { day:"2-digit", month:"long", year:"numeric" })}`, L, 52);

    // Practice name top right
    if (practice.name) {
      doc.font("Helvetica-Bold").fontSize(10).fillColor(WHITE)
         .text(practice.name, 0, 22, { align: "right", width: W - L });
      doc.font("Helvetica").fontSize(8).fillColor("#9FE1CB")
         .text(practice.practitioner || "", 0, 35, { align: "right", width: W - L });
    }

    let y = 92;

    // ── EMPLOYER INFO BLOCK ──
    doc.rect(L, y, CW, 52).fill(GRAY_LT).stroke(GRAY_LT);
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(13)
       .text(employer.name || "Employer", L + 12, y + 10);
    const empMeta = [
      employer.industry_class && `Industry: ${employer.industry_class}`,
      employer.coida_ref      && `COIDA ref: ${employer.coida_ref}`,
      employer.coida_insurer  && `Insurer: ${(employer.coida_insurer || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`,
    ].filter(Boolean).join("   ·   ");
    doc.font("Helvetica").fontSize(9).fillColor(GRAY)
       .text(empMeta || " ", L + 12, y + 28, { width: CW - 24 });

    y += 64;

    // ── SECTION HELPER ──
    const sectionHeader = (title, yPos) => {
      doc.rect(L, yPos, CW, 22).fill(TEAL).stroke(TEAL);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(WHITE)
         .text(title, L + 10, yPos + 6);
      return yPos + 28;
    };

    // ── KPI ROW HELPER (4 cells) ──
    const kpiRow = (items, yPos) => {
      const cellW = CW / items.length;
      items.forEach((item, i) => {
        const x = L + i * cellW;
        doc.rect(x, yPos, cellW - 2, 52).fill(GRAY_LT).stroke(GRAY_LT);
        doc.font("Helvetica-Bold").fontSize(18).fillColor(item.color || TEAL)
           .text(item.value, x + 8, yPos + 8, { width: cellW - 16, align: "center" });
        doc.font("Helvetica").fontSize(8).fillColor(GRAY)
           .text(item.label, x + 8, yPos + 32, { width: cellW - 16, align: "center" });
      });
      return yPos + 60;
    };

    // ── 1. SURVEILLANCE COMPLIANCE ──
    y = sectionHeader("1. HEALTH SURVEILLANCE COMPLIANCE", y);

    const survPct = Number(surveillance.compliance_pct ?? 0);
    y = kpiRow([
      { label: "Compliance Rate",    value: pct(surveillance.compliance_pct),  color: complianceColor(survPct) },
      { label: "Total Due",          value: num(surveillance.total_due),        color: DARK },
      { label: "Completed",          value: num(surveillance.completed),        color: TEAL },
      { label: "Overdue",            value: num(surveillance.overdue),          color: Number(surveillance.overdue) > 0 ? RED : TEAL },
    ], y);

    // Compliance bar
    const barW = CW - 20;
    doc.rect(L + 10, y, barW, 10).fill("#E5E7EB").stroke("#E5E7EB");
    const fillW = Math.max(0, Math.min(1, survPct / 100)) * barW;
    if (fillW > 0) {
      doc.rect(L + 10, y, fillW, 10).fill(complianceColor(survPct)).stroke(complianceColor(survPct));
    }
    doc.font("Helvetica").fontSize(8).fillColor(GRAY)
       .text(`${pct(surveillance.compliance_pct)} of scheduled surveillance tests completed in period`, L + 10, y + 14);
    y += 32;

    // Test type breakdown if available
    if (Array.isArray(surveillance.by_type) && surveillance.by_type.length > 0) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text("By test type:", L, y); y += 14;
      surveillance.by_type.forEach(t => {
        const tPct = Number(t.compliance_pct ?? 0);
        doc.font("Helvetica").fontSize(9).fillColor(DARK)
           .text(`${(t.test_type || "").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}`, L + 10, y, { width: 140, lineBreak: false });
        doc.fillColor(complianceColor(tPct)).text(`${pct(t.compliance_pct)}`, L + 155, y, { width: 50, lineBreak: false });
        doc.fillColor(GRAY).text(`(${num(t.completed)}/${num(t.total_due)})`, L + 215, y);
        y += 14;
      });
      y += 4;
    }

    y += 8;

    // ── 2. FITNESS CERTIFICATES ──
    y = sectionHeader("2. FITNESS CERTIFICATE STATUS", y);
    y = kpiRow([
      { label: "Current Certs",      value: num(fitness.current),          color: TEAL },
      { label: "Expiring ≤30 days",  value: num(fitness.expiring_30_days), color: Number(fitness.expiring_30_days) > 0 ? AMBER : TEAL },
      { label: "Expired",            value: num(fitness.expired),          color: Number(fitness.expired) > 0 ? RED : TEAL },
      { label: "Total on Record",    value: num(fitness.total_certs),      color: DARK },
    ], y);

    if (Number(fitness.expiring_30_days) > 0) {
      doc.rect(L, y, CW, 18).fill("#FEF3C7").stroke("#FEF3C7");
      doc.font("Helvetica").fontSize(8).fillColor(AMBER)
         .text(`⚠  ${fitness.expiring_30_days} certificate(s) expire within 30 days — schedule renewals promptly.`, L + 8, y + 5);
      y += 24;
    }
    y += 8;

    // ── 3. IOD SUMMARY ──
    y = sectionHeader("3. INJURY ON DUTY (IOD) SUMMARY", y);
    y = kpiRow([
      { label: "Total IODs",         value: num(iod.iod_count),         color: Number(iod.iod_count) > 0 ? AMBER : TEAL },
      { label: "Lost Time Injuries", value: num(iod.lost_time_injuries), color: Number(iod.lost_time_injuries) > 0 ? RED : TEAL },
      { label: "Fatalities",         value: num(iod.fatalities, "0"),   color: Number(iod.fatalities) > 0 ? RED : TEAL },
      { label: "Claims Submitted",   value: num(iod.claims_submitted),  color: DARK },
    ], y);
    y += 8;

    // ── 4. DRUG & ALCOHOL TESTING ──
    y = sectionHeader("4. DRUG & ALCOHOL TESTING", y);
    y = kpiRow([
      { label: "Tests Conducted",    value: num(drug.tests_conducted),   color: DARK },
      { label: "Positive Results",   value: num(drug.positives),         color: Number(drug.positives) > 0 ? RED : TEAL },
      { label: "Positivity Rate",    value: pct(drug.positivity_rate),   color: Number(drug.positivity_rate) > 5 ? RED : TEAL },
      { label: "Refusals",           value: num(drug.refusals),          color: Number(drug.refusals) > 0 ? AMBER : TEAL },
    ], y);
    y += 8;

    // ── SIGN-OFF ──
    // Push to bottom if room, else just append
    const signY = Math.max(y + 20, H - 80);
    doc.rect(0, signY - 8, W, 1).fill("#E5E7EB");
    doc.font("Helvetica").fontSize(8).fillColor(GRAY)
       .text("This report is generated from aggregated data held in OccHealth Pro SA and does not contain individual clinical records.", L, signY, { width: CW });
    doc.text(`Prepared by: ${practice.practitioner || "Occupational Health Practitioner"}  ·  ${practice.name || ""}  ·  SANC/HPCSA registration on file`, L, signY + 12, { width: CW });

    // Signature line
    const sigX = L;
    const sigY2 = signY + 32;
    doc.moveTo(sigX, sigY2 + 14).lineTo(sigX + 160, sigY2 + 14).stroke(DARK);
    doc.font("Helvetica").fontSize(8).fillColor(GRAY).text("Signature / stamp", sigX, sigY2 + 16);

    doc.moveTo(sigX + 200, sigY2 + 14).lineTo(sigX + 360, sigY2 + 14).stroke(DARK);
    doc.text("Date", sigX + 200, sigY2 + 16);

    // OccHealth Pro SA watermark bottom right
    doc.font("Helvetica").fontSize(7).fillColor("#D1D5DB")
       .text("OccHealth Pro SA", 0, H - 16, { align: "right", width: W - L });

    doc.end();
  });
}

export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  try {
    const data = JSON.parse(event.body);
    const pdf  = await generateReport(data);
    const empName = (data.employer?.name || "employer").replace(/[^a-z0-9]/gi, "-").toLowerCase();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="compliance-report-${empName}.pdf"`,
      },
      body: pdf.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
