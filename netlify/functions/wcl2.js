import PDFDocument from "pdfkit";

const MM = 2.8346;
const DARK      = "#04342C";
const TEAL      = "#0F6E56";
const TEAL_LIGHT= "#E1F5EE";
const GRAY      = "#6B7280";
const FIELD_BG  = "#F9FAFB";
const WHITE     = "#FFFFFF";
const RED       = "#DC2626";
const RED_LIGHT = "#FEF2F2";

async function generateWCL2(data) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: "W.Cl.2 Employer Report of Accident" } });
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const m = 15 * MM;

    // ── Government header ─────────────────────────────────────────────
    doc.rect(0, 0, W, 22 * MM).fill(DARK);
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(11)
       .text("REPUBLIC OF SOUTH AFRICA", m, 4 * MM, { lineBreak: false });
    doc.font("Helvetica").fontSize(8).fillColor("#5DCAA5")
       .text("Department of Employment and Labour · Compensation Fund", m, 10 * MM, { lineBreak: false });
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(9)
       .text("W.Cl.2", 0, 4 * MM, { align: "right", width: W - m, lineBreak: false });
    doc.font("Helvetica").fontSize(7).fillColor("#5DCAA5")
       .text("EMPLOYER'S REPORT OF AN ACCIDENT", 0, 10 * MM, { align: "right", width: W - m, lineBreak: false });

    // ── Form title ────────────────────────────────────────────────────
    doc.rect(0, 22 * MM, W, 10 * MM).fill(TEAL);
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(11)
       .text("EMPLOYER'S REPORT OF AN ACCIDENT", 0, 24.5 * MM, { align: "center", width: W, lineBreak: false });

    // ── Legal notice ──────────────────────────────────────────────────
    doc.rect(m, 34 * MM, W - 2*m, 8 * MM).fill(RED_LIGHT);
    doc.fillColor(RED).font("Helvetica-Bold").fontSize(7)
       .text("IMPORTANT: ", m + 2*MM, 36*MM, { continued: true, lineBreak: false });
    doc.font("Helvetica").fillColor(DARK)
       .text("This form must be submitted to the Compensation Fund within 7 days of the accident. Failure to report is an offence under the Compensation for Occupational Injuries and Diseases Act (COIDA) No. 130 of 1993.", { lineBreak: false });

    let y = 45 * MM;

    // ── Section helpers ───────────────────────────────────────────────
    function sectionHeader(num, title) {
      doc.rect(m, y, W - 2*m, 7.5*MM).fill(TEAL_LIGHT);
      doc.rect(m, y, 8*MM, 7.5*MM).fill(TEAL);
      doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(9)
         .text(num, m + 1*MM, y + 1.5*MM, { width: 6*MM, align: "center", lineBreak: false });
      doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(9)
         .text(title.toUpperCase(), m + 10*MM, y + 1.5*MM, { lineBreak: false });
      y += 9 * MM;
    }

    function fieldBox(label, value, x, yPos, w_pts, h_pts = 7*MM) {
      doc.fillColor(GRAY).font("Helvetica").fontSize(6.5)
         .text(label.toUpperCase(), x, yPos, { lineBreak: false });
      doc.rect(x, yPos + 3*MM, w_pts - 1*MM, h_pts).fill(FIELD_BG);
      doc.rect(x, yPos + 3*MM, w_pts - 1*MM, h_pts).strokeColor("#D1D5DB").lineWidth(0.3).stroke();
      doc.fillColor(DARK).font("Helvetica").fontSize(9)
         .text(value || "", x + 1.5*MM, yPos + 4.5*MM, { width: w_pts - 4*MM, lineBreak: false });
    }

    function row(fields) {
      // fields: [{label, value, flex}] — flex determines proportional width
      const totalFlex = fields.reduce((s, f) => s + (f.flex || 1), 0);
      const availW = W - 2*m;
      let x = m;
      fields.forEach(f => {
        const fw = (availW * (f.flex || 1)) / totalFlex;
        fieldBox(f.label, f.value || "", x, y, fw, f.h || 7*MM);
        x += fw;
      });
      const maxH = Math.max(...fields.map(f => (f.h || 7*MM) + 3*MM));
      y += maxH + 3*MM;
    }

    function checkRow(label, options, selected) {
      doc.fillColor(GRAY).font("Helvetica").fontSize(6.5)
         .text(label.toUpperCase(), m, y, { lineBreak: false });
      y += 4 * MM;
      let x = m;
      options.forEach(opt => {
        const checked = opt.value === selected;
        doc.rect(x, y, 3.5*MM, 3.5*MM).fillAndStroke(checked ? TEAL : WHITE, "#9CA3AF");
        if (checked) {
          doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(7)
             .text("✓", x + 0.5*MM, y + 0.2*MM, { lineBreak: false });
        }
        doc.fillColor(DARK).font("Helvetica").fontSize(8)
           .text(opt.label, x + 5*MM, y + 0.2*MM, { lineBreak: false });
        x += opt.label.length * 5 + 12*MM;
      });
      y += 7 * MM;
    }

    // ══ SECTION 1: EMPLOYER DETAILS ═══════════════════════════════════
    sectionHeader("1", "Employer details");
    row([
      { label: "Registered name of employer", value: data.employer_name, flex: 3 },
      { label: "COIDA reference number",       value: data.coida_ref,     flex: 1 },
    ]);
    row([
      { label: "Physical address",             value: data.employer_address, flex: 3 },
      { label: "Industry / nature of business",value: data.industry_class,   flex: 2 },
    ]);
    row([
      { label: "Contact person",               value: data.contact_person, flex: 2 },
      { label: "Telephone number",             value: data.contact_phone,  flex: 1 },
      { label: "Email address",                value: data.contact_email,  flex: 2 },
    ]);
    row([
      { label: "COIDA insurer",                value: data.coida_insurer === "rma" ? "Rand Mutual Assurance (RMA)" : data.coida_insurer === "fem" ? "Federated Employers Mutual (FEM)" : "Compensation Fund (DoL)", flex: 2 },
      { label: "Employer's policy number",     value: data.policy_number || "", flex: 1 },
    ]);

    // ══ SECTION 2: EMPLOYEE DETAILS ═══════════════════════════════════
    sectionHeader("2", "Employee details");
    row([
      { label: "Surname",           value: data.person_last_name,   flex: 2 },
      { label: "First names",       value: data.person_first_name,  flex: 2 },
      { label: "ID number",         value: data.id_number || "",    flex: 2 },
    ]);
    row([
      { label: "Date of birth",     value: data.date_of_birth,      flex: 1 },
      { label: "Gender",            value: data.gender || "",       flex: 1 },
      { label: "Nationality",       value: data.nationality || "South African", flex: 1 },
      { label: "Employee number",   value: data.employee_number,    flex: 1 },
    ]);
    row([
      { label: "Occupation / job title", value: data.job_title,    flex: 2 },
      { label: "Department",             value: data.department || "", flex: 1 },
      { label: "Date commenced employment", value: data.start_date || "", flex: 1 },
    ]);
    row([
      { label: "Ordinary weekly wage (ZAR)", value: data.weekly_wage || "", flex: 1 },
      { label: "Overtime pay per week",      value: data.overtime_pay || "", flex: 1 },
      { label: "Other earnings",             value: data.other_earnings || "", flex: 1 },
    ]);

    // ══ SECTION 3: ACCIDENT DETAILS ═══════════════════════════════════
    sectionHeader("3", "Accident / incident details");
    row([
      { label: "Date of accident",            value: data.incident_date,  flex: 1 },
      { label: "Time of accident",            value: data.incident_time || "", flex: 1 },
      { label: "Date reported to employer",   value: data.date_reported || data.incident_date, flex: 1 },
      { label: "Date reported to Fund",       value: data.date_filed || new Date().toISOString().slice(0,10), flex: 1 },
    ]);
    row([
      { label: "Place where accident occurred", value: data.site || data.employer_address || "", flex: 3 },
      { label: "Province",                      value: data.province || "Western Cape", flex: 1 },
    ]);
    checkRow("Type of accident", [
      { label: "Injury", value: "injury" },
      { label: "Occupational disease", value: "occupational_disease" },
      { label: "Near miss", value: "near_miss" },
    ], data.incident_type);
    checkRow("Severity", [
      { label: "First aid only", value: "first_aid" },
      { label: "Medical treatment", value: "medical_treatment" },
      { label: "Lost time injury", value: "lost_time" },
      { label: "Fatality", value: "fatality" },
    ], data.severity);

    // ══ SECTION 4: NATURE OF ACCIDENT ═════════════════════════════════
    sectionHeader("4", "Nature of accident and injury");
    row([
      { label: "Part of body injured",         value: data.body_part,     flex: 2 },
      { label: "Nature of injury / disease",   value: data.mechanism,     flex: 3 },
    ]);
    fieldBox("Description of how the accident occurred (Section 5 of W.Cl.2)", data.narrative || "", m, y, W - 2*m, 20*MM);
    y += 25 * MM;

    // ══ SECTION 5: FIRST AID ══════════════════════════════════════════
    sectionHeader("5", "First aid and medical treatment");
    row([
      { label: "Was first aid given?",          value: data.first_aid_given?.length > 0 ? "Yes" : "No", flex: 1 },
      { label: "First aid treatment provided",  value: (data.first_aid_given || []).join(", ") || "None", flex: 3 },
    ]);
    row([
      { label: "Name of treating doctor / hospital", value: data.treating_doctor || "", flex: 2 },
      { label: "Contact number",                     value: data.doctor_phone || "",   flex: 1 },
    ]);

    // ══ SECTION 6: DECLARATION ════════════════════════════════════════
    sectionHeader("6", "Employer declaration");
    doc.rect(m, y, W - 2*m, 6*MM).fill(FIELD_BG);
    doc.fillColor(DARK).font("Helvetica").fontSize(7.5)
       .text("I declare that the information furnished above is true and correct to the best of my knowledge and belief.", m + 2*MM, y + 1.5*MM, { width: W - 2*m - 4*MM, lineBreak: false });
    y += 8 * MM;

    row([
      { label: "Name of authorised signatory", value: data.signatory_name || data.contact_person || "", flex: 2 },
      { label: "Designation",                  value: data.signatory_title || "HR Manager", flex: 1 },
      { label: "Date",                          value: new Date().toISOString().slice(0,10), flex: 1 },
    ]);

    // Signature line
    y += 2 * MM;
    doc.moveTo(m, y).lineTo(90*MM, y).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(GRAY).font("Helvetica").fontSize(7)
       .text("Signature of authorised employer representative", m, y + 2*MM, { lineBreak: false });
    doc.rect(W - 55*MM, y - 18*MM, 40*MM, 20*MM).strokeColor("#D1D5DB").lineWidth(0.3).stroke();
    doc.fillColor(GRAY).font("Helvetica").fontSize(7)
       .text("COMPANY STAMP", W - 55*MM, y - 9*MM, { width: 40*MM, align: "center", lineBreak: false });

    // ── Footer ────────────────────────────────────────────────────────
    doc.rect(0, H - 12*MM, W, 12*MM).fill(DARK);
    doc.fillColor(WHITE).font("Helvetica").fontSize(7)
       .text("W.Cl.2 · Compensation for Occupational Injuries and Diseases Act No. 130 of 1993 · Generated by OccHealth Pro SA", m, H - 8*MM, { lineBreak: false });
    doc.text(new Date().toLocaleDateString("en-ZA"), 0, H - 8*MM, { align: "right", width: W - m, lineBreak: false });

    doc.end();
  });
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const data = JSON.parse(event.body);
    const pdfBuffer = await generateWCL2(data);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="WCl2-${(data.incident_date || "").replace(/-/g,"")}-${(data.person_last_name || "").slice(0,10)}.pdf"`,
      },
      body: pdfBuffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("W.Cl.2 error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
