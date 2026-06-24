import PDFDocument from "pdfkit";

const MM        = 2.8346;
const TEAL      = "#0F6E56";
const TEAL_DARK = "#04342C";
const TEAL_LT   = "#E1F5EE";
const TEAL_MID  = "#5DCAA5";
const GRAY      = "#6B7280";
const GRAY_LT   = "#F3F4F6";
const RED       = "#DC2626";
const AMBER     = "#D97706";
const GREEN     = "#16a34a";
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
function gradeColor(grade) {
  if (grade === "A") return TEAL;
  if (grade === "B") return GREEN;
  if (grade === "C") return AMBER;
  return RED;
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function makeSectionHeader(doc, title, L, CW, y, color = TEAL) {
  doc.rect(L, y, CW, 22).fill(color).stroke(color);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(WHITE)
     .text(title, L + 10, y + 6);
  return y + 28;
}

function makeKpiRow(doc, items, L, CW, y) {
  const cellW = CW / items.length;
  items.forEach((item, i) => {
    const x = L + i * cellW;
    doc.rect(x, y, cellW - 2, 52).fill(GRAY_LT).stroke(GRAY_LT);
    doc.font("Helvetica-Bold").fontSize(18).fillColor(item.color || TEAL)
       .text(item.value, x + 8, y + 8, { width: cellW - 16, align: "center" });
    doc.font("Helvetica").fontSize(8).fillColor(GRAY)
       .text(item.label, x + 8, y + 32, { width: cellW - 16, align: "center" });
  });
  return y + 60;
}

function makeComplianceBar(doc, pctVal, L, CW, y) {
  const barW = CW - 20;
  doc.rect(L + 10, y, barW, 10).fill("#E5E7EB").stroke("#E5E7EB");
  const fillW = Math.max(0, Math.min(1, Number(pctVal) / 100)) * barW;
  if (fillW > 0) {
    doc.rect(L + 10, y, fillW, 10).fill(complianceColor(pctVal)).stroke(complianceColor(pctVal));
  }
  return y;
}

// ── OHP internal report (unchanged logic) ─────────────────────────────────────
async function generateReport(data) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: "Occupational Health Compliance Report" } });
    doc.on("data", c => chunks.push(c));
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const L = 40;
    const R = W - 40;
    const CW = R - L;

    const {
      employer = {}, practice = {}, surveillance = {}, fitness = {},
      iod = {}, drug = {}, period_label = "Last 12 months",
      generated_at = new Date().toISOString(),
    } = data;

    // Header
    doc.rect(0, 0, W, 72).fill(TEAL_DARK);
    doc.rect(0, 72, W, 4).fill(TEAL);
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(16)
       .text("OCCUPATIONAL HEALTH", L, 18, { lineBreak: false });
    doc.font("Helvetica").fontSize(16).text(" COMPLIANCE REPORT", { lineBreak: false, continued: false });
    doc.font("Helvetica").fontSize(9).fillColor("#9FE1CB")
       .text(`Period: ${period_label}`, L, 40);
    doc.text(`Generated: ${new Date(generated_at).toLocaleDateString("en-ZA", { day:"2-digit", month:"long", year:"numeric" })}`, L, 52);
    if (practice.name) {
      doc.font("Helvetica-Bold").fontSize(10).fillColor(WHITE)
         .text(practice.name, 0, 22, { align: "right", width: W - L });
      doc.font("Helvetica").fontSize(8).fillColor("#9FE1CB")
         .text(practice.practitioner || "", 0, 35, { align: "right", width: W - L });
    }

    let y = 92;

    // Employer block
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

    // 1. Surveillance
    y = makeSectionHeader(doc, "1. HEALTH SURVEILLANCE COMPLIANCE", L, CW, y);
    const survPct = Number(surveillance.compliance_pct ?? 0);
    y = makeKpiRow(doc, [
      { label: "Compliance Rate", value: pct(surveillance.compliance_pct), color: complianceColor(survPct) },
      { label: "Total Due",       value: num(surveillance.total_due),       color: DARK },
      { label: "Completed",       value: num(surveillance.completed),       color: TEAL },
      { label: "Overdue",         value: num(surveillance.overdue),         color: Number(surveillance.overdue) > 0 ? RED : TEAL },
    ], L, CW, y);
    makeComplianceBar(doc, survPct, L, CW, y);
    doc.font("Helvetica").fontSize(8).fillColor(GRAY)
       .text(`${pct(surveillance.compliance_pct)} of scheduled surveillance tests completed in period`, L + 10, y + 14);
    y += 32;
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

    // 2. Fitness
    y = makeSectionHeader(doc, "2. FITNESS CERTIFICATE STATUS", L, CW, y);
    y = makeKpiRow(doc, [
      { label: "Current Certs",     value: num(fitness.current),          color: TEAL },
      { label: "Expiring ≤30 days", value: num(fitness.expiring_30_days), color: Number(fitness.expiring_30_days) > 0 ? AMBER : TEAL },
      { label: "Expired",           value: num(fitness.expired),          color: Number(fitness.expired) > 0 ? RED : TEAL },
      { label: "Total on Record",   value: num(fitness.total_certs),      color: DARK },
    ], L, CW, y);
    if (Number(fitness.expiring_30_days) > 0) {
      doc.rect(L, y, CW, 18).fill("#FEF3C7").stroke("#FEF3C7");
      doc.font("Helvetica").fontSize(8).fillColor(AMBER)
         .text(`⚠  ${fitness.expiring_30_days} certificate(s) expire within 30 days — schedule renewals promptly.`, L + 8, y + 5);
      y += 24;
    }
    y += 8;

    // 3. IOD
    y = makeSectionHeader(doc, "3. INJURY ON DUTY (IOD) SUMMARY", L, CW, y);
    y = makeKpiRow(doc, [
      { label: "Total IODs",         value: num(iod.iod_count),          color: Number(iod.iod_count) > 0 ? AMBER : TEAL },
      { label: "Lost Time Injuries", value: num(iod.lost_time_injuries),  color: Number(iod.lost_time_injuries) > 0 ? RED : TEAL },
      { label: "Fatalities",         value: num(iod.fatalities, "0"),    color: Number(iod.fatalities) > 0 ? RED : TEAL },
      { label: "Claims Submitted",   value: num(iod.claims_submitted),    color: DARK },
    ], L, CW, y);
    y += 8;

    // 4. Drug
    y = makeSectionHeader(doc, "4. DRUG & ALCOHOL TESTING", L, CW, y);
    y = makeKpiRow(doc, [
      { label: "Tests Conducted",  value: num(drug.tests_conducted),  color: DARK },
      { label: "Positive Results", value: num(drug.positives),        color: Number(drug.positives) > 0 ? RED : TEAL },
      { label: "Positivity Rate",  value: pct(drug.positivity_rate),  color: Number(drug.positivity_rate) > 5 ? RED : TEAL },
      { label: "Refusals",         value: num(drug.refusals),         color: Number(drug.refusals) > 0 ? AMBER : TEAL },
    ], L, CW, y);
    y += 8;

    // Sign-off
    const signY = Math.max(y + 20, H - 80);
    doc.rect(0, signY - 8, W, 1).fill("#E5E7EB");
    doc.font("Helvetica").fontSize(8).fillColor(GRAY)
       .text("This report is generated from aggregated data held in OccHealth Pro SA and does not contain individual clinical records.", L, signY, { width: CW });
    doc.text(`Prepared by: ${practice.practitioner || "Occupational Health Practitioner"}  ·  ${practice.name || ""}  ·  SANC/HPCSA registration on file`, L, signY + 12, { width: CW });
    doc.moveTo(L, signY + 46).lineTo(L + 160, signY + 46).stroke(DARK);
    doc.font("Helvetica").fontSize(8).fillColor(GRAY).text("Signature / stamp", L, signY + 48);
    doc.moveTo(L + 200, signY + 46).lineTo(L + 360, signY + 46).stroke(DARK);
    doc.text("Date", L + 200, signY + 48);
    doc.font("Helvetica").fontSize(7).fillColor("#D1D5DB")
       .text("OccHealth Pro SA", 0, H - 16, { align: "right", width: W - L });

    doc.end();
  });
}

