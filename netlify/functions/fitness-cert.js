import PDFDocument from "pdfkit";

const MM = 2.8346; // points per mm

const TEAL      = "#0F6E56";
const TEAL_LIGHT= "#E1F5EE";
const DARK      = "#04342C";
const GRAY      = "#6B7280";
const FIELD_BG  = "#F3F4F6";
const BLUE      = "#1D6FA4";
const BLUE_LIGHT= "#EFF6FF";
const WHITE     = "#FFFFFF";

const STATUS_COLORS = {
  fit:                  TEAL,
  fit_with_restrictions: BLUE,
  temporarily_unfit:    "#DC2626",
  permanently_unfit:    "#111827",
};
const STATUS_LABELS = {
  fit:                  "FIT FOR DUTY",
  fit_with_restrictions:"FIT WITH RESTRICTIONS",
  temporarily_unfit:    "TEMPORARILY UNFIT",
  permanently_unfit:    "PERMANENTLY UNFIT",
};

function hex(col) {
  return col; // pdfkit accepts hex strings directly
}

async function generateCert(data) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: "Certificate of Fitness" } });
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;   // 595 pts
    const H = doc.page.height;  // 842 pts

    const m = 15 * MM;          // left/right margin

    // ── Header bar ───────────────────────────────────────────────────
    doc.rect(0, 0, W, 28 * MM).fill(DARK);
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(14)
       .text(data.practice_name || "OccHealth Pro SA", m, 8 * MM, { lineBreak: false });
    doc.fillColor("#5DCAA5").font("Helvetica").fontSize(9)
       .text("CERTIFICATE OF FITNESS", m, 16 * MM, { lineBreak: false });
    doc.fillColor(WHITE).font("Helvetica").fontSize(8)
       .text(`Cert No: ${(data.cert_id || "FC-001").slice(0,8).toUpperCase()}`, 0, 8 * MM, { align: "right", width: W - m, lineBreak: false });
    doc.text(`Issued: ${data.valid_from || ""}`, 0, 16 * MM, { align: "right", width: W - m, lineBreak: false });

    // ── Status banner ────────────────────────────────────────────────
    const status = data.fitness_status || "fit";
    const bannerY = 30 * MM;
    doc.rect(m, bannerY, W - 2*m, 16 * MM).fill(STATUS_COLORS[status] || TEAL);
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(16)
       .text(STATUS_LABELS[status] || status.toUpperCase(), m, bannerY + 4.5*MM, { align: "center", width: W - 2*m, lineBreak: false });

    let y = 52 * MM;

    // ── Section title ────────────────────────────────────────────────
    function sectionTitle(title) {
      doc.rect(m, y, W - 2*m, 8 * MM).fill(TEAL_LIGHT);
      doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(10)
         .text(title.toUpperCase(), m + 3*MM, y + 2*MM, { lineBreak: false });
      y += 10 * MM;
    }

    // ── Two-column field row ─────────────────────────────────────────
    function fieldRow(pairs) {
      // pairs: [{label, value}, ...]  evenly distributed
      const colW = (W - 2*m) / pairs.length;
      pairs.forEach((p, i) => {
        const x = m + i * colW;
        doc.fillColor(GRAY).font("Helvetica").fontSize(7)
           .text(p.label.toUpperCase(), x, y, { lineBreak: false });
        doc.rect(x, y + 3.5*MM, colW - 2*MM, 6.5*MM).fill(FIELD_BG);
        doc.fillColor(DARK).font("Helvetica").fontSize(9)
           .text(p.value || "—", x + 2*MM, y + 5*MM, { lineBreak: false, width: colW - 6*MM });
      });
      y += 13 * MM;
    }

    // ── Employee details ─────────────────────────────────────────────
    sectionTitle("Employee details");
    fieldRow([
      { label: "Full name",       value: data.person_name },
      { label: "Employee number", value: data.employee_number },
    ]);
    fieldRow([
      { label: "Employer",        value: data.employer_name },
      { label: "Job title / role",value: data.role_category },
    ]);
    fieldRow([
      { label: "Date of birth",   value: data.date_of_birth },
      { label: "Site / location", value: data.site },
    ]);

    // ── Certificate validity ─────────────────────────────────────────
    y += 4 * MM;
    sectionTitle("Certificate validity");
    fieldRow([
      { label: "From",            value: data.valid_from },
      { label: "To",              value: data.valid_until },
      { label: "Validity period", value: data.validity_period || "12 months" },
    ]);

    // ── Restrictions ─────────────────────────────────────────────────
    y += 2 * MM;
    sectionTitle("Restrictions & conditions");
    const restrictions = data.restrictions || [];
    if (restrictions.length > 0) {
      const boxH = restrictions.length * 7 * MM + 4 * MM;
      doc.rect(m, y, W - 2*m, boxH).fill(BLUE_LIGHT);
      restrictions.forEach((r, i) => {
        doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(9)
           .text(`• ${r}`, m + 3*MM, y + 2*MM + i * 7*MM, { lineBreak: false });
      });
      y += boxH + 4 * MM;
    } else {
      doc.rect(m, y, W - 2*m, 8 * MM).fill(TEAL_LIGHT);
      doc.fillColor(TEAL).font("Helvetica").fontSize(9)
         .text("No restrictions — unrestricted duty", m + 3*MM, y + 2*MM, { lineBreak: false });
      y += 12 * MM;
    }

    // ── Notes ────────────────────────────────────────────────────────
    const notes = data.notes || "";
    if (notes) {
      y += 3 * MM;
      sectionTitle("Clinical notes");
      doc.rect(m, y, W - 2*m, 22 * MM).fill(FIELD_BG);
      doc.fillColor(DARK).font("Helvetica").fontSize(10)
         .text(notes, m + 3*MM, y + 3*MM, { width: W - 2*m - 6*MM, height: 18*MM, lineBreak: true });
      y += 26 * MM;
    }

    // ── Practitioner ─────────────────────────────────────────────────
    y += 6 * MM;
    sectionTitle("Examining practitioner");
    fieldRow([
      { label: "Full name",    value: data.practitioner_name },
      { label: "Qualification",value: data.qualification },
    ]);
    fieldRow([
      { label: "SANC number",  value: data.sanc_number },
      { label: "Date signed",  value: data.signed_at },
    ]);

    // ── Signature line ───────────────────────────────────────────────
    y += 8 * MM;
    doc.moveTo(m, y).lineTo(80 * MM, y).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(GRAY).font("Helvetica").fontSize(7)
       .text("Authorised signature", m, y + 2*MM, { lineBreak: false });

    // Stamp box
    doc.rect(W - 55*MM, y - 20*MM, 40*MM, 22*MM).strokeColor(GRAY).lineWidth(0.5).stroke();
    doc.fillColor(GRAY).font("Helvetica").fontSize(7)
       .text("PRACTICE STAMP", W - 55*MM, y - 10*MM, { width: 40*MM, align: "center", lineBreak: false });

    // ── Footer ───────────────────────────────────────────────────────
    doc.rect(0, H - 12*MM, W, 12*MM).fill(DARK);
    doc.fillColor(WHITE).font("Helvetica").fontSize(7)
       .text("This certificate is issued in terms of the Occupational Health and Safety Act (OHSA) 85 of 1993.", m, H - 8*MM, { lineBreak: false });
    doc.text("OccHealth Pro SA · POPIA compliant", 0, H - 8*MM, { align: "right", width: W - m, lineBreak: false });

    doc.end();
  });
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const data = JSON.parse(event.body);
    const pdfBuffer = await generateCert(data);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="fitness-cert-${(data.cert_id || "cert").slice(0,8)}.pdf"`,
      },
      body: pdfBuffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("Fitness cert error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
