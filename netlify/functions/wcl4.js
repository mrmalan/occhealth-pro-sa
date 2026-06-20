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
const AMBER      = "#92400E";
const AMBER_LIGHT= "#FFFBEB";

async function generateWCL4(data) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: "W.Cl.4 First Medical Report" } });
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const m = 15 * MM;

    // ── Government header ────────────────────────────────────────────
    doc.rect(0, 0, W, 22*MM).fill(DARK);
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(11)
       .text("REPUBLIC OF SOUTH AFRICA", m, 4*MM, { lineBreak:false });
    doc.font("Helvetica").fontSize(8).fillColor("#5DCAA5")
       .text("Department of Employment and Labour · Compensation Fund", m, 10*MM, { lineBreak:false });
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(9)
       .text("W.Cl.4", 0, 4*MM, { align:"right", width: W-m, lineBreak:false });
    doc.font("Helvetica").fontSize(7).fillColor("#5DCAA5")
       .text("FIRST MEDICAL REPORT", 0, 10*MM, { align:"right", width: W-m, lineBreak:false });

    // ── Title bar ───────────────────────────────────────────────────
    doc.rect(0, 22*MM, W, 10*MM).fill(TEAL);
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(11)
       .text("FIRST MEDICAL REPORT IN RESPECT OF AN OCCUPATIONAL INJURY OR DISEASE", 0, 24.5*MM, { align:"center", width:W, lineBreak:false });

    // ── Legal notice ─────────────────────────────────────────────────
    doc.rect(m, 34*MM, W-2*m, 8*MM).fill(RED_LIGHT);
    doc.fillColor(RED).font("Helvetica-Bold").fontSize(7)
       .text("IMPORTANT: ", m+2*MM, 36*MM, { continued:true, lineBreak:false });
    doc.font("Helvetica").fillColor(DARK)
       .text("This form must be completed by the attending medical practitioner and submitted with the W.Cl.2 to the Compensation Fund. Retain a copy for practice records.", { lineBreak:false });

    let y = 45*MM;

    const sectionHeader = (num, title) => {
      doc.rect(m, y, W-2*m, 7.5*MM).fill(TEAL_LIGHT);
      doc.rect(m, y, 8*MM, 7.5*MM).fill(TEAL);
      doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(9)
         .text(num, m+1*MM, y+1.5*MM, { width:6*MM, align:"center", lineBreak:false });
      doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(9)
         .text(title.toUpperCase(), m+10*MM, y+1.5*MM, { lineBreak:false });
      y += 9*MM;
    };

    const fieldBox = (label, value, x, yPos, w_pts, h_pts=7*MM) => {
      doc.fillColor(GRAY).font("Helvetica").fontSize(6.5)
         .text(label.toUpperCase(), x, yPos, { lineBreak:false });
      doc.rect(x, yPos+3*MM, w_pts-1*MM, h_pts).fill(FIELD_BG);
      doc.rect(x, yPos+3*MM, w_pts-1*MM, h_pts).strokeColor("#E5E7EB").lineWidth(0.3).stroke();
      doc.fillColor(DARK).font("Helvetica").fontSize(9)
         .text(String(value||""), x+1.5*MM, yPos+4.5*MM, { width: w_pts-4*MM, lineBreak:false });
    };

    const row = (fields) => {
      const totalFlex = fields.reduce((s,f) => s+(f.flex||1), 0);
      const availW = W-2*m;
      let x = m;
      fields.forEach(f => {
        const fw = (availW*(f.flex||1))/totalFlex;
        fieldBox(f.label, f.value||"", x, y, fw, f.h||7*MM);
        x += fw;
      });
      y += (fields[0]?.h||7*MM) + 5*MM;
    };

    const textArea = (label, value, h_pts=20*MM) => {
      doc.fillColor(GRAY).font("Helvetica").fontSize(6.5)
         .text(label.toUpperCase(), m, y, { lineBreak:false });
      y += 3.5*MM;
      doc.rect(m, y, W-2*m, h_pts).fill(FIELD_BG);
      doc.rect(m, y, W-2*m, h_pts).strokeColor("#E5E7EB").lineWidth(0.3).stroke();
      if (value) {
        doc.fillColor(DARK).font("Helvetica").fontSize(9)
           .text(String(value), m+2*MM, y+2*MM, { width: W-2*m-4*MM, height: h_pts-4*MM });
      }
      y += h_pts + 4*MM;
    };

    const checkRow = (label, options, selected) => {
      doc.fillColor(GRAY).font("Helvetica").fontSize(6.5)
         .text(label.toUpperCase(), m, y, { lineBreak:false });
      y += 4*MM;
      let x = m;
      options.forEach(opt => {
        const checked = opt.value === selected;
        doc.rect(x, y, 3.5*MM, 3.5*MM).fillAndStroke(checked ? TEAL : WHITE, "#9CA3AF");
        if (checked) {
          doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(7)
             .text("✓", x+0.5*MM, y+0.2*MM, { lineBreak:false });
        }
        doc.fillColor(DARK).font("Helvetica").fontSize(8)
           .text(opt.label, x+5*MM, y+0.2*MM, { lineBreak:false });
        x += opt.label.length * 4.5 + 12*MM;
      });
      y += 7*MM;
    };

    // ══ SECTION 1: PATIENT DETAILS ════════════════════════════════════
    sectionHeader("1", "Patient details");
    row([
      { label:"Surname",         value:data.person_last_name,  flex:2 },
      { label:"First names",     value:data.person_first_name, flex:2 },
      { label:"ID number",       value:data.id_number||"",     flex:2 },
    ]);
    row([
      { label:"Date of birth",   value:data.date_of_birth,     flex:1 },
      { label:"Gender",          value:data.gender||"",        flex:1 },
      { label:"Occupation",      value:data.job_title,         flex:2 },
      { label:"Employer",        value:data.employer_name,     flex:2 },
    ]);

    // ══ SECTION 2: ACCIDENT REFERENCE ════════════════════════════════
    sectionHeader("2", "Accident reference");
    row([
      { label:"Date of accident",       value:data.incident_date,  flex:1 },
      { label:"Date first examined",    value:data.examination_date || data.incident_date, flex:1 },
      { label:"W.Cl.2 reference",       value:data.wcl2_ref||"",   flex:2 },
    ]);
    row([
      { label:"Place of accident",      value:data.site||"",       flex:3 },
      { label:"COIDA ref (employer)",   value:data.coida_ref||"",  flex:1 },
    ]);

    // ══ SECTION 3: HISTORY (SUBJECTIVE) ══════════════════════════════
    sectionHeader("3", "History of injury / illness (as reported by patient)");
    textArea("Patient's account of how the accident occurred / symptoms presented", data.subjective || data.narrative || "", 18*MM);

    // ══ SECTION 4: CLINICAL FINDINGS (OBJECTIVE) ═════════════════════
    sectionHeader("4", "Clinical findings on examination");

    // Vitals
    row([
      { label:"Blood pressure",  value:data.vitals?.bp_systolic ? `${data.vitals.bp_systolic}/${data.vitals.bp_diastolic} mmHg` : "", flex:1 },
      { label:"Pulse",           value:data.vitals?.hr ? `${data.vitals.hr} bpm` : "",    flex:1 },
      { label:"Temperature",     value:data.vitals?.temp ? `${data.vitals.temp}°C` : "",  flex:1 },
      { label:"Weight",          value:data.vitals?.weight ? `${data.vitals.weight} kg` : "", flex:1 },
    ]);

    row([
      { label:"Part of body injured / affected",  value:data.body_part || "", flex:2 },
      { label:"Nature of injury / disease",       value:data.mechanism || "", flex:3 },
    ]);

    textArea("Clinical findings (objective examination)", data.objective || "", 18*MM);

    // ══ SECTION 5: DIAGNOSIS (ASSESSMENT) ════════════════════════════
    sectionHeader("5", "Diagnosis and assessment");
    textArea("Diagnosis / clinical impression (ICD-10 code if available)", data.assessment || "", 14*MM);

    checkRow("Is the injury / disease related to the reported accident or occupational exposure?", [
      { label:"Yes", value:"yes" },
      { label:"No",  value:"no"  },
      { label:"Uncertain", value:"uncertain" },
    ], data.work_related || "yes");

    // ══ SECTION 6: TREATMENT AND PROGNOSIS (PLAN) ════════════════════
    sectionHeader("6", "Treatment and prognosis");
    textArea("Treatment provided / recommended", data.plan || "", 14*MM);

    row([
      { label:"Estimated period of total incapacity (days)",  value:data.incapacity_days||"", flex:1 },
      { label:"Expected return to work date",                 value:data.return_to_work||"",  flex:1 },
      { label:"Referral (specialist / hospital)",             value:data.referral||"",        flex:2 },
    ]);

    checkRow("Patient fitness for work", [
      { label:"Fit for normal duties",       value:"fit" },
      { label:"Fit for light duties only",   value:"light" },
      { label:"Unfit for work",              value:"unfit" },
    ], data.work_fitness || (data.fitness_status === "fit" ? "fit" : data.fitness_status === "temporarily_unfit" ? "unfit" : "light"));

    // ══ SECTION 7: PRACTITIONER DECLARATION ══════════════════════════
    sectionHeader("7", "Practitioner declaration");
    row([
      { label:"Full name",        value:data.practitioner_name, flex:2 },
      { label:"Qualification",    value:data.qualification||"", flex:1 },
      { label:"HPCSA / SANC no.", value:data.sanc_number||"",  flex:1 },
    ]);
    row([
      { label:"Practice address", value:data.practice_address||data.practice_name||"", flex:3 },
      { label:"Date",             value:data.signed_at || new Date().toISOString().slice(0,10), flex:1 },
    ]);

    // Declaration text
    doc.rect(m, y, W-2*m, 7*MM).fill(FIELD_BG);
    doc.fillColor(DARK).font("Helvetica").fontSize(7.5)
       .text("I certify that I have examined the patient named above and that the information furnished in this report is true and correct.", m+2*MM, y+1.5*MM, { width: W-2*m-4*MM, lineBreak:false });
    y += 10*MM;

    // Signature row
    y += 2*MM;
    doc.moveTo(m, y+10*MM).lineTo(80*MM, y+10*MM).strokeColor(DARK).lineWidth(0.5).stroke();
    doc.fillColor(GRAY).font("Helvetica").fontSize(7)
       .text("Signature of attending practitioner", m, y+12*MM, { lineBreak:false });

    // Stamp box
    doc.rect(W-55*MM, y, 40*MM, 22*MM).strokeColor("#E5E7EB").lineWidth(0.5).stroke();
    doc.fillColor(GRAY).font("Helvetica").fontSize(7)
       .text("PRACTICE STAMP", W-55*MM, y+9*MM, { width:40*MM, align:"center", lineBreak:false });

    // ── Footer ───────────────────────────────────────────────────────
    doc.rect(0, H-12*MM, W, 12*MM).fill(DARK);
    doc.fillColor(WHITE).font("Helvetica").fontSize(7)
       .text("W.Cl.4 · Compensation for Occupational Injuries and Diseases Act No. 130 of 1993 · Generated by OccHealth Pro SA", m, H-8*MM, { lineBreak:false });
    doc.text(new Date().toLocaleDateString("en-ZA"), 0, H-8*MM, { align:"right", width: W-m, lineBreak:false });

    doc.end();
  });
}

export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode:405, body:"Method Not Allowed" };
  try {
    const data = JSON.parse(event.body);
    const pdf = await generateWCL4(data);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="WCl4-${(data.incident_date||"").replace(/-/g,"").slice(0,8)}-${(data.person_last_name||"").slice(0,10)}.pdf"`,
      },
      body: pdf.toString("base64"),
      isBase64Encoded: true,
    };
  } catch(err) {
    return { statusCode:500, body: JSON.stringify({ error: err.message }) };
  }
}