// ── Client pack — cover page + DoL score + full compliance sections ────────────
async function generateClientPack(data) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: "Occupational Health Client Pack" }, autoFirstPage: true });
    doc.on("data", c => chunks.push(c));
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W  = doc.page.width;
    const H  = doc.page.height;
    const L  = 48;
    const R  = W - 48;
    const CW = R - L;

    const {
      employer = {}, practice = {}, surveillance = {}, fitness = {},
      iod = {}, drug = {}, dol_score = {}, period_label = "Last 12 months",
      generated_at = new Date().toISOString(),
    } = data;

    const grade     = dol_score.grade || "—";
    const score     = dol_score.total || 0;
    const breakdown = Array.isArray(dol_score.breakdown) ? dol_score.breakdown : [];
    const gColor    = gradeColor(grade);
    const dateStr   = new Date(generated_at).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });

    // ════════════════════════════════════════════════
    // PAGE 1 — COVER
    // ════════════════════════════════════════════════

    // Full teal-dark background top half
    doc.rect(0, 0, W, H * 0.58).fill(TEAL_DARK);
    // Accent stripe
    doc.rect(0, H * 0.58, W, 5).fill(TEAL_MID);
    // Bottom half white
    doc.rect(0, H * 0.58 + 5, W, H * 0.42 - 5).fill(WHITE);

    // OccHealth Pro SA wordmark
    doc.font("Helvetica").fontSize(11).fillColor(TEAL_MID)
       .text("OccHealth Pro SA", L, 36, { letterSpacing: 1 });

    // Report type label
    doc.font("Helvetica").fontSize(10).fillColor("#9FE1CB")
       .text("OCCUPATIONAL HEALTH CLIENT PACK", L, 64, { characterSpacing: 1.5 });

    // Employer name — large
    doc.font("Helvetica-Bold").fontSize(30).fillColor(WHITE)
       .text(employer.name || "Employer", L, 104, { width: CW, lineBreak: true });

    // Employer meta line
    const empMeta = [
      employer.industry_class,
      employer.coida_ref && `COIDA: ${employer.coida_ref}`,
      employer.coida_insurer && (employer.coida_insurer.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())),
    ].filter(Boolean).join("   ·   ");
    doc.font("Helvetica").fontSize(11).fillColor("#9FE1CB")
       .text(empMeta || " ", L, 158, { width: CW });

    // ── DoL Readiness grade — centred, large ──
    const gradeBoxY = 210;
    const gradeBoxW = 140;
    const gradeBoxH = 140;
    const gradeBoxX = W / 2 - gradeBoxW / 2;

    // Outer circle illusion via filled rect with border
    doc.roundedRect(gradeBoxX, gradeBoxY, gradeBoxW, gradeBoxH, 70)
       .fill("rgba(255,255,255,0.08)");
    doc.roundedRect(gradeBoxX + 4, gradeBoxY + 4, gradeBoxW - 8, gradeBoxH - 8, 66)
       .lineWidth(3).strokeColor(gColor).stroke();

    // Grade letter
    doc.font("Helvetica-Bold").fontSize(68).fillColor(gColor)
       .text(grade, gradeBoxX, gradeBoxY + 24, { width: gradeBoxW, align: "center" });

    // Score below grade
    doc.font("Helvetica-Bold").fontSize(18).fillColor(WHITE)
       .text(`${score}/100`, 0, gradeBoxY + gradeBoxH + 12, { width: W, align: "center" });

    doc.font("Helvetica").fontSize(11).fillColor("#9FE1CB")
       .text("DoL Readiness Score", 0, gradeBoxY + gradeBoxH + 34, { width: W, align: "center" });

    // Readiness descriptor
    const descriptor = score >= 90 ? "Excellent — well-prepared for a DoL inspection."
      : score >= 75 ? "Good — minor gaps to address before an inspection."
      : score >= 60 ? "Fair — attention required before an inspection."
      : "At risk — significant compliance gaps require immediate action.";
    doc.font("Helvetica").fontSize(10).fillColor("#9FE1CB")
       .text(descriptor, L, gradeBoxY + gradeBoxH + 58, { width: CW, align: "center" });

    // ── Bottom white section — period + prepared by ──
    const bottomY = H * 0.58 + 28;
    doc.font("Helvetica-Bold").fontSize(12).fillColor(TEAL_DARK)
       .text("Reporting period", L, bottomY);
    doc.font("Helvetica").fontSize(11).fillColor(DARK)
       .text(period_label, L, bottomY + 16);

    doc.font("Helvetica-Bold").fontSize(12).fillColor(TEAL_DARK)
       .text("Prepared by", L + 200, bottomY);
    doc.font("Helvetica").fontSize(11).fillColor(DARK)
       .text(practice.practitioner || "Occupational Health Practitioner", L + 200, bottomY + 16);
    doc.font("Helvetica").fontSize(10).fillColor(GRAY)
       .text(practice.name || "OccHealth Pro SA", L + 200, bottomY + 30);

    doc.font("Helvetica-Bold").fontSize(12).fillColor(TEAL_DARK)
       .text("Report date", L + 370, bottomY);
    doc.font("Helvetica").fontSize(11).fillColor(DARK)
       .text(dateStr, L + 370, bottomY + 16);

    // Confidentiality footer
    doc.font("Helvetica").fontSize(7.5).fillColor(GRAY)
       .text(
         "CONFIDENTIAL — This pack contains aggregate workforce health compliance data only. No individual clinical records are included. " +
         "Prepared in accordance with POPIA and the National Health Act.",
         L, H - 32, { width: CW }
       );
    doc.font("Helvetica").fontSize(7).fillColor("#D1D5DB")
       .text("OccHealth Pro SA", 0, H - 16, { align: "right", width: W - 48 });

    // ════════════════════════════════════════════════
    // PAGE 2 — DoL READINESS BREAKDOWN + COMPLIANCE SECTIONS
    // ════════════════════════════════════════════════
    doc.addPage();

    // Page header strip
    doc.rect(0, 0, W, 44).fill(TEAL_DARK);
    doc.rect(0, 44, W, 3).fill(TEAL_MID);
    doc.font("Helvetica-Bold").fontSize(12).fillColor(WHITE)
       .text("DoL READINESS BREAKDOWN", L, 14);
    doc.font("Helvetica").fontSize(9).fillColor("#9FE1CB")
       .text(`${employer.name || ""}  ·  ${period_label}`, L, 29);

    let y = 60;

    // Grade summary bar
    doc.rect(L, y, CW, 36).fill(GRAY_LT);
    // Grade badge
    doc.rect(L, y, 52, 36).fill(gColor);
    doc.font("Helvetica-Bold").fontSize(20).fillColor(WHITE)
       .text(grade, L, y + 7, { width: 52, align: "center" });
    doc.font("Helvetica-Bold").fontSize(14).fillColor(TEAL_DARK)
       .text(`${score} / 100`, L + 62, y + 4);
    doc.font("Helvetica").fontSize(10).fillColor(GRAY)
       .text(descriptor, L + 62, y + 20, { width: CW - 80 });
    y += 48;

    // Breakdown rows
    if (breakdown.length > 0) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor(GRAY)
         .text("DIMENSION", L, y, { width: CW * 0.5, lineBreak: false });
      doc.text("SCORE", L + CW * 0.5, y, { width: 60, align: "right", lineBreak: false });
      doc.text("/ MAX", L + CW * 0.5 + 60, y);
      y += 14;
      doc.rect(L, y, CW, 1).fill("#E5E7EB"); y += 6;

      breakdown.forEach(item => {
        const rowColor = item.score >= item.max * 0.9 ? TEAL : item.score >= item.max * 0.7 ? AMBER : RED;
        // Label
        doc.font("Helvetica").fontSize(10).fillColor(DARK)
           .text(item.label, L, y + 2, { width: CW * 0.45, lineBreak: false });
        // Score
        doc.font("Helvetica-Bold").fontSize(10).fillColor(rowColor)
           .text(`${item.score}`, L + CW * 0.5, y + 2, { width: 40, align: "right", lineBreak: false });
        doc.font("Helvetica").fontSize(10).fillColor(GRAY)
           .text(`/ ${item.max}`, L + CW * 0.5 + 42, y + 2, { lineBreak: false });
        // Mini bar
        const barY = y + 15;
        const barFullW = CW * 0.42;
        doc.rect(L, barY, barFullW, 5).fill("#E5E7EB");
        const fill = (item.score / item.max) * barFullW;
        if (fill > 0) doc.rect(L, barY, fill, 5).fill(rowColor);
        if (item.warning) {
          doc.font("Helvetica").fontSize(8).fillColor(AMBER)
             .text(`⚠ ${item.warning}`, L, barY + 8);
          y += 36;
        } else {
          y += 30;
        }
        doc.rect(L, y, CW, 0.5).fill("#F3F4F6"); y += 4;
      });
      y += 12;
    }

    // ── Compliance sections (same as OHP report but on page 2) ──
    const sH = (title, yy) => makeSectionHeader(doc, title, L, CW, yy);
    const kR = (items, yy) => makeKpiRow(doc, items, L, CW, yy);

    // 1. Surveillance
    y = sH("1. HEALTH SURVEILLANCE COMPLIANCE", y);
    const survPct = Number(surveillance.compliance_pct ?? 0);
    y = kR([
      { label: "Compliance Rate", value: pct(surveillance.compliance_pct), color: complianceColor(survPct) },
      { label: "Total Due",       value: num(surveillance.total_due),       color: DARK },
      { label: "Completed",       value: num(surveillance.completed),       color: TEAL },
      { label: "Overdue",         value: num(surveillance.overdue),         color: Number(surveillance.overdue) > 0 ? RED : TEAL },
    ], L, CW, y);
    makeComplianceBar(doc, survPct, L, CW, y);
    doc.font("Helvetica").fontSize(8).fillColor(GRAY)
       .text(`${pct(surveillance.compliance_pct)} of scheduled surveillance tests completed in period`, L + 10, y + 14);
    y += 32;
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

    // Page break check
    if (y > H - 200) { doc.addPage(); y = 40; }

    // 2. Fitness
    y = sH("2. FITNESS CERTIFICATE STATUS", y);
    y = kR([
      { label: "Current Certs",     value: num(fitness.current),          color: TEAL },
      { label: "Expiring ≤30 days", value: num(fitness.expiring_30_days), color: Number(fitness.expiring_30_days) > 0 ? AMBER : TEAL },
      { label: "Expired",           value: num(fitness.expired),          color: Number(fitness.expired) > 0 ? RED : TEAL },
      { label: "Total on Record",   value: num(fitness.total_certs),      color: DARK },
    ], L, CW, y);
    if (Number(fitness.expiring_30_days) > 0) {
      doc.rect(L, y, CW, 18).fill("#FEF3C7").stroke("#FEF3C7");
      doc.font("Helvetica").fontSize(8).fillColor(AMBER)
         .text(`⚠  ${fitness.expiring_30_days} certificate(s) expire within 30 days — schedule renewals promptly.`, L + 8, y + 5);
      y += 24;
    }
    y += 8;

    if (y > H - 160) { doc.addPage(); y = 40; }

    // 3. IOD
    y = sH("3. INJURY ON DUTY (IOD) SUMMARY", y);
    y = kR([
      { label: "Total IODs",         value: num(iod.iod_count),          color: Number(iod.iod_count) > 0 ? AMBER : TEAL },
      { label: "Lost Time Injuries", value: num(iod.lost_time_injuries),  color: Number(iod.lost_time_injuries) > 0 ? RED : TEAL },
      { label: "Fatalities",         value: num(iod.fatalities, "0"),    color: Number(iod.fatalities) > 0 ? RED : TEAL },
      { label: "Claims Submitted",   value: num(iod.claims_submitted),    color: DARK },
    ], L, CW, y);
    y += 8;

    if (y > H - 160) { doc.addPage(); y = 40; }

    // 4. Drug
    y = sH("4. DRUG & ALCOHOL TESTING", y);
    y = kR([
      { label: "Tests Conducted",  value: num(drug.tests_conducted),  color: DARK },
      { label: "Positive Results", value: num(drug.positives),        color: Number(drug.positives) > 0 ? RED : TEAL },
      { label: "Positivity Rate",  value: pct(drug.positivity_rate),  color: Number(drug.positivity_rate) > 5 ? RED : TEAL },
      { label: "Refusals",         value: num(drug.refusals),         color: Number(drug.refusals) > 0 ? AMBER : TEAL },
    ], L, CW, y);
    y += 16;

    // Sign-off block
    if (y > H - 120) { doc.addPage(); y = 40; }
    doc.rect(L, y, CW, 72).fill(GRAY_LT);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(TEAL_DARK)
       .text("OHP DECLARATION", L + 12, y + 10);
    doc.font("Helvetica").fontSize(8.5).fillColor(DARK)
       .text(
         `This report was prepared by ${practice.practitioner || "the Occupational Health Practitioner"} (${practice.name || "OccHealth Pro SA"}) ` +
         `from aggregated occupational health data recorded during the ${period_label.toLowerCase()} period. ` +
         `No individual clinical records are included. Prepared in compliance with POPIA and the National Health Act.`,
         L + 12, y + 26, { width: CW - 24 }
       );
    y += 84;

    doc.moveTo(L, y + 14).lineTo(L + 180, y + 14).stroke(DARK);
    doc.font("Helvetica").fontSize(8).fillColor(GRAY).text("Signature", L, y + 16);
    doc.moveTo(L + 210, y + 14).lineTo(L + 370, y + 14).stroke(DARK);
    doc.text("Date", L + 210, y + 16);

    doc.font("Helvetica").fontSize(7).fillColor("#D1D5DB")
       .text("OccHealth Pro SA", 0, H - 16, { align: "right", width: W - 48 });

    doc.end();
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────
import { uploadDoc } from "./_upload_doc.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const data = JSON.parse(event.body);
    const pdfBuffer = await generateReport(data);
    const isClientPack = data.is_client_pack;
    const prefix = isClientPack ? "ClientPack" : "ComplianceReport";
    const folder = isClientPack ? "client_pack" : "compliance_report";
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,"");
    const nameStr = (data.employer?.name || "employer").slice(0,16).replace(/[^a-z0-9]/gi,"-").toLowerCase();
    const filename = `${prefix}-${dateStr}-${nameStr}.pdf`;
    const storagePath = await uploadDoc(pdfBuffer, folder, filename);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        ...(storagePath ? { "X-Storage-Path": storagePath } : {}),
      },
      body: pdfBuffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("Compliance report error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
