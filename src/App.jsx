import { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "YOUR_PROJECT";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || "YOUR_ANON_KEY";
const USE_MOCK = SUPABASE_URL.includes("YOUR_PROJECT");
const VAT_RATE = 0.15;
const APP_VERSION = "0.1.0";

// localStorage namespace
const LS = {
  SESSION: "oh_session",
  MODULES: "oh_modules",
  PRACTICE: "oh_practice",
  SIGNED_NOTES: "oh_signed_notes",
};

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_SESSION = {
  user: {
    id: "mock-user-1",
    email: "demo@occhealth.co.za",
    user_metadata: {
      full_name: "Sr. Thandi Dlamini",
      role: "ohp",
      tenant_name: "Cape OccHealth Services",
      tenant_type: "independent_ohp",
    },
  },
};

const MOCK_EMPLOYERS = [
  { id: "e1", name: "Cape Construction (Pty) Ltd", coida_ref: "CF-2024-001", industry_class: "Construction", coida_insurer: "fem", contact_email: "hr@capeconstruct.co.za", person_count: 48 },
  { id: "e2", name: "Stellenbosch Winery Group", coida_ref: "CF-2024-002", industry_class: "Agriculture", coida_insurer: "compensation_fund", contact_email: "safety@swg.co.za", person_count: 124 },
  { id: "e3", name: "Atlantic Logistics SA", coida_ref: "CF-2024-003", industry_class: "Transport", coida_insurer: "compensation_fund", contact_email: "ohs@atlanticlogistics.co.za", person_count: 67 },
];

const MOCK_PERSONS = [
  { id: "p1", employer_id: "e1", employee_number: "CC-001", first_name: "Sipho", last_name: "Nkosi", job_title: "Site Foreman", department: "Civil", site: "N2 Highway Project", employment_status: "active", date_of_birth: "1982-03-15" },
  { id: "p2", employer_id: "e1", employee_number: "CC-002", first_name: "Ahmed", last_name: "Davids", job_title: "Scaffolder", department: "Civil", site: "N2 Highway Project", employment_status: "active", date_of_birth: "1990-07-22" },
  { id: "p3", employer_id: "e2", employee_number: "SW-045", first_name: "Liezel", last_name: "van der Berg", job_title: "Cellar Worker", department: "Production", site: "Stellenbosch Main", employment_status: "active", date_of_birth: "1988-11-08" },
  { id: "p4", employer_id: "e3", employee_number: "AL-012", first_name: "Thabo", last_name: "Mokoena", job_title: "Forklift Operator", department: "Warehouse", site: "Cape Town DC", employment_status: "active", date_of_birth: "1975-05-30" },
];

const MOCK_ENCOUNTERS = [
  { id: "enc1", person_id: "p1", employer_id: "e1", encounter_at: "2026-06-10T09:00:00Z", encounter_type: "periodic", signed_at: "2026-06-10T09:45:00Z", signed_by: "Sr. Thandi Dlamini", assessment: "No significant changes noted. BP well controlled.", plan: "Continue current medication. Repeat in 12 months." },
  { id: "enc2", person_id: "p2", employer_id: "e1", encounter_at: "2026-06-12T10:30:00Z", encounter_type: "pre_employment", signed_at: "2026-06-12T11:00:00Z", signed_by: "Sr. Thandi Dlamini", assessment: "Fit for scaffolding work at heights.", plan: "Issue fitness certificate. Audiometry baseline recorded." },
];

const MOCK_FITNESS_CERTS = [
  { id: "fc1", encounter_id: "enc1", person_id: "p1", fitness_status: "fit", valid_from: "2026-06-10", valid_until: "2027-06-10", role_category: "Site Foreman", superseded: false },
  { id: "fc2", encounter_id: "enc2", person_id: "p2", fitness_status: "fit", valid_from: "2026-06-12", valid_until: "2027-06-12", role_category: "Scaffolder", superseded: false },
];

const MOCK_IOD = [
  { id: "iod1", person_id: "p4", employer_id: "e3", incident_at: "2026-06-05T14:22:00Z", incident_type: "injury", mechanism: "Forklift blade contact", body_part: "Left hand — index finger", severity: "medical_treatment", narrative: "Employee was guiding pallet when forklift blade made contact with left index finger. Immediate first aid applied on site." },
];

const MOCK_DRUG_TESTS = [
  { id: "dt1", person_id: "p1", employer_id: "e1", test_reason: "random", specimen_type: "urine", result: "negative", consent_given: true, refusal: false, tested_at: "2026-06-15T08:00:00Z", substances_tested: ["cannabis", "cocaine", "opiates", "amphetamines"] },
];

const MOCK_SURVEILLANCE = [
  { id: "sv1", person_id: "p2", hazard_profile_id: "hp1", test_type: "audiometry", scheduled_date: "2026-07-01", status: "scheduled" },
  { id: "sv2", person_id: "p3", hazard_profile_id: "hp2", test_type: "spirometry", scheduled_date: "2026-06-25", status: "overdue" },
  { id: "sv3", person_id: "p4", hazard_profile_id: "hp3", test_type: "audiometry", scheduled_date: "2026-08-01", status: "scheduled" },
];

// ─── COLOURS & DESIGN TOKENS ──────────────────────────────────────────────────
const C = {
  teal: "#0F6E56",
  tealDark: "#04342C",
  tealLight: "#E1F5EE",
  tealMid: "#1D9E75",
  amber: "#854F0B",
  amberLight: "#FAEEDA",
  red: "#B91C1C",
  redLight: "#FEE2E2",
  text: "#1a1a18",
  textSub: "#5F5E5A",
  textTert: "#888780",
  border: "#D8D6CE",
  bg: "#F8F7F4",
  bgCard: "#FFFFFF",
  bgSub: "#F1EFE8",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtR = (n) => `R ${Number(n||0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── FLOWBOARD CONSTANTS ──────────────────────────────────────────────────────
// OccHealth encounter types with colours
const OCC_APPT_TYPES = {
  "Pre-employment":  { color: "#2563EB", light: "#DBEAFE" },
  "Periodic":        { color: "#0F6E56", light: "#E1F5EE" },
  "Exit medical":    { color: "#7C3AED", light: "#EDE9FE" },
  "IOD follow-up":   { color: "#DC2626", light: "#FEE2E2" },
  "Surveillance":    { color: "#0891B2", light: "#CFFAFE" },
  "Drug test":       { color: "#D97706", light: "#FEF3C7" },
  "Sick/acute":      { color: "#6B7280", light: "#F3F4F6" },
  "Chronic review":  { color: "#059669", light: "#D1FAE8" },
};

// Practitioner colours (first 5)
const OHP_COLORS = [
  { color: "#0D6B6E", light: "#E8F4F4" },
  { color: "#7C3AED", light: "#EDE9FE" },
  { color: "#D97706", light: "#FEF3C7" },
  { color: "#DC2626", light: "#FEE2E2" },
  { color: "#059669", light: "#D1FAE8" },
];

// Mock flowboard data — OccHealth clinic session
const MOCK_OCC_FLOWBOARD = [
  { id:"a1",  time:"07:30", hour:7.5,  dur:30,  person:"Sipho Nkosi",        job_title:"Boilermaker",      dept:"Maintenance",  type:"Pre-employment",  prac:"p1", bay:"Bay 1", status:"done",        arrived:true,  invoiced:true,  startedAt:"07:32",endedAt:"07:58", revenue:480, alerts:[] },
  { id:"a2",  time:"08:00", hour:8,    dur:20,  person:"Fatima Adams",       job_title:"Welder",           dept:"Production",   type:"Drug test",       prac:"p2", bay:"Bay 2", status:"done",        arrived:true,  invoiced:true,  startedAt:"08:02",endedAt:"08:19", revenue:280, alerts:[] },
  { id:"a3",  time:"08:30", hour:8.5,  dur:45,  person:"Johannes van Wyk",  job_title:"Machine operator", dept:"Production",   type:"Periodic",        prac:"p1", bay:"Bay 1", status:"done",        arrived:true,  invoiced:true,  startedAt:"08:33",endedAt:"09:14", revenue:550, alerts:["Hypertension — on treatment"] },
  { id:"a4",  time:"09:00", hour:9,    dur:30,  person:"Thandi Dlamini",    job_title:"Safety officer",   dept:"SHE",          type:"Chronic review",  prac:"p1", bay:"Bay 1", status:"in_progress", arrived:true,  invoiced:false, startedAt:"09:05",endedAt:null,   revenue:null, alerts:["Diabetic — check glucose"] },
  { id:"a5",  time:"09:30", hour:9.5,  dur:60,  person:"Marco Ferreira",    job_title:"Scaffolder",       dept:"Civil",        type:"Surveillance",    prac:"p2", bay:"Bay 2", status:"in_progress", arrived:true,  invoiced:false, startedAt:"09:35",endedAt:null,   revenue:null, alerts:["Audiometry + spirometry required"] },
  { id:"a6",  time:"10:00", hour:10,   dur:30,  person:"Brenda Mokoena",    job_title:"Cleaner",          dept:"Facilities",   type:"IOD follow-up",   prac:"p1", bay:"Bay 1", status:"waiting",     arrived:true,  invoiced:false, startedAt:null,   endedAt:null,   revenue:null, alerts:["Slip injury 14 days ago"] },
  { id:"a7",  time:"10:30", hour:10.5, dur:30,  person:"Andile Khumalo",    job_title:"Electrician",      dept:"Engineering",  type:"Pre-employment",  prac:"p2", bay:"Bay 2", status:"scheduled",   arrived:false, invoiced:false, startedAt:null,   endedAt:null,   revenue:null, alerts:[] },
  { id:"a8",  time:"11:00", hour:11,   dur:20,  person:"Pieter du Plessis", job_title:"Forklift operator",dept:"Logistics",    type:"Drug test",       prac:"p1", bay:"Bay 1", status:"scheduled",   arrived:false, invoiced:false, startedAt:null,   endedAt:null,   revenue:null, alerts:[] },
  { id:"a9",  time:"11:30", hour:11.5, dur:45,  person:"Nokukhanya Sitole", job_title:"Chemical worker",  dept:"Processing",   type:"Surveillance",    prac:"p2", bay:"Bay 2", status:"scheduled",   arrived:false, invoiced:false, startedAt:null,   endedAt:null,   revenue:null, alerts:["Bio-monitoring — urine sample required"] },
  { id:"a10", time:"12:30", hour:12.5, dur:30,  person:"Rory Campbell",     job_title:"Site manager",     dept:"Management",   type:"Periodic",        prac:"p1", bay:"Bay 1", status:"scheduled",   arrived:false, invoiced:false, startedAt:null,   endedAt:null,   revenue:null, alerts:[] },
  { id:"a11", time:"13:00", hour:13,   dur:45,  person:"Zanele Moyo",       job_title:"Lab technician",   dept:"Laboratory",   type:"Pre-employment",  prac:"p1", bay:"Bay 1", status:"scheduled",   arrived:false, invoiced:false, startedAt:null,   endedAt:null,   revenue:null, alerts:[] },
  { id:"a12", time:"13:30", hour:13.5, dur:20,  person:"Deon Swart",        job_title:"Driver",           dept:"Transport",    type:"Drug test",       prac:"p2", bay:"Bay 2", status:"scheduled",   arrived:false, invoiced:false, startedAt:null,   endedAt:null,   revenue:null, alerts:[] },
  { id:"a13", time:"14:00", hour:14,   dur:30,  person:"Priya Naidoo",      job_title:"Nurse",            dept:"Medical",      type:"Exit medical",    prac:"p1", bay:"Bay 1", status:"scheduled",   arrived:false, invoiced:false, startedAt:null,   endedAt:null,   revenue:null, alerts:[] },
  { id:"a14", time:"14:30", hour:14.5, dur:30,  person:"Lebo Sithole",      job_title:"Artisan",          dept:"Maintenance",  type:"Periodic",        prac:"p2", bay:"Bay 2", status:"scheduled",   arrived:false, invoiced:false, startedAt:null,   endedAt:null,   revenue:null, alerts:[] },
  { id:"a15", time:"15:00", hour:15,   dur:30,  person:"Yolanda Steyn",     job_title:"Admin clerk",      dept:"Admin",        type:"Chronic review",  prac:"p1", bay:"Bay 1", status:"scheduled",   arrived:false, invoiced:false, startedAt:null,   endedAt:null,   revenue:null, alerts:[] },
];

// Monthly register — 20 working days of clinic data
const generateOccMonthlyRegister = () => {
  const days = [];
  const today = new Date(2026, 5, 21);
  const types = Object.keys(OCC_APPT_TYPES);
  const seed = (d,p) => ((d*7+p*3)%100)/100;
  for (let d=0; d<25; d++) {
    const date = new Date(today); date.setDate(today.getDate()-d);
    if (date.getDay()===0||date.getDay()===6) continue;
    const dateStr = date.toISOString().slice(0,10);
    const pracData = ["p1","p2"].map((pid,pi) => {
      const s = seed(d,pi);
      const count = Math.floor(6 + s*6);
      let revenue = 0;
      const sessions = [];
      for (let i=0; i<count; i++) {
        const type = types[Math.floor(seed(d*10+i,pi)*types.length)];
        const rate = type==="Pre-employment"?480:type==="Periodic"?550:type==="Drug test"?280:type==="Surveillance"?620:type==="IOD follow-up"?420:400;
        const dur = type==="Surveillance"?60:type==="Pre-employment"?45:30;
        revenue += Math.round(rate*(0.85+seed(d+i,pi)*0.3));
        sessions.push({ type, dur, revenue: Math.round(rate*(0.85+seed(d+i,pi)*0.3)) });
      }
      const bookedMins = sessions.reduce((s,a)=>s+a.dur,0);
      return { pracId: pid, count, revenue, bookedMins, sessions };
    });
    const dayRevenue = pracData.reduce((s,p)=>s+p.revenue,0);
    const dayCount = pracData.reduce((s,p)=>s+p.count,0);
    days.push({ date:dateStr, label:date.toLocaleDateString("en-ZA",{weekday:"short",day:"numeric",month:"short"}), pracData, dayRevenue, dayCount });
  }
  return days.reverse();
};
const MOCK_OCC_MONTHLY = generateOccMonthlyRegister();

// Stock / consumables defaults
const MOCK_OCC_STOCK = [
  { id:"s1", name:"Drug test kits (urine, 6-panel)", category:"test_kits",    qty:48,  reorder:20, unit:"units",    lot:"DT2026-04", expiry:"2027-03-31", supplier:"Biosite", unit_cost:145 },
  { id:"s2", name:"Drug test kits (breath alcohol)", category:"test_kits",    qty:12,  reorder:8,  unit:"units",    lot:"BA2025-11", expiry:"2026-12-31", supplier:"Alco-Safe", unit_cost:210 },
  { id:"s3", name:"Venipuncture needles 21G",        category:"consumables",  qty:200, reorder:50, unit:"units",    lot:null,        expiry:null,         supplier:"Medipack", unit_cost:4.5 },
  { id:"s4", name:"Vacutainer tubes (EDTA)",         category:"consumables",  qty:80,  reorder:30, unit:"units",    lot:null,        expiry:"2027-06-30", supplier:"Medipack", unit_cost:8 },
  { id:"s5", name:"Nitrile gloves (M)",              category:"consumables",  qty:5,   reorder:10, unit:"boxes",    lot:null,        expiry:null,         supplier:"Medical Direct", unit_cost:85 },
  { id:"s6", name:"Urine specimen cups",             category:"consumables",  qty:60,  reorder:20, unit:"units",    lot:null,        expiry:null,         supplier:"Biosite", unit_cost:6 },
  { id:"s7", name:"BP cuff (adult)",                 category:"equipment",    qty:2,   reorder:1,  unit:"units",    lot:null,        expiry:null,         supplier:"Welch Allyn", unit_cost:1200 },
  { id:"s8", name:"Pulse oximeter",                  category:"equipment",    qty:2,   reorder:1,  unit:"units",    lot:null,        expiry:null,         supplier:"Nonin", unit_cost:950 },
];

const MOCK_OCC_CALIBRATION = [
  { id:"c1", equip:"Audiometer (Maico MA 41)",     serial:"MA41-2024-0033", last:"2025-06-15", next:"2026-06-15", by:"SABS Accredited Lab",    cert_url:null },
  { id:"c2", equip:"Spirometer (MIR Spirolab)",    serial:"SL-2023-0117",  last:"2026-01-10", next:"2026-07-10", by:"MIR SA",                   cert_url:null },
  { id:"c3", equip:"Audiometric booth (IAC 400A)", serial:"IAC-2019-011",  last:"2025-11-20", next:"2026-11-20", by:"SABS Accredited Lab",    cert_url:null },
  { id:"c4", equip:"Breath alcohol (Lion SD400)",  serial:"SD4-2025-0044", last:"2026-03-05", next:"2026-09-05", by:"Lion Laboratories SA",   cert_url:null },
  { id:"c5", equip:"Weighing scale",               serial:"WS-2022-008",   last:"2025-12-01", next:"2026-12-01", by:"In-house",                 cert_url:null },
];

// ─── UTILITY COMPONENTS ───────────────────────────────────────────────────────
const Badge = ({ children, color = "teal" }) => {
  const styles = {
    teal: { background: C.tealLight, color: C.teal },
    amber: { background: C.amberLight, color: C.amber },
    red: { background: C.redLight, color: C.red },
    gray: { background: C.bgSub, color: C.textSub },
  };
  return (
    <span style={{ ...styles[color], fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
};

const Card = ({ children, style = {}, ...rest }) => (
  <div style={{ background: C.bgCard, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "1rem 1.25rem", ...style }} {...rest}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textTert, fontWeight: 500, marginBottom: 12, paddingBottom: 8, borderBottom: `0.5px solid ${C.border}` }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", disabled = false, style = {} }) => {
  const base = { border: "none", borderRadius: 7, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 500, transition: "opacity 0.15s", opacity: disabled ? 0.5 : 1 };
  const sizes = { sm: { fontSize: 12, padding: "5px 12px" }, md: { fontSize: 13, padding: "8px 16px" }, lg: { fontSize: 14, padding: "10px 20px" } };
  const variants = {
    primary: { background: C.teal, color: "#fff" },
    secondary: { background: C.bgSub, color: C.text },
    danger: { background: C.red, color: "#fff" },
    ghost: { background: "transparent", color: C.teal, border: `1px solid ${C.teal}` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  );
};

const StatCard = ({ label, value, sub, color = C.teal }) => (
  <div style={{ background: C.bgSub, borderRadius: 8, padding: "0.875rem 1rem" }}>
    <div style={{ fontSize: 22, fontWeight: 500, color, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 12, color: C.textSub, marginTop: 4, lineHeight: 1.4 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: C.textTert, marginTop: 2 }}>{sub}</div>}
  </div>
);

// ─── SCREENS ──────────────────────────────────────────────────────────────────

const Dashboard = ({ session, navigate }) => {
  const meta = session.user.user_metadata;
  const { encounters, fitnessCerts, employers, persons, iodCount } = useData();
  const overdue = MOCK_SURVEILLANCE.filter(s => s.status === "overdue").length;
  const certsExpiring = fitnessCerts.filter(fc => {
    const days = (new Date(fc.valid_until) - new Date()) / 86400000;
    return days < 30 && days > 0;
  }).length;

  // Calibration alerts — read from localStorage (set by StockCalibration component)
  const today = new Date();
  const calOverdue = MOCK_OCC_CALIBRATION.filter(c => c.next && new Date(c.next) < today).length;
  const calDueSoon = MOCK_OCC_CALIBRATION.filter(c => {
    if (!c.next) return false;
    const d = (new Date(c.next) - today) / 86400000;
    return d >= 0 && d <= 30;
  }).length;
  const stockLow = MOCK_OCC_STOCK.filter(s => s.qty > 0 && s.qty <= s.reorder).length;
  const stockOut = MOCK_OCC_STOCK.filter(s => s.qty <= 0).length;
  const hasStockAlert = calOverdue > 0 || calDueSoon > 0 || stockLow > 0 || stockOut > 0;

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textTert, marginBottom: 4 }}>Good morning</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: C.text }}>{meta.full_name}</div>
        <div style={{ fontSize: 13, color: C.textSub }}>{meta.tenant_name}</div>
      </div>

      {(overdue > 0 || certsExpiring > 0 || hasStockAlert) && (
        <div style={{ background: C.amberLight, border: `1px solid #E8C56A`, borderRadius: 8, padding: "0.875rem 1rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.amber, marginBottom: 4 }}>⚠ Action required</div>
          {overdue > 0 && <div style={{ fontSize: 13, color: C.amber }}>{overdue} surveillance test{overdue > 1 ? "s" : ""} overdue</div>}
          {certsExpiring > 0 && <div style={{ fontSize: 13, color: C.amber }}>{certsExpiring} fitness certificate{certsExpiring > 1 ? "s" : ""} expiring within 30 days</div>}
          {calOverdue > 0 && <div style={{ fontSize: 13, color: C.red }}>⚠ {calOverdue} equipment calibration{calOverdue > 1 ? "s" : ""} overdue — results may not be legally defensible</div>}
          {calDueSoon > 0 && <div style={{ fontSize: 13, color: C.amber }}>{calDueSoon} equipment calibration{calDueSoon > 1 ? "s" : ""} due within 30 days</div>}
          {stockOut > 0 && <div style={{ fontSize: 13, color: C.amber }}>{stockOut} stock item{stockOut > 1 ? "s" : ""} out of stock</div>}
          {stockLow > 0 && <div style={{ fontSize: 13, color: C.amber }}>{stockLow} stock item{stockLow > 1 ? "s" : ""} below reorder level</div>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
        <StatCard label="Employers" value={employers.length} />
        <StatCard label="Employees" value={persons.length} />
        <StatCard label="Surveillance due" value={MOCK_SURVEILLANCE.filter(s => s.status !== "completed").length} color={overdue > 0 ? C.amber : C.teal} />
        <StatCard label="Encounters this month" value={encounters.length} />
        <StatCard label="Active fitness certs" value={fitnessCerts.filter(f => !f.superseded).length} />
        <StatCard label="Open IOD cases" value={iodCount} color={iodCount > 0 ? C.amber : C.teal} />
      </div>

      <SectionTitle>Recent activity</SectionTitle>
      {[...encounters].reverse().slice(0, 5).map(enc => {
        const person = persons.find(p => p.id === enc.person_id);
        const employer = employers.find(e => e.id === enc.employer_id);
        return (
          <Card key={enc.id} style={{ marginBottom: 8, cursor: "pointer" }} onClick={() => navigate("encounters")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{person?.first_name} {person?.last_name}</div>
                <div style={{ fontSize: 12, color: C.textSub }}>{employer?.name} · {enc.encounter_type.replace(/_/g, " ")}</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Badge color={enc.signed_at ? "teal" : "amber"}>{enc.signed_at ? "Signed" : "Draft"}</Badge>
                <span style={{ fontSize: 11, color: C.textTert }}>{new Date(enc.encounter_at).toLocaleDateString("en-ZA")}</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const EMPLOYMENT_STATUSES = ["active", "contractor", "terminated"];

// ── Person detail view ────────────────────────────────────────────────────────
const PersonDetail = ({ person, employer, onBack }) => {
  const { encounters, fitnessCerts, db } = useData();
  const [drugTests, setDrugTests] = useState([]);
  const [iods, setIods] = useState([]);
  const [survEvents, setSurvEvents] = useState([]);

  useEffect(() => {
    if (!db || !person?.id) return;
    db.from("drug_test").select(`person_id=eq.${person.id}&order=tested_at.desc&limit=20`).then(r => { if (r.data) setDrugTests(r.data); });
    db.from("iod_incident").select(`person_id=eq.${person.id}&order=incident_at.desc&limit=20`).then(r => { if (r.data) setIods(r.data); });
    db.from("surveillance_event").select(`person_id=eq.${person.id}&order=scheduled_date.desc&limit=30`).then(r => { if (r.data) setSurvEvents(r.data); });
  }, [db, person?.id]);

  const personEncounters = encounters.filter(e => e.person_id === person.id);
  const personCerts = fitnessCerts.filter(f => f.person_id === person.id && !f.superseded);
  const activeCert = personCerts[0];

  const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  return (
    <div>
      <Btn variant="ghost" size="sm" onClick={onBack} style={{ marginBottom: "1rem" }}>← Back to employees</Btn>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>{person.first_name} {person.last_name}</div>
          <div style={{ fontSize: 13, color: C.textSub, marginTop: 2 }}>
            {[person.job_title, person.department, person.site, employer?.name].filter(Boolean).join(" · ")}
          </div>
        </div>
        <Badge color={person.employment_status === "active" ? "teal" : person.employment_status === "contractor" ? "amber" : "gray"}>
          {person.employment_status}
        </Badge>
      </div>

      {/* Current fitness cert alert */}
      {activeCert && (
        <div style={{ background: new Date(activeCert.valid_until) < new Date() ? C.redLight : C.tealLight, border: `1px solid ${new Date(activeCert.valid_until) < new Date() ? C.red : C.tealMid}`, borderRadius: 8, padding: "10px 14px", marginBottom: "1rem" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: new Date(activeCert.valid_until) < new Date() ? C.red : C.teal, marginBottom: 2 }}>
            {new Date(activeCert.valid_until) < new Date() ? "⚠ Fitness certificate EXPIRED" : "✓ Fitness certificate current"}
          </div>
          <div style={{ fontSize: 12, color: C.textSub }}>
            Status: <strong>{activeCert.fitness_status?.replace(/_/g," ")}</strong> · Valid until: <strong>{activeCert.valid_until}</strong>
            {activeCert.restrictions?.length > 0 && <span> · Restrictions: {activeCert.restrictions.join(", ")}</span>}
          </div>
        </div>
      )}

      {/* Personal details */}
      <Card style={{ marginBottom: "1rem" }}>
        <SectionTitle>Personal details</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {[
            ["Employee number", person.employee_number],
            ["ID number", person.id_number],
            ["Date of birth", person.date_of_birth],
            ["Gender", person.gender],
            ["Start date", person.start_date],
            ["Job title", person.job_title],
            ["Department", person.department],
            ["Site", person.site],
          ].map(([label, value]) => value ? (
            <div key={label} style={{ padding: "6px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 13 }}>
              <div style={{ fontSize: 10, color: C.textTert, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <div style={{ fontWeight: 500, marginTop: 1 }}>{value}</div>
            </div>
          ) : null)}
        </div>
      </Card>

      {/* Encounters */}
      <Card style={{ marginBottom: "1rem" }}>
        <SectionTitle>Clinical encounters ({personEncounters.length})</SectionTitle>
        {personEncounters.length === 0
          ? <div style={{ fontSize: 13, color: C.textTert }}>No encounters recorded.</div>
          : personEncounters.slice(0,5).map(enc => (
            <div key={enc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 500 }}>{enc.encounter_type?.replace(/_/g," ")}</div>
                <div style={{ fontSize: 11, color: C.textTert }}>{new Date(enc.encounter_at).toLocaleDateString("en-ZA")}</div>
              </div>
              <Badge color={enc.signed_at ? "teal" : "amber"}>{enc.signed_at ? "Signed" : "Draft"}</Badge>
            </div>
          ))
        }
      </Card>

      {/* Surveillance */}
      {survEvents.length > 0 && (
        <Card style={{ marginBottom: "1rem" }}>
          <SectionTitle>Surveillance history ({survEvents.length})</SectionTitle>
          {survEvents.slice(0,6).map(ev => (
            <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 500 }}>{ev.test_type?.replace(/_/g," ")}</div>
                <div style={{ fontSize: 11, color: C.textTert }}>{ev.scheduled_date}</div>
              </div>
              <Badge color={ev.status === "completed" ? "teal" : ev.status === "overdue" ? "red" : "gray"}>{ev.status}</Badge>
            </div>
          ))}
        </Card>
      )}

      {/* Drug tests */}
      {drugTests.length > 0 && (
        <Card style={{ marginBottom: "1rem" }}>
          <SectionTitle>Drug & alcohol tests ({drugTests.length})</SectionTitle>
          {drugTests.slice(0,5).map(dt => (
            <div key={dt.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 500 }}>{dt.test_reason?.replace(/_/g," ")} · {dt.specimen_type}</div>
                <div style={{ fontSize: 11, color: C.textTert }}>{new Date(dt.tested_at).toLocaleDateString("en-ZA")}</div>
              </div>
              <Badge color={dt.result === "negative" ? "teal" : dt.result === "positive" ? "red" : "amber"}>{dt.result}</Badge>
            </div>
          ))}
        </Card>
      )}

      {/* IOD */}
      {iods.length > 0 && (
        <Card>
          <SectionTitle>IOD incidents ({iods.length})</SectionTitle>
          {iods.slice(0,5).map(iod => (
            <div key={iod.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 500 }}>{iod.incident_type?.replace(/_/g," ")} · {iod.severity?.replace(/_/g," ")}</div>
                <div style={{ fontSize: 11, color: C.textTert }}>{new Date(iod.incident_at).toLocaleDateString("en-ZA")}</div>
              </div>
              <Badge color={iod.severity === "fatality" ? "red" : iod.severity === "lost_time" ? "amber" : "gray"}>{iod.severity?.replace(/_/g," ")}</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

const EmployerDetail = ({ employer, persons, db, refreshData, onBack }) => {
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selPerson, setSelPerson] = useState(null);
  const EMPTY_PERSON = {
    first_name: "", last_name: "", id_number: "", date_of_birth: "",
    gender: "", job_title: "", department: "", site: "",
    employment_status: "active", start_date: "",
  };
  const [form, setForm] = useState(EMPTY_PERSON);
  const [localPersons, setLocalPersons] = useState(persons);
  const [personPage, setPersonPage] = useState(0);
  const PERSONS_PER_PAGE = 20;

  // Keep in sync if parent refreshes — use length + ids as dep to avoid infinite loop
  useEffect(() => setLocalPersons(persons), [persons.map(p => p.id).join(",")]);

  const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) return;
    setSaving(true);
    const payload = {
      ...form,
      employer_id: employer.id,
      date_of_birth: form.date_of_birth || null,
      start_date: form.start_date || null,
      created_at: new Date().toISOString(),
    };
    try {
      if (!USE_MOCK && db) {
        const res = await db.from("person").insert(payload).select();
        if (res.data?.[0]) {
          setLocalPersons(prev => [...prev, res.data[0]]);
        } else {
          setLocalPersons(prev => [...prev, { ...payload, id: `p_${Date.now()}` }]);
        }
        await refreshData();
      } else {
        setLocalPersons(prev => [...prev, { ...payload, id: `p_${Date.now()}` }]);
      }
    } catch(e) {
      console.warn("Add person error", e);
      setLocalPersons(prev => [...prev, { ...payload, id: `p_${Date.now()}` }]);
    }
    setForm(EMPTY_PERSON);
    setShowAddPerson(false);
    setSaving(false);
  };

  // Show person detail if one is selected
  if (selPerson) {
    return <PersonDetail person={selPerson} employer={employer} onBack={() => setSelPerson(null)} />;
  }

  const filteredPersons = localPersons.filter(p => {
    const q = search.toLowerCase();
    return !q || `${p.first_name} ${p.last_name} ${p.job_title || ""} ${p.department || ""} ${p.employee_number || ""}`.toLowerCase().includes(q);
  });
  const totalPages = Math.ceil(filteredPersons.length / PERSONS_PER_PAGE);
  const pagedPersons = filteredPersons.slice(personPage * PERSONS_PER_PAGE, (personPage + 1) * PERSONS_PER_PAGE);

  return (
    <div>
      <Btn variant="ghost" size="sm" onClick={onBack} style={{ marginBottom: "1rem" }}>← Back</Btn>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{employer.name}</div>
      <div style={{ fontSize: 13, color: C.textSub, marginBottom: "1.25rem" }}>
        COIDA ref: {employer.coida_ref || "—"} · Insurer: {(employer.coida_insurer || "").replace(/_/g, " ").toUpperCase()}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SectionTitle style={{ marginBottom: 0 }}>Employees ({localPersons.length})</SectionTitle>
        <Btn size="sm" onClick={() => setShowAddPerson(v => !v)}>
          {showAddPerson ? "Cancel" : "+ Add employee"}
        </Btn>
      </div>
      {localPersons.length > 0 && (
        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, job title, department…"
            style={{ width: "100%", padding: "8px 10px 8px 32px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box", background: C.bgCard }}
          />
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.textTert }}>🔍</span>
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 14, color: C.textTert, cursor: "pointer" }}>✕</button>}
        </div>
      )}

      {showAddPerson && (
        <Card style={{ marginBottom: "1rem", border: `1px solid ${C.teal}` }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>New employee</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>FIRST NAME *</div>
              <input style={inputStyle} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>LAST NAME *</div>
              <input style={inputStyle} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>ID NUMBER</div>
              <input style={inputStyle} value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} placeholder="SA ID number" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>DATE OF BIRTH</div>
              <input style={inputStyle} type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>GENDER</div>
              <select style={inputStyle} value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>STATUS</div>
              <select style={inputStyle} value={form.employment_status} onChange={e => setForm(f => ({ ...f, employment_status: e.target.value }))}>
                {EMPLOYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>JOB TITLE</div>
              <input style={inputStyle} value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} placeholder="e.g. Boilermaker" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>DEPARTMENT</div>
              <input style={inputStyle} value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Maintenance" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>SITE / LOCATION</div>
              <input style={inputStyle} value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))} placeholder="e.g. Plant 2" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>START DATE</div>
              <input style={inputStyle} type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" onClick={handleSave} disabled={saving || !form.first_name || !form.last_name}>
              {saving ? "Saving..." : "Save employee"}
            </Btn>
            <Btn size="sm" variant="secondary" onClick={() => { setShowAddPerson(false); setForm(EMPTY_PERSON); }}>Cancel</Btn>
          </div>
        </Card>
      )}

      {localPersons.length === 0 && !showAddPerson && (
        <Card style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: 13, color: C.textSub, marginBottom: 8 }}>No employees yet.</div>
          <Btn size="sm" onClick={() => setShowAddPerson(true)}>+ Add first employee</Btn>
        </Card>
      )}

      {filteredPersons.length === 0 && localPersons.length > 0 && (
        <div style={{ fontSize: 13, color: C.textTert, padding: "1rem 0", textAlign: "center" }}>No employees match "{search}"</div>
      )}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, padding: "8px 0" }}>
          <Btn variant="ghost" size="sm" onClick={() => setPersonPage(p => Math.max(0, p - 1))} disabled={personPage === 0}>← Prev</Btn>
          <span style={{ fontSize: 12, color: C.textSub }}>Page {personPage + 1} of {totalPages} ({filteredPersons.length} employees)</span>
          <Btn variant="ghost" size="sm" onClick={() => setPersonPage(p => Math.min(totalPages - 1, p + 1))} disabled={personPage === totalPages - 1}>Next →</Btn>
        </div>
      )}
      {pagedPersons.map(p => (
        <Card key={p.id} style={{ marginBottom: 8, cursor: "pointer" }} onClick={() => setSelPerson(p)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.teal }}>{p.first_name} {p.last_name}</div>
              <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>
                {[p.job_title, p.department, p.site].filter(Boolean).join(" · ")}
              </div>
              {p.employee_number && <div style={{ fontSize: 11, color: C.textTert, marginTop: 1 }}>Emp #: {p.employee_number}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Badge color={p.employment_status === "active" ? "teal" : p.employment_status === "contractor" ? "amber" : "gray"}>
                {p.employment_status}
              </Badge>
              <span style={{ fontSize: 16, color: C.textTert }}>›</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const Employers = ({ navigate }) => {
  const { employers, persons: allPersons, db, refreshData } = useData();
  const [sel, setSel] = useState(null);
  const [showAddEmployer, setShowAddEmployer] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: "", coida_ref: "", industry_class: "", coida_insurer: "compensation_fund", contact_email: "" });
  const [saving, setSaving] = useState(false);

  const handleAddEmployer = async () => {
    if (!newEmp.name) return;
    setSaving(true);
    if (!USE_MOCK && db) {
      await db.from("employer").insert({ ...newEmp, created_at: new Date().toISOString() });
      await refreshData();
    }
    setShowAddEmployer(false);
    setNewEmp({ name: "", coida_ref: "", industry_class: "", coida_insurer: "compensation_fund", contact_email: "" });
    setSaving(false);
  };

  if (sel) {
    const persons = allPersons.filter(p => p.employer_id === sel.id);
    return (
      <EmployerDetail
        employer={sel}
        persons={persons}
        db={db}
        refreshData={refreshData}
        onBack={() => setSel(null)}
      />
    );
  }
  const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Employers</div>
        <Btn size="sm" onClick={() => setShowAddEmployer(true)}>+ Add employer</Btn>
      </div>
      {showAddEmployer && (
        <Card style={{ marginBottom: "1rem", border: `1px solid ${C.teal}` }}>
          <SectionTitle>New employer</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>COMPANY NAME *</div><input style={inputStyle} value={newEmp.name} onChange={e => setNewEmp(n => ({...n, name: e.target.value}))} placeholder="Company name" /></div>
            <div><div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>COIDA REF</div><input style={inputStyle} value={newEmp.coida_ref} onChange={e => setNewEmp(n => ({...n, coida_ref: e.target.value}))} placeholder="CF-2024-001" /></div>
            <div><div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>INDUSTRY</div><select style={inputStyle} value={newEmp.industry_class} onChange={e => setNewEmp(n => ({...n, industry_class: e.target.value}))}><option value="">Select...</option>{["Construction","Mining","Manufacturing","Agriculture","Transport","Logistics","Food processing","Chemical","Healthcare","Other"].map(i => <option key={i} value={i}>{i}</option>)}</select></div>
            <div><div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>COIDA INSURER</div><select style={inputStyle} value={newEmp.coida_insurer} onChange={e => setNewEmp(n => ({...n, coida_insurer: e.target.value}))}><option value="compensation_fund">Compensation Fund</option><option value="rma">RMA</option><option value="fem">FEM</option></select></div>
          </div>
          <input style={{...inputStyle, marginBottom: 10}} value={newEmp.contact_email} onChange={e => setNewEmp(n => ({...n, contact_email: e.target.value}))} placeholder="HR contact email" type="email" />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" onClick={handleAddEmployer} disabled={saving || !newEmp.name}>{saving ? "Saving..." : "Save employer"}</Btn>
            <Btn size="sm" variant="secondary" onClick={() => setShowAddEmployer(false)}>Cancel</Btn>
          </div>
        </Card>
      )}
      {employers.map(e => (
        <Card key={e.id} style={{ marginBottom: 8, cursor: "pointer" }} onClick={() => setSel(e)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{e.name}</div>
              <div style={{ fontSize: 12, color: C.textSub }}>{e.industry_class} · {allPersons.filter(p => p.employer_id === e.id).length} employees</div>
              <div style={{ fontSize: 11, color: C.textTert, marginTop: 2 }}>COIDA: {e.coida_ref}</div>
            </div>
            <Badge color={e.coida_insurer === "fem" ? "amber" : "teal"}>{(e.coida_insurer || "compensation_fund").replace(/_/g, " ").toUpperCase()}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
// Builder pattern: supports .insert().select(), .update().eq(), .select().order().limit() etc.
const makeClient = (getHeaders) => {
  const client = {
    from: (table) => {
      // Builder state
      let _method = "GET";
      let _body = null;
      let _filters = [];   // ["col=eq.val", ...]
      let _order = null;   // "col.asc" | "col.desc"
      let _limit = null;
      let _wantReturn = false;
      let _upsertConflict = null;

      const buildQS = () => {
        const parts = [..._filters];
        if (_order) parts.push(`order=${_order}`);
        if (_limit) parts.push(`limit=${_limit}`);
        return parts.length ? `?${parts.join("&")}` : "";
      };

      const execute = async () => {
        if (USE_MOCK) {
          if (_method === "POST" || _method === "PATCH") {
            const row = typeof _body === "string" ? JSON.parse(_body) : _body;
            if (Array.isArray(row)) return { data: row.map(r => ({ ...r, id: r.id || crypto.randomUUID() })), error: null };
            return { data: [{ ...row, id: row.id || crypto.randomUUID() }], error: null };
          }
          return { data: [], error: null };
        }
        try {
          const headers = { ...getHeaders() };
          if (_wantReturn) headers["Prefer"] = "return=representation";
          const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${buildQS()}`, {
            method: _method, headers, body: _body,
          });
          const text = await r.text();
          let data = null;
          try { data = text ? JSON.parse(text) : null; } catch { data = null; }
          if (!r.ok) return { data: null, error: data || { message: r.statusText } };
          return { data: Array.isArray(data) ? data : (data ? [data] : []), error: null };
        } catch(e) { return { data: null, error: e }; }
      };

      const builder = {
        // Terminal: run the query
        then: (res, rej) => execute().then(res, rej),

        // READ
        select: (filter = "") => {
          // Only set GET if no write method already set (i.e. not after insert/update)
          if (_method === "GET" || !_method) _method = "GET";
          // If called after insert/update, just ensure return=representation (already set by _wantReturn)
          if (filter) _filters.push(...filter.split("&").filter(Boolean));
          return builder;
        },
        order: (col, opts = {}) => {
          _order = `${col}.${opts.ascending === false ? "desc" : opts.ascending === true ? "asc" : "desc"}`;
          return builder;
        },
        limit: (n) => { _limit = n; return builder; },
        eq: (col, val) => { _filters.push(`${col}=eq.${val}`); return builder; },
        neq: (col, val) => { _filters.push(`${col}=neq.${val}`); return builder; },
        is: (col, val) => { _filters.push(`${col}=is.${val}`); return builder; },
        not: (col, op, val) => { _filters.push(`${col}=not.${op}.${val}`); return builder; },

        // WRITE
        insert: (row) => {
          _method = "POST";
          _body = JSON.stringify(row);
          _wantReturn = true;
          return builder;
        },
        update: (vals) => {
          _method = "PATCH";
          _body = JSON.stringify(vals);
          _wantReturn = true;
          return builder;
        },
        upsert: (rows, opts = {}) => {
          _method = "POST";
          _body = JSON.stringify(rows);
          _wantReturn = true;
          if (opts.onConflict) {
            _filters.push(`on_conflict=${opts.onConflict}`);
          }
          // Supabase upsert uses Prefer header
          return {
            ...builder,
            then: (res, rej) => {
              const h = { ...getHeaders(), "Prefer": `resolution=merge-duplicates,return=representation` };
              if (USE_MOCK) return Promise.resolve({ data: [], error: null }).then(res, rej);
              return fetch(`${SUPABASE_URL}/rest/v1/${table}${buildQS()}`, {
                method: "POST", headers: h, body: _body,
              }).then(async r => {
                const text = await r.text();
                let data = null;
                try { data = text ? JSON.parse(text) : null; } catch {}
                return r.ok ? { data: data || [], error: null } : { data: null, error: data };
              }).then(res, rej);
            }
          };
        },
        delete: () => {
          _method = "DELETE";
          return builder;
        },
      };
      return builder;
    },
  };
  return client;
};

const sb = makeClient(() => ({
  "apikey": SUPABASE_ANON,
  "Authorization": `Bearer ${SUPABASE_ANON}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
}));

// ─── OFFLINE QUEUE ────────────────────────────────────────────────────────────
const OFFLINE_DB = "oh_offline";
const OFFLINE_STORE = "queue";

const offlineQ = {
  open: () => new Promise((res, rej) => {
    const req = indexedDB.open(OFFLINE_DB, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(OFFLINE_STORE, { keyPath: "id", autoIncrement: true });
    req.onsuccess = e => res(e.target.result);
    req.onerror = e => rej(e);
  }),
  push: async (record) => {
    try {
      const db = await offlineQ.open();
      const tx = db.transaction(OFFLINE_STORE, "readwrite");
      tx.objectStore(OFFLINE_STORE).add(record);
    } catch(e) { console.warn("IndexedDB push failed:", e); }
  },
  getAll: async () => {
    try {
      const db = await offlineQ.open();
      return new Promise((res) => {
        const tx = db.transaction(OFFLINE_STORE, "readonly");
        const req = tx.objectStore(OFFLINE_STORE).getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => res([]);
      });
    } catch(e) { return []; }
  },
  remove: async (id) => {
    try {
      const db = await offlineQ.open();
      const tx = db.transaction(OFFLINE_STORE, "readwrite");
      tx.objectStore(OFFLINE_STORE).delete(id);
    } catch(e) {}
  },
  flush: async () => {
    if (!navigator.onLine || USE_MOCK) return;
    const items = await offlineQ.getAll();
    for (const item of items) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${item.table}`, {
          method: "POST",
          headers: sb.headers(),
          body: JSON.stringify(item.payload),
        });
        if (r.ok) await offlineQ.remove(item.id);
      } catch(e) {}
    }
  },
};

// ─── AUDIT LOG HELPER ─────────────────────────────────────────────────────────
const writeAuditLog = async (action, tableName, recordId, personId, employerId, detail = {}) => {
  const entry = {
    actor_type: "practitioner",
    action,
    table_name: tableName,
    record_id: recordId,
    person_id: personId,
    employer_id: employerId,
    client_timestamp: new Date().toISOString(),
    detail,
  };
  if (!navigator.onLine || USE_MOCK) {
    await offlineQ.push({ table: "audit_log", payload: entry, client_timestamp: entry.client_timestamp });
  } else {
    await sb.from("audit_log").insert(entry);
  }
};

// ─── VET VOICE MODEL (OHP style) ─────────────────────────────────────────────
const saveSignedNote = (note) => {
  try {
    const notes = JSON.parse(localStorage.getItem(LS.SIGNED_NOTES) || "[]");
    notes.unshift(note);
    localStorage.setItem(LS.SIGNED_NOTES, JSON.stringify(notes.slice(0, 10)));
  } catch(e) {}
};

const getStyleExamples = () => {
  try {
    const notes = JSON.parse(localStorage.getItem(LS.SIGNED_NOTES) || "[]");
    return notes.slice(0, 3).map(n =>
      `S: ${n.subjective}\nO: ${n.objective}\nA: ${n.assessment}\nP: ${n.plan}`
    ).join("\n\n---\n\n");
  } catch(e) { return ""; }
};

// ─── INPUT COMPONENT ─────────────────────────────────────────────────────────
const Field = ({ label, children, style = {} }) => (
  <div style={{ marginBottom: 10, ...style }}>
    <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: C.textTert, marginBottom: 4, fontWeight: 500 }}>{label}</div>
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder = "", type = "text", style = {} }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", ...style }} />
);

const Select = ({ value, onChange, children, style = {} }) => (
  <select value={value} onChange={onChange}
    style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", background: "#fff", outline: "none", ...style }}>
    {children}
  </select>
);

const Textarea = ({ value, onChange, rows = 3, placeholder = "" }) => (
  <textarea value={value} onChange={onChange} rows={rows} placeholder={placeholder}
    style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", lineHeight: 1.6 }} />
);

// ─── ENCOUNTER DETAIL VIEW ────────────────────────────────────────────────────
// ─── AI LETTERS ───────────────────────────────────────────────────────────────
// Generates referral letters, sick notes, return-to-work certificates
// from a signed encounter's assessment + plan. No clinical hallucination —
// Claude only reformats what the OHP has already written.

const LETTER_TYPES = [
  { value: "referral",   label: "Specialist referral",    icon: "📋" },
  { value: "sick_note",  label: "Sick note",              icon: "🏥" },
  { value: "rtw",        label: "Return-to-work cert",    icon: "✅" },
];

const AILetters = ({ enc, person, employer, session }) => {
  const [generating, setGenerating] = useState(null); // letter type being generated
  const [letters, setLetters] = useState({}); // keyed by letter type
  const [showLetter, setShowLetter] = useState(null);
  const meta = session?.user?.user_metadata || {};

  const generate = async (type) => {
    setGenerating(type);
    try {
      const typeLabel = LETTER_TYPES.find(t => t.value === type)?.label || type;
      const systemPrompt = `You are an occupational health practitioner assistant. Generate a professional ${typeLabel} letter for South Africa based on the clinical notes provided. Use formal medical letter format. Include date, patient details, practitioner details. Do not add clinical information not present in the notes. Output plain text only — no markdown, no asterisks.`;

      const contextLines = [
        `Patient: ${person?.first_name || ""} ${person?.last_name || ""}`,
        `ID: ${person?.id_number || "not provided"}`,
        `DOB: ${person?.date_of_birth || "not provided"}`,
        `Occupation: ${person?.job_title || "not provided"}`,
        `Employer: ${employer?.name || "not provided"}`,
        `Encounter date: ${enc.encounter_at ? new Date(enc.encounter_at).toLocaleDateString("en-ZA") : ""}`,
        `Encounter type: ${enc.encounter_type?.replace(/_/g," ") || ""}`,
        enc.assessment ? `Assessment: ${enc.assessment}` : "",
        enc.plan ? `Plan: ${enc.plan}` : "",
        `Practitioner: ${enc.signed_by || meta.full_name || ""}`,
      ].filter(Boolean).join("\n");

      const typeInstruction = {
        referral: "Write a specialist referral letter. Include reason for referral, clinical summary, and specific request.",
        sick_note: "Write a medical certificate of illness/incapacity. State the period of incapacity and return-to-work date if known. Keep it concise and formal.",
        rtw: "Write a return-to-work certificate. State that the patient is fit to return, with any restrictions or modifications required. Reference the encounter date.",
      }[type] || "";

      const res = await fetch("/.netlify/functions/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          messages: [{ role: "user", content: `${typeInstruction}\n\nClinical context:\n${contextLines}` }],
          max_tokens: 600,
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      setLetters(prev => ({ ...prev, [type]: text }));
      setShowLetter(type);
    } catch(e) {
      console.error("Letter generation error:", e);
      alert("Failed to generate letter: " + e.message);
    }
    setGenerating(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <SectionTitle>AI letters</SectionTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
        {LETTER_TYPES.map(t => (
          <Btn key={t.value} size="sm" variant="secondary" onClick={() => generate(t.value)} disabled={!!generating}>
            {generating === t.value ? "Generating..." : `${t.icon} ${t.label}`}
          </Btn>
        ))}
      </div>

      {showLetter && letters[showLetter] && (
        <Card style={{ border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {LETTER_TYPES.map(t => (
                <button key={t.value} onClick={() => setShowLetter(letters[t.value] ? t.value : showLetter)}
                  style={{ fontSize: 12, padding: "4px 10px", borderRadius: 5, border: `1px solid ${C.border}`,
                    background: showLetter === t.value ? C.teal : C.bgSub, color: showLetter === t.value ? "#fff" : C.textSub,
                    cursor: letters[t.value] ? "pointer" : "not-allowed", opacity: letters[t.value] ? 1 : 0.4 }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn size="sm" variant="secondary" onClick={() => copyToClipboard(letters[showLetter])}>Copy</Btn>
              <Btn size="sm" variant="ghost" onClick={() => {
                const w = window.open("", "_blank");
                w.document.write(`<pre style="font-family:Georgia,serif;font-size:14px;line-height:1.8;padding:2rem;max-width:700px;margin:auto">${letters[showLetter]}</pre>`);
                w.print();
              }}>Print</Btn>
            </div>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap", color: C.text, fontFamily: "Georgia, serif", background: C.bgSub, padding: "1rem", borderRadius: 6 }}>
            {letters[showLetter]}
          </div>
        </Card>
      )}
    </div>
  );
};

const EncounterDetail = ({ enc, onBack, session }) => {
  const { persons, employers, fitnessCerts } = useData();
  const person = persons.find(p => p.id === enc.person_id);
  const employer = employers.find(e => e.id === enc.employer_id);
  const fc = fitnessCerts.find(f => f.encounter_id === enc.id);
  const [printing, setPrinting] = useState(false);

  const printCert = async () => {
    if (!fc) return;
    setPrinting(true);
    try {
      const meta = session?.user?.user_metadata || {};
      const payload = {
        cert_id: fc.id,
        practice_name: meta.tenant_name || "OccHealth Pro SA",
        person_name: person ? `${person.first_name} ${person.last_name}` : "",
        employee_number: person?.employee_number || "",
        employer_name: employer?.name || "",
        role_category: fc.role_category || person?.job_title || "",
        date_of_birth: person?.date_of_birth || "",
        site: enc.site || employer?.name || "",
        fitness_status: fc.fitness_status,
        restrictions: fc.restrictions || [],
        valid_from: fc.valid_from,
        valid_until: fc.valid_until,
        validity_period: (() => {
          if (!fc.valid_from || !fc.valid_until) return "12 months";
          const months = Math.round((new Date(fc.valid_until) - new Date(fc.valid_from)) / (1000 * 60 * 60 * 24 * 30));
          return `${months} months`;
        })(),
        notes: fc.notes || enc.assessment || "",
        practitioner_name: enc.signed_by || meta.full_name || "",
        qualification: meta.qualification || "",
        sanc_number: meta.sanc_number || "",
        signed_at: fc.valid_from,
      };
      const res = await fetch("/.netlify/functions/fitness-cert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch(e) {
      alert("Failed to generate certificate: " + e.message);
    }
    setPrinting(false);
  };
  return (
    <div>
      <Btn variant="ghost" size="sm" onClick={onBack} style={{ marginBottom: "1rem" }}>← Back</Btn>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>{person?.first_name} {person?.last_name}</div>
          <div style={{ fontSize: 13, color: C.textSub }}>{employer?.name} · {enc.encounter_type.replace(/_/g," ")}</div>
          <div style={{ fontSize: 11, color: C.textTert }}>{new Date(enc.encounter_at).toLocaleString("en-ZA")}</div>
        </div>
        <Badge color={enc.signed_at ? "teal" : "amber"}>{enc.signed_at ? "Signed" : "Draft"}</Badge>
      </div>
      {enc.vitals && (
        <>
          <SectionTitle>Vitals</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: "1rem" }}>
            {enc.vitals.bp_systolic && <StatCard label="Blood pressure" value={`${enc.vitals.bp_systolic}/${enc.vitals.bp_diastolic}`} sub="mmHg" />}
            {enc.vitals.hr && <StatCard label="Heart rate" value={enc.vitals.hr} sub="bpm" />}
            {enc.vitals.weight && <StatCard label="Weight" value={`${enc.vitals.weight}kg`} />}
            {enc.vitals.height && <StatCard label="Height" value={`${enc.vitals.height}cm`} />}
            {enc.vitals.bmi && <StatCard label="BMI" value={enc.vitals.bmi} color={enc.vitals.bmi > 30 ? C.amber : C.teal} />}
            {enc.vitals.temp && <StatCard label="Temp" value={`${enc.vitals.temp}°C`} />}
          </div>
        </>
      )}
      <SectionTitle>Clinical notes</SectionTitle>
      {[
        { label: "Subjective (S)", value: enc.subjective },
        { label: "Objective (O)", value: enc.objective },
        { label: "Assessment (A)", value: enc.assessment },
        { label: "Plan (P)", value: enc.plan },
      ].filter(f => f.value).map(f => (
        <Card key={f.label} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: C.textTert, marginBottom: 4 }}>{f.label}</div>
          <div style={{ fontSize: 13, lineHeight: 1.65, color: C.text }}>{f.value}</div>
        </Card>
      ))}
      {enc.signed_at && (
        <div style={{ fontSize: 12, color: C.textSub, marginTop: 8 }}>
          Signed by <strong>{enc.signed_by}</strong> on {new Date(enc.signed_at).toLocaleString("en-ZA")}
          {enc.ai_generated && <span style={{ marginLeft: 8 }}><Badge color="gray">AI-assisted</Badge></span>}
        </div>
      )}

      {/* AI letters — only on signed encounters with assessment/plan */}
      {enc.signed_at && (enc.assessment || enc.plan) && (
        <AILetters enc={enc} person={person} employer={employer} session={session} />
      )}

      {fc && (
        <>
          <SectionTitle style={{ marginTop: "1rem" }}>Fitness certificate</SectionTitle>
          <Card style={{ border: `1px solid ${C.tealMid}`, background: C.tealLight }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.tealDark }}>{fc.fitness_status.replace(/_/g," ").toUpperCase()}</div>
                <div style={{ fontSize: 12, color: C.teal }}>Valid: {new Date(fc.valid_from).toLocaleDateString("en-ZA")} – {new Date(fc.valid_until).toLocaleDateString("en-ZA")}</div>
                {fc.restrictions?.length > 0 && <div style={{ fontSize: 12, color: C.teal, marginTop: 2 }}>Restrictions: {fc.restrictions.join(", ")}</div>}
              </div>
              <Btn size="sm" variant="ghost" onClick={printCert} disabled={printing} style={{ borderColor: C.teal, color: C.teal }}>{printing ? "Generating..." : "Print cert"}</Btn>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

// ─── SIGN MODAL ───────────────────────────────────────────────────────────────
const SignModal = ({ form, person, onConfirm, onCancel, session }) => {
  const [fcEnabled, setFcEnabled] = useState(["pre_employment","periodic","exit","surveillance"].includes(form.encounter_type));
  const [fcStatus, setFcStatus] = useState("fit");
  const [fcRestrictions, setFcRestrictions] = useState("");
  const [fcMonths, setFcMonths] = useState(12);
  const [signing, setSigning] = useState(false);

  const handleSign = async () => {
    setSigning(true);
    const now = new Date().toISOString();
    const validFrom = now.slice(0,10);
    const validUntil = new Date(Date.now() + fcMonths * 30 * 86400000).toISOString().slice(0,10);
    const fc = fcEnabled ? {
      fitness_status: fcStatus,
      restrictions: fcRestrictions ? fcRestrictions.split(",").map(s => s.trim()).filter(Boolean) : [],
      valid_from: validFrom,
      valid_until: validUntil,
      role_category: person?.job_title || "",
    } : null;
    await onConfirm(now, fc);
    setSigning(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: "100%", maxWidth: 480 }}>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Sign & finalise encounter</div>
        <div style={{ fontSize: 13, color: C.textSub, marginBottom: "1.25rem" }}>
          {person?.first_name} {person?.last_name} · {form.encounter_type.replace(/_/g," ")}
        </div>
        <div style={{ background: C.amberLight, border: `1px solid #E8C56A`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: C.amber, marginBottom: "1.25rem" }}>
          ⚠ Once signed this record is locked and cannot be edited. Corrections require a new encounter.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
          <input type="checkbox" id="fc-toggle" checked={fcEnabled} onChange={e => setFcEnabled(e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor="fc-toggle" style={{ fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Issue fitness certificate</label>
        </div>
        {fcEnabled && (
          <div style={{ background: C.bgSub, borderRadius: 8, padding: "1rem", marginBottom: "1rem" }}>
            <Field label="Fitness status">
              <Select value={fcStatus} onChange={e => setFcStatus(e.target.value)}>
                <option value="fit">Fit</option>
                <option value="fit_with_restrictions">Fit with restrictions</option>
                <option value="temporarily_unfit">Temporarily unfit</option>
                <option value="permanently_unfit">Permanently unfit</option>
              </Select>
            </Field>
            {fcStatus === "fit_with_restrictions" && (
              <Field label="Restrictions (comma-separated)">
                <Input value={fcRestrictions} onChange={e => setFcRestrictions(e.target.value)} placeholder="No heights, Limited lifting..." />
              </Field>
            )}
            <Field label="Valid for (months)">
              <Select value={fcMonths} onChange={e => setFcMonths(Number(e.target.value))}>
                {[3,6,9,12,18,24].map(m => <option key={m} value={m}>{m} months</option>)}
              </Select>
            </Field>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onCancel} disabled={signing}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSign} disabled={signing}>
            {signing ? "Signing..." : "Sign & finalise"}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ─── VOICE TO NOTE ────────────────────────────────────────────────────────────
const useVoiceToNote = (onResult, context = {}) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [generating, setGenerating] = useState(false);
  const recRef = useRef(null);

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported in this browser"); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-ZA";
    rec.onresult = e => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setTranscript(t);
    };
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  const stop = async () => {
    recRef.current?.stop();
    setListening(false);
    if (!transcript) return;
    setGenerating(true);
    try {
      const styleExamples = getStyleExamples();

      // Build rich context string from person/employer/encounter data
      const ctx = [];
      if (context.encounterType) ctx.push(`Encounter type: ${context.encounterType.replace(/_/g, " ")}`);
      if (context.personName) ctx.push(`Patient: ${context.personName}`);
      if (context.jobTitle) ctx.push(`Occupation: ${context.jobTitle}`);
      if (context.employer) ctx.push(`Employer: ${context.employer}`);
      if (context.hazardProfiles?.length) ctx.push(`Hazard exposures: ${context.hazardProfiles.join(", ")}`);
      if (context.vitals?.bp_systolic) ctx.push(`BP: ${context.vitals.bp_systolic}/${context.vitals.bp_diastolic} mmHg`);
      if (context.vitals?.hr) ctx.push(`HR: ${context.vitals.hr} bpm`);
      if (context.vitals?.weight) ctx.push(`Weight: ${context.vitals.weight} kg`);
      const contextStr = ctx.length ? `\n\nPatient context:\n${ctx.join("\n")}` : "";

      const styleSection = styleExamples
        ? `\n\nHere are examples of this practitioner's writing style (match it precisely):\n\n${styleExamples}`
        : "";

      const systemPrompt = `You are an occupational health clinical note assistant for South Africa. Generate structured SOAP notes from voice transcripts. Write concisely in the style of an experienced occupational health practitioner. Use standard SA OHP terminology. Do not fabricate clinical findings — only include what is in the transcript.${styleSection} Respond ONLY with JSON: {"subjective":"...","objective":"...","assessment":"...","plan":"..."}`;

      const userMsg = `Generate a SOAP note from this voice transcript.${contextStr}\n\nTranscript: ${transcript}`;

      const res = await fetch("/.netlify/functions/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          messages: [{ role: "user", content: userMsg }],
          max_tokens: 800,
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      onResult(parsed);
    } catch(e) {
      console.error("Voice-to-note error:", e);
    }
    setGenerating(false);
    setTranscript("");
  };

  return { listening, transcript, generating, start, stop };
};

// ─── ENCOUNTERS SCREEN ────────────────────────────────────────────────────────
const Encounters = ({ navigate, session }) => {
  const { encounters: ctxEncounters, fitnessCerts: ctxFitnessCerts } = useData();
  const [encounters, setEncounters] = useState(ctxEncounters);
  const [fitnessCerts, setFitnessCerts] = useState(ctxFitnessCerts);
  // Sync local state when DataContext loads live data
  useEffect(() => { setEncounters(ctxEncounters); }, [ctxEncounters]);
  useEffect(() => { setFitnessCerts(ctxFitnessCerts); }, [ctxFitnessCerts]);
  const [view, setView] = useState("list"); // list | new | detail
  const [selEnc, setSelEnc] = useState(null);
  const [showSign, setShowSign] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // null | "saving" | "saved" | "offline"

  const EMPTY_FORM = {
    person_id: "", encounter_type: "periodic", site: "",
    vitals: { bp_systolic: "", bp_diastolic: "", hr: "", temp: "", weight: "", height: "", bmi: "" },
    subjective: "", objective: "", assessment: "", plan: "",
  };
  const [form, setForm] = useState(EMPTY_FORM);

  const setVital = (k, v) => setForm(f => ({ ...f, vitals: { ...f.vitals, [k]: v } }));
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-calc BMI
  useEffect(() => {
    const { weight, height } = form.vitals;
    if (weight && height && Number(height) > 0) {
      const bmi = (Number(weight) / Math.pow(Number(height) / 100, 2)).toFixed(1);
      setForm(f => ({ ...f, vitals: { ...f.vitals, bmi } }));
    }
  }, [form.vitals.weight, form.vitals.height]);

  const { persons: allPersons, employers: allEmployers, db: liveDb, setLiveEncounters, setLiveFitnessCerts } = useData();
  const person = allPersons.find(p => p.id === form.person_id);
  const employer = person ? allEmployers.find(e => e.id === person.employer_id) : null;

  // Voice to note
  const voice = useVoiceToNote((parsed) => {
    setForm(f => ({ ...f,
      subjective: parsed.subjective || f.subjective,
      objective: parsed.objective || f.objective,
      assessment: parsed.assessment || f.assessment,
      plan: parsed.plan || f.plan,
    }));
  }, {
    encounterType: form.encounter_type,
    personName: person ? `${person.first_name} ${person.last_name}` : undefined,
    jobTitle: person?.job_title,
    employer: employer?.name,
    vitals: form.vitals,
  });

  const handleSign = async (signedAt, fc) => {
    setSyncStatus("saving");
    const now = new Date().toISOString();
    const encId = crypto.randomUUID();
    const meta = session.user.user_metadata;

    const vitalsClean = Object.fromEntries(
      Object.entries(form.vitals).filter(([,v]) => v !== "" && v !== null)
    );

    const encRecord = {
      id: encId,
      person_id: form.person_id,
      employer_id: employer?.id || "",
      encounter_at: now,
      client_timestamp: now,
      encounter_type: form.encounter_type,
      site: form.site || employer?.name || "",
      vitals: Object.keys(vitalsClean).length > 0 ? vitalsClean : null,
      subjective: form.subjective,
      objective: form.objective,
      assessment: form.assessment,
      plan: form.plan,
      signed_by: meta.full_name,
      signed_at: signedAt,
      ai_generated: voice.generating,
    };

    // Save to Supabase or offline queue
    const activeDb = liveDb || sb;
    if (navigator.onLine && !USE_MOCK) {
      const { error } = await activeDb.from("clinical_encounter").insert(encRecord);
      if (error) {
        await offlineQ.push({ table: "clinical_encounter", payload: encRecord, client_timestamp: now });
        setSyncStatus("offline");
      } else {
        setSyncStatus("saved");
      }
    } else {
      await offlineQ.push({ table: "clinical_encounter", payload: encRecord, client_timestamp: now });
      setSyncStatus(USE_MOCK ? "saved" : "offline");
    }

    // Save fitness cert if issued
    let fcRecord = null;
    if (fc) {
      fcRecord = {
        id: crypto.randomUUID(),
        encounter_id: encId,
        person_id: form.person_id,
        ...fc,
        superseded: false,
        client_timestamp: now,
      };
      if (navigator.onLine && !USE_MOCK) {
        await activeDb.from("fitness_certificate").insert(fcRecord);
      } else {
        await offlineQ.push({ table: "fitness_certificate", payload: fcRecord, client_timestamp: now });
      }
    }

    // Write audit log
    await writeAuditLog("insert", "clinical_encounter", encId, form.person_id, employer?.id, {
      encounter_type: form.encounter_type,
      signed_by: meta.full_name,
      fitness_cert_issued: !!fc,
    });

    // Save to style model
    saveSignedNote({ subjective: form.subjective, objective: form.objective, assessment: form.assessment, plan: form.plan });

    // Update local state
    const newEnc = { ...encRecord, id: encId };
    setEncounters(prev => [newEnc, ...prev]);
    if (fcRecord) setFitnessCerts(prev => [fcRecord, ...prev]);
    // Also update DataContext live state if available
    if (setLiveEncounters) setLiveEncounters(prev => prev ? [newEnc, ...prev] : [newEnc]);
    if (fcRecord && setLiveFitnessCerts) setLiveFitnessCerts(prev => prev ? [fcRecord, ...prev] : [fcRecord]);

    // Flush offline queue if online
    if (navigator.onLine) offlineQ.flush();

    setShowSign(false);
    setView("detail");
    setSelEnc(newEnc);
    setTimeout(() => setSyncStatus(null), 3000);
  };

  // ── Patient picker modal ──
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const filteredPersons = allPersons.filter(p => {
    const q = pickerSearch.toLowerCase();
    const emp = allEmployers.find(e => e.id === p.employer_id);
    return !q || `${p.first_name} ${p.last_name} ${emp?.name} ${p.job_title}`.toLowerCase().includes(q);
  });

  const startNewEncounter = (personId) => {
    setForm({ ...EMPTY_FORM, person_id: personId });
    setShowPicker(false);
    setPickerSearch("");
    setView("new");
  };

  // ── List view ──
  if (view === "list") return (
    <div>
      {showPicker && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: "100%", maxWidth: 440, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: "1rem" }}>Select employee</div>
            <input
              autoFocus
              value={pickerSearch}
              onChange={e => setPickerSearch(e.target.value)}
              placeholder="Search by name, employer, job title..."
              style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, marginBottom: "0.75rem", outline: "none" }}
            />
            <div style={{ overflowY: "auto", flex: 1 }}>
              {filteredPersons.map(p => {
                const emp = allEmployers.find(e => e.id === p.employer_id);
                return (
                  <div key={p.id} onClick={() => startNewEncounter(p.id)}
                    style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4, border: `0.5px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = C.tealLight}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.first_name} {p.last_name}</div>
                    <div style={{ fontSize: 12, color: C.textSub }}>{emp?.name} · {p.job_title}</div>
                  </div>
                );
              })}
              {filteredPersons.length === 0 && <div style={{ fontSize: 13, color: C.textTert, textAlign: "center", padding: "1rem" }}>No employees found</div>}
            </div>
            <Btn variant="secondary" size="sm" onClick={() => { setShowPicker(false); setPickerSearch(""); }} style={{ marginTop: "1rem" }}>Cancel</Btn>
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Clinical encounters</div>
        <Btn size="sm" onClick={() => setShowPicker(true)}>+ New encounter</Btn>
      </div>
      {encounters.map(enc => {
        const p = allPersons.find(x => x.id === enc.person_id);
        const emp = allEmployers.find(x => x.id === enc.employer_id);
        return (
          <Card key={enc.id} style={{ marginBottom: 8, cursor: "pointer" }} onClick={() => { setSelEnc(enc); setView("detail"); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: enc.assessment ? 8 : 0 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p?.first_name} {p?.last_name}</div>
                <div style={{ fontSize: 12, color: C.textSub }}>{emp?.name} · {enc.encounter_type.replace(/_/g," ")}</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Badge color={enc.signed_at ? "teal" : "amber"}>{enc.signed_at ? "Signed" : "Draft"}</Badge>
                <span style={{ fontSize: 11, color: C.textTert }}>{new Date(enc.encounter_at).toLocaleDateString("en-ZA")}</span>
              </div>
            </div>
            {enc.assessment && <div style={{ fontSize: 12, color: C.textSub, background: C.bgSub, borderRadius: 6, padding: "6px 10px" }}><strong>A:</strong> {enc.assessment}</div>}
          </Card>
        );
      })}
    </div>
  );

  // ── Detail view ──
  if (view === "detail" && selEnc) return (
    <EncounterDetail enc={selEnc} onBack={() => setView("list")} session={session} />
  );

  // ── New encounter form ──
  const canSign = form.person_id && form.assessment && form.plan;

  return (
    <div>
      {showSign && (
        <SignModal
          form={form}
          person={person}
          session={session}
          onConfirm={handleSign}
          onCancel={() => setShowSign(false)}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <Btn variant="ghost" size="sm" onClick={() => setView("list")} style={{ marginBottom: 4 }}>← Encounters</Btn>
          <div style={{ fontSize: 18, fontWeight: 500 }}>New encounter</div>
          {person && <div style={{ fontSize: 13, color: C.textSub }}>{person.first_name} {person.last_name} · {employer?.name}</div>}
        </div>
        {syncStatus && (
          <Badge color={syncStatus === "saved" ? "teal" : syncStatus === "offline" ? "amber" : "gray"}>
            {syncStatus === "saving" ? "Saving..." : syncStatus === "saved" ? "✓ Saved" : "⚡ Offline — queued"}
          </Badge>
        )}
      </div>

      {/* Patient + type */}
      <Card style={{ marginBottom: 10 }}>
        <SectionTitle>Patient & encounter type</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Encounter type">
            <Select value={form.encounter_type} onChange={e => setField("encounter_type", e.target.value)}>
              {["pre_employment","periodic","exit","iod_treatment","surveillance","sick","chronic_review","drug_test_linked"].map(t => (
                <option key={t} value={t}>{t.replace(/_/g," ")}</option>
              ))}
            </Select>
          </Field>
          <Field label="Site / location">
            <Input value={form.site} onChange={e => setField("site", e.target.value)} placeholder={employer?.name || "Site name..."} />
          </Field>
        </div>
      </Card>

      {/* Vitals */}
      <Card style={{ marginBottom: 10 }}>
        <SectionTitle>Vitals</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {[
            { key: "bp_systolic", label: "BP Systolic", unit: "mmHg" },
            { key: "bp_diastolic", label: "BP Diastolic", unit: "mmHg" },
            { key: "hr", label: "Heart rate", unit: "bpm" },
            { key: "temp", label: "Temperature", unit: "°C" },
            { key: "weight", label: "Weight", unit: "kg" },
            { key: "height", label: "Height", unit: "cm" },
          ].map(v => (
            <Field key={v.key} label={`${v.label} (${v.unit})`}>
              <Input type="number" value={form.vitals[v.key]} onChange={e => setVital(v.key, e.target.value)} placeholder="—" />
            </Field>
          ))}
        </div>
        {form.vitals.bmi && (
          <div style={{ fontSize: 12, color: Number(form.vitals.bmi) > 30 ? C.amber : C.teal, marginTop: 4 }}>
            BMI: <strong>{form.vitals.bmi}</strong> {Number(form.vitals.bmi) > 30 ? "— Obese" : Number(form.vitals.bmi) > 25 ? "— Overweight" : "— Normal"}
          </div>
        )}
      </Card>

      {/* SOAP */}
      <Card style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <SectionTitle style={{ margin: 0, border: "none", padding: 0 }}>Clinical notes (SOAP)</SectionTitle>
          <div style={{ display: "flex", gap: 8 }}>
            {voice.generating && <Badge color="amber">Generating...</Badge>}
            {voice.listening && <Badge color="red">● Recording</Badge>}
            <Btn
              size="sm"
              variant={voice.listening ? "danger" : "ghost"}
              onClick={voice.listening ? voice.stop : voice.start}
            >
              {voice.listening ? "Stop & generate" : "🎙 Voice to note"}
            </Btn>
          </div>
        </div>
        {voice.transcript && (
          <div style={{ fontSize: 12, color: C.textSub, background: C.bgSub, borderRadius: 6, padding: "6px 10px", marginBottom: 10, fontStyle: "italic" }}>
            "{voice.transcript}"
          </div>
        )}
        <Field label="S — Subjective (patient's complaint)">
          <Textarea value={form.subjective} onChange={e => setField("subjective", e.target.value)} rows={2} placeholder="Chief complaint, history of presenting illness..." />
        </Field>
        <Field label="O — Objective (clinical findings)">
          <Textarea value={form.objective} onChange={e => setField("objective", e.target.value)} rows={2} placeholder="Examination findings, observations..." />
        </Field>
        <Field label="A — Assessment *">
          <Textarea value={form.assessment} onChange={e => setField("assessment", e.target.value)} rows={2} placeholder="Diagnosis / clinical impression..." />
        </Field>
        <Field label="P — Plan *">
          <Textarea value={form.plan} onChange={e => setField("plan", e.target.value)} rows={2} placeholder="Treatment, referrals, follow-up..." />
        </Field>
      </Card>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Btn variant="primary" disabled={!canSign} onClick={() => setShowSign(true)}>
          Sign & finalise
        </Btn>
        <Btn variant="secondary" onClick={() => setView("list")}>Cancel</Btn>
        {!canSign && <span style={{ fontSize: 12, color: C.textTert }}>Assessment and Plan required to sign</span>}
      </div>
    </div>
  );
};

// ─── SURVEILLANCE REGISTER ────────────────────────────────────────────────────

const TEST_TYPES = [
  { value: "audiometry", label: "Audiometry" },
  { value: "spirometry", label: "Spirometry" },
  { value: "vision", label: "Vision" },
  { value: "bio_monitor", label: "Biological monitoring" },
  { value: "blood_pressure", label: "Blood pressure" },
  { value: "glucose", label: "Glucose" },
  { value: "lung_function", label: "Lung function" },
];

// ── Hazard Profile Modal ──────────────────────────────────────────────────────
const HazardProfileModal = ({ employers, onSave, onClose }) => {
  const [form, setForm] = useState({
    employer_id: employers[0]?.id || "",
    name: "",
    hazard_codes: "",
    surveillance_types: [],
    surveillance_period_months: 12,
  });
  const [saving, setSaving] = useState(false);

  const toggleType = (val) => {
    setForm(f => ({
      ...f,
      surveillance_types: f.surveillance_types.includes(val)
        ? f.surveillance_types.filter(t => t !== val)
        : [...f.surveillance_types, val],
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.employer_id || form.surveillance_types.length === 0) return;
    setSaving(true);
    await onSave({
      ...form,
      hazard_codes: form.hazard_codes.split(",").map(s => s.trim()).filter(Boolean),
      surveillance_period_months: Number(form.surveillance_period_months),
    });
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.bgCard, borderRadius: 12, padding: "1.5rem", width: 480, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: "1rem" }}>New hazard profile</div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: C.textSub, display: "block", marginBottom: 4 }}>Employer</label>
          <select value={form.employer_id} onChange={e => setForm(f => ({ ...f, employer_id: e.target.value }))}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 13 }}>
            {employers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: C.textSub, display: "block", marginBottom: 4 }}>Profile name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Noise-exposed workers"
            style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: C.textSub, display: "block", marginBottom: 4 }}>Hazard codes (comma-separated)</label>
          <input value={form.hazard_codes} onChange={e => setForm(f => ({ ...f, hazard_codes: e.target.value }))}
            placeholder="e.g. NOISE, DUST, SOLVENT"
            style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: C.textSub, display: "block", marginBottom: 8 }}>Required surveillance tests</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {TEST_TYPES.map(t => (
              <label key={t.value} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={form.surveillance_types.includes(t.value)} onChange={() => toggleType(t.value)} />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ fontSize: 12, color: C.textSub, display: "block", marginBottom: 4 }}>Surveillance frequency</label>
          <select value={form.surveillance_period_months} onChange={e => setForm(f => ({ ...f, surveillance_period_months: e.target.value }))}
            style={{ padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 13 }}>
            <option value={6}>Every 6 months</option>
            <option value={12}>Annually</option>
            <option value={24}>Every 2 years</option>
            <option value={36}>Every 3 years</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving || !form.name || form.surveillance_types.length === 0}>
            {saving ? "Saving..." : "Create profile"}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ── Enrol Employees Modal ─────────────────────────────────────────────────────
const EnrolModal = ({ profile, persons, enrolledIds, onSave, onClose }) => {
  const eligible = persons.filter(p => p.employer_id === profile.employer_id);
  const [selected, setSelected] = useState(new Set(enrolledIds));
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleSave = async () => {
    setSaving(true);
    await onSave(profile.id, Array.from(selected));
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.bgCard, borderRadius: 12, padding: "1.5rem", width: 440, maxWidth: "95vw", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Enrol employees</div>
        <div style={{ fontSize: 12, color: C.textSub, marginBottom: "1rem" }}>{profile.name}</div>

        {eligible.length === 0 && (
          <div style={{ fontSize: 13, color: C.textSub, padding: "1rem 0" }}>No employees found for this employer. Add employees first.</div>
        )}

        {eligible.map(p => (
          <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `0.5px solid ${C.border}`, cursor: "pointer" }}>
            <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{p.first_name} {p.last_name}</div>
              <div style={{ fontSize: 11, color: C.textSub }}>{p.job_title || "—"} · {p.site || "—"}</div>
            </div>
          </label>
        ))}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: "1rem" }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving || eligible.length === 0}>
            {saving ? "Saving..." : `Save enrolment (${selected.size})`}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ── Result Capture Modal ──────────────────────────────────────────────────────
const ResultCaptureModal = ({ event, person, onSave, onClose, db }) => {
  const [results, setResults] = useState({});
  const [flagged, setFlagged] = useState(false);
  const [flagDetail, setFlagDetail] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiChecking, setAiChecking] = useState(false);

  // Fields per test type
  const fields = {
    audiometry: [
      { key: "left_500hz",  label: "Left 500 Hz (dB)" },
      { key: "left_1khz",   label: "Left 1 kHz (dB)" },
      { key: "left_2khz",   label: "Left 2 kHz (dB)" },
      { key: "left_4khz",   label: "Left 4 kHz (dB)" },
      { key: "left_8khz",   label: "Left 8 kHz (dB)" },
      { key: "right_500hz", label: "Right 500 Hz (dB)" },
      { key: "right_1khz",  label: "Right 1 kHz (dB)" },
      { key: "right_2khz",  label: "Right 2 kHz (dB)" },
      { key: "right_4khz",  label: "Right 4 kHz (dB)" },
      { key: "right_8khz",  label: "Right 8 kHz (dB)" },
    ],
    spirometry: [
      { key: "fvc",           label: "FVC (L)" },
      { key: "fev1",          label: "FEV1 (L)" },
      { key: "fev1_fvc_ratio", label: "FEV1/FVC ratio" },
      { key: "pef",           label: "PEF (L/min)" },
    ],
    vision: [
      { key: "va_right_uncorrected", label: "VA right (uncorrected)" },
      { key: "va_left_uncorrected",  label: "VA left (uncorrected)" },
      { key: "va_right_corrected",   label: "VA right (corrected)" },
      { key: "va_left_corrected",    label: "VA left (corrected)" },
      { key: "colour_vision",        label: "Colour vision" },
    ],
    bio_monitor: [
      { key: "substance",       label: "Substance" },
      { key: "result_value",    label: "Result value" },
      { key: "unit",            label: "Unit" },
      { key: "reference_range", label: "Reference range" },
    ],
    blood_pressure: [
      { key: "systolic",  label: "Systolic (mmHg)" },
      { key: "diastolic", label: "Diastolic (mmHg)" },
      { key: "pulse",     label: "Pulse (bpm)" },
    ],
    glucose: [
      { key: "fasting",        label: "Fasting glucose (mmol/L)" },
      { key: "random",         label: "Random glucose (mmol/L)" },
      { key: "hba1c",          label: "HbA1c (%)" },
    ],
    lung_function: [
      { key: "fvc",  label: "FVC (L)" },
      { key: "fev1", label: "FEV1 (L)" },
      { key: "pef",  label: "PEF (L/min)" },
    ],
  };

  const typeFields = fields[event?.test_type] || [];

  const checkWithAI = async () => {
    setAiChecking(true);
    try {
      // Fetch the previous completed result for this person + test type for comparison
      let previousResult = null;
      if (db && !USE_MOCK) {
        try {
          const prevRes = await db.from("surveillance_event").select(
            `person_id=eq.${event.person_id}&test_type=eq.${event.test_type}&status=eq.completed&id=neq.${event.id}&order=completed_date.desc&limit=1`
          );
          if (prevRes.data?.[0]?.results) previousResult = prevRes.data[0].results;
        } catch(e) { console.warn("Prior result fetch failed", e); }
      }

      const prevContext = previousResult
        ? `Previous result (for comparison): ${JSON.stringify(previousResult)}`
        : "No previous result on file — assess absolute values only.";

      const flagRules = {
        audiometry: "Flag if any frequency shows threshold shift ≥10dB compared to previous, OR absolute threshold >25dB HL at any frequency.",
        spirometry: "Flag if FEV1 drops ≥15% compared to previous, OR FEV1/FVC ratio <0.70.",
        vision: "Flag if uncorrected VA is worse than 6/12 in either eye, or significant change from previous.",
        blood_pressure: "Flag if systolic ≥140 or diastolic ≥90.",
        glucose: "Flag if fasting glucose ≥7.0 mmol/L or random ≥11.1 mmol/L.",
        bio_monitor: "Flag if result is outside the stated reference range.",
        lung_function: "Flag if FEV1 <80% predicted or FEV1/FVC <0.70.",
      };
      const rules = flagRules[event.test_type] || "Flag if any value is outside normal clinical range.";

      const resp = await fetch("/.netlify/functions/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "You are an occupational health clinical decision support system for South Africa. Analyse surveillance results and flag significant findings. Return JSON only: {flagged: boolean, flag_detail: string}. flag_detail must be one concise clinical sentence. Never fabricate values.",
          messages: [{ role: "user", content: `Test type: ${event.test_type}\nCurrent results: ${JSON.stringify(results)}\n${prevContext}\n\nFlagging rules: ${rules}\n\nShould this result be flagged for OHP review?` }],
          max_tokens: 200,
        }),
      });
      const data = await resp.json();
      const text = data.content?.[0]?.text || "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setFlagged(parsed.flagged || false);
      setFlagDetail(parsed.flag_detail || "");
    } catch(e) {
      console.warn("AI flag check failed", e);
    }
    setAiChecking(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(event.id, {
      results,
      flagged,
      flag_detail: flagDetail,
      completed_date: new Date().toISOString().slice(0, 10),
      status: "completed",
    });
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.bgCard, borderRadius: 12, padding: "1.5rem", width: 500, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Capture result</div>
        <div style={{ fontSize: 12, color: C.textSub, marginBottom: "1rem" }}>
          {person?.first_name} {person?.last_name} · {TEST_TYPES.find(t => t.value === event?.test_type)?.label}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1rem" }}>
          {typeFields.map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 11, color: C.textSub, display: "block", marginBottom: 3 }}>{f.label}</label>
              <input
                value={results[f.key] || ""}
                onChange={e => setResults(r => ({ ...r, [f.key]: e.target.value }))}
                style={{ width: "100%", padding: "6px 9px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <Btn variant="secondary" size="sm" onClick={checkWithAI} disabled={aiChecking || Object.keys(results).length === 0}>
            {aiChecking ? "Checking..." : "🤖 Check with AI"}
          </Btn>
        </div>

        {flagged && (
          <div style={{ background: C.amberLight, border: `1px solid ${C.amber}`, borderRadius: 8, padding: "10px 12px", marginBottom: "1rem" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.amber, marginBottom: 4 }}>⚠ AI flagged</div>
            <div style={{ fontSize: 12, color: C.text }}>{flagDetail}</div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginTop: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={flagged} onChange={e => setFlagged(e.target.checked)} />
              Keep flag on record
            </label>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save result"}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ── Main Surveillance Screen ──────────────────────────────────────────────────
// Generate ICS calendar file from surveillance events
const generateSurveillanceICS = (events, persons) => {
  const lines = [
    "BEGIN:VCALENDAR","VERSION:2.0",
    "PRODID:-//OccHealth Pro SA//Surveillance Schedule//EN",
    "CALSCALE:GREGORIAN","METHOD:PUBLISH",
  ];
  const now = new Date().toISOString().replace(/[-:]/g,"").slice(0,15) + "Z";
  events.filter(e => ["scheduled","overdue"].includes(e.status)).forEach(ev => {
    const person = persons.find(p => p.id === ev.person_id);
    const name = person ? `${person.first_name} ${person.last_name}` : "Employee";
    const dateStr = (ev.scheduled_date || "").replace(/-/g,"");
    if (!dateStr) return;
    const uid = `surv-${ev.id || Math.random().toString(36).slice(2)}@occhealth-pro-sa`;
    const typeName = (ev.test_type || "test").replace(/_/g," ");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `SUMMARY:Surveillance due: ${typeName} — ${name}`,
      `DESCRIPTION:Test type: ${typeName}\nEmployee: ${name}\nStatus: ${ev.status}`,
      `STATUS:${ev.status === "overdue" ? "CANCELLED" : "CONFIRMED"}`,
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
};

const Surveillance = () => {
  const { employers, persons, db, refreshData } = useData();

  // Local state for hazard profiles, enrolments, events — loaded from Supabase or mock
  const [profiles, setProfiles] = useState([]);
  const [enrolments, setEnrolments] = useState([]); // [{person_id, hazard_profile_id, enrolled_at}]
  const [events, setEvents] = useState(MOCK_SURVEILLANCE);
  const [loading, setLoading] = useState(false);

  // UI state
  const [tab, setTab] = useState("schedule"); // schedule | profiles
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [employerFilter, setEmployerFilter] = useState("all");
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [enrolTarget, setEnrolTarget] = useState(null); // profile being enrolled
  const [captureTarget, setCaptureTarget] = useState(null); // {event, person}

  // Load from Supabase
  useEffect(() => {
    if (!db) return;
    loadSurveillanceData();
  }, [db]);

  const loadSurveillanceData = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const [profRes, enrolRes, evtRes] = await Promise.all([
        db.from("hazard_profile").select("*"),
        db.from("person_hazard").select("*"),
        db.from("surveillance_event").select().order("scheduled_date", {ascending:true}),
      ]);
      if (profRes.data?.length) setProfiles(profRes.data);
      if (enrolRes.data) setEnrolments(enrolRes.data);
      if (evtRes.data?.length) setEvents(evtRes.data);
    } catch(e) { console.warn("Surveillance load error", e); }
    setLoading(false);
  };

  // Create hazard profile + schedule initial surveillance events
  const handleCreateProfile = async (profileData) => {
    try {
      // 1. Insert profile
      const profRes = await db?.from("hazard_profile").insert(profileData).select();
      if (!profRes?.data?.[0]) return;
      const newProfile = profRes.data[0];

      setProfiles(prev => [...prev, newProfile]);
      setShowNewProfile(false);
    } catch(e) {
      console.warn("Create profile error", e);
      // Optimistic update for demo mode
      const mockProfile = { ...profileData, id: `hp_${Date.now()}` };
      setProfiles(prev => [...prev, mockProfile]);
      setShowNewProfile(false);
    }
  };

  // Save enrolment: upsert person_hazard rows + generate surveillance_event rows
  const handleSaveEnrolment = async (profileId, personIds) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    const today = new Date().toISOString().slice(0, 10);
    const newEnrolments = personIds.map(pid => ({ person_id: pid, hazard_profile_id: profileId, enrolled_at: today }));

    // Generate surveillance events for each person × each test type
    const newEvents = [];
    for (const pid of personIds) {
      for (const testType of (profile.surveillance_types || [])) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + (profile.surveillance_period_months || 12));
        newEvents.push({
          person_id: pid,
          hazard_profile_id: profileId,
          test_type: testType,
          scheduled_date: dueDate.toISOString().slice(0, 10),
          status: "scheduled",
        });
      }
    }

    try {
      if (db) {
        await db.from("person_hazard").upsert(newEnrolments, { onConflict: "person_id,hazard_profile_id" });
        if (newEvents.length) {
          const evtRes = await db.from("surveillance_event").insert(newEvents).select();
          if (evtRes.data) setEvents(prev => [...prev, ...evtRes.data]);
        }
      }
    } catch(e) { console.warn("Enrolment error", e); }

    // Optimistic update
    setEnrolments(prev => {
      const filtered = prev.filter(e => e.hazard_profile_id !== profileId);
      return [...filtered, ...newEnrolments];
    });
    if (!db) {
      const mockEvts = newEvents.map((e, i) => ({ ...e, id: `sve_${Date.now()}_${i}` }));
      setEvents(prev => [...prev, ...mockEvts]);
    }
    setEnrolTarget(null);
  };

  // Capture result
  const handleSaveResult = async (eventId, resultData) => {
    try {
      if (db) {
        await db.from("surveillance_event").update(resultData).eq("id", eventId);
      }
    } catch(e) { console.warn("Result save error", e); }
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...resultData } : e));
    setCaptureTarget(null);
  };

  // Derived filtered events
  const filteredEvents = events.filter(ev => {
    const person = persons.find(p => p.id === ev.person_id);
    const employer = employers.find(e => e.id === person?.employer_id);
    if (statusFilter !== "all" && ev.status !== statusFilter) return false;
    if (typeFilter !== "all" && ev.test_type !== typeFilter) return false;
    if (employerFilter !== "all" && employer?.id !== employerFilter) return false;
    return true;
  });

  // KPI counts
  const scheduled = events.filter(e => e.status === "scheduled").length;
  const overdue = events.filter(e => e.status === "overdue").length;
  const completedThisMonth = events.filter(e => {
    if (e.status !== "completed") return false;
    const d = new Date(e.completed_date || e.scheduled_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Enrolled person ids per profile
  const enrolledFor = (profileId) => enrolments.filter(e => e.hazard_profile_id === profileId).map(e => e.person_id);

  // Scheduler — manual trigger for testing
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [schedulerResult, setSchedulerResult] = useState(null);

  const runScheduler = async () => {
    setSchedulerRunning(true);
    setSchedulerResult(null);
    try {
      const r = await fetch("/.netlify/functions/surveillance-scheduler", { method: "POST" });
      const data = await r.json();
      setSchedulerResult(data);
      // Reload events after scheduler run
      await loadSurveillanceData();
    } catch(e) {
      setSchedulerResult({ error: e.message });
    }
    setSchedulerRunning(false);
  };

  const TAB_STYLE = (active) => ({
    padding: "6px 14px", fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? C.teal : C.textSub, background: "none", border: "none",
    borderBottom: active ? `2px solid ${C.teal}` : "2px solid transparent",
    cursor: "pointer",
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Health surveillance</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn size="sm" variant="secondary" onClick={runScheduler} disabled={schedulerRunning}>
            {schedulerRunning ? "Running..." : "⟳ Run scheduler"}
          </Btn>
          <Btn size="sm" variant="secondary" onClick={() => {
            const ics = generateSurveillanceICS(events, persons);
            const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = "surveillance-schedule.ics"; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
          }}>📅 Export .ics</Btn>
          <Btn size="sm" onClick={() => setShowNewProfile(true)}>+ New hazard profile</Btn>
        </div>
      </div>
      {schedulerResult && (
        <div style={{ background: schedulerResult.error ? C.redLight : C.tealLight, border: `1px solid ${schedulerResult.error ? C.red : C.tealMid}`, borderRadius: 8, padding: "8px 12px", marginBottom: "1rem", fontSize: 12, color: schedulerResult.error ? C.red : C.teal }}>
          {schedulerResult.error
            ? `Scheduler error: ${schedulerResult.error}`
            : `✓ Scheduler ran — ${schedulerResult.marked_overdue ?? 0} marked overdue, ${schedulerResult.next_cycles_generated ?? 0} next cycles generated`
          }
        </div>
      )}

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: "1.25rem" }}>
        <StatCard label="Scheduled" value={scheduled} />
        <StatCard label="Overdue" value={overdue} color={overdue > 0 ? C.red : C.teal} />
        <StatCard label="Completed this month" value={completedThisMonth} color={C.teal} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: "1.25rem" }}>
        <button style={TAB_STYLE(tab === "schedule")} onClick={() => setTab("schedule")}>Surveillance schedule</button>
        <button style={TAB_STYLE(tab === "profiles")} onClick={() => setTab("profiles")}>Hazard profiles</button>
      </div>

      {/* ── SCHEDULE TAB ─────────────────────────────── */}
      {tab === "schedule" && (
        <div>
          {/* Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 12 }}>
              <option value="all">All statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
              <option value="waived">Waived</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 12 }}>
              <option value="all">All test types</option>
              {TEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={employerFilter} onChange={e => setEmployerFilter(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 12 }}>
              <option value="all">All employers</option>
              {employers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          {loading && <div style={{ fontSize: 13, color: C.textSub, padding: "1rem 0" }}>Loading...</div>}

          {filteredEvents.length === 0 && !loading && (
            <Card style={{ textAlign: "center", padding: "2rem" }}>
              <div style={{ fontSize: 13, color: C.textSub, marginBottom: 8 }}>No surveillance events found.</div>
              <div style={{ fontSize: 12, color: C.textTert }}>Create a hazard profile and enrol employees to generate the schedule.</div>
            </Card>
          )}

          {filteredEvents.map(ev => {
            const person = persons.find(p => p.id === ev.person_id);
            const employer = employers.find(e => e.id === person?.employer_id);
            const daysUntil = Math.round((new Date(ev.scheduled_date) - new Date()) / 86400000);
            const isOverdue = daysUntil < 0 && ev.status !== "completed";
            const statusColor = ev.status === "completed" ? "teal" : ev.status === "overdue" || isOverdue ? "red" : daysUntil <= 30 ? "amber" : "gray";

            return (
              <Card key={ev.id} style={{ marginBottom: 8, borderLeft: isOverdue ? `3px solid ${C.red}` : ev.status === "completed" ? `3px solid ${C.teal}` : daysUntil <= 30 ? `3px solid ${C.amber}` : `3px solid transparent` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{person?.first_name} {person?.last_name}</div>
                    <div style={{ fontSize: 12, color: C.textSub }}>{employer?.name} · {TEST_TYPES.find(t => t.value === ev.test_type)?.label || ev.test_type}</div>
                    <div style={{ fontSize: 11, color: C.textTert, marginTop: 2 }}>
                      Due: {new Date(ev.scheduled_date).toLocaleDateString("en-ZA")}
                      {ev.status !== "completed" && (
                        <span style={{ color: isOverdue ? C.red : daysUntil <= 30 ? C.amber : C.textTert, marginLeft: 6 }}>
                          {isOverdue ? `${Math.abs(daysUntil)}d overdue` : `in ${daysUntil}d`}
                        </span>
                      )}
                      {ev.status === "completed" && ev.completed_date && (
                        <span style={{ color: C.teal, marginLeft: 6 }}>Completed {new Date(ev.completed_date).toLocaleDateString("en-ZA")}</span>
                      )}
                    </div>
                    {ev.flagged && (
                      <div style={{ fontSize: 11, color: C.amber, marginTop: 4, background: C.amberLight, padding: "2px 8px", borderRadius: 4, display: "inline-block" }}>
                        ⚠ {ev.flag_detail}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", marginLeft: 12 }}>
                    <Badge color={statusColor}>{ev.status === "scheduled" && isOverdue ? "overdue" : ev.status}</Badge>
                    {ev.status !== "completed" && (
                      <Btn size="sm" variant="ghost" onClick={() => setCaptureTarget({ event: ev, person })}>Capture result</Btn>
                    )}
                    {ev.status === "completed" && (
                      <span style={{ fontSize: 11, color: C.textTert }}>✓ Done</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── PROFILES TAB ─────────────────────────────── */}
      {tab === "profiles" && (
        <div>
          {profiles.length === 0 && (
            <Card style={{ textAlign: "center", padding: "2rem" }}>
              <div style={{ fontSize: 13, color: C.textSub, marginBottom: 8 }}>No hazard profiles yet.</div>
              <div style={{ fontSize: 12, color: C.textTert, marginBottom: "1rem" }}>Profiles define which tests are required and how often. Create one per exposure group.</div>
              <Btn onClick={() => setShowNewProfile(true)}>+ Create first profile</Btn>
            </Card>
          )}

          {profiles.map(prof => {
            const employer = employers.find(e => e.id === prof.employer_id);
            const enrolled = enrolledFor(prof.id);
            const profEvents = events.filter(e => e.hazard_profile_id === prof.id);
            const profOverdue = profEvents.filter(e => {
              const d = Math.round((new Date(e.scheduled_date) - new Date()) / 86400000);
              return d < 0 && e.status !== "completed";
            }).length;

            return (
              <Card key={prof.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{prof.name}</div>
                    <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>{employer?.name}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {(prof.surveillance_types || []).map(t => (
                        <span key={t} style={{ fontSize: 11, background: C.tealLight, color: C.teal, padding: "2px 8px", borderRadius: 20 }}>
                          {TEST_TYPES.find(tt => tt.value === t)?.label || t}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: C.textTert, marginTop: 6 }}>
                      Every {prof.surveillance_period_months || 12} months · {enrolled.length} employee{enrolled.length !== 1 ? "s" : ""} enrolled
                      {profOverdue > 0 && <span style={{ color: C.red, marginLeft: 8 }}>· {profOverdue} overdue</span>}
                    </div>
                    {(prof.hazard_codes || []).length > 0 && (
                      <div style={{ fontSize: 11, color: C.textTert, marginTop: 4 }}>
                        Hazards: {prof.hazard_codes.join(", ")}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                    <Btn size="sm" onClick={() => setEnrolTarget(prof)}>Manage enrolment</Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showNewProfile && (
        <HazardProfileModal employers={employers} onSave={handleCreateProfile} onClose={() => setShowNewProfile(false)} />
      )}
      {enrolTarget && (
        <EnrolModal
          profile={enrolTarget}
          persons={persons}
          enrolledIds={enrolledFor(enrolTarget.id)}
          onSave={handleSaveEnrolment}
          onClose={() => setEnrolTarget(null)}
        />
      )}
      {captureTarget && (
        <ResultCaptureModal
          event={captureTarget.event}
          person={captureTarget.person}
          onSave={handleSaveResult}
          onClose={() => setCaptureTarget(null)}
          db={db}
        />
      )}
    </div>
  );
};

const FitnessCerts = () => {
  const { fitnessCerts, persons, employers } = useData();
  const [printing, setPrinting] = useState(null); // fc.id being printed
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const printCert = async (fc) => {
    const person = persons.find(p => p.id === fc.person_id);
    const employer = employers.find(e => e.id === person?.employer_id);
    setPrinting(fc.id);
    try {
      const payload = {
        cert_id: fc.id,
        practice_name: "OccHealth Pro SA",
        person_name: person ? `${person.first_name} ${person.last_name}` : "",
        employee_number: person?.employee_number || "",
        employer_name: employer?.name || "",
        role_category: fc.role_category || person?.job_title || "",
        date_of_birth: person?.date_of_birth || "",
        site: person?.site || employer?.name || "",
        fitness_status: fc.fitness_status,
        restrictions: fc.restrictions || [],
        valid_from: fc.valid_from,
        valid_until: fc.valid_until,
        validity_period: (() => {
          if (!fc.valid_from || !fc.valid_until) return "12 months";
          const months = Math.round((new Date(fc.valid_until) - new Date(fc.valid_from)) / (1000*60*60*24*30));
          return `${months} months`;
        })(),
        notes: fc.notes || "",
        practitioner_name: "",
        qualification: "",
        sanc_number: "",
        signed_at: fc.valid_from,
      };
      const res = await fetch("/.netlify/functions/fitness-cert", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch(e) { alert("Failed to generate certificate: " + e.message); }
    setPrinting(null);
  };

  const filtered = fitnessCerts.filter(fc => {
    const person = persons.find(p => p.id === fc.person_id);
    const name = person ? `${person.first_name} ${person.last_name}`.toLowerCase() : "";
    const matchSearch = !search || name.includes(search.toLowerCase()) || (fc.role_category || "").toLowerCase().includes(search.toLowerCase());
    const daysLeft = Math.round((new Date(fc.valid_until) - new Date()) / 86400000);
    const matchStatus = statusFilter === "all" || (statusFilter === "current" && daysLeft > 0) || (statusFilter === "expired" && daysLeft <= 0) || (statusFilter === "expiring" && daysLeft > 0 && daysLeft <= 30);
    return matchSearch && matchStatus;
  });

  // Summary counts
  const total = fitnessCerts.length;
  const current = fitnessCerts.filter(fc => new Date(fc.valid_until) > new Date()).length;
  const expired = fitnessCerts.filter(fc => new Date(fc.valid_until) <= new Date()).length;
  const expiring30 = fitnessCerts.filter(fc => {
    const d = Math.round((new Date(fc.valid_until) - new Date()) / 86400000);
    return d > 0 && d <= 30;
  }).length;

  // ── Ghost state ──
  if (total === 0) {
    return (
      <div>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: "1.25rem" }}>Fitness certificates</div>
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          {/* Ghost illustration */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "inline-flex", flexDirection: "column", gap: 8, opacity: 0.18 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bgSub, borderRadius: 8, padding: "10px 14px", width: 340, gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, background: C.border, borderRadius: 4, width: `${55+i*15}%`, marginBottom: 6 }} />
                    <div style={{ height: 10, background: C.border, borderRadius: 4, width: "40%" }} />
                  </div>
                  <div style={{ width: 48, height: 20, background: C.teal, borderRadius: 10, opacity: 0.4 }} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, color: C.text, marginBottom: 8 }}>No fitness certificates yet</div>
          <div style={{ fontSize: 13, color: C.textSub, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
            Fitness certificates are generated automatically when you sign a clinical encounter that includes a fitness assessment. Complete an encounter with a pre-employment, periodic, or exit medical to issue the first certificate.
          </div>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ background: C.bgSub, borderRadius: 8, padding: "10px 16px", fontSize: 12, color: C.textSub }}>
              <div style={{ fontWeight: 600, color: C.text, marginBottom: 2 }}>How to issue</div>
              Encounters → New encounter → Sign → Certificate auto-generated
            </div>
            <div style={{ background: C.bgSub, borderRadius: 8, padding: "10px 16px", fontSize: 12, color: C.textSub }}>
              <div style={{ fontWeight: 600, color: C.text, marginBottom: 2 }}>Valid for</div>
              Typically 12 months (adjustable per encounter)
            </div>
            <div style={{ background: C.bgSub, borderRadius: 8, padding: "10px 16px", fontSize: 12, color: C.textSub }}>
              <div style={{ fontWeight: 600, color: C.text, marginBottom: 2 }}>PDF output</div>
              OHS Act compliant — printable and shareable
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Register view ──
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Fitness certificates</div>
      </div>

      {/* KPI summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: "1rem" }}>
        {[
          { label: "Total", value: total, color: C.teal, filter: "all" },
          { label: "Current", value: current, color: C.teal, filter: "current" },
          { label: "Expiring 30d", value: expiring30, color: expiring30 > 0 ? C.amber : C.textSub, filter: "expiring" },
          { label: "Expired", value: expired, color: expired > 0 ? C.red : C.textSub, filter: "expired" },
        ].map(k => (
          <div key={k.label} onClick={() => setStatusFilter(statusFilter === k.filter ? "all" : k.filter)}
            style={{ background: statusFilter === k.filter ? C.tealLight : C.bgSub, borderRadius: 8, padding: "10px 12px", cursor: "pointer", border: `1px solid ${statusFilter === k.filter ? C.tealMid : C.border}`, transition: "all .15s" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{k.label}{statusFilter === k.filter ? " ✕" : ""}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPersonPage(0); }} placeholder="Search by employee or role…"
          style={{ width: "100%", padding: "8px 10px 8px 32px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box", background: C.bgCard }} />
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.textTert }}>🔍</span>
        {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 14, cursor: "pointer", color: C.textTert }}>✕</button>}
      </div>

      {/* Register table header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 90px 80px 90px", gap: 8, padding: "6px 14px", background: C.bgSub, borderRadius: "7px 7px 0 0", borderBottom: `1px solid ${C.border}` }}>
        {["Employee", "Employer / role", "Status", "Valid from", "Valid until", ""].map((h, i) => (
          <div key={i} style={{ fontSize: 10, fontWeight: 700, color: C.textTert, textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: "2rem", textAlign: "center", color: C.textTert, fontSize: 13, border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 7px 7px" }}>
          No certificates match current filters.
        </div>
      )}

      {filtered.map((fc, i) => {
        const person = persons.find(p => p.id === fc.person_id);
        const employer = employers.find(e => e.id === person?.employer_id);
        const daysLeft = Math.round((new Date(fc.valid_until) - new Date()) / 86400000);
        const isExpired = daysLeft <= 0;
        const isExpiring = daysLeft > 0 && daysLeft <= 30;
        return (
          <div key={fc.id} style={{
            display: "grid", gridTemplateColumns: "1fr 140px 100px 90px 80px 90px", gap: 8,
            padding: "10px 14px", alignItems: "center",
            background: isExpired ? "#FFF8F8" : isExpiring ? "#FFFBF0" : C.bgCard,
            borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
            borderLeft: `3px solid ${isExpired ? C.red : isExpiring ? C.amber : C.teal}`,
            borderRight: `1px solid ${C.border}`,
            borderRadius: i === filtered.length - 1 ? "0 0 7px 7px" : 0,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{person?.first_name} {person?.last_name}</div>
              {person?.employee_number && <div style={{ fontSize: 11, color: C.textTert }}>Emp #{person.employee_number}</div>}
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textSub }}>{employer?.name || "—"}</div>
              {fc.role_category && <div style={{ fontSize: 11, color: C.textTert }}>{fc.role_category}</div>}
            </div>
            <div>
              <Badge color={fc.fitness_status === "fit" ? "teal" : fc.fitness_status === "fit_with_restrictions" ? "amber" : "red"}>
                {fc.fitness_status?.replace(/_/g," ")}
              </Badge>
            </div>
            <div style={{ fontSize: 12, color: C.textSub }}>{fc.valid_from ? new Date(fc.valid_from).toLocaleDateString("en-ZA") : "—"}</div>
            <div>
              <div style={{ fontSize: 12, color: isExpired ? C.red : isExpiring ? C.amber : C.textSub }}>
                {fc.valid_until ? new Date(fc.valid_until).toLocaleDateString("en-ZA") : "—"}
              </div>
              <div style={{ fontSize: 10, color: isExpired ? C.red : isExpiring ? C.amber : C.textTert }}>
                {isExpired ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`}
              </div>
            </div>
            <div>
              <Btn size="sm" variant="ghost" onClick={() => printCert(fc)} disabled={printing === fc.id}>
                {printing === fc.id ? "…" : "🖨 Print"}
              </Btn>
            </div>
          </div>
        );
      })}
    </div>
  );
};


const IODRegister = () => {
  const { persons, employers, db, refreshData } = useData();
  const [generatingId, setGeneratingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [liveIODs, setLiveIODs] = useState(null);
  const [coidaClaims, setCoidaClaims] = useState({}); // keyed by iod_incident_id → claim row
  const [claimSaving, setClaimSaving] = useState(null); // iod.id being saved
  const [editingRef, setEditingRef] = useState(null); // iod.id whose ref is being edited
  const [refDraft, setRefDraft] = useState(""); // draft value for claim_reference input
  const [editingAmount, setEditingAmount] = useState(null); // iod.id whose amount is being edited
  const [amountDraft, setAmountDraft] = useState(""); // draft value for amount_awarded input

  const EMPTY_IOD = {
    person_id: "", employer_id: "",
    incident_at: new Date().toISOString().slice(0,16),
    incident_type: "injury",
    severity: "medical_treatment",
    mechanism: "",
    body_part: "",
    narrative: "",
    first_aid_given: [],
    site: "",
  };
  const [form, setForm] = useState(EMPTY_IOD);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // When person changes, auto-fill employer
  const selectedPerson = persons.find(p => p.id === form.person_id);
  const selectedEmployer = employers.find(e => e.id === (form.employer_id || selectedPerson?.employer_id));

  const handlePersonChange = (personId) => {
    const p = persons.find(x => x.id === personId);
    setForm(f => ({ ...f, person_id: personId, employer_id: p?.employer_id || "", site: p?.site || "" }));
  };

  const toggleFirstAid = (item) => {
    setForm(f => ({
      ...f,
      first_aid_given: f.first_aid_given.includes(item)
        ? f.first_aid_given.filter(x => x !== item)
        : [...f.first_aid_given, item],
    }));
  };

  const saveIOD = async () => {
    if (!form.person_id || !form.narrative) return;
    setSaving(true);
    const record = {
      person_id: form.person_id,
      employer_id: form.employer_id || selectedPerson?.employer_id || "",
      incident_at: new Date(form.incident_at).toISOString(),
      client_timestamp: new Date().toISOString(),
      incident_type: form.incident_type,
      severity: form.severity,
      mechanism: form.mechanism,
      body_part: form.body_part,
      narrative: form.narrative,
      first_aid_given: form.first_aid_given,
      created_at: new Date().toISOString(),
    };
    if (form.site) record.site = form.site;

    let saved = { ...record, id: crypto.randomUUID() };
    if (!USE_MOCK && db) {
      const { data, error } = await db.from("iod_incident").insert(record);
      if (!error && data?.[0]) saved = data[0];
    }
    setLiveIODs(prev => [saved, ...(prev || MOCK_IOD)]);
    setForm(EMPTY_IOD);
    setShowForm(false);
    setSaving(false);
  };

  // Load live IOD data + COIDA claims from Supabase on mount
  useEffect(() => {
    if (!db || USE_MOCK) return;
    db.from("iod_incident").select().order("incident_at", {ascending:false}).limit(200).then(res => {
      if (res.data?.length) setLiveIODs(res.data);
    }).catch(() => {});
    db.from("coida_claim").select().order("created_at", {ascending:false}).limit(500).then(res => {
      if (res.data?.length) {
        const map = {};
        res.data.forEach(c => { map[c.iod_incident_id] = c; });
        setCoidaClaims(map);
      }
    }).catch(() => {});
  }, [db]);

  const CLAIM_STATUSES = [
    { value: "draft",        label: "Draft",        color: "gray" },
    { value: "submitted",    label: "Submitted",    color: "amber" },
    { value: "acknowledged", label: "Acknowledged", color: "amber" },
    { value: "assessed",     label: "Assessed",     color: "amber" },
    { value: "approved",     label: "Approved",     color: "teal" },
    { value: "paid",         label: "Paid",         color: "teal" },
    { value: "disputed",     label: "Disputed",     color: "red" },
    { value: "rejected",     label: "Rejected",     color: "red" },
  ];

  const INSURER_LABELS = { compensation_fund: "Compensation Fund", rma: "RMA", fem: "FEM" };

  const createOrUpdateClaim = async (iod, newStatus) => {
    setClaimSaving(iod.id);
    const employer = employers.find(e => e.id === iod.employer_id);
    const existing = coidaClaims[iod.id];
    const now = new Date().toISOString();

    const payload = existing
      ? { status: newStatus, ...(newStatus === "submitted" ? { submitted_at: now } : {}), ...(newStatus === "acknowledged" ? { acknowledged_at: now } : {}), ...(newStatus === "assessed" ? { assessed_at: now } : {}) }
      : { iod_incident_id: iod.id, insurer: employer?.coida_insurer || "compensation_fund", status: newStatus, created_at: now, ...(newStatus === "submitted" ? { submitted_at: now } : {}) };

    try {
      if (!USE_MOCK && db) {
        if (existing) {
          await db.from("coida_claim").update(payload).eq("id", existing.id);
          setCoidaClaims(prev => ({ ...prev, [iod.id]: { ...existing, ...payload } }));
        } else {
          const res = await db.from("coida_claim").insert(payload).select();
          if (res.data?.[0]) setCoidaClaims(prev => ({ ...prev, [iod.id]: res.data[0] }));
        }
      } else {
        // Demo mode optimistic update
        const mockClaim = existing
          ? { ...existing, ...payload }
          : { ...payload, id: `claim_${Date.now()}` };
        setCoidaClaims(prev => ({ ...prev, [iod.id]: mockClaim }));
      }
    } catch(e) { console.warn("Claim save error", e); }
    setClaimSaving(null);
  };

  const saveClaimRef = async (iod, ref) => {
    const existing = coidaClaims[iod.id];
    if (!existing) return;
    const updated = { ...existing, claim_reference: ref };
    setCoidaClaims(prev => ({ ...prev, [iod.id]: updated }));
    if (!USE_MOCK && db) {
      try { await db.from("coida_claim").update({ claim_reference: ref }).eq("id", existing.id); }
      catch(e) { console.warn("Ref save error", e); }
    }
    setEditingRef(null);
  };

  const saveClaimAmount = async (iod, amount) => {
    const existing = coidaClaims[iod.id];
    if (!existing) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) { setEditingAmount(null); return; }
    const updated = { ...existing, amount_awarded: parsed };
    setCoidaClaims(prev => ({ ...prev, [iod.id]: updated }));
    if (!USE_MOCK && db) {
      try { await db.from("coida_claim").update({ amount_awarded: parsed }).eq("id", existing.id); }
      catch(e) { console.warn("Amount save error", e); }
    }
    setEditingAmount(null);
  };

  const iods = liveIODs ?? MOCK_IOD;
  const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none" };
  const labelStyle = { fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: C.textTert, marginBottom: 4, fontWeight: 500, display: "block" };
  const FIRST_AID_OPTIONS = ["Wound cleaned and dressed","Ice pack applied","Immobilisation / splinting","CPR administered","Oxygen administered","Referred to hospital","Other"];

  const generateWCL2 = async (iod) => {
    setGeneratingId(iod.id + "_wcl2");
    try {
      const person = persons.find(p => p.id === iod.person_id);
      const employer = employers.find(e => e.id === iod.employer_id);
      const incidentDate = iod.incident_at ? new Date(iod.incident_at) : new Date();
      const payload = {
        employer_name: employer?.name || "",
        coida_ref: employer?.coida_ref || "",
        coida_insurer: employer?.coida_insurer || "compensation_fund",
        contact_email: employer?.contact_email || "",
        industry_class: employer?.industry_class || "",
        person_first_name: person?.first_name || "",
        person_last_name: person?.last_name || "",
        employee_number: person?.employee_number || "",
        job_title: person?.job_title || "",
        department: person?.department || "",
        date_of_birth: person?.date_of_birth || "",
        start_date: person?.start_date || "",
        id_number: person?.id_number || "",
        site: iod.site || person?.site || employer?.name || "",
        incident_date: incidentDate.toISOString().slice(0, 10),
        incident_time: incidentDate.toTimeString().slice(0, 5),
        incident_type: iod.incident_type || "injury",
        severity: iod.severity || "medical_treatment",
        body_part: iod.body_part || "",
        mechanism: iod.mechanism || "",
        narrative: iod.narrative || "",
        first_aid_given: iod.first_aid_given || [],
      };
      const res = await fetch("/.netlify/functions/wcl2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch(e) {
      alert("Failed to generate W.Cl.2: " + e.message);
    }
    setGeneratingId(null);
  };

  return (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: 18, fontWeight: 500 }}>IOD register</div>
      <Btn size="sm" onClick={() => { setForm(EMPTY_IOD); setShowForm(true); }}>+ Log IOD</Btn>
    </div>

    {showForm && (
      <Card style={{ marginBottom: "1rem", border: `1px solid ${C.teal}` }}>
        <SectionTitle>Log injury on duty</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Employee *</label>
            <select style={inputStyle} value={form.person_id} onChange={e => handlePersonChange(e.target.value)}>
              <option value="">Select employee...</option>
              {persons.map(p => {
                const emp = employers.find(e => e.id === p.employer_id);
                return <option key={p.id} value={p.id}>{p.first_name} {p.last_name} — {emp?.name}</option>;
              })}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date & time of incident *</label>
            <input type="datetime-local" style={inputStyle} value={form.incident_at} onChange={e => setF("incident_at", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Incident type</label>
            <select style={inputStyle} value={form.incident_type} onChange={e => setF("incident_type", e.target.value)}>
              <option value="injury">Injury</option>
              <option value="occupational_disease">Occupational disease</option>
              <option value="near_miss">Near miss</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Severity</label>
            <select style={inputStyle} value={form.severity} onChange={e => setF("severity", e.target.value)}>
              <option value="first_aid">First aid only</option>
              <option value="medical_treatment">Medical treatment</option>
              <option value="lost_time">Lost time injury</option>
              <option value="fatality">Fatality</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Part of body injured</label>
            <input style={inputStyle} value={form.body_part} onChange={e => setF("body_part", e.target.value)} placeholder="e.g. Right knee" />
          </div>
          <div>
            <label style={labelStyle}>Mechanism / how it happened</label>
            <input style={inputStyle} value={form.mechanism} onChange={e => setF("mechanism", e.target.value)} placeholder="e.g. Slip and fall on wet surface" />
          </div>
          <div>
            <label style={labelStyle}>Site / location</label>
            <input style={inputStyle} value={form.site} onChange={e => setF("site", e.target.value)} placeholder={selectedEmployer?.name || "Site name"} />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Narrative — what happened? (for W.Cl.2 Section 5) *</label>
          <textarea style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} rows={3} value={form.narrative} onChange={e => setF("narrative", e.target.value)} placeholder="Describe the sequence of events leading to the injury..." />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>First aid given</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {FIRST_AID_OPTIONS.map(opt => (
              <label key={opt} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, cursor: "pointer", background: form.first_aid_given.includes(opt) ? C.tealLight : C.bgSub, border: `1px solid ${form.first_aid_given.includes(opt) ? C.tealMid : C.border}`, borderRadius: 5, padding: "4px 8px", color: form.first_aid_given.includes(opt) ? C.teal : C.text }}>
                <input type="checkbox" checked={form.first_aid_given.includes(opt)} onChange={() => toggleFirstAid(opt)} style={{ accentColor: C.teal }} />
                {opt}
              </label>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={saveIOD} disabled={saving || !form.person_id || !form.narrative}>{saving ? "Saving..." : "Save IOD"}</Btn>
          <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancel</Btn>
          {(!form.person_id || !form.narrative) && <span style={{ fontSize: 12, color: C.textTert, alignSelf: "center" }}>Employee and narrative required</span>}
        </div>
      </Card>
    )}

    {iods.map(iod => {
      const person = persons.find(p => p.id === iod.person_id);
      const employer = employers.find(e => e.id === iod.employer_id);
      const claim = coidaClaims[iod.id];
      const nextStatus = !claim ? "submitted"
        : claim.status === "submitted" ? "acknowledged"
        : claim.status === "acknowledged" ? "assessed"
        : claim.status === "assessed" ? "approved"
        : claim.status === "approved" ? "paid"
        : null;
      const nextLabel = !claim ? "Log COIDA claim"
        : claim.status === "submitted" ? "Mark acknowledged"
        : claim.status === "acknowledged" ? "Mark assessed"
        : claim.status === "assessed" ? "Mark approved"
        : claim.status === "approved" ? "Mark paid"
        : null;
      return (
        <Card key={iod.id} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{person?.first_name} {person?.last_name}</div>
              <div style={{ fontSize: 12, color: C.textSub }}>{employer?.name}</div>
              <div style={{ fontSize: 11, color: C.textTert }}>{new Date(iod.incident_at).toLocaleString("en-ZA")}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <Badge color={iod.severity === "medical_treatment" ? "amber" : iod.severity === "lost_time" ? "red" : "gray"}>{iod.severity.replace(/_/g," ")}</Badge>
              {claim && <Badge color={CLAIM_STATUSES.find(s => s.value === claim.status)?.color || "gray"}>{claim.status}</Badge>}
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.textSub, background: C.bgSub, borderRadius: 6, padding: "6px 10px", marginBottom: 8 }}>{iod.narrative}</div>

          {/* Claim ref (acknowledged+) and amount awarded (approved/paid) */}
          {claim && ["acknowledged","assessed","approved","paid"].includes(claim.status) && (
            <div style={{ display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: C.textTert }}>Fund ref:</span>
                {editingRef === iod.id ? (
                  <>
                    <input autoFocus value={refDraft} onChange={e => setRefDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveClaimRef(iod, refDraft); if (e.key === "Escape") setEditingRef(null); }}
                      style={{ fontSize: 12, padding: "2px 6px", borderRadius: 5, border: `1px solid ${C.teal}`, width: 140 }} />
                    <button onClick={() => saveClaimRef(iod, refDraft)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: C.teal, color: "#fff", border: "none", cursor: "pointer" }}>Save</button>
                    <button onClick={() => setEditingRef(null)} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 5, background: "none", border: `1px solid ${C.border}`, cursor: "pointer" }}>✕</button>
                  </>
                ) : (
                  <button onClick={() => { setEditingRef(iod.id); setRefDraft(claim.claim_reference || ""); }}
                    style={{ fontSize: 12, color: claim.claim_reference ? C.text : C.textTert, background: "none", border: `1px dashed ${C.border}`, borderRadius: 5, padding: "2px 8px", cursor: "pointer" }}>
                    {claim.claim_reference || "Add ref…"}
                  </button>
                )}
              </div>
              {["approved","paid"].includes(claim.status) && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: C.textTert }}>Amount awarded:</span>
                  {editingAmount === iod.id ? (
                    <>
                      <input autoFocus type="number" min="0" step="0.01" value={amountDraft} onChange={e => setAmountDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveClaimAmount(iod, amountDraft); if (e.key === "Escape") setEditingAmount(null); }}
                        style={{ fontSize: 12, padding: "2px 6px", borderRadius: 5, border: `1px solid ${C.teal}`, width: 100 }} />
                      <button onClick={() => saveClaimAmount(iod, amountDraft)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: C.teal, color: "#fff", border: "none", cursor: "pointer" }}>Save</button>
                      <button onClick={() => setEditingAmount(null)} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 5, background: "none", border: `1px solid ${C.border}`, cursor: "pointer" }}>✕</button>
                    </>
                  ) : (
                    <button onClick={() => { setEditingAmount(iod.id); setAmountDraft(claim.amount_awarded?.toString() || ""); }}
                      style={{ fontSize: 12, color: claim.amount_awarded ? C.teal : C.textTert, fontWeight: claim.amount_awarded ? 600 : 400, background: "none", border: `1px dashed ${C.border}`, borderRadius: 5, padding: "2px 8px", cursor: "pointer" }}>
                      {claim.amount_awarded ? `R ${Number(claim.amount_awarded).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` : "Add amount…"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn size="sm" variant="ghost" onClick={() => generateWCL2(iod)} disabled={generatingId === iod.id + "_wcl2"}>
              {generatingId === iod.id + "_wcl2" ? "Generating..." : "Generate W.Cl.2"}
            </Btn>
            <Btn size="sm" variant="ghost" onClick={async () => {
              setGeneratingId(iod.id + "_wcl4");
              try {
                const person = persons.find(p => p.id === iod.person_id);
                const employer = employers.find(e => e.id === iod.employer_id);
                const incidentDate = iod.incident_at ? new Date(iod.incident_at) : new Date();

                // Look up the most recent signed clinical encounter for this person
                // to pre-fill the medical findings section of W.Cl.4
                let linkedEncounter = null;
                if (!USE_MOCK && db) {
                  try {
                    const encRes = await db.from("clinical_encounter").select(
                      `person_id=eq.${iod.person_id}&signed_at=not.is.null&order=signed_at.desc&limit=1`
                    );
                    if (encRes.data?.[0]) linkedEncounter = encRes.data[0];
                  } catch(e) { console.warn("Encounter lookup failed", e); }
                } else {
                  // Demo mode: try to find in local encounters state
                  linkedEncounter = encounters?.find(e => e.person_id === iod.person_id && e.signed_at) || null;
                }

                const payload = {
                  employer_name: employer?.name || "",
                  coida_ref: employer?.coida_ref || "",
                  person_first_name: person?.first_name || "",
                  person_last_name: person?.last_name || "",
                  employee_number: person?.employee_number || "",
                  job_title: person?.job_title || "",
                  date_of_birth: person?.date_of_birth || "",
                  id_number: person?.id_number || "",
                  gender: person?.gender || "",
                  site: person?.site || employer?.name || "",
                  incident_date: incidentDate.toISOString().slice(0,10),
                  examination_date: linkedEncounter?.encounter_at
                    ? new Date(linkedEncounter.encounter_at).toISOString().slice(0,10)
                    : incidentDate.toISOString().slice(0,10),
                  body_part: iod.body_part || "",
                  mechanism: iod.mechanism || "",
                  narrative: iod.narrative || "",
                  // Pull clinical content from linked encounter if available
                  subjective: linkedEncounter?.subjective || iod.narrative || "",
                  objective: linkedEncounter?.objective || "",
                  assessment: linkedEncounter?.assessment || "",
                  plan: linkedEncounter?.plan || "",
                  vitals: linkedEncounter?.vitals || null,
                  work_related: "yes",
                  work_fitness: iod.severity === "lost_time" ? "unfit" : "light",
                  signed_at: linkedEncounter?.signed_at
                    ? new Date(linkedEncounter.signed_at).toISOString().slice(0,10)
                    : new Date().toISOString().slice(0,10),
                };
                const res = await fetch("/.netlify/functions/wcl4", {
                  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error("Failed");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
                setTimeout(() => URL.revokeObjectURL(url), 60000);
              } catch(e) { alert("Failed to generate W.Cl.4: " + e.message); }
              setGeneratingId(null);
            }} disabled={generatingId === iod.id + "_wcl4"}>
              {generatingId === iod.id + "_wcl4" ? "Generating..." : "Generate W.Cl.4"}
            </Btn>
            {nextStatus && (
              <Btn size="sm" onClick={() => createOrUpdateClaim(iod, nextStatus)} disabled={claimSaving === iod.id}>
                {claimSaving === iod.id ? "Saving..." : nextLabel}
              </Btn>
            )}
            {(claim?.status === "disputed" || claim?.status === "rejected") && (
              <Btn size="sm" variant="secondary" onClick={() => createOrUpdateClaim(iod, "submitted")} disabled={claimSaving === iod.id}>
                Resubmit
              </Btn>
            )}
            <Btn size="sm" variant="secondary" disabled={generatingId === iod.id + "_letter"} onClick={async () => {
              setGeneratingId(iod.id + "_letter");
              try {
                const p = persons.find(x => x.id === iod.person_id);
                const emp = employers.find(e => e.id === iod.employer_id);
                const systemPrompt = "You are an occupational health practitioner assistant in South Africa. Draft a professional COIDA covering letter to accompany a W.Cl.2/W.Cl.4 submission. Use formal letter format. Be concise. Output plain text only — no markdown.";
                const userMsg = `Write a covering letter for a COIDA claim submission.\nPatient: ${p?.first_name} ${p?.last_name}\nOccupation: ${p?.job_title || "not stated"}\nEmployer: ${emp?.name}\nInsurer: ${INSURER_LABELS[emp?.coida_insurer] || emp?.coida_insurer}\nIncident date: ${iod.incident_at ? new Date(iod.incident_at).toLocaleDateString("en-ZA") : ""}\nIncident type: ${iod.incident_type}\nSeverity: ${iod.severity?.replace(/_/g," ")}\nNarrative: ${iod.narrative}\nClaim status: ${claim?.status || "new submission"}${claim?.claim_reference ? "\nClaim reference: " + claim.claim_reference : ""}`;
                const res = await fetch("/.netlify/functions/claude", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ system: systemPrompt, messages: [{ role: "user", content: userMsg }], max_tokens: 500 }),
                });
                const data = await res.json();
                const letter = data.content?.[0]?.text || "";
                // Open in new window for print/copy
                const w = window.open("", "_blank");
                w.document.write(`<pre style="font-family:Georgia,serif;font-size:14px;line-height:1.8;padding:2rem;max-width:700px;margin:auto">${letter}</pre><script>window.print()<\/script>`);
              } catch(e) { alert("Letter generation failed: " + e.message); }
              setGeneratingId(null);
            }}>
              {generatingId === iod.id + "_letter" ? "Generating..." : "📄 Covering letter"}
            </Btn>
          </div>
        </Card>
      );
    })}
  </div>
  );
};

const DrugTesting = () => {
  const { persons, employers, db } = useData();
  const [generatingId, setGeneratingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [liveTests, setLiveTests] = useState(null);

  const SUBSTANCES = ["Cannabis","Cocaine","Opiates","Amphetamines","Benzodiazepines","Methamphetamine","Alcohol"];
  const EMPTY_TEST = {
    person_id: "",
    tested_at: new Date().toISOString().slice(0,16),
    test_reason: "random",
    specimen_type: "urine",
    device_brand: "",
    device_lot: "",
    substances_tested: ["Cannabis","Cocaine","Opiates","Amphetamines"],
    substances_positive: [],
    result: "negative",
    refusal: false,
    refusal_reason: "",
    consent_given: true,
    witness_name: "",
    witness_title: "Supervisor",
    notes: "",
  };
  const [form, setForm] = useState(EMPTY_TEST);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleSubstance = (sub) => setForm(f => ({
    ...f,
    substances_tested: f.substances_tested.includes(sub)
      ? f.substances_tested.filter(x => x !== sub)
      : [...f.substances_tested, sub],
    substances_positive: f.substances_positive.filter(x => f.substances_tested.includes(x)),
  }));

  const togglePositive = (sub) => setForm(f => ({
    ...f,
    substances_positive: f.substances_positive.includes(sub)
      ? f.substances_positive.filter(x => x !== sub)
      : [...f.substances_positive, sub],
    result: f.substances_positive.includes(sub) && f.substances_positive.length === 1 ? "negative" : "positive",
  }));

  const selectedPerson = persons.find(p => p.id === form.person_id);
  const selectedEmployer = employers.find(e => e.id === selectedPerson?.employer_id);

  const saveTest = async () => {
    if (!form.person_id) return;
    setSaving(true);
    const record = {
      person_id: form.person_id,
      employer_id: selectedPerson?.employer_id || "",
      tested_at: new Date(form.tested_at).toISOString(),
      client_timestamp: new Date().toISOString(),
      test_reason: form.test_reason,
      specimen_type: form.specimen_type,
      device_brand: form.device_brand || null,
      device_lot: form.device_lot || null,
      substances_tested: form.substances_tested,
      substances_positive: form.substances_positive,
      result: form.refusal ? "invalid" : (form.substances_positive.length > 0 ? "positive" : "negative"),
      consent_given: form.consent_given,
      refusal: form.refusal,
      refusal_reason: form.refusal_reason || null,
      created_at: new Date().toISOString(),
    };

    let saved = { ...record, id: crypto.randomUUID() };
    if (!USE_MOCK && db) {
      const { data, error } = await db.from("drug_test").insert(record);
      if (!error && data?.[0]) saved = data[0];
    }
    setLiveTests(prev => [saved, ...(prev || MOCK_DRUG_TESTS)]);
    setForm(EMPTY_TEST);
    setShowForm(false);
    setSaving(false);
  };

  // Load live drug test data from Supabase on mount
  useEffect(() => {
    if (!db || USE_MOCK) return;
    db.from("drug_test").select().order("tested_at", {ascending:false}).limit(200).then(res => {
      if (res.data?.length) setLiveTests(res.data);
    }).catch(() => {});
  }, [db]);

  const tests = liveTests ?? MOCK_DRUG_TESTS;
  const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none" };
  const labelStyle = { fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: C.textTert, marginBottom: 4, fontWeight: 500, display: "block" };

  const printCert = async (dt) => {
    setGeneratingId(dt.id);
    try {
      const person = persons.find(p => p.id === dt.person_id);
      const employer = employers.find(e => e.id === dt.employer_id);
      const payload = {
        cert_id: dt.id,
        practice_name: "OccHealth Pro SA",
        person_first_name: person?.first_name || "",
        person_last_name: person?.last_name || "",
        employee_number: person?.employee_number || "",
        employer_name: employer?.name || "",
        job_title: person?.job_title || "",
        site: person?.site || employer?.name || "",
        tested_at: dt.tested_at || "",
        test_reason: dt.test_reason || "random",
        specimen_type: dt.specimen_type || "urine",
        device_brand: dt.device_brand || "",
        device_lot: dt.device_lot || "",
        substances_tested: dt.substances_tested || [],
        substances_positive: dt.substances_positive || [],
        result: dt.result || "negative",
        refusal: dt.refusal || false,
        refusal_reason: dt.refusal_reason || "",
        consent_given: dt.consent_given !== false,
        practitioner_name: dt.practitioner_name || "",
        sanc_number: dt.sanc_number || "",
        qualification: dt.qualification || "",
        collector_name: dt.collector_name || "",
        witness_name: dt.witness_name || "",
      };
      const res = await fetch("/.netlify/functions/drug-test-cert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch(e) {
      alert("Failed to generate certificate: " + e.message);
    }
    setGeneratingId(null);
  };

  return (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: 18, fontWeight: 500 }}>Drug & alcohol testing</div>
      <Btn size="sm" onClick={() => { setForm(EMPTY_TEST); setShowForm(true); }}>+ New test</Btn>
    </div>

    {showForm && (
      <Card style={{ marginBottom: "1rem", border: `1px solid ${C.teal}` }}>
        <SectionTitle>New drug & alcohol test</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Employee *</label>
            <select style={inputStyle} value={form.person_id} onChange={e => setF("person_id", e.target.value)}>
              <option value="">Select employee...</option>
              {persons.map(p => {
                const emp = employers.find(e => e.id === p.employer_id);
                return <option key={p.id} value={p.id}>{p.first_name} {p.last_name} — {emp?.name}</option>;
              })}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date & time of test</label>
            <input type="datetime-local" style={inputStyle} value={form.tested_at} onChange={e => setF("tested_at", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Reason for test</label>
            <select style={inputStyle} value={form.test_reason} onChange={e => setF("test_reason", e.target.value)}>
              <option value="random">Random</option>
              <option value="post_incident">Post-incident</option>
              <option value="reasonable_suspicion">Reasonable suspicion</option>
              <option value="pre_employment">Pre-employment</option>
              <option value="return_to_duty">Return to duty</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Specimen type</label>
            <select style={inputStyle} value={form.specimen_type} onChange={e => setF("specimen_type", e.target.value)}>
              <option value="urine">Urine</option>
              <option value="breath">Breath</option>
              <option value="oral_fluid">Oral fluid</option>
              <option value="blood">Blood</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Device brand</label>
            <input style={inputStyle} value={form.device_brand} onChange={e => setF("device_brand", e.target.value)} placeholder="e.g. DrugCheck 3000" />
          </div>
          <div>
            <label style={labelStyle}>Device lot number</label>
            <input style={inputStyle} value={form.device_lot} onChange={e => setF("device_lot", e.target.value)} placeholder="e.g. DC-2026-0441" />
          </div>
          <div>
            <label style={labelStyle}>Witness name</label>
            <input style={inputStyle} value={form.witness_name} onChange={e => setF("witness_name", e.target.value)} placeholder="Supervisor or HR representative" />
          </div>
          <div>
            <label style={labelStyle}>Witness designation</label>
            <input style={inputStyle} value={form.witness_title} onChange={e => setF("witness_title", e.target.value)} placeholder="e.g. Site Safety Officer" />
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Substances tested (tick all tested)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {SUBSTANCES.map(sub => (
              <label key={sub} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, cursor: "pointer", background: form.substances_tested.includes(sub) ? C.tealLight : C.bgSub, border: `1px solid ${form.substances_tested.includes(sub) ? C.tealMid : C.border}`, borderRadius: 5, padding: "4px 8px", color: form.substances_tested.includes(sub) ? C.teal : C.text }}>
                <input type="checkbox" checked={form.substances_tested.includes(sub)} onChange={() => toggleSubstance(sub)} style={{ accentColor: C.teal }} />
                {sub}
              </label>
            ))}
          </div>
        </div>

        {!form.refusal && form.substances_tested.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Positive results (tick any positives)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {form.substances_tested.map(sub => (
                <label key={sub} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, cursor: "pointer", background: form.substances_positive.includes(sub) ? "#FEF2F2" : C.bgSub, border: `1px solid ${form.substances_positive.includes(sub) ? "#FECACA" : C.border}`, borderRadius: 5, padding: "4px 8px", color: form.substances_positive.includes(sub) ? "#DC2626" : C.text }}>
                  <input type="checkbox" checked={form.substances_positive.includes(sub)} onChange={() => togglePositive(sub)} />
                  {sub}
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "8px 12px", borderRadius: 7, background: form.consent_given ? C.tealLight : "#FEF2F2", border: `1px solid ${form.consent_given ? C.tealMid : "#FECACA"}` }}>
            <input type="checkbox" checked={form.consent_given} onChange={e => setF("consent_given", e.target.checked)} style={{ accentColor: C.teal, width: 16, height: 16 }} />
            <span style={{ color: form.consent_given ? C.teal : "#DC2626", fontWeight: 500 }}>Informed consent obtained</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "8px 12px", borderRadius: 7, background: form.refusal ? "#FEF2F2" : C.bgSub, border: `1px solid ${form.refusal ? "#FECACA" : C.border}` }}>
            <input type="checkbox" checked={form.refusal} onChange={e => setF("refusal", e.target.checked)} />
            <span style={{ color: form.refusal ? "#DC2626" : C.text, fontWeight: form.refusal ? 500 : 400 }}>Employee refused to test</span>
          </label>
        </div>

        {form.refusal && (
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Reason for refusal</label>
            <input style={inputStyle} value={form.refusal_reason} onChange={e => setF("refusal_reason", e.target.value)} placeholder="Employee's stated reason for refusal..." />
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Btn onClick={saveTest} disabled={saving || !form.person_id}>{saving ? "Saving..." : "Save test record"}</Btn>
          <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancel</Btn>
          {form.substances_positive.length > 0 && <Badge color="red">⚠ {form.substances_positive.length} positive result{form.substances_positive.length > 1 ? "s" : ""}</Badge>}
          {form.refusal && <Badge color="gray">Refusal logged</Badge>}
        </div>
      </Card>
    )}

    {tests.map(dt => {
      const person = persons.find(p => p.id === dt.person_id);
      const employer = employers.find(e => e.id === dt.employer_id);
      return (
        <Card key={dt.id} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {person ? `${person.first_name} ${person.last_name}` : <span style={{ color: C.textTert }}>Employee not found</span>}
              </div>
              <div style={{ fontSize: 12, color: C.textSub }}>{employer?.name || "—"} · {dt.test_reason.replace(/_/g," ")} · {dt.specimen_type}</div>
              <div style={{ fontSize: 11, color: C.textTert }}>{new Date(dt.tested_at).toLocaleDateString("en-ZA")}</div>
              <div style={{ fontSize: 11, color: C.textTert, marginTop: 2 }}>Substances: {dt.substances_tested.join(", ")}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <Badge color={dt.result === "negative" ? "teal" : dt.result === "positive" ? "red" : "amber"}>{dt.result}</Badge>
              <Btn size="sm" variant="ghost" onClick={() => printCert(dt)} disabled={generatingId === dt.id}>
                {generatingId === dt.id ? "Generating..." : "Certificate"}
              </Btn>
            </div>
          </div>
        </Card>
      );
    })}
  </div>
  );
};

// ─── EMPLOYER PORTAL ──────────────────────────────────────────────────────────

// Mini bar chart component — no external deps
const MiniBar = ({ value, max, color = C.teal }) => (
  <div style={{ height: 6, background: C.bgSub, borderRadius: 3, overflow: "hidden", marginTop: 6 }}>
    <div style={{ height: "100%", width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`, background: color, borderRadius: 3, transition: "width 0.4s ease" }} />
  </div>
);

// Sparkline-style month bars
const MonthBars = ({ data, valueKey, color = C.teal, height = 40 }) => {
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const pct = val / max;
        const month = d.month ? new Date(d.month).toLocaleDateString("en-ZA", { month: "short" }) : "";
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div title={`${month}: ${val}`} style={{ width: "100%", height: Math.max(3, pct * (height - 14)), background: color, borderRadius: "2px 2px 0 0", transition: "height 0.4s ease" }} />
            <div style={{ fontSize: 9, color: C.textTert, whiteSpace: "nowrap" }}>{month}</div>
          </div>
        );
      })}
    </div>
  );
};

const EmployerPortal = ({ session }) => {
  const { employers, db } = useData();

  // Employer selector — portal can be scoped to one employer
  const [selEmployerId, setSelEmployerId] = useState(employers[0]?.id || "");
  const selEmployer = employers.find(e => e.id === selEmployerId) || employers[0];

  // Period filter
  const [period, setPeriod] = useState("6"); // months back

  // Data from materialised views
  const [survData, setSurvData] = useState([]);
  const [iodData, setIodData] = useState([]);
  const [fitnessData, setFitnessData] = useState(null);
  const [drugData, setDrugData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Mock data for demo mode
  const MOCK_SURV = [
    { employer_id: selEmployerId, month: "2026-04-01", test_type: "audiometry", total_due: 8, completed: 7, overdue: 1, compliance_pct: 87.5 },
    { employer_id: selEmployerId, month: "2026-04-01", test_type: "spirometry", total_due: 5, completed: 5, overdue: 0, compliance_pct: 100 },
    { employer_id: selEmployerId, month: "2026-05-01", test_type: "audiometry", total_due: 6, completed: 4, overdue: 2, compliance_pct: 66.7 },
    { employer_id: selEmployerId, month: "2026-05-01", test_type: "spirometry", total_due: 4, completed: 4, overdue: 0, compliance_pct: 100 },
    { employer_id: selEmployerId, month: "2026-06-01", test_type: "audiometry", total_due: 10, completed: 6, overdue: 4, compliance_pct: 60 },
    { employer_id: selEmployerId, month: "2026-06-01", test_type: "spirometry", total_due: 6, completed: 3, overdue: 3, compliance_pct: 50 },
    { employer_id: selEmployerId, month: "2026-06-01", test_type: "vision", total_due: 4, completed: 4, overdue: 0, compliance_pct: 100 },
  ];
  const MOCK_IOD = [
    { employer_id: selEmployerId, month: "2026-04-01", iod_count: 1, lost_time_injuries: 0, fatalities: 0, claims_submitted: 1, claims_paid: 1 },
    { employer_id: selEmployerId, month: "2026-05-01", iod_count: 3, lost_time_injuries: 1, fatalities: 0, claims_submitted: 2, claims_paid: 0 },
    { employer_id: selEmployerId, month: "2026-06-01", iod_count: 2, lost_time_injuries: 0, fatalities: 0, claims_submitted: 2, claims_paid: 0 },
  ];
  const MOCK_FITNESS = { employer_id: selEmployerId, total_certs: 18, current: 14, expired: 2, expiring_30_days: 2 };
  const MOCK_DRUG = [
    { employer_id: selEmployerId, month: "2026-04-01", tests_conducted: 12, positives: 0, refusals: 0, positivity_rate: 0 },
    { employer_id: selEmployerId, month: "2026-05-01", tests_conducted: 15, positives: 1, refusals: 0, positivity_rate: 6.7 },
    { employer_id: selEmployerId, month: "2026-06-01", tests_conducted: 10, positives: 0, refusals: 1, positivity_rate: 0 },
  ];

  const loadPortalData = async () => {
    if (!selEmployer) return;
    setLoading(true);
    const eid = selEmployer.id;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - Number(period));
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    if (!USE_MOCK && db) {
      try {
        const [s, i, f, d] = await Promise.all([
          db.from("employer_surveillance_summary").select(`employer_id=eq.${eid}&month=gte.${cutoffStr}&order=month.asc`),
          db.from("employer_iod_summary").select(`employer_id=eq.${eid}&month=gte.${cutoffStr}&order=month.asc`),
          db.from("employer_fitness_summary").select(`employer_id=eq.${eid}`),
          db.from("employer_drug_test_summary").select(`employer_id=eq.${eid}&month=gte.${cutoffStr}&order=month.asc`),
        ]);
        setSurvData(s.data || []);
        setIodData(i.data || []);
        setFitnessData(f.data?.[0] || null);
        setDrugData(d.data || []);
      } catch(e) {
        console.warn("Portal data load error:", e);
        setSurvData(MOCK_SURV); setIodData(MOCK_IOD); setFitnessData(MOCK_FITNESS); setDrugData(MOCK_DRUG);
      }
    } else {
      setSurvData(MOCK_SURV); setIodData(MOCK_IOD); setFitnessData(MOCK_FITNESS); setDrugData(MOCK_DRUG);
    }
    setLastRefreshed(new Date());
    setLoading(false);
  };

  useEffect(() => { loadPortalData(); }, [selEmployer?.id, period, db]);

  const generateComplianceReport = async () => {
    setGeneratingReport(true);
    try {
      const periodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label || `Last ${period} months`;
      // Aggregate surveillance by type
      const survByTypeFull = Object.entries(survData.reduce((acc, r) => {
        if (!acc[r.test_type]) acc[r.test_type] = { test_type: r.test_type, total_due: 0, completed: 0, overdue: 0 };
        acc[r.test_type].total_due  += Number(r.total_due || 0);
        acc[r.test_type].completed  += Number(r.completed || 0);
        acc[r.test_type].overdue    += Number(r.overdue || 0);
        return acc;
      }, {})).map(([, v]) => ({
        ...v,
        compliance_pct: v.total_due > 0 ? ((v.completed / v.total_due) * 100).toFixed(1) : "0.0",
      }));

      const payload = {
        employer: {
          name: selEmployer?.name,
          coida_ref: selEmployer?.coida_ref,
          industry_class: selEmployer?.industry_class,
          coida_insurer: selEmployer?.coida_insurer,
        },
        practice: {
          name: "OccHealth Pro SA",
          practitioner: session?.user?.user_metadata?.full_name || "",
        },
        surveillance: {
          compliance_pct: totalDue > 0 ? ((totalCompleted / totalDue) * 100).toFixed(1) : "0.0",
          total_due: totalDue,
          completed: totalCompleted,
          overdue: totalOverdue,
          by_type: survByTypeFull,
        },
        fitness: fitnessData || {},
        iod: {
          iod_count: totalIOD,
          lost_time_injuries: totalLTI,
          fatalities: totalFatalities,
          claims_submitted: iodData.reduce((s, r) => s + Number(r.claims_submitted || 0), 0),
        },
        drug: {
          tests_conducted: totalTests,
          positives: totalPositives,
          refusals: totalRefusals,
          positivity_rate: overallPositivity,
        },
        period_label: periodLabel,
        generated_at: new Date().toISOString(),
      };

      const res = await fetch("/.netlify/functions/compliance-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Report error: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compliance-report-${(selEmployer?.name || "employer").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch(e) {
      alert("Report generation failed: " + e.message);
    }
    setGeneratingReport(false);
  };

  // ── Derived KPIs ──
  // Surveillance: overall compliance across all test types in period
  const totalDue = survData.reduce((s, r) => s + Number(r.total_due || 0), 0);
  const totalCompleted = survData.reduce((s, r) => s + Number(r.completed || 0), 0);
  const overallCompliance = totalDue > 0 ? Math.round((totalCompleted / totalDue) * 100) : null;
  const totalOverdue = survData.reduce((s, r) => s + Number(r.overdue || 0), 0);

  // IOD: totals for period
  const totalIOD = iodData.reduce((s, r) => s + Number(r.iod_count || 0), 0);
  const totalLTI = iodData.reduce((s, r) => s + Number(r.lost_time_injuries || 0), 0);
  const totalFatalities = iodData.reduce((s, r) => s + Number(r.fatalities || 0), 0);

  // Surveillance by test type (latest period collapsed)
  const survByType = survData.reduce((acc, r) => {
    if (!acc[r.test_type]) acc[r.test_type] = { total_due: 0, completed: 0, overdue: 0 };
    acc[r.test_type].total_due  += Number(r.total_due || 0);
    acc[r.test_type].completed  += Number(r.completed || 0);
    acc[r.test_type].overdue    += Number(r.overdue || 0);
    return acc;
  }, {});

  // Drug: totals
  const totalTests = drugData.reduce((s, r) => s + Number(r.tests_conducted || 0), 0);
  const totalPositives = drugData.reduce((s, r) => s + Number(r.positives || 0), 0);
  const totalRefusals = drugData.reduce((s, r) => s + Number(r.refusals || 0), 0);
  const overallPositivity = totalTests > 0 ? ((totalPositives / totalTests) * 100).toFixed(1) : "0.0";

  // IOD months for sparkline
  const iodMonths = iodData.slice(-6);
  const drugMonths = drugData.slice(-6);

  const complianceColor = overallCompliance === null ? C.textTert : overallCompliance >= 90 ? C.teal : overallCompliance >= 70 ? C.amber : C.red;

  const PERIOD_OPTIONS = [
    { value: "3", label: "Last 3 months" },
    { value: "6", label: "Last 6 months" },
    { value: "12", label: "Last 12 months" },
  ];

  const TEST_LABEL = { audiometry: "Audiometry", spirometry: "Spirometry", vision: "Vision", bio_monitor: "Bio monitoring", blood_pressure: "Blood pressure", glucose: "Glucose", lung_function: "Lung function" };

  return (
    <div>
      {/* Header */}
      <div style={{ background: C.tealDark, borderRadius: 10, padding: "1.25rem 1.5rem", marginBottom: "1.25rem", color: "#fff" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5DCAA5", marginBottom: 6 }}>Employer portal</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            {employers.length > 1 ? (
              <select
                value={selEmployerId}
                onChange={e => setSelEmployerId(e.target.value)}
                style={{ fontSize: 18, fontWeight: 500, background: "transparent", color: "#fff", border: "none", outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
                {employers.map(e => <option key={e.id} value={e.id} style={{ color: C.text, background: C.bgCard }}>{e.name}</option>)}
              </select>
            ) : (
              <div style={{ fontSize: 18, fontWeight: 500 }}>{selEmployer?.name || "—"}</div>
            )}
            <div style={{ fontSize: 13, color: "#9FE1CB", marginTop: 2 }}>
              Aggregate compliance view · No individual clinical records
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", outline: "none" }}>
              {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ color: C.text, background: C.bgCard }}>{o.label}</option>)}
            </select>
            <button
              onClick={loadPortalData}
              disabled={loading}
              style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer" }}>
              {loading ? "Loading..." : "⟳ Refresh"}
            </button>
            <button
              onClick={generateComplianceReport}
              disabled={generatingReport || loading}
              style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", background: generatingReport ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.2)", color: "#fff", cursor: generatingReport ? "default" : "pointer", fontWeight: 500 }}>
              {generatingReport ? "Generating..." : "📄 Compliance Report"}
            </button>
          </div>
        </div>
        {lastRefreshed && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
            Last refreshed: {lastRefreshed.toLocaleTimeString("en-ZA")}
          </div>
        )}
      </div>

      {/* Confidentiality notice */}
      <Card style={{ background: C.tealLight, border: `1px solid ${C.tealMid}`, marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 12, color: C.tealDark, lineHeight: 1.6 }}>
          <strong>Confidentiality notice:</strong> This portal displays aggregate workforce health metrics only. Individual clinical records, fitness assessments, test results, and personal medical information are confidential and accessible to registered occupational health practitioners only, in accordance with POPIA and the National Health Act.
        </div>
      </Card>

      {/* ── KPI ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
        {/* Surveillance compliance */}
        <Card>
          <div style={{ fontSize: 11, color: C.textTert, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Surveillance compliance</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: complianceColor, lineHeight: 1 }}>
            {overallCompliance !== null ? `${overallCompliance}%` : "—"}
          </div>
          <div style={{ fontSize: 12, color: C.textSub, marginTop: 4 }}>
            {totalCompleted}/{totalDue} tests complete
            {totalOverdue > 0 && <span style={{ color: C.red, marginLeft: 8 }}>· {totalOverdue} overdue</span>}
          </div>
          <MiniBar value={totalCompleted} max={totalDue} color={complianceColor} />
        </Card>

        {/* Fitness certificates */}
        <Card>
          <div style={{ fontSize: 11, color: C.textTert, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Fitness certs current</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: fitnessData ? (fitnessData.expired > 0 ? C.amber : C.teal) : C.textTert, lineHeight: 1 }}>
            {fitnessData ? `${fitnessData.current}/${fitnessData.total_certs}` : "—"}
          </div>
          <div style={{ fontSize: 12, color: C.textSub, marginTop: 4 }}>
            {fitnessData?.expired > 0 && <span style={{ color: C.red }}>{fitnessData.expired} expired · </span>}
            {fitnessData?.expiring_30_days > 0 && <span style={{ color: C.amber }}>{fitnessData.expiring_30_days} expiring in 30 days</span>}
            {fitnessData && fitnessData.expired === 0 && fitnessData.expiring_30_days === 0 && <span style={{ color: C.teal }}>All current</span>}
          </div>
          {fitnessData && <MiniBar value={fitnessData.current} max={fitnessData.total_certs} color={fitnessData.expired > 0 ? C.amber : C.teal} />}
        </Card>

        {/* IOD */}
        <Card>
          <div style={{ fontSize: 11, color: C.textTert, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>IOD incidents ({PERIOD_OPTIONS.find(o => o.value === period)?.label})</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: totalIOD === 0 ? C.teal : totalFatalities > 0 ? C.red : C.amber, lineHeight: 1 }}>
            {totalIOD}
          </div>
          <div style={{ fontSize: 12, color: C.textSub, marginTop: 4 }}>
            {totalLTI > 0 && <span style={{ color: C.amber }}>{totalLTI} lost-time · </span>}
            {totalFatalities > 0 && <span style={{ color: C.red }}>{totalFatalities} fatalities · </span>}
            {totalIOD === 0 ? <span style={{ color: C.teal }}>Zero incidents</span> : `${iodData.reduce((s,r) => s + Number(r.claims_submitted||0), 0)} claims submitted`}
          </div>
          {iodMonths.length > 0 && <div style={{ marginTop: 10 }}><MonthBars data={iodMonths} valueKey="iod_count" color={C.amber} height={36} /></div>}
        </Card>

        {/* Drug testing */}
        <Card>
          <div style={{ fontSize: 11, color: C.textTert, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Drug & alcohol testing</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: Number(overallPositivity) > 0 ? C.red : C.teal, lineHeight: 1 }}>
            {overallPositivity}%
          </div>
          <div style={{ fontSize: 12, color: C.textSub, marginTop: 4 }}>
            positivity rate · {totalTests} tests · {totalPositives} positive{totalPositives !== 1 ? "s" : ""}
            {totalRefusals > 0 && <span style={{ color: C.amber }}> · {totalRefusals} refusal{totalRefusals !== 1 ? "s" : ""}</span>}
          </div>
          {drugMonths.length > 0 && <div style={{ marginTop: 10 }}><MonthBars data={drugMonths} valueKey="tests_conducted" color={C.teal} height={36} /></div>}
        </Card>
      </div>

      {/* ── SURVEILLANCE BY TEST TYPE ── */}
      {Object.keys(survByType).length > 0 && (
        <>
          <SectionTitle>Surveillance compliance by test type</SectionTitle>
          {Object.entries(survByType).map(([type, counts]) => {
            const pct = counts.total_due > 0 ? Math.round((counts.completed / counts.total_due) * 100) : 0;
            const color = pct >= 90 ? "teal" : pct >= 70 ? "amber" : "red";
            return (
              <Card key={type} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{TEST_LABEL[type] || type}</div>
                    <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>
                      {counts.completed}/{counts.total_due} complete
                      {counts.overdue > 0 && <span style={{ color: C.red, marginLeft: 8 }}>{counts.overdue} overdue</span>}
                    </div>
                  </div>
                  <Badge color={color}>{pct}%</Badge>
                </div>
                <MiniBar value={counts.completed} max={counts.total_due} color={pct >= 90 ? C.teal : pct >= 70 ? C.amber : C.red} />
              </Card>
            );
          })}
        </>
      )}

      {/* ── IOD MONTHLY BREAKDOWN ── */}
      {iodData.length > 0 && (
        <>
          <SectionTitle style={{ marginTop: "1.25rem" }}>IOD incidents by month</SectionTitle>
          {iodData.map((row, i) => {
            const month = row.month ? new Date(row.month).toLocaleDateString("en-ZA", { month: "long", year: "numeric" }) : "";
            return (
              <Card key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{month}</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {Number(row.lost_time_injuries) > 0 && <Badge color="amber">{row.lost_time_injuries} LTI</Badge>}
                    {Number(row.fatalities) > 0 && <Badge color="red">{row.fatalities} fatal</Badge>}
                    <Badge color={Number(row.iod_count) === 0 ? "teal" : "amber"}>{row.iod_count} incident{Number(row.iod_count) !== 1 ? "s" : ""}</Badge>
                  </div>
                </div>
                {(Number(row.claims_submitted) > 0) && (
                  <div style={{ fontSize: 11, color: C.textSub, marginTop: 4 }}>
                    {row.claims_submitted} claim{Number(row.claims_submitted) !== 1 ? "s" : ""} submitted · {row.claims_paid} paid
                  </div>
                )}
              </Card>
            );
          })}
        </>
      )}

      {/* ── DRUG TEST MONTHLY BREAKDOWN ── */}
      {drugData.length > 0 && (
        <>
          <SectionTitle style={{ marginTop: "1.25rem" }}>Drug & alcohol tests by month</SectionTitle>
          {drugData.map((row, i) => {
            const month = row.month ? new Date(row.month).toLocaleDateString("en-ZA", { month: "long", year: "numeric" }) : "";
            const positivity = Number(row.positivity_rate) || 0;
            return (
              <Card key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{month}</div>
                    <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>
                      {row.tests_conducted} test{Number(row.tests_conducted) !== 1 ? "s" : ""}
                      {Number(row.refusals) > 0 && <span style={{ color: C.amber }}> · {row.refusals} refusal{Number(row.refusals) !== 1 ? "s" : ""}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {Number(row.positives) > 0 && <Badge color="red">{row.positives} positive</Badge>}
                    <Badge color={positivity === 0 ? "teal" : positivity < 5 ? "amber" : "red"}>{positivity.toFixed(1)}%</Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </>
      )}

      {/* Empty state */}
      {!loading && survData.length === 0 && iodData.length === 0 && !fitnessData && drugData.length === 0 && (
        <Card style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: 13, color: C.textSub, marginBottom: 8 }}>No data available for this employer and period.</div>
          <div style={{ fontSize: 12, color: C.textTert }}>Data populates as the OHP records encounters, surveillance results, IOD incidents, and drug tests.</div>
        </Card>
      )}
    </div>
  );
};

// ─── FINANCE & BILLING ────────────────────────────────────────────────────────

// ── Helpers ──────────────────────────────────────────────────────────────────
const downloadCSV = (rows, filename) => {
  const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '\\"')}""`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

const formatDateZA = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
};

// ── WhatsApp message templates ────────────────────────────────────────────────
const WA_TEMPLATES = {
  surveillance_due: (name, testType, date, practice) =>
    `Hi ${name}, this is a reminder from ${practice}. Your ${testType} health surveillance is due on ${date}. Please report to the clinic on this date. Reply STOP to opt out.`,
  cert_expiring: (name, date, practice) =>
    `Hi ${name}, your fitness certificate issued by ${practice} expires on ${date}. Please contact us to schedule your renewal assessment. Reply STOP to opt out.`,
  iod_followup: (name, incidentDate, practice) =>
    `Hi ${name}, following your injury on ${incidentDate}, ${practice} would like to schedule a follow-up assessment. Please contact us at your earliest convenience.`,
  cert_issued: (name, status, validUntil, practice) =>
    `Hi ${name}, your fitness assessment with ${practice} is complete. Outcome: ${status.replace(/_/g," ")}. Valid until ${validUntil}. Contact us if you have any questions.`,
};

// ── WhatsApp sender via Netlify function ──────────────────────────────────────
const sendWhatsApp = async (to, message) => {
  const res = await fetch("/.netlify/functions/whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, message }),
  });
  if (!res.ok) throw new Error(`WhatsApp send failed: ${res.status}`);
  return res.json();
};

// ── WhatsApp Compose Modal ────────────────────────────────────────────────────
const WhatsAppModal = ({ template, recipient, onClose }) => {
  const [message, setMessage] = useState(template || "");
  const [to, setTo] = useState(recipient?.phone || "");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!to || !message) return;
    setSending(true);
    setError("");
    try {
      await sendWhatsApp(to, message);
      setSent(true);
    } catch(e) {
      setError(e.message);
    }
    setSending(false);
  };

  if (sent) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.bgCard, borderRadius: 12, padding: "2rem", width: 400, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Message sent</div>
        <div style={{ fontSize: 13, color: C.textSub, marginBottom: "1.5rem" }}>WhatsApp message delivered to {to}</div>
        <Btn onClick={onClose}>Close</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.bgCard, borderRadius: 12, padding: "1.5rem", width: 480, maxWidth: "95vw" }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: "1rem" }}>Send WhatsApp message</div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: C.textSub, display: "block", marginBottom: 4 }}>To (phone number with country code)</label>
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="+27821234567"
            style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: 11, color: C.textSub, display: "block", marginBottom: 4 }}>Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 13, resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }} />
          <div style={{ fontSize: 11, color: C.textTert, marginTop: 4 }}>{message.length} characters</div>
        </div>
        {error && <div style={{ background: C.redLight, border: `1px solid ${C.red}`, borderRadius: 6, padding: "8px 10px", fontSize: 12, color: C.red, marginBottom: 10 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSend} disabled={sending || !to || !message} style={{ background: "#25D366", borderColor: "#25D366" }}>
            {sending ? "Sending..." : "Send via WhatsApp"}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ── Main Finance & Billing Screen ─────────────────────────────────────────────
const FinanceBilling = ({ session }) => {
  const { employers, persons, encounters, db } = useData();
  const meta = session?.user?.user_metadata || {};

  const [tab, setTab] = useState("invoices");
  const [period, setPeriod] = useState("month");
  const [waModal, setWaModal] = useState(null); // {template, recipient}

  // Invoice state
  const [invoices, setInvoices] = useState([]);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [invSaving, setInvSaving] = useState(false);
  const EMPTY_INV = {
    employer_id: employers[0]?.id || "",
    billing_model: "per_session",
    lines: [{ description: "Occupational health sessions", quantity: 1, unit_amount: 0 }],
    due_days: 30,
  };
  const [invForm, setInvForm] = useState(EMPTY_INV);

  // WhatsApp alerts state
  const [waAlerts, setWaAlerts] = useState([]);

  useEffect(() => {
    if (!db || USE_MOCK) {
      // Build mock invoices
      setInvoices([
        { id: "inv1", employer_id: employers[0]?.id, invoice_number: "OHP-001", issue_date: "2026-06-01", due_date: "2026-07-01", total: 3500, vat_amount: 456.52, status: "issued", billing_model: "per_session" },
        { id: "inv2", employer_id: employers[0]?.id, invoice_number: "OHP-002", issue_date: "2026-05-01", due_date: "2026-06-01", total: 3500, vat_amount: 456.52, status: "paid", billing_model: "per_session" },
      ]);
      return;
    }
    db.from("invoice").select().order("issue_date", {ascending:false}).limit(200).then(res => {
      if (res.data?.length) setInvoices(res.data);
    }).catch(() => {});
  }, [db, employers[0]?.id]);

  // Build WhatsApp alert list from live data
  useEffect(() => {
    const alerts = [];
    const practice = meta.tenant_name || "OccHealth Pro SA";
    const today = new Date();

    // Surveillance due within 14 days — needs persons with phone numbers
    // In practice these come from surveillance_event — using persons as proxy
    persons.forEach(p => {
      if (p.phone && p.surveillance_due_date) {
        const due = new Date(p.surveillance_due_date);
        const days = Math.round((due - today) / 86400000);
        if (days >= 0 && days <= 14) {
          alerts.push({
            id: `surv_${p.id}`,
            type: "surveillance_due",
            person: p,
            label: `${p.first_name} ${p.last_name} — surveillance due in ${days} days`,
            template: WA_TEMPLATES.surveillance_due(
              p.first_name,
              "health surveillance",
              due.toLocaleDateString("en-ZA"),
              practice
            ),
          });
        }
      }
    });

    setWaAlerts(alerts);
  }, [persons, meta.tenant_name]);

  // Generate next invoice number
  const nextInvNumber = () => {
    const nums = invoices.map(i => parseInt(i.invoice_number?.replace(/[^0-9]/g, "") || "0")).filter(Boolean);
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `OHP-${String(next).padStart(3, "0")}`;
  };

  // Save invoice
  const saveInvoice = async () => {
    if (!invForm.employer_id || !invForm.lines.length) return;
    setInvSaving(true);
    const subtotal = invForm.lines.reduce((s, l) => s + (Number(l.quantity) * Number(l.unit_amount)), 0);
    const vat = subtotal * VAT_RATE;
    const total = subtotal + vat;
    const issueDate = new Date().toISOString().slice(0,10);
    const dueDate = new Date(Date.now() + invForm.due_days * 86400000).toISOString().slice(0,10);

    const inv = {
      employer_id: invForm.employer_id,
      invoice_number: nextInvNumber(),
      issue_date: issueDate,
      due_date: dueDate,
      billing_model: invForm.billing_model,
      subtotal: Math.round(subtotal * 100) / 100,
      vat_amount: Math.round(vat * 100) / 100,
      total: Math.round(total * 100) / 100,
      status: "draft",
      created_at: new Date().toISOString(),
    };

    try {
      if (!USE_MOCK && db) {
        const res = await db.from("invoice").insert(inv).select();
        if (res.data?.[0]) {
          // Insert lines
          const lines = invForm.lines.map(l => ({
            invoice_id: res.data[0].id,
            description: l.description,
            quantity: Number(l.quantity),
            unit_amount: Number(l.unit_amount),
            vat_rate: VAT_RATE,
            line_total: Number(l.quantity) * Number(l.unit_amount),
          }));
          await db.from("invoice_line").insert(lines);
          setInvoices(prev => [res.data[0], ...prev]);
        }
      } else {
        setInvoices(prev => [{ ...inv, id: `inv_${Date.now()}` }, ...prev]);
      }
    } catch(e) { console.warn("Invoice save error", e); }

    setInvForm({ ...EMPTY_INV, lines: [{ description: "Occupational health sessions", quantity: 1, unit_amount: 0 }] });
    setShowNewInvoice(false);
    setInvSaving(false);
  };

  // ── Xero CSV export ──────────────────────────────────────────────────────
  const exportXeroInvoices = () => {
    const header = ["ContactName","InvoiceNumber","InvoiceDate","DueDate","Description","Quantity","UnitAmount","AccountCode","TaxType"];
    const rows = [header];
    invoices.forEach(inv => {
      const emp = employers.find(e => e.id === inv.employer_id);
      const contactName = emp?.name || "Unknown";
      // If no line detail available, create a summary line
      rows.push([
        contactName,
        inv.invoice_number,
        formatDateZA(inv.issue_date),
        formatDateZA(inv.due_date),
        `Occupational health services — ${inv.billing_model?.replace(/_/g," ")}`,
        1,
        inv.subtotal || 0,
        "400",   // Revenue account
        "OUTPUT2", // 15% VAT
      ]);
    });
    downloadCSV(rows, `xero_invoices_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const exportXeroContacts = () => {
    const header = ["Name","EmailAddress","POAddressLine1","POCity","POCountry","TaxNumber","CompanyNumber"];
    const rows = [header];
    employers.forEach(emp => {
      rows.push([emp.name, emp.contact_email || "", "", "", "ZA", emp.coida_ref || "", ""]);
    });
    downloadCSV(rows, `xero_contacts_${new Date().toISOString().slice(0,10)}.csv`);
  };

  // ── Sage CSV export ──────────────────────────────────────────────────────
  const exportSageInvoices = () => {
    const header = ["Type","Date","Reference","Net Amount","VAT Code","Gross Amount","Nominal Code","Details"];
    const rows = [header];
    invoices.forEach(inv => {
      const emp = employers.find(e => e.id === inv.employer_id);
      rows.push([
        "SI",
        formatDateZA(inv.issue_date),
        inv.invoice_number,
        inv.subtotal || 0,
        "T1",
        inv.total || 0,
        "4000",
        `${emp?.name || ""} — OHP services`,
      ]);
    });
    downloadCSV(rows, `sage_invoices_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const exportSageContacts = () => {
    const header = ["Account Reference","Company Name","Currency","Contact Name","Email"];
    const rows = [header];
    employers.forEach((emp, i) => {
      rows.push([`EMP${String(i+1).padStart(3,"0")}`, emp.name, "ZAR", "", emp.contact_email || ""]);
    });
    downloadCSV(rows, `sage_contacts_${new Date().toISOString().slice(0,10)}.csv`);
  };

  // ── VAT201 workpaper ──────────────────────────────────────────────────────
  const exportVAT201 = () => {
    const header = ["Invoice No","Issue Date","Contact","Net (excl VAT)","VAT (15%)","Gross (incl VAT)","Status"];
    const rows = [header];
    let totalNet = 0, totalVat = 0, totalGross = 0;
    invoices.forEach(inv => {
      const emp = employers.find(e => e.id === inv.employer_id);
      const net = Number(inv.subtotal || 0);
      const vat = Number(inv.vat_amount || 0);
      const gross = Number(inv.total || 0);
      totalNet += net; totalVat += vat; totalGross += gross;
      rows.push([inv.invoice_number, formatDateZA(inv.issue_date), emp?.name || "", net.toFixed(2), vat.toFixed(2), gross.toFixed(2), inv.status]);
    });
    rows.push(["TOTAL","","",totalNet.toFixed(2),totalVat.toFixed(2),totalGross.toFixed(2),""]);
    downloadCSV(rows, `vat201_workpaper_${new Date().toISOString().slice(0,10)}.csv`);
  };

  // ── WhatsApp bulk sender (surveillance due) ───────────────────────────────
  const sendSurveillanceReminders = async (events, survEvents) => {
    const practice = meta.tenant_name || "OccHealth Pro SA";
    let sent = 0;
    for (const ev of survEvents) {
      const p = persons.find(x => x.id === ev.person_id);
      if (!p?.phone) continue;
      const due = new Date(ev.scheduled_date).toLocaleDateString("en-ZA");
      const testLabel = ev.test_type?.replace(/_/g," ") || "health surveillance";
      try {
        await sendWhatsApp(p.phone, WA_TEMPLATES.surveillance_due(p.first_name, testLabel, due, practice));
        sent++;
      } catch(e) { console.warn("WA send failed:", e); }
    }
    return sent;
  };

  const TAB_STYLE = (active) => ({
    padding: "6px 14px", fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? C.teal : C.textSub, background: "none", border: "none",
    borderBottom: active ? `2px solid ${C.teal}` : "2px solid transparent",
    cursor: "pointer",
  });

  const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  // Derived stats
  const outstanding = invoices.filter(i => i.status === "issued").reduce((s, i) => s + Number(i.total || 0), 0);
  const paidThisMonth = invoices.filter(i => {
    if (i.status !== "paid") return false;
    const d = new Date(i.issue_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, i) => s + Number(i.total || 0), 0);

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: "1.25rem" }}>Finance & billing</div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: "1.25rem" }}>
        <StatCard label="Outstanding (issued)" value={`R${outstanding.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`} color={outstanding > 0 ? C.amber : C.teal} />
        <StatCard label="Paid this month" value={`R${paidThisMonth.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`} color={C.teal} />
        <StatCard label="Total invoices" value={invoices.length} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: "1.25rem" }}>
        <button style={TAB_STYLE(tab === "invoices")} onClick={() => setTab("invoices")}>Invoices</button>
        <button style={TAB_STYLE(tab === "exports")} onClick={() => setTab("exports")}>Xero / Sage export</button>
        <button style={TAB_STYLE(tab === "whatsapp")} onClick={() => setTab("whatsapp")}>WhatsApp</button>
      </div>

      {/* ── INVOICES TAB ──────────────────────────────── */}
      {tab === "invoices" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <Btn size="sm" onClick={() => setShowNewInvoice(v => !v)}>{showNewInvoice ? "Cancel" : "+ New invoice"}</Btn>
          </div>

          {showNewInvoice && (
            <Card style={{ marginBottom: "1rem", border: `1px solid ${C.teal}` }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>New invoice</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>EMPLOYER / CLIENT</div>
                  <select style={inputStyle} value={invForm.employer_id} onChange={e => setInvForm(f => ({ ...f, employer_id: e.target.value }))}>
                    {employers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>BILLING MODEL</div>
                  <select style={inputStyle} value={invForm.billing_model} onChange={e => setInvForm(f => ({ ...f, billing_model: e.target.value }))}>
                    <option value="per_session">Per session</option>
                    <option value="per_head">Per head (employee)</option>
                    <option value="retainer">Monthly retainer</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.textTert, marginBottom: 3 }}>PAYMENT TERMS (days)</div>
                  <select style={inputStyle} value={invForm.due_days} onChange={e => setInvForm(f => ({ ...f, due_days: Number(e.target.value) }))}>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: C.textTert, marginBottom: 6 }}>LINE ITEMS</div>
                {invForm.lines.map((line, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 80px 100px 32px", gap: 6, marginBottom: 6, alignItems: "center" }}>
                    <input style={inputStyle} value={line.description} onChange={e => setInvForm(f => ({ ...f, lines: f.lines.map((l, j) => j === i ? { ...l, description: e.target.value } : l) }))} placeholder="Description" />
                    <input style={inputStyle} type="number" value={line.quantity} onChange={e => setInvForm(f => ({ ...f, lines: f.lines.map((l, j) => j === i ? { ...l, quantity: e.target.value } : l) }))} placeholder="Qty" min={1} />
                    <input style={inputStyle} type="number" value={line.unit_amount} onChange={e => setInvForm(f => ({ ...f, lines: f.lines.map((l, j) => j === i ? { ...l, unit_amount: e.target.value } : l) }))} placeholder="Unit (excl VAT)" />
                    <button onClick={() => setInvForm(f => ({ ...f, lines: f.lines.filter((_,j) => j !== i) }))} style={{ border: "none", background: "none", cursor: "pointer", color: C.red, fontSize: 16, padding: 0 }}>×</button>
                  </div>
                ))}
                <Btn size="sm" variant="secondary" onClick={() => setInvForm(f => ({ ...f, lines: [...f.lines, { description: "", quantity: 1, unit_amount: 0 }] }))}>+ Add line</Btn>
              </div>

              {/* Totals preview */}
              {(() => {
                const sub = invForm.lines.reduce((s, l) => s + (Number(l.quantity) * Number(l.unit_amount)), 0);
                const vat = sub * VAT_RATE;
                return (
                  <div style={{ background: C.bgSub, borderRadius: 6, padding: "10px 12px", marginBottom: 12, fontSize: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.textSub }}>Subtotal (excl VAT)</span><span>R {sub.toFixed(2)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.textSub }}>VAT (15%)</span><span>R {vat.toFixed(2)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, marginTop: 4, paddingTop: 4, borderTop: `1px solid ${C.border}` }}><span>Total</span><span>R {(sub + vat).toFixed(2)}</span></div>
                  </div>
                );
              })()}

              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={saveInvoice} disabled={invSaving || !invForm.employer_id}>{invSaving ? "Saving..." : "Create invoice"}</Btn>
                <Btn variant="secondary" onClick={() => setShowNewInvoice(false)}>Cancel</Btn>
              </div>
            </Card>
          )}

          {invoices.length === 0 && !showNewInvoice && (
            <Card style={{ textAlign: "center", padding: "2rem" }}>
              <div style={{ fontSize: 13, color: C.textSub, marginBottom: 8 }}>No invoices yet.</div>
              <Btn size="sm" onClick={() => setShowNewInvoice(true)}>+ Create first invoice</Btn>
            </Card>
          )}

          {invoices.map(inv => {
            const emp = employers.find(e => e.id === inv.employer_id);
            const isOverdue = inv.status === "issued" && inv.due_date && new Date(inv.due_date) < new Date();
            return (
              <Card key={inv.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{inv.invoice_number}</div>
                    <div style={{ fontSize: 12, color: C.textSub }}>{emp?.name}</div>
                    <div style={{ fontSize: 11, color: C.textTert }}>
                      Issued: {formatDateZA(inv.issue_date)} · Due: {formatDateZA(inv.due_date)}
                      {isOverdue && <span style={{ color: C.red, marginLeft: 6 }}>OVERDUE</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>R {Number(inv.total || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</div>
                    <div style={{ marginTop: 4 }}>
                      <Badge color={inv.status === "paid" ? "teal" : isOverdue ? "red" : inv.status === "issued" ? "amber" : "gray"}>
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                {inv.status === "issued" && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <Btn size="sm" variant="ghost" onClick={async () => {
                      if (!USE_MOCK && db) await db.from("invoice").update({ status: "paid" }).eq("id", inv.id);
                      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: "paid" } : i));
                    }}>Mark paid</Btn>
                    {emp?.contact_email && (
                      <Btn size="sm" variant="secondary" onClick={() => {
                        // Send via WhatsApp to employer contact
                        setWaModal({
                          template: `Hi, please find invoice ${inv.invoice_number} for occupational health services. Amount due: R ${Number(inv.total||0).toFixed(2)} (incl VAT). Due date: ${formatDateZA(inv.due_date)}. Please remit payment to your OHP. Thank you.`,
                          recipient: { phone: "" },
                        });
                      }}>📱 Send reminder</Btn>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ── EXPORTS TAB ──────────────────────────────── */}
      {tab === "exports" && (
        <div>
          <Card style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: 11, color: C.textTert, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Xero</div>
            <div style={{ fontSize: 13, color: C.textSub, marginBottom: 12, lineHeight: 1.5 }}>
              Export invoices and contacts in Xero import format. In Xero: Accounts → Sales → Import, or Contacts → Import.
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn size="sm" onClick={exportXeroInvoices} disabled={invoices.length === 0}>Xero invoices CSV</Btn>
              <Btn size="sm" variant="secondary" onClick={exportXeroContacts} disabled={employers.length === 0}>Xero contacts CSV</Btn>
            </div>
            <div style={{ fontSize: 11, color: C.textTert, marginTop: 8 }}>
              Invoice account code: 400 · Tax type: OUTPUT2 (15% VAT) · Dates: DD/MM/YYYY
            </div>
          </Card>

          <Card style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: 11, color: C.textTert, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Sage / Pastel</div>
            <div style={{ fontSize: 13, color: C.textSub, marginBottom: 12, lineHeight: 1.5 }}>
              Export in Sage 50cloud / Pastel import format. In Sage: File → Import → Invoices or Customers.
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn size="sm" onClick={exportSageInvoices} disabled={invoices.length === 0}>Sage invoices CSV</Btn>
              <Btn size="sm" variant="secondary" onClick={exportSageContacts} disabled={employers.length === 0}>Sage contacts CSV</Btn>
            </div>
            <div style={{ fontSize: 11, color: C.textTert, marginTop: 8 }}>
              Type: SI (Sales Invoice) · Nominal code: 4000 · VAT code: T1 (standard rated) · Currency: ZAR
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 11, color: C.textTert, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>VAT workpaper</div>
            <div style={{ fontSize: 13, color: C.textSub, marginBottom: 12, lineHeight: 1.5 }}>
              Supporting schedule for SARS VAT201 return. Fields 1 (output tax), 1A (standard rated supplies), invoice detail.
            </div>
            <Btn size="sm" onClick={exportVAT201} disabled={invoices.length === 0}>VAT201 workpaper CSV</Btn>
            <div style={{ fontSize: 11, color: C.textTert, marginTop: 8 }}>VAT rate: 15% · All amounts in ZAR</div>
          </Card>
        </div>
      )}

      {/* ── WHATSAPP TAB ──────────────────────────────── */}
      {tab === "whatsapp" && (
        <div>
          <Card style={{ background: C.tealLight, border: `1px solid ${C.tealMid}`, marginBottom: "1.25rem" }}>
            <div style={{ fontSize: 13, color: C.tealDark, lineHeight: 1.6 }}>
              <strong>WhatsApp reminders via Twilio.</strong> Add your Twilio credentials in Netlify environment variables: TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM (your WhatsApp-enabled number, e.g. +27...). Messages sent from your registered Twilio number.
            </div>
          </Card>

          <SectionTitle>Message templates</SectionTitle>
          {[
            { key: "surveillance_due", label: "Surveillance due reminder", desc: "Sent to employees with upcoming surveillance tests", color: "amber" },
            { key: "cert_expiring", label: "Fitness cert expiry warning", desc: "Sent to employees whose certificates expire within 30 days", color: "amber" },
            { key: "iod_followup", label: "IOD follow-up", desc: "Sent to employees after an injury on duty", color: "red" },
            { key: "cert_issued", label: "Certificate issued", desc: "Sent to employees after fitness assessment is complete", color: "teal" },
          ].map(t => (
            <Card key={t.key} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{t.desc}</div>
                </div>
                <Btn size="sm" variant="ghost" onClick={() => setWaModal({
                  template: WA_TEMPLATES[t.key]("[Name]", t.key === "surveillance_due" ? "audiometry" : t.key === "cert_expiring" ? "2026-12-31" : t.key === "iod_followup" ? "01/06/2026" : "fit", t.key === "cert_issued" ? "2027-06-01" : "01/07/2026", meta.tenant_name || "OccHealth Pro SA"),
                  recipient: { phone: "" },
                })}>
                  Preview & send
                </Btn>
              </div>
            </Card>
          ))}

          <SectionTitle style={{ marginTop: "1.25rem" }}>Quick send</SectionTitle>
          <Card style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: C.textSub, marginBottom: 12 }}>Send a custom message to any number.</div>
            <Btn size="sm" onClick={() => setWaModal({ template: "", recipient: { phone: "" } })}>
              📱 New WhatsApp message
            </Btn>
          </Card>

          {/* Automated alerts from live data */}
          {waAlerts.length > 0 && (
            <>
              <SectionTitle style={{ marginTop: "1.25rem" }}>Pending alerts ({waAlerts.length})</SectionTitle>
              {waAlerts.map(alert => (
                <Card key={alert.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13 }}>{alert.label}</div>
                    <Btn size="sm" onClick={() => setWaModal({ template: alert.template, recipient: alert.person })}>Send</Btn>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* WhatsApp compose modal */}
      {waModal && (
        <WhatsAppModal
          template={waModal.template}
          recipient={waModal.recipient}
          onClose={() => setWaModal(null)}
        />
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// FLOWBOARD
// ══════════════════════════════════════════════════════════════
const OccFlowboard = () => {
  const { practitioners, employers } = useData();
  const [appts, setAppts] = useState(MOCK_OCC_FLOWBOARD);
  const [view, setView] = useState("list"); // list | byprac | timeline | register | monthly
  const [selAppt, setSelAppt] = useState(null);
  const [kpiFilter, setKpiFilter] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0,10));

  // Build practitioner display list from DB or mock
  const pracs = practitioners?.length
    ? practitioners.slice(0,5).map((p,i) => ({ id: p.id, name: p.name, initials: p.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(), ...OHP_COLORS[i % OHP_COLORS.length] }))
    : [
        { id:"p1", name:"OHP Practitioner 1", initials:"P1", ...OHP_COLORS[0] },
        { id:"p2", name:"OHP Practitioner 2", initials:"P2", ...OHP_COLORS[1] },
      ];

  const pracName  = (id) => pracs.find(p=>p.id===id)?.name || "—";
  const pracColor = (id) => pracs.find(p=>p.id===id)?.color || C.teal;
  const pracLight = (id) => pracs.find(p=>p.id===id)?.light || C.tealLight;
  const typeColor = (t) => OCC_APPT_TYPES[t]?.color || C.textSub;
  const typeLight = (t) => OCC_APPT_TYPES[t]?.light || C.bgSub;

  const setStatus = (id, status) => {
    const now = new Date().toTimeString().slice(0,5);
    setAppts(prev => prev.map(a => {
      if (a.id !== id) return a;
      return {
        ...a, status,
        arrived: status !== "scheduled" ? true : a.arrived,
        startedAt: status === "in_progress" && !a.startedAt ? now : a.startedAt,
        endedAt:   status === "done" && !a.endedAt ? now : a.endedAt,
      };
    }));
  };

  const KPI_FILTERS = {
    waiting:    a => a.status === "waiting",
    inprog:     a => a.status === "in_progress",
    done:       a => a.status === "done",
    notarrived: a => !a.arrived && a.status === "scheduled",
    uninvoiced: a => a.status === "done" && !a.invoiced,
  };

  const kpiFiltered = kpiFilter ? appts.filter(KPI_FILTERS[kpiFilter]) : appts;
  const waiting    = appts.filter(a=>a.status==="waiting").length;
  const inProgress = appts.filter(a=>a.status==="in_progress").length;
  const done       = appts.filter(a=>a.status==="done").length;
  const notArrived = appts.filter(a=>!a.arrived && a.status==="scheduled").length;
  const uninvoiced = appts.filter(a=>a.status==="done" && !a.invoiced).length;
  const revenue    = appts.filter(a=>a.revenue).reduce((s,a)=>s+(a.revenue||0),0);

  const TAB = (v,label) => (
    <button onClick={()=>setView(v)} style={{
      padding:"6px 14px", fontSize:13, fontWeight:view===v?600:400,
      color:view===v?C.teal:C.textSub, background:"none", border:"none",
      borderBottom:view===v?`2px solid ${C.teal}`:"2px solid transparent", cursor:"pointer"
    }}>{label}</button>
  );

  const KpiCard = ({label,value,filterKey,color}) => (
    <div onClick={()=>setKpiFilter(kpiFilter===filterKey?null:filterKey)} style={{
      background:kpiFilter===filterKey?C.tealLight:C.bgSub, borderRadius:8, padding:"0.75rem 1rem",
      cursor:"pointer", border:`1px solid ${kpiFilter===filterKey?C.tealMid:C.border}`, transition:"all .15s"
    }}>
      <div style={{fontSize:20,fontWeight:700,color:color||C.teal}}>{value}</div>
      <div style={{fontSize:11,color:C.textSub,marginTop:2}}>{label}{kpiFilter===filterKey&&<span style={{color:C.teal}}> ✕</span>}</div>
    </div>
  );

  // ── LIST VIEW ──
  const ListView = () => {
    const listAppts = kpiFilter ? kpiFiltered : appts;
    return (
      <div>
        {listAppts.map(a => {
          const tc = typeColor(a.type); const tl = typeLight(a.type);
          const pc = pracColor(a.prac);
          return (
            <div key={a.id} onClick={()=>setSelAppt(a)} style={{
              display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
              borderBottom:`1px solid ${C.border}`, cursor:"pointer",
              background:a.status==="in_progress"?tl:a.status==="waiting"?C.amberLight:"transparent",
              borderLeft:a.status==="in_progress"?`3px solid ${tc}`:a.status==="waiting"?`3px solid ${C.amber}`:"3px solid transparent",
            }} onMouseEnter={e=>e.currentTarget.style.background=C.tealLight}
               onMouseLeave={e=>e.currentTarget.style.background=a.status==="in_progress"?tl:a.status==="waiting"?C.amberLight:"transparent"}>
              <div style={{width:48,textAlign:"center"}}>
                <div style={{fontSize:12,fontWeight:700,color:C.textSub}}>{a.time}</div>
                <div style={{fontSize:10,color:C.textTert}}>{a.dur}m</div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500}}>{a.person}</div>
                <div style={{fontSize:11,color:C.textSub}}>{a.job_title} · {a.dept}</div>
                {a.alerts?.length>0 && <div style={{fontSize:10,color:C.amber,marginTop:2}}>⚠ {a.alerts[0]}</div>}
              </div>
              <span style={{fontSize:11,fontWeight:600,color:tc,background:tl,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{a.type}</span>
              <div style={{width:22,height:22,borderRadius:"50%",background:pc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700,flexShrink:0}}>
                {pracs.find(p=>p.id===a.prac)?.initials||"?"}
              </div>
              <div style={{width:90}}>
                {a.status==="done" && <span style={{fontSize:11,fontWeight:600,color:C.teal}}>✓ Done</span>}
                {a.status==="in_progress" && <span style={{fontSize:11,fontWeight:600,color:tc}}>● Active</span>}
                {a.status==="waiting" && (
                  <Btn size="sm" onClick={e=>{e.stopPropagation();setStatus(a.id,"in_progress")}}>Start</Btn>
                )}
                {a.status==="scheduled" && !a.arrived && (
                  <Btn size="sm" variant="secondary" onClick={e=>{e.stopPropagation();setStatus(a.id,"waiting")}}>Arrived</Btn>
                )}
              </div>
            </div>
          );
        })}
        {listAppts.length === 0 && <div style={{padding:"2rem",textAlign:"center",color:C.textTert}}>No appointments match filter.</div>}
      </div>
    );
  };

  // ── BY PRACTITIONER VIEW ──
  const ByPracView = () => (
    <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(pracs.length,3)},1fr)`,gap:12}}>
      {pracs.map(p => {
        const pa = appts.filter(a=>a.prac===p.id);
        return (
          <div key={p.id} style={{background:p.light,borderRadius:9,padding:"12px 14px",borderLeft:`4px solid ${p.color}`}}>
            <div style={{fontWeight:700,fontSize:13,color:p.color,marginBottom:10}}>{p.name}</div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <div style={{fontSize:11,color:C.textSub}}>{pa.filter(a=>a.status==="done").length}/{pa.length} done</div>
              <div style={{fontSize:11,fontWeight:600,color:p.color}}>{fmtR(pa.reduce((s,a)=>s+(a.revenue||0),0))}</div>
            </div>
            {pa.map(a=>(
              <div key={a.id} onClick={()=>setSelAppt(a)} style={{
                background:C.bgCard,borderRadius:7,padding:"8px 10px",marginBottom:6,cursor:"pointer",
                borderLeft:`3px solid ${typeColor(a.type)}`
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:12,fontWeight:500}}>{a.time} — {a.person}</div>
                  <span style={{fontSize:10,fontWeight:600,color:typeColor(a.type)}}>{a.type}</span>
                </div>
                <div style={{fontSize:11,color:C.textSub,marginTop:2}}>{a.job_title}</div>
                <div style={{display:"flex",gap:6,marginTop:6}}>
                  {a.status==="scheduled"&&!a.arrived&&<Btn size="sm" variant="secondary" onClick={e=>{e.stopPropagation();setStatus(a.id,"waiting")}}>Arrived</Btn>}
                  {a.status==="waiting"&&<Btn size="sm" onClick={e=>{e.stopPropagation();setStatus(a.id,"in_progress")}}>Start</Btn>}
                  {a.status==="in_progress"&&<Btn size="sm" onClick={e=>{e.stopPropagation();setStatus(a.id,"done")}}>✓ Done</Btn>}
                  {a.status==="done"&&<span style={{fontSize:11,color:C.teal,fontWeight:600}}>✓ Complete</span>}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );

  // ── TIMELINE VIEW ──
  const TimelineView = () => {
    const COL_W = 180; const ROW_H = 30;
    const START_H = 7; const END_H = 17;
    const now = new Date();
    const nowMins = now.getHours()*60+now.getMinutes();
    const nowPct = Math.min(100,Math.max(0,((nowMins-START_H*60)/((END_H-START_H)*60))*100));
    const hours = Array.from({length:END_H-START_H+1},(_,i)=>START_H+i);
    return (
      <div style={{overflowX:"auto"}}>
        <div style={{minWidth:pracs.length*COL_W+80}}>
          {/* Header */}
          <div style={{display:"grid",gridTemplateColumns:`80px repeat(${pracs.length},${COL_W}px)`,borderBottom:`1px solid ${C.border}`,background:C.bgSub}}>
            <div style={{padding:"8px 10px",fontSize:11,color:C.textTert}}>TIME</div>
            {pracs.map(p=>(
              <div key={p.id} style={{padding:"8px 10px",fontSize:12,fontWeight:600,color:p.color,background:p.light,borderLeft:`3px solid ${p.color}`}}>
                {p.name}
              </div>
            ))}
          </div>
          {/* Body */}
          <div style={{position:"relative"}}>
            {hours.map(h=>(
              <div key={h} style={{display:"grid",gridTemplateColumns:`80px repeat(${pracs.length},${COL_W}px)`,borderBottom:`1px solid ${C.border}30`,minHeight:ROW_H*2}}>
                <div style={{padding:"6px 10px",fontSize:11,color:C.textTert,borderRight:`1px solid ${C.border}`}}>
                  {h.toString().padStart(2,"0")}:00
                </div>
                {pracs.map(p=>(
                  <div key={p.id} style={{borderLeft:`1px solid ${C.border}20`,position:"relative",minHeight:ROW_H*2}}>
                    {appts.filter(a=>a.prac===p.id && Math.floor(a.hour)===h).map(a=>{
                      const topOffset = ((a.hour-h)*2)*ROW_H;
                      const height = Math.max(24,(a.dur/30)*ROW_H);
                      const tc = typeColor(a.type); const tl = typeLight(a.type);
                      return (
                        <div key={a.id} onClick={()=>setSelAppt(a)} style={{
                          position:"absolute",top:topOffset,left:4,right:4,height:height-3,
                          background:a.status==="done"?tl:a.status==="in_progress"?tc:tl,
                          border:`1px solid ${tc}`,borderRadius:5,padding:"3px 6px",cursor:"pointer",overflow:"hidden",zIndex:1
                        }}>
                          <div style={{fontSize:10,fontWeight:700,color:a.status==="in_progress"?"#fff":tc,lineHeight:1.2}}>{a.person}</div>
                          {height>30&&<div style={{fontSize:9,color:a.status==="in_progress"?"#ffffffaa":C.textTert}}>{a.type}</div>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
            {/* Current time line */}
            <div style={{position:"absolute",top:`${nowPct}%`,left:80,right:0,height:2,background:C.red,zIndex:10,pointerEvents:"none"}}>
              <div style={{position:"absolute",left:-28,top:-8,fontSize:9,background:C.red,color:"#fff",padding:"2px 4px",borderRadius:3}}>
                {now.toTimeString().slice(0,5)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── REGISTER VIEW ──
  const RegisterView = () => {
    const toMins = t => { if(!t) return null; const [h,m]=t.split(":").map(Number); return h*60+m; };
    const minsStr = m => m==null?`—`:`${Math.floor(m/60)}h ${m%60}m`;
    const actualDur = a => { if(!a.startedAt||!a.endedAt) return null; return toMins(a.endedAt)-toMins(a.startedAt); };
    const DAY_MINS = (17-7)*60;

    const pracStats = pracs.map(p => {
      const pa = appts.filter(a=>a.prac===p.id);
      const doneA = pa.filter(a=>a.status==="done");
      const bookedMins = pa.reduce((s,a)=>s+a.dur,0);
      const revenue = doneA.reduce((s,a)=>s+(a.revenue||0),0);
      const utilisation = Math.min(100,Math.round(bookedMins/DAY_MINS*100));
      return {p,pa,doneA,bookedMins,revenue,utilisation};
    });

    const exportCSV = () => {
      const rows = [
        ["Practitioner","Time","Employee","Job Title","Dept","Type","Bay","Status","Started","Ended","Duration","Actual Dur","Revenue"],
        ...appts.map(a=>[pracName(a.prac),a.time,a.person,a.job_title,a.dept,a.type,a.bay,a.status,a.startedAt||"—",a.endedAt||"—",`${a.dur}m`,actualDur(a)?`${actualDur(a)}m`:"—",a.revenue?`R${a.revenue}`:"—"])
      ];
      const csv = rows.map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
      const blob = new Blob([csv],{type:"text/csv"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href=url; a.download=`deployment-register-${selectedDate}.csv`; a.click(); URL.revokeObjectURL(url);
    };

    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:13,color:C.textSub}}>Deployment register · {new Date(selectedDate+"T00:00:00").toLocaleDateString("en-ZA",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
          <Btn size="sm" variant="secondary" onClick={exportCSV}>⬇ Export CSV</Btn>
        </div>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${pracs.length},1fr)`,gap:12,marginBottom:16}}>
          {pracStats.map(({p,pa,doneA,bookedMins,revenue,utilisation})=>(
            <div key={p.id} style={{background:p.light,borderRadius:9,padding:"14px 16px",borderLeft:`4px solid ${p.color}`}}>
              <div style={{fontWeight:700,fontSize:13,color:p.color,marginBottom:8}}>{p.name}</div>
              {[["Appointments",`${doneA.length} done / ${pa.length} booked`],["Booked time",minsStr(bookedMins)],["Day utilisation",`${utilisation}%`],["Revenue",revenue>0?fmtR(revenue):"—"]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${p.color}20`,fontSize:12}}>
                  <span style={{color:C.textSub}}>{l}</span><span style={{fontWeight:600,color:p.color}}>{v}</span>
                </div>
              ))}
              <div style={{marginTop:8}}>
                <div style={{height:5,background:"#ffffff80",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${utilisation}%`,background:p.color,borderRadius:3}}/>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
          {[
            {l:"Completed",v:`${appts.filter(a=>a.status==="done").length} / ${appts.length}`,c:C.teal},
            {l:"Revenue confirmed",v:fmtR(appts.reduce((s,a)=>s+(a.revenue||0),0)),c:C.teal},
            {l:"Not invoiced",v:`${appts.filter(a=>a.status==="done"&&!a.invoiced).length}`,c:uninvoiced>0?C.amber:C.textSub},
          ].map(k=>(
            <Card key={k.l} style={{padding:"10px 14px"}}>
              <div style={{fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div>
              <div style={{fontSize:11,color:C.textSub,marginTop:2}}>{k.l}</div>
            </Card>
          ))}
        </div>
        {pracs.map(p=>{
          const pa = appts.filter(a=>a.prac===p.id);
          return (
            <div key={p.id} style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:p.light,borderRadius:"8px 8px 0 0",borderLeft:`4px solid ${p.color}`}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:p.color}}/>
                <span style={{fontWeight:700,fontSize:13,color:p.color}}>{p.name}</span>
              </div>
              <div style={{border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 8px 8px",overflowX:"auto"}}>
                <div style={{display:"grid",gridTemplateColumns:"60px 160px 130px 80px 70px 60px 60px 70px",padding:"6px 12px",background:C.bgSub,borderBottom:`1px solid ${C.border}`,minWidth:680}}>
                  {["Time","Employee","Type","Status","Started","Ended","Duration","Revenue"].map((h,i)=>(
                    <span key={i} style={{fontSize:10,fontWeight:700,color:C.textTert,textTransform:"uppercase",letterSpacing:.3}}>{h}</span>
                  ))}
                </div>
                {pa.map((a,i)=>{
                  const ad = actualDur(a);
                  return (
                    <div key={a.id} onClick={()=>setSelAppt(a)} style={{
                      display:"grid",gridTemplateColumns:"60px 160px 130px 80px 60px 60px 70px 70px",
                      padding:"8px 12px",borderBottom:i<pa.length-1?`1px solid ${C.border}`:"none",
                      alignItems:"center",cursor:"pointer",minWidth:680,
                    }} onMouseEnter={e=>e.currentTarget.style.background=C.tealLight}
                       onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{fontSize:12,fontWeight:700,color:C.textSub}}>{a.time}</span>
                      <div>
                        <div style={{fontSize:12,fontWeight:500}}>{a.person}</div>
                        <div style={{fontSize:10,color:C.textTert}}>{a.job_title}</div>
                      </div>
                      <span style={{fontSize:11,fontWeight:600,color:typeColor(a.type),background:typeLight(a.type),padding:"2px 7px",borderRadius:8}}>{a.type}</span>
                      <span style={{fontSize:11,fontWeight:600,color:a.status==="done"?C.teal:a.status==="in_progress"?typeColor(a.type):C.textSub}}>
                        {a.status==="done"?"✓ Done":a.status==="in_progress"?"● Active":a.status==="waiting"?"Waiting":"Sched."}
                      </span>
                      <span style={{fontSize:11,color:C.text}}>{a.startedAt||"—"}</span>
                      <span style={{fontSize:11,color:C.text}}>{a.endedAt||"—"}</span>
                      <span style={{fontSize:11,fontWeight:600,color:C.text}}>{ad!=null?`${ad}m`:"—"}</span>
                      <span style={{fontSize:12,fontWeight:700,color:a.revenue?C.teal:C.textTert}}>{a.revenue?fmtR(a.revenue):a.status==="done"?"Uninv.":"—"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── MONTHLY VIEW ──
  const MonthlyView = () => {
    const [expanded, setExpanded] = useState(null);
    const data = MOCK_OCC_MONTHLY;
    const maxRev = Math.max(...data.map(d=>d.dayRevenue));
    return (
      <div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
          {[
            {l:"Sessions (30 days)",v:data.reduce((s,d)=>s+d.dayCount,0).toString(),c:C.teal},
            {l:"Revenue (30 days)",v:fmtR(data.reduce((s,d)=>s+d.dayRevenue,0)),c:C.teal},
            {l:"Avg per day",v:fmtR(data.length?data.reduce((s,d)=>s+d.dayRevenue,0)/data.length:0),c:C.teal},
          ].map(k=>(
            <Card key={k.l} style={{padding:"10px 14px"}}>
              <div style={{fontSize:18,fontWeight:700,color:k.c}}>{k.v}</div>
              <div style={{fontSize:11,color:C.textSub,marginTop:2}}>{k.l}</div>
            </Card>
          ))}
        </div>
        {/* Revenue bar chart */}
        <Card style={{padding:"1rem 1.25rem",marginBottom:16}}>
          <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textTert, fontWeight: 500, marginBottom: 12, paddingBottom: 8, borderBottom: `0.5px solid ${C.border}` }}>Daily revenue — last 30 days</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:3,height:80}}>
            {data.map(d=>(
              <div key={d.date} title={`${d.label}: ${fmtR(d.dayRevenue)}`} style={{
                flex:1,background:C.tealMid,borderRadius:"3px 3px 0 0",opacity:.8,
                height:`${maxRev>0?(d.dayRevenue/maxRev*100):0}%`,minHeight:2,cursor:"pointer"
              }} onClick={()=>setExpanded(expanded===d.date?null:d.date)}/>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.textTert,marginTop:4}}>
            <span>{data[0]?.label}</span><span>{data[data.length-1]?.label}</span>
          </div>
        </Card>
        {/* Day list */}
        {data.map(d=>(
          <div key={d.date} style={{borderBottom:`1px solid ${C.border}`}}>
            <div onClick={()=>setExpanded(expanded===d.date?null:d.date)} style={{
              display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"8px 12px",cursor:"pointer",background:expanded===d.date?C.tealLight:"transparent"
            }} onMouseEnter={e=>e.currentTarget.style.background=C.tealLight}
               onMouseLeave={e=>e.currentTarget.style.background=expanded===d.date?C.tealLight:"transparent"}>
              <span style={{fontSize:13,fontWeight:500}}>{d.label}</span>
              <div style={{display:"flex",gap:20,alignItems:"center"}}>
                <span style={{fontSize:12,color:C.textSub}}>{d.dayCount} sessions</span>
                <span style={{fontSize:13,fontWeight:700,color:C.teal}}>{fmtR(d.dayRevenue)}</span>
                <span style={{fontSize:11,color:C.textTert}}>{expanded===d.date?"▲":"▼"}</span>
              </div>
            </div>
            {expanded===d.date&&(
              <div style={{padding:"8px 12px 12px",background:C.bgSub}}>
                {d.pracData.map(pd=>{
                  const p = pracs.find(x=>x.id===pd.pracId);
                  return p?(
                    <div key={pd.pracId} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}20`,fontSize:12}}>
                      <span style={{color:p.color,fontWeight:500}}>{p.name}</span>
                      <span style={{color:C.textSub}}>{pd.count} sessions · {fmtR(pd.revenue)}</span>
                    </div>
                  ):null;
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ── APPOINTMENT POPOVER ──
  const ApptPopover = ({appt,onClose}) => {
    const tc = typeColor(appt.type); const tl = typeLight(appt.type);
    const pc = pracColor(appt.prac);
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={onClose}>
        <div style={{background:C.bgCard,borderRadius:12,padding:"1.5rem",width:400,maxWidth:"95vw"}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div>
              <div style={{fontSize:16,fontWeight:600}}>{appt.person}</div>
              <div style={{fontSize:12,color:C.textSub,marginTop:2}}>{appt.job_title} · {appt.dept}</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.textTert}}>✕</button>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <span style={{fontSize:12,fontWeight:600,color:tc,background:tl,padding:"3px 10px",borderRadius:20}}>{appt.type}</span>
            <span style={{fontSize:12,color:C.textSub,background:C.bgSub,padding:"3px 10px",borderRadius:20}}>{appt.bay}</span>
            <span style={{fontSize:12,color:C.textSub,background:C.bgSub,padding:"3px 10px",borderRadius:20}}>
              {appt.time} · {appt.dur}min
            </span>
          </div>
          {appt.alerts?.length>0&&(
            <div style={{background:C.amberLight,border:`1px solid #E8C56A`,borderRadius:8,padding:"8px 12px",marginBottom:12}}>
              {appt.alerts.map((al,i)=><div key={i} style={{fontSize:12,color:C.amber}}>⚠ {al}</div>)}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12,marginBottom:14}}>
            {[["Practitioner",pracName(appt.prac)],["Status",appt.status],["Arrived",appt.arrived?"Yes":"No"],["Started",appt.startedAt||"—"],["Ended",appt.endedAt||"—"],["Revenue",appt.revenue?fmtR(appt.revenue):"—"]].map(([l,v])=>(
              <div key={l}><div style={{color:C.textTert,fontSize:11}}>{l}</div><div style={{fontWeight:500,marginTop:1}}>{v}</div></div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
            {appt.status==="scheduled"&&!appt.arrived&&<Btn size="sm" variant="secondary" onClick={()=>{setStatus(appt.id,"waiting");onClose();}}>Mark arrived</Btn>}
            {appt.status==="waiting"&&<Btn size="sm" onClick={()=>{setStatus(appt.id,"in_progress");onClose();}}>Start session</Btn>}
            {appt.status==="in_progress"&&<Btn size="sm" onClick={()=>{setStatus(appt.id,"done");onClose();}}>✓ Mark done</Btn>}
            {appt.status==="done"&&!appt.invoiced&&<Btn size="sm" variant="secondary" onClick={()=>{setAppts(p=>p.map(a=>a.id===appt.id?{...a,invoiced:true}:a));onClose();}}>Mark invoiced</Btn>}
          </div>
          {/* Reschedule */}
          {["scheduled","waiting"].includes(appt.status) && (() => {
            const [showR, setShowR] = useState(false);
            const [newTime, setNewTime] = useState(appt.time||"08:00");
            const [newBay, setNewBay] = useState(appt.bay||"Bay 1");
            const [newDur, setNewDur] = useState(String(appt.dur||30));
            const doReschedule = () => {
              setAppts(prev => prev.map(a => a.id===appt.id ? {...a, time:newTime, bay:newBay, dur:parseInt(newDur)||appt.dur} : a));
              setShowR(false); onClose();
            };
            return showR ? (
              <div style={{background:C.bgSub,borderRadius:8,padding:"10px 12px",marginTop:4}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Reschedule</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px",gap:8,marginBottom:8}}>
                  <div>
                    <div style={{fontSize:10,color:C.textTert,marginBottom:3}}>TIME</div>
                    <input type="time" value={newTime} onChange={e=>setNewTime(e.target.value)}
                      style={{width:"100%",padding:"6px 8px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:13,boxSizing:"border-box"}}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:C.textTert,marginBottom:3}}>BAY</div>
                    <select value={newBay} onChange={e=>setNewBay(e.target.value)}
                      style={{width:"100%",padding:"6px 8px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:13}}>
                      {["Bay 1","Bay 2","Bay 3","Consultation room","Procedure room"].map(b=><option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:C.textTert,marginBottom:3}}>DURATION</div>
                    <select value={newDur} onChange={e=>setNewDur(e.target.value)}
                      style={{width:"100%",padding:"6px 8px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:13}}>
                      {["15","20","30","45","60","90"].map(d=><option key={d} value={d}>{d}m</option>)}
                    </select>
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <Btn size="sm" onClick={doReschedule}>Confirm</Btn>
                  <Btn size="sm" variant="secondary" onClick={()=>setShowR(false)}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <button onClick={()=>setShowR(true)} style={{fontSize:12,color:C.textSub,background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",marginTop:4}}>
                ⇅ Reschedule
              </button>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
        <div style={{fontSize:18,fontWeight:500}}>Clinic flowboard</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}
            style={{padding:"5px 8px",borderRadius:7,border:`1px solid ${C.border}`,fontSize:12}}/>
        </div>
      </div>

      {/* KPI row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:"1rem"}}>
        <KpiCard label="Waiting" value={waiting} filterKey="waiting" color={waiting>0?C.amber:C.textSub}/>
        <KpiCard label="In progress" value={inProgress} filterKey="inprog" color={inProgress>0?C.teal:C.textSub}/>
        <KpiCard label="Done" value={done} filterKey="done" color={C.teal}/>
        <KpiCard label="Not arrived" value={notArrived} filterKey="notarrived" color={notArrived>0?C.amber:C.textSub}/>
        <KpiCard label="Uninvoiced" value={uninvoiced} filterKey="uninvoiced" color={uninvoiced>0?C.amber:C.textSub}/>
      </div>
      {kpiFilter&&<div style={{background:C.tealLight,border:`1px solid ${C.tealMid}`,borderRadius:8,padding:"6px 12px",marginBottom:"0.75rem",fontSize:12,color:C.teal}}>
        Filtering: {kpiFilter} — {kpiFiltered.length} appointments · <button onClick={()=>setKpiFilter(null)} style={{background:"none",border:"none",color:C.teal,cursor:"pointer",fontWeight:600}}>Clear ✕</button>
      </div>}

      {/* Revenue summary */}
      <div style={{fontSize:13,color:C.textSub,marginBottom:"0.75rem"}}>
        Revenue confirmed today: <strong style={{color:C.teal}}>{fmtR(revenue)}</strong>
        {uninvoiced>0&&<span style={{color:C.amber,marginLeft:12}}>⚠ {uninvoiced} completed, not yet invoiced</span>}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:"1rem",overflowX:"auto"}}>
        {TAB("list","List")}
        {TAB("byprac","By practitioner")}
        {TAB("timeline","Timeline")}
        {TAB("register","Register")}
        {TAB("monthly","Monthly")}
      </div>

      <Card style={{padding:0,overflow:"hidden"}}>
        {view==="list"     && <ListView/>}
        {view==="byprac"   && <div style={{padding:"1rem"}}><ByPracView/></div>}
        {view==="timeline" && <TimelineView/>}
        {view==="register" && <div style={{padding:"1rem"}}><RegisterView/></div>}
        {view==="monthly"  && <div style={{padding:"1rem"}}><MonthlyView/></div>}
      </Card>
      {selAppt&&<ApptPopover appt={selAppt} onClose={()=>setSelAppt(null)}/>}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// STOCK & CALIBRATION
// ══════════════════════════════════════════════════════════════
const StockCalibration = () => {
  const [tab, setTab] = useState("stock"); // stock | calibration
  const [stock, setStock] = useState(MOCK_OCC_STOCK);
  const [calibration, setCalibration] = useState(MOCK_OCC_CALIBRATION);
  const [editStock, setEditStock] = useState(null);
  const [editCal, setEditCal] = useState(null);

  const today = new Date();
  const daysDiff = (dateStr) => dateStr ? Math.ceil((new Date(dateStr)-today)/(1000*60*60*24)) : null;

  const calStatus = (item) => {
    const d = daysDiff(item.next);
    if (d === null) return "none";
    if (d < 0) return "overdue";
    if (d <= 30) return "due_soon";
    return "ok";
  };

  const stockStatus = (item) => {
    if (item.qty <= 0) return "out";
    if (item.qty <= item.reorder) return "low";
    return "ok";
  };

  const TAB_STYLE = (active) => ({
    padding:"6px 14px",fontSize:13,fontWeight:active?600:400,
    color:active?C.teal:C.textSub,background:"none",border:"none",
    borderBottom:active?`2px solid ${C.teal}`:"2px solid transparent",cursor:"pointer"
  });

  return (
    <div>
      <div style={{fontSize:18,fontWeight:500,marginBottom:"1rem"}}>Stock & calibration</div>

      {/* Summary alerts */}
      {(() => {
        const outOfStock = stock.filter(s=>s.qty<=0).length;
        const lowStock = stock.filter(s=>s.qty>0&&s.qty<=s.reorder).length;
        const calOverdue = calibration.filter(c=>calStatus(c)==="overdue").length;
        const calDueSoon = calibration.filter(c=>calStatus(c)==="due_soon").length;
        if (outOfStock||lowStock||calOverdue||calDueSoon) return (
          <div style={{background:C.amberLight,border:`1px solid #E8C56A`,borderRadius:8,padding:"10px 14px",marginBottom:"1rem"}}>
            <div style={{fontSize:13,fontWeight:500,color:C.amber,marginBottom:4}}>⚠ Attention required</div>
            {outOfStock>0&&<div style={{fontSize:12,color:C.amber}}>{outOfStock} item{outOfStock>1?"s":""} out of stock</div>}
            {lowStock>0&&<div style={{fontSize:12,color:C.amber}}>{lowStock} item{lowStock>1?"s":""} below reorder level</div>}
            {calOverdue>0&&<div style={{fontSize:12,color:C.red}}>{calOverdue} piece{calOverdue>1?"s":""} of equipment calibration overdue</div>}
            {calDueSoon>0&&<div style={{fontSize:12,color:C.amber}}>{calDueSoon} calibration{calDueSoon>1?"s":""} due within 30 days</div>}
          </div>
        );
        return null;
      })()}

      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:"1rem"}}>
        <button style={TAB_STYLE(tab==="stock")} onClick={()=>setTab("stock")}>Consumables & stock</button>
        <button style={TAB_STYLE(tab==="calibration")} onClick={()=>setTab("calibration")}>Equipment calibration</button>
      </div>

      {tab==="stock"&&(
        <div>
          {["test_kits","consumables","equipment"].map(cat=>{
            const items = stock.filter(s=>s.category===cat);
            if (!items.length) return null;
            const catLabel = cat==="test_kits"?"Drug test kits":cat==="consumables"?"Consumables":"Equipment";
            return (
              <div key={cat} style={{marginBottom:16}}>
                <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textTert, fontWeight: 500, marginBottom: 12, paddingBottom: 8, borderBottom: `0.5px solid ${C.border}` }}>{catLabel}</div>
                {items.map(item=>{
                  const st = stockStatus(item);
                  const expD = daysDiff(item.expiry);
                  const expiring = expD!==null && expD<=90;
                  return (
                    <Card key={item.id} style={{marginBottom:8,padding:"10px 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:500}}>{item.name}</div>
                          <div style={{fontSize:11,color:C.textSub,marginTop:2}}>
                            Supplier: {item.supplier}
                            {item.lot&&<span> · Lot: {item.lot}</span>}
                            {item.expiry&&<span style={{color:expiring?C.amber:C.textSub}}> · Exp: {item.expiry}{expiring?` (${expD}d)`:""}</span>}
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:20,fontWeight:700,color:st==="out"?C.red:st==="low"?C.amber:C.teal}}>{item.qty}</div>
                            <div style={{fontSize:10,color:C.textTert}}>{item.unit}</div>
                          </div>
                          {st!=="ok"&&<Badge color={st==="out"?"red":"amber"}>{st==="out"?"Out of stock":"Low stock"}</Badge>}
                          <Btn size="sm" variant="secondary" onClick={()=>{setEditStock({...item})}}>Adjust</Btn>
                        </div>
                      </div>
                      <div style={{marginTop:6}}>
                        <div style={{height:4,background:C.bgSub,borderRadius:2,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${Math.min(100,(item.qty/Math.max(item.qty,item.reorder*3))*100)}%`,background:st==="out"?C.red:st==="low"?C.amber:C.teal,borderRadius:2}}/>
                        </div>
                        <div style={{fontSize:10,color:C.textTert,marginTop:2}}>Reorder at {item.reorder} {item.unit}</div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {tab==="calibration"&&(
        <div>
          <div style={{fontSize:12,color:C.textSub,marginBottom:12}}>Equipment calibration is a legal requirement for audiometry, spirometry, and breath alcohol testing. Results obtained with uncalibrated equipment are not legally defensible.</div>
          {calibration.map(item=>{
            const st = calStatus(item);
            const d = daysDiff(item.next);
            return (
              <Card key={item.id} style={{marginBottom:8,padding:"12px 14px",borderLeft:`3px solid ${st==="overdue"?C.red:st==="due_soon"?C.amber:C.teal}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500}}>{item.equip}</div>
                    <div style={{fontSize:11,color:C.textSub,marginTop:2}}>Serial: {item.serial} · Calibrated by: {item.by}</div>
                    <div style={{display:"flex",gap:16,marginTop:6,fontSize:12}}>
                      <span style={{color:C.textSub}}>Last: <strong>{item.last||"—"}</strong></span>
                      <span style={{color:st==="overdue"?C.red:st==="due_soon"?C.amber:C.teal}}>
                        Next due: <strong>{item.next}</strong>
                        {d!==null&&<span> ({d<0?`${Math.abs(d)} days overdue`:`${d} days`})</span>}
                      </span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    {st!=="ok"&&<Badge color={st==="overdue"?"red":"amber"}>{st==="overdue"?"OVERDUE":"Due soon"}</Badge>}
                    <Btn size="sm" variant="secondary" onClick={()=>setEditCal({...item})}>Update</Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stock adjust modal */}
      {editStock&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={()=>setEditStock(null)}>
          <div style={{background:C.bgCard,borderRadius:12,padding:"1.5rem",width:360}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:12}}>Adjust stock — {editStock.name}</div>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:16}}>
              <Btn size="sm" variant="secondary" onClick={()=>setEditStock(s=>({...s,qty:Math.max(0,s.qty-1)}))}>-</Btn>
              <input type="number" value={editStock.qty} min={0}
                onChange={e=>setEditStock(s=>({...s,qty:parseInt(e.target.value)||0}))}
                style={{width:80,textAlign:"center",padding:"6px",borderRadius:7,border:`1px solid ${C.border}`,fontSize:16,fontWeight:700}}/>
              <Btn size="sm" onClick={()=>setEditStock(s=>({...s,qty:s.qty+1}))}>+</Btn>
              <span style={{fontSize:12,color:C.textSub}}>{editStock.unit}</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>{setStock(prev=>prev.map(s=>s.id===editStock.id?{...s,qty:editStock.qty}:s));setEditStock(null);}}>Save</Btn>
              <Btn variant="secondary" onClick={()=>setEditStock(null)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Calibration update modal */}
      {editCal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={()=>setEditCal(null)}>
          <div style={{background:C.bgCard,borderRadius:12,padding:"1.5rem",width:400}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:12}}>Update calibration — {editCal.equip}</div>
            {[["Last calibrated","last","date"],["Next due","next","date"],["Calibrated by","by","text"],["Certificate URL","cert_url","text"]].map(([label,field,type])=>(
              <div key={field} style={{marginBottom:10}}>
                <div style={{fontSize:11,color:C.textTert,marginBottom:3}}>{label.toUpperCase()}</div>
                <input type={type} value={editCal[field]||""} onChange={e=>setEditCal(c=>({...c,[field]:e.target.value}))}
                  style={{width:"100%",padding:"6px 8px",borderRadius:7,border:`1px solid ${C.border}`,fontSize:13,boxSizing:"border-box"}}/>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <Btn onClick={()=>{setCalibration(prev=>prev.map(c=>c.id===editCal.id?{...editCal}:c));setEditCal(null);}}>Save</Btn>
              <Btn variant="secondary" onClick={()=>setEditCal(null)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Settings = ({ session }) => {
  const { db, employers, refreshData } = useData();
  const meta = session?.user?.user_metadata || {};

  const [tab, setTab] = useState("practice");
  const [saved, setSaved] = useState(false);

  const [prac, setPrac] = useState(null);
  const [pracForm, setPracForm] = useState({ name: meta.full_name || "", sanc_number: "", hpcsa_number: "", qualification: "B.Cur OHN", registration_expiry: "" });
  const [pracSaving, setPracSaving] = useState(false);
  const [pracLoading, setPracLoading] = useState(true);

  const [empForm, setEmpForm] = useState({ name: "", coida_ref: "", industry_class: "", coida_insurer: "compensation_fund", contact_email: "" });
  const [empSaving, setEmpSaving] = useState(false);
  const selEmployer = employers?.[0] || null;

  const [twilioSid, setTwilioSid] = useState(localStorage.getItem("oh_twilio_sid") || "");
  const [twilioToken, setTwilioToken] = useState(localStorage.getItem("oh_twilio_token") || "");
  const [twilioFrom, setTwilioFrom] = useState(localStorage.getItem("oh_twilio_from") || "");
  const [twilioSaved, setTwilioSaved] = useState(false);

  useEffect(() => {
    if (!db) { setPracLoading(false); return; }
    db.from("practitioner").select().order("created_at", {ascending:true}).limit(1).then(res => {
      if (res.data?.[0]) {
        const p = res.data[0];
        setPrac(p);
        setPracForm({ name: p.name || "", sanc_number: p.sanc_number || "", hpcsa_number: p.hpcsa_number || "", qualification: p.qualification || "", registration_expiry: p.registration_expiry || "" });
      }
      setPracLoading(false);
    }).catch(() => setPracLoading(false));
  }, [db]);

  useEffect(() => {
    if (selEmployer) {
      setEmpForm({ name: selEmployer.name || "", coida_ref: selEmployer.coida_ref || "", industry_class: selEmployer.industry_class || "", coida_insurer: selEmployer.coida_insurer || "compensation_fund", contact_email: selEmployer.contact_email || "" });
    }
  }, [selEmployer?.id]);

  const savePractitioner = async () => {
    setPracSaving(true);
    if (prac?.id && db) await db.from("practitioner").update(pracForm).eq("id", prac.id);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    setPracSaving(false);
  };

  const saveEmployer = async () => {
    if (!selEmployer?.id || !db) return;
    setEmpSaving(true);
    await db.from("employer").update(empForm).eq("id", selEmployer.id);
    await refreshData();
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    setEmpSaving(false);
  };

  const saveTwilio = () => {
    localStorage.setItem("oh_twilio_sid", twilioSid);
    localStorage.setItem("oh_twilio_token", twilioToken);
    localStorage.setItem("oh_twilio_from", twilioFrom);
    setTwilioSaved(true); setTimeout(() => setTwilioSaved(false), 2000);
  };

  const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: C.bgCard };
  const TAB = (v, label) => (
    <button onClick={() => setTab(v)} style={{ padding: "6px 14px", fontSize: 13, fontWeight: tab === v ? 600 : 400, color: tab === v ? C.teal : C.textSub, background: "none", border: "none", borderBottom: tab === v ? `2px solid ${C.teal}` : "2px solid transparent", cursor: "pointer" }}>{label}</button>
  );
  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: C.textTert, marginBottom: 3, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Settings</div>
        {saved && <span style={{ fontSize: 12, color: C.teal, fontWeight: 600 }}>&#10003; Saved</span>}
      </div>
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: "1.25rem" }}>
        {TAB("practice", "Practitioner")}
        {TAB("employer", "Employer / clinic")}
        {TAB("integrations", "Integrations")}
        {TAB("system", "System")}
      </div>

      {tab === "practice" && (
        <div>
          <Card style={{ marginBottom: "1rem" }}>
            <SectionTitle>Account</SectionTitle>
            {[{ label: "Email", value: session?.user?.email }, { label: "User ID", value: (session?.user?.id || "").slice(0,8) + "…" }].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ color: C.textSub }}>{r.label}</span><span style={{ fontWeight: 500 }}>{r.value}</span>
              </div>
            ))}
          </Card>
          <Card>
            <SectionTitle>Practitioner details</SectionTitle>
            {pracLoading ? <div style={{ fontSize: 13, color: C.textSub, padding: "1rem 0" }}>Loading…</div> : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
                  <Field label="Full name *"><input style={inputStyle} value={pracForm.name} onChange={e => setPracForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. / Sister Name Surname" /></Field>
                  <Field label="Qualification">
                    <select style={inputStyle} value={pracForm.qualification} onChange={e => setPracForm(f => ({ ...f, qualification: e.target.value }))}>
                      {["B.Cur OHN","B.Cur (Hons) OHN","B.Sc Nursing OHN","MBChB (Occupational Medicine)","Diploma Occupational Health","Other"].map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </Field>
                  <Field label="SANC number"><input style={inputStyle} value={pracForm.sanc_number} onChange={e => setPracForm(f => ({ ...f, sanc_number: e.target.value }))} placeholder="SANC registration number" /></Field>
                  <Field label="HPCSA number"><input style={inputStyle} value={pracForm.hpcsa_number} onChange={e => setPracForm(f => ({ ...f, hpcsa_number: e.target.value }))} placeholder="HPCSA number (if applicable)" /></Field>
                  <Field label="Registration expiry"><input style={inputStyle} type="date" value={pracForm.registration_expiry} onChange={e => setPracForm(f => ({ ...f, registration_expiry: e.target.value }))} /></Field>
                </div>
                {pracForm.registration_expiry && new Date(pracForm.registration_expiry) < new Date(Date.now() + 30*24*60*60*1000) && (
                  <div style={{ background: C.amberLight, border: `1px solid #E8C56A`, borderRadius: 7, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: C.amber }}>
                    &#9888; Registration {new Date(pracForm.registration_expiry) < new Date() ? "expired" : "expires within 30 days"} — {pracForm.registration_expiry}
                  </div>
                )}
                <Btn onClick={savePractitioner} disabled={pracSaving || !pracForm.name}>{pracSaving ? "Saving…" : "Save practitioner details"}</Btn>
              </>
            )}
          </Card>
        </div>
      )}

      {tab === "employer" && (
        <Card>
          <SectionTitle>Primary employer / clinic details</SectionTitle>
          {!selEmployer ? <div style={{ fontSize: 13, color: C.textSub }}>No employer configured.</div> : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <Field label="Company name *"><input style={inputStyle} value={empForm.name} onChange={e => setEmpForm(f => ({ ...f, name: e.target.value }))} /></Field>
                <Field label="COIDA reference"><input style={inputStyle} value={empForm.coida_ref} onChange={e => setEmpForm(f => ({ ...f, coida_ref: e.target.value }))} placeholder="CF-2024-001" /></Field>
                <Field label="Industry">
                  <select style={inputStyle} value={empForm.industry_class} onChange={e => setEmpForm(f => ({ ...f, industry_class: e.target.value }))}>
                    <option value="">Select…</option>
                    {["Construction","Mining","Manufacturing","Agriculture","Transport","Logistics","Food processing","Chemical","Healthcare","Retail","Other"].map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </Field>
                <Field label="COIDA insurer">
                  <select style={inputStyle} value={empForm.coida_insurer} onChange={e => setEmpForm(f => ({ ...f, coida_insurer: e.target.value }))}>
                    <option value="compensation_fund">Compensation Fund</option>
                    <option value="rma">RMA (Rand Mutual Assurance)</option>
                    <option value="fem">FEM (Federated Employers Mutual)</option>
                  </select>
                </Field>
                <Field label="HR contact email"><input style={inputStyle} type="email" value={empForm.contact_email} onChange={e => setEmpForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="hr@company.co.za" /></Field>
              </div>
              <Btn onClick={saveEmployer} disabled={empSaving || !empForm.name}>{empSaving ? "Saving…" : "Save employer details"}</Btn>
            </>
          )}
        </Card>
      )}

      {tab === "integrations" && (
        <div>
          <Card style={{ marginBottom: "1rem" }}>
            <SectionTitle>WhatsApp / Twilio</SectionTitle>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 12 }}>Required for WhatsApp reminders. Get credentials at twilio.com (free trial available).</div>
            <Field label="Account SID"><input style={inputStyle} value={twilioSid} onChange={e => setTwilioSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" /></Field>
            <Field label="Auth token"><input style={inputStyle} type="password" value={twilioToken} onChange={e => setTwilioToken(e.target.value)} placeholder="Auth token" /></Field>
            <Field label="WhatsApp from number"><input style={inputStyle} value={twilioFrom} onChange={e => setTwilioFrom(e.target.value)} placeholder="+27XXXXXXXXX" /></Field>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Btn onClick={saveTwilio}>Save Twilio credentials</Btn>
              {twilioSaved && <span style={{ fontSize: 12, color: C.teal, fontWeight: 600 }}>&#10003; Saved locally</span>}
            </div>
            <div style={{ fontSize: 11, color: C.textTert, marginTop: 8 }}>Stored in browser localStorage only — not sent to any server.</div>
          </Card>
          <Card>
            <SectionTitle>Accounting exports</SectionTitle>
            {[
              { label: "Xero CSV", desc: "Export invoices as Xero-compatible CSV from Finance screen", status: "Available" },
              { label: "Sage CSV", desc: "Export invoices as Sage/Pastel CSV from Finance screen", status: "Available" },
              { label: "Xero API (direct sync)", desc: "Requires Xero app partner approval — apply at developer.xero.com", status: "Pending" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: `0.5px solid ${C.border}` }}>
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>{r.label}</div><div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{r.desc}</div></div>
                <Badge color={r.status === "Available" ? "teal" : "gray"}>{r.status}</Badge>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "system" && (
        <Card>
          <SectionTitle>System information</SectionTitle>
          {[
            { label: "App version", value: APP_VERSION },
            { label: "Data mode", value: USE_MOCK ? "Demo (in-memory)" : "Live (Supabase)" },
            { label: "VAT rate", value: `${VAT_RATE * 100}%` },
            { label: "Supabase project", value: USE_MOCK ? "Not connected" : SUPABASE_URL.split(".")[0].replace("https://","") },
            { label: "Audit log", value: "Append-only, monthly partitioned" },
            { label: "Document retention", value: "40 years (OHS Act maximum)" },
            { label: "Data jurisdiction", value: "Supabase eu-west-1 (Ireland)" },
            { label: "POPIA compliance", value: "Confidentiality boundary at DB role layer" },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 13 }}>
              <span style={{ color: C.textSub }}>{row.label}</span><span style={{ fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

// ─── SUPABASE AUTH ────────────────────────────────────────────────────────────
const auth = {
  signUp: async (email, password, meta) => {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { "apikey": SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, data: meta }),
    });
    return r.json();
  },
  signIn: async (email, password) => {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "apikey": SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },
  signOut: async (token) => {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${token}` },
    });
  },
  getUser: async (token) => {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${token}` },
    });
    return r.json();
  },
};

// Supabase client with auth token support
const sbAuth = (token) => makeClient(() => ({
  "apikey": SUPABASE_ANON,
  "Authorization": `Bearer ${token || SUPABASE_ANON}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
}));

// ─── ONBOARDING WIZARD ────────────────────────────────────────────────────────
const OnboardingWizard = ({ session, onComplete }) => {
  const [step, setStep] = useState(1); // 1=tenant 2=practitioner 3=employer 4=employees 5=done
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const token = session?.access_token || session?.user?.access_token;

  const [tenant, setTenant] = useState({ name: "", type: "independent_ohp", coida_registration: "" });
  const [practitioner, setPractitioner] = useState({ name: session?.user?.user_metadata?.full_name || "", sanc_number: "", qualification: "B.Cur OHN", registration_expiry: "" });
  const [employer, setEmployer] = useState({ name: "", coida_ref: "", industry_class: "", coida_insurer: "compensation_fund", contact_email: "" });
  const [employees, setEmployees] = useState([{ first_name: "", last_name: "", employee_number: "", job_title: "", department: "", site: "" }]);
  const [tenantId, setTenantId] = useState(null);
  const [employerId, setEmployerId] = useState(null);

  const db = sbAuth(token);

  const saveTenant = async () => {
    if (!tenant.name) { setError("Practice name is required"); return; }
    setSaving(true); setError("");
    const tenantData = { name: tenant.name, type: tenant.type, created_at: new Date().toISOString() };
    if (tenant.coida_registration) tenantData.coida_registration = tenant.coida_registration;
    const { data, error: err } = await db.from("tenant").insert(tenantData);
    if (err || !data?.[0]) { setError(`Failed to save practice details: ${JSON.stringify(err)}`); setSaving(false); return; }
    setTenantId(data[0].id);
    setSaving(false);
    setStep(2);
  };

  const savePractitioner = async () => {
    if (!practitioner.name) { setError("Name is required"); return; }
    setSaving(true); setError("");
    const practData = {
      name: practitioner.name,
      tenant_id: tenantId,
      qualification: practitioner.qualification,
      created_at: new Date().toISOString(),
    };
    if (practitioner.sanc_number) practData.sanc_number = practitioner.sanc_number;
    if (practitioner.registration_expiry) practData.registration_expiry = practitioner.registration_expiry;
    const { error: err } = await db.from("practitioner").insert(practData);
    if (err) { setError(`Failed to save practitioner details: ${err.message || JSON.stringify(err)}`); setSaving(false); return; }
    setSaving(false);
    setStep(3);
  };

  const saveEmployer = async () => {
    if (!employer.name) { setError("Employer name is required"); return; }
    setSaving(true); setError("");
    const empData = { name: employer.name, tenant_id: tenantId, coida_insurer: employer.coida_insurer, created_at: new Date().toISOString() };
    if (employer.coida_ref) empData.coida_ref = employer.coida_ref;
    if (employer.industry_class) empData.industry_class = employer.industry_class;
    if (employer.contact_email) empData.contact_email = employer.contact_email;
    const { data, error: err } = await db.from("employer").insert(empData);
    if (err || !data?.[0]) { setError("Failed to save employer."); setSaving(false); return; }
    setEmployerId(data[0].id);
    setSaving(false);
    setStep(4);
  };

  const saveEmployees = async () => {
    setSaving(true); setError("");
    const valid = employees.filter(e => e.first_name && e.last_name);
    if (valid.length === 0) { setStep(5); setSaving(false); return; }
    for (const emp of valid) {
      const personData = {
        first_name: emp.first_name,
        last_name: emp.last_name,
        employer_id: employerId,
        employment_status: "active",
        created_at: new Date().toISOString(),
      };
      if (emp.employee_number) personData.employee_number = emp.employee_number;
      if (emp.job_title) personData.job_title = emp.job_title;
      if (emp.department) personData.department = emp.department;
      if (emp.site) personData.site = emp.site;
      await db.from("person").insert(personData);
    }
    setSaving(false);
    setStep(5);
  };

  const addEmployee = () => setEmployees(e => [...e, { first_name: "", last_name: "", employee_number: "", job_title: "", department: "", site: "" }]);
  const setEmp = (i, k, v) => setEmployees(e => e.map((emp, idx) => idx === i ? { ...emp, [k]: v } : emp));

  const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none" };
  const labelStyle = { fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: C.textTert, marginBottom: 4, fontWeight: 500, display: "block" };

  const steps = ["Practice", "You", "Employer", "Employees", "Done"];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", boxSizing: "border-box" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "1.5rem", width: "100%", maxWidth: 520, boxSizing: "border-box", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: C.tealDark, marginBottom: 4 }}>Set up OccHealth Pro SA</div>
          <div style={{ fontSize: 13, color: C.textSub }}>Just a few details to get you started — takes about 3 minutes.</div>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1.75rem" }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: 3, borderRadius: 2, background: i + 1 <= step ? C.teal : C.border, marginBottom: 4 }} />
              <div style={{ fontSize: 10, color: i + 1 <= step ? C.teal : C.textTert, fontWeight: i + 1 === step ? 600 : 400 }}>{s}</div>
            </div>
          ))}
        </div>

        {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 7, padding: "8px 12px", fontSize: 12, color: C.red, marginBottom: "1rem" }}>{error}</div>}

        {/* Step 1 — Practice */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: "1rem", color: C.text }}>Your practice details</div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Practice / trading name *</label>
              <input style={inputStyle} value={tenant.name} onChange={e => setTenant(t => ({ ...t, name: e.target.value }))} placeholder="e.g. Cape OccHealth Services" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Practice type</label>
              <select style={inputStyle} value={tenant.type} onChange={e => setTenant(t => ({ ...t, type: e.target.value }))}>
                <option value="independent_ohp">Independent OHP (sole practitioner)</option>
                <option value="bureau">OHP bureau / network</option>
                <option value="employer_clinic">Employer-owned clinic</option>
              </select>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={labelStyle}>COIDA registration number (optional)</label>
              <input style={inputStyle} value={tenant.coida_registration} onChange={e => setTenant(t => ({ ...t, coida_registration: e.target.value }))} placeholder="e.g. 12345678" />
            </div>
            <Btn onClick={saveTenant} disabled={saving} style={{ width: "100%" }}>{saving ? "Saving..." : "Continue →"}</Btn>
          </div>
        )}

        {/* Step 2 — Practitioner */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: "1rem", color: C.text }}>Your professional details</div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Full name *</label>
              <input style={inputStyle} value={practitioner.name} onChange={e => setPractitioner(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Sr. Thandi Dlamini" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>SANC registration number (optional)</label>
              <input style={inputStyle} value={practitioner.sanc_number} onChange={e => setPractitioner(p => ({ ...p, sanc_number: e.target.value }))} placeholder="e.g. 123456789" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Qualification</label>
              <select style={inputStyle} value={practitioner.qualification} onChange={e => setPractitioner(p => ({ ...p, qualification: e.target.value }))}>
                <option value="B.Cur OHN">B.Cur OHN (Occupational Health Nursing)</option>
                <option value="B.Tech OHN">B.Tech OHN</option>
                <option value="Dip OHN">Diploma in OHN</option>
                <option value="MBChB Dip Occ Med">MBChB + Dip Occ Med</option>
                <option value="FC OccMed">FC OccMed (Occupational Medicine Specialist)</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={labelStyle}>SANC registration expiry date</label>
              <input type="date" style={inputStyle} value={practitioner.registration_expiry} onChange={e => setPractitioner(p => ({ ...p, registration_expiry: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="secondary" onClick={() => setStep(1)}>← Back</Btn>
              <Btn onClick={savePractitioner} disabled={saving} style={{ flex: 1 }}>{saving ? "Saving..." : "Continue →"}</Btn>
            </div>
          </div>
        )}

        {/* Step 3 — First employer */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, color: C.text }}>Add your first employer client</div>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: "1rem" }}>You can add more employers later from the Employers screen.</div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Company name *</label>
              <input style={inputStyle} value={employer.name} onChange={e => setEmployer(em => ({ ...em, name: e.target.value }))} placeholder="e.g. Cape Construction (Pty) Ltd" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>COIDA reference number</label>
                <input style={inputStyle} value={employer.coida_ref} onChange={e => setEmployer(em => ({ ...em, coida_ref: e.target.value }))} placeholder="CF-2024-001" />
              </div>
              <div>
                <label style={labelStyle}>Industry</label>
                <select style={inputStyle} value={employer.industry_class} onChange={e => setEmployer(em => ({ ...em, industry_class: e.target.value }))}>
                  <option value="">Select...</option>
                  {["Construction","Mining","Manufacturing","Agriculture","Transport","Logistics","Food processing","Chemical","Healthcare","Retail","Other"].map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>COIDA insurer</label>
              <select style={inputStyle} value={employer.coida_insurer} onChange={e => setEmployer(em => ({ ...em, coida_insurer: e.target.value }))}>
                <option value="compensation_fund">Compensation Fund (DoL)</option>
                <option value="rma">Rand Mutual Assurance (RMA) — mining & metals</option>
                <option value="fem">Federated Employers Mutual (FEM) — construction</option>
              </select>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={labelStyle}>HR contact email</label>
              <input type="email" style={inputStyle} value={employer.contact_email} onChange={e => setEmployer(em => ({ ...em, contact_email: e.target.value }))} placeholder="hr@company.co.za" />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="secondary" onClick={() => setStep(2)}>← Back</Btn>
              <Btn onClick={saveEmployer} disabled={saving} style={{ flex: 1 }}>{saving ? "Saving..." : "Continue →"}</Btn>
            </div>
          </div>
        )}

        {/* Step 4 — Employees */}
        {step === 4 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, color: C.text }}>Add employees for {employer.name}</div>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: "1rem" }}>Add a few key employees to get started. You can bulk-import more later.</div>
            <div style={{ maxHeight: 320, overflowY: "auto", marginBottom: "1rem" }}>
              {employees.map((emp, i) => (
                <div key={i} style={{ background: C.bgSub, borderRadius: 8, padding: "0.875rem", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: C.textTert, marginBottom: 8, fontWeight: 500 }}>Employee {i + 1}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={labelStyle}>First name *</label>
                      <input style={inputStyle} value={emp.first_name} onChange={e => setEmp(i, "first_name", e.target.value)} placeholder="First name" />
                    </div>
                    <div>
                      <label style={labelStyle}>Last name *</label>
                      <input style={inputStyle} value={emp.last_name} onChange={e => setEmp(i, "last_name", e.target.value)} placeholder="Last name" />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={labelStyle}>Emp. number</label>
                      <input style={inputStyle} value={emp.employee_number} onChange={e => setEmp(i, "employee_number", e.target.value)} placeholder="EMP-001" />
                    </div>
                    <div>
                      <label style={labelStyle}>Job title</label>
                      <input style={inputStyle} value={emp.job_title} onChange={e => setEmp(i, "job_title", e.target.value)} placeholder="Title" />
                    </div>
                    <div>
                      <label style={labelStyle}>Site</label>
                      <input style={inputStyle} value={emp.site} onChange={e => setEmp(i, "site", e.target.value)} placeholder="Site" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Btn variant="ghost" size="sm" onClick={addEmployee} style={{ marginBottom: "1rem" }}>+ Add another employee</Btn>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="secondary" onClick={() => setStep(3)}>← Back</Btn>
              <Btn onClick={saveEmployees} disabled={saving} style={{ flex: 1 }}>{saving ? "Saving..." : "Save & finish →"}</Btn>
            </div>
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <button onClick={() => setStep(5)} style={{ background: "none", border: "none", fontSize: 12, color: C.textTert, cursor: "pointer", textDecoration: "underline" }}>Skip for now</button>
            </div>
          </div>
        )}

        {/* Step 5 — Done */}
        {step === 5 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: "1rem" }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>You're all set</div>
            <div style={{ fontSize: 13, color: C.textSub, marginBottom: "1.5rem", lineHeight: 1.6 }}>
              Your practice is configured. Head to Encounters to start recording clinical notes, or add more employers from the Employers screen.
            </div>
            <Btn onClick={onComplete} style={{ width: "100%" }}>Go to dashboard →</Btn>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
const PasswordInput = ({ value, onChange, placeholder, onKeyDown, label, hint }) => {
  const [show, setShow] = useState(false);
  const inputStyle = { width: "100%", padding: "9px 40px 9px 12px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 14, outline: "none", fontFamily: "inherit" };
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: C.textSub, marginBottom: 4 }}>
        {label} {hint && <span style={{ color: C.textTert }}>{hint}</span>}
      </div>
      <div style={{ position: "relative" }}>
        <input type={show ? "text" : "password"} style={inputStyle} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown} />
        <button onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textTert, fontSize: 16, lineHeight: 1 }}>
          {show ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputStyle = { width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 14, outline: "none", fontFamily: "inherit" };

  const handleLogin = async () => {
    if (!email || !password) { setError("Enter email and password"); return; }
    setLoading(true); setError("");
    if (USE_MOCK) { onLogin(MOCK_SESSION); setLoading(false); return; }
    const data = await auth.signIn(email, password);
    if (data.error || !data.access_token) {
      setError(data.error_description || data.message || "Invalid email or password");
      setLoading(false); return;
    }
    const user = await auth.getUser(data.access_token);
    onLogin({ ...data, user });
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!email || !password || !fullName) { setError("All fields required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    const data = await auth.signUp(email, password, { full_name: fullName, role: "ohp", onboarding_complete: false });
    if (data.error) { setError(data.error_description || data.message || "Signup failed"); setLoading(false); return; }
    const signInData = await auth.signIn(email, password);
    if (signInData.access_token) {
      const user = await auth.getUser(signInData.access_token);
      onLogin({ ...signInData, user });
    } else {
      setError("Account created. Check your email to confirm, then sign in.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.tealDark, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", boxSizing: "border-box" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "1.5rem", width: "100%", maxWidth: 380, boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: C.tealDark, letterSpacing: "-0.02em" }}>OccHealth Pro SA</div>
          <div style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>Occupational health practice management</div>
        </div>

        {USE_MOCK && (
          <div style={{ background: C.tealLight, border: `1px solid ${C.tealMid}`, borderRadius: 8, padding: "8px 12px", marginBottom: "1rem", fontSize: 12, color: C.teal }}>
            Demo mode — any credentials will work
          </div>
        )}

        {!USE_MOCK && (
          <div style={{ display: "flex", background: C.bgSub, borderRadius: 8, padding: 3, marginBottom: "1.25rem" }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); setConfirmPassword(""); }} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "none", background: mode === m ? "#fff" : "transparent", color: mode === m ? C.text : C.textSub, fontSize: 13, fontWeight: mode === m ? 500 : 400, cursor: "pointer", boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
        )}

        {mode === "signup" && !USE_MOCK && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 4 }}>Full name</div>
            <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Sr. Jane Smith" />
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 4 }}>Email</div>
          <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@practice.co.za" onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : undefined)} />
        </div>

        <PasswordInput
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          label="Password"
          hint={mode === "signup" ? "(min 8 characters)" : ""}
          onKeyDown={e => e.key === "Enter" && mode === "login" && handleLogin()}
        />

        {mode === "signup" && !USE_MOCK && (
          <PasswordInput
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            label="Confirm password"
            onKeyDown={e => e.key === "Enter" && handleSignup()}
          />
        )}

        {error && <div style={{ fontSize: 12, color: C.red, marginBottom: 10, background: "#FEF2F2", padding: "8px 10px", borderRadius: 6 }}>{error}</div>}

        <Btn onClick={mode === "login" ? handleLogin : handleSignup} disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
          {loading ? (mode === "login" ? "Signing in..." : "Creating account...") : (mode === "login" ? "Sign in" : "Create account")}
        </Btn>

        <div style={{ textAlign: "center", marginTop: "1rem", fontSize: 11, color: C.textTert }}>
          OccHealth Pro SA v{APP_VERSION} · POPIA compliant
        </div>
      </div>
    </div>
  );
};

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV_OHP = [
  { id: "dashboard",  label: "Dashboard",    icon: "⊞" },
  { id: "flowboard",  label: "Flowboard",    icon: "📅" },
  { id: "employers",  label: "Employers",    icon: "🏭" },
  { id: "encounters", label: "Encounters",   icon: "📋" },
  { id: "surveillance",label: "Surveillance",icon: "📊" },
  { id: "fitness",    label: "Fitness certs",icon: "✅" },
  { id: "iod",        label: "IOD register", icon: "⚠" },
  { id: "drug",       label: "Drug testing", icon: "🧪" },
  { id: "stock",      label: "Stock & cal.", icon: "📦" },
  { id: "finance",    label: "Finance",      icon: "💳" },
  { id: "settings",   label: "Settings",     icon: "⚙" },
];

const NAV_EMPLOYER = [
  { id: "portal", label: "Dashboard", icon: "⊞" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const Sidebar = ({ screen, setScreen, session, onLogout, view }) => {
  const nav = view === "employer" ? NAV_EMPLOYER : NAV_OHP;
  return (
    <div style={{ width: 200, minHeight: "100vh", background: C.tealDark, display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "1.25rem 1rem 1rem" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>OccHealth Pro SA</div>
        <div style={{ fontSize: 10, color: "#5DCAA5", marginTop: 2, letterSpacing: "0.05em" }}>
          {view === "employer" ? "EMPLOYER PORTAL" : view === "bureau" ? "BUREAU OPS" : "OHP CLINICAL"}
        </div>
      </div>
      <nav style={{ flex: 1, padding: "0.5rem 0.5rem" }}>
        {nav.map(item => (
          <div key={item.id} onClick={() => setScreen(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 7, marginBottom: 2, cursor: "pointer", background: screen === item.id ? "rgba(255,255,255,0.12)" : "transparent", color: screen === item.id ? "#fff" : "#9FE1CB", fontSize: 13, transition: "background 0.15s" }}>
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>
      <div style={{ padding: "1rem", borderTop: "0.5px solid rgba(255,255,255,0.1)" }}>
        <div style={{ fontSize: 11, color: "#5DCAA5", marginBottom: 4 }}>{session.user.user_metadata.full_name}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{session.user.email}</div>
        <Btn variant="ghost" size="sm" onClick={onLogout} style={{ color: "#9FE1CB", borderColor: "rgba(255,255,255,0.2)", fontSize: 11 }}>Sign out</Btn>
      </div>
    </div>
  );
};

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
const TopBar = ({ screen, nav }) => {
  const item = nav.find(n => n.id === screen);
  return (
    <div style={{ background: "#fff", borderBottom: `0.5px solid ${C.border}`, padding: "0 1.5rem", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ fontSize: 15, fontWeight: 500 }}>{item?.label || screen}</div>
      {USE_MOCK && <Badge color="amber">Demo mode</Badge>}
    </div>
  );
};

// ─── DATA CONTEXT ────────────────────────────────────────────────────────────
const DataContext = createContext(null);
const useData = () => useContext(DataContext);

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(() => {
    try { const s = localStorage.getItem(LS.SESSION); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [screen, setScreen] = useState("dashboard");
  const [view, setView] = useState("ohp");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Live data state (replaces mock arrays for authenticated users)
  const [liveEmployers, setLiveEmployers] = useState(null); // null = not loaded
  const [livePersons, setLivePersons] = useState(null);
  const [liveEncounters, setLiveEncounters] = useState(null);
  const [liveFitnessCerts, setLiveFitnessCerts] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  const token = session?.access_token;
  // Memoize db so it's a stable reference — prevents useEffect([db]) infinite loops
  const db = useMemo(() => token ? sbAuth(token) : null, [token]);

  // Derived: use live data when available, else mock
  const employers = liveEmployers ?? MOCK_EMPLOYERS;
  const persons = livePersons ?? MOCK_PERSONS;
  const encounters = liveEncounters ?? MOCK_ENCOUNTERS;
  const fitnessCerts = liveFitnessCerts ?? MOCK_FITNESS_CERTS;

  // Unregister any stale service workers on startup
  // SW was caching old bundles and causing blank pages — disabled until properly implemented
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
      });
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  }, []);

  // Load live data when session exists and Supabase connected
  // Also check if the token is expired — if so, clear session and force re-login
  useEffect(() => {
    if (!session || USE_MOCK || !token) return;
    // JWT exp is in the token payload — check if expired
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiry = payload.exp * 1000; // convert to ms
      if (Date.now() > expiry) {
        console.warn("Session expired — clearing");
        setSession(null);
        localStorage.removeItem(LS.SESSION);
        return;
      }
    } catch(e) { /* not a JWT, ignore */ }
    loadAllData();
  }, [session?.access_token]);

  const loadAllData = async () => {
    if (!db) return;
    setDataLoading(true);
    try {
      const [empRes, persRes, encRes, fcRes] = await Promise.all([
        db.from("employer").select(""),
        db.from("person").select(""),
        db.from("clinical_encounter").select("limit=100"),
        db.from("fitness_certificate").select("superseded=eq.false&limit=100"),
      ]);
      if (empRes.data) setLiveEmployers(empRes.data);
      if (persRes.data) setLivePersons(persRes.data);
      if (encRes.data) setLiveEncounters(encRes.data);
      if (fcRes.data) setLiveFitnessCerts(fcRes.data);

      // Only trigger onboarding if:
      // 1. The query actually succeeded (data is an array, not null)
      // 2. The array is genuinely empty
      // 3. User metadata doesn't say onboarding is complete
      // This prevents a failed/RLS-blocked query from looping into onboarding
      const metaComplete = session?.user?.user_metadata?.onboarding_complete;
      if (!metaComplete && empRes.data !== null && Array.isArray(empRes.data) && empRes.data.length === 0) {
        setNeedsOnboarding(true);
      }
    } catch(e) {
      console.warn("Data load error:", e);
    }
    setDataLoading(false);
  };

  const handleLogin = async (sess) => {
    setSession(sess);
    localStorage.setItem(LS.SESSION, JSON.stringify(sess));
    // Only trigger onboarding if metadata explicitly has onboarding_complete: false
    // If the field is absent, the user may be returning — let loadAllData decide
    if (!USE_MOCK && sess?.access_token) {
      const meta = sess?.user?.user_metadata || {};
      if (meta.onboarding_complete === false) {
        setNeedsOnboarding(true);
      }
      // If onboarding_complete is absent or true, let loadAllData check employer count
    }
  };

  const handleLogout = async () => {
    if (!USE_MOCK && token) {
      await auth.signOut(token).catch(() => {});
    }
    setSession(null);
    setLiveEmployers(null);
    setLivePersons(null);
    setLiveEncounters(null);
    setLiveFitnessCerts(null);
    setNeedsOnboarding(false);
    localStorage.removeItem(LS.SESSION);
    setScreen("dashboard");
  };

  const handleOnboardingComplete = async () => {
    setNeedsOnboarding(false);
    if (token) {
      // Update user metadata to mark onboarding complete
      await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ data: { ...session?.user?.user_metadata, onboarding_complete: true } }),
      }).catch(() => {});
      // Update local session so the check doesn't re-trigger on next render
      const updatedSession = {
        ...session,
        user: {
          ...session.user,
          user_metadata: { ...session.user.user_metadata, onboarding_complete: true }
        }
      };
      setSession(updatedSession);
      localStorage.setItem(LS.SESSION, JSON.stringify(updatedSession));
      await loadAllData();
    }
  };

  const refreshData = () => { if (!USE_MOCK) loadAllData(); };

  if (!session) return <LoginScreen onLogin={handleLogin} />;

  if (needsOnboarding && !USE_MOCK) {
    return <OnboardingWizard session={session} onComplete={handleOnboardingComplete} />;
  }

  const navigate = (s) => setScreen(s);

  // iodCount: derived from live data if available — feeds Dashboard stat card
  const iodCount = MOCK_IOD.length; // replaced with live count once IODRegister loads

  const dataCtx = { employers, persons, encounters, fitnessCerts, db, token, refreshData, dataLoading,
    setLiveEncounters, setLiveFitnessCerts, setLiveEmployers, setLivePersons, iodCount };

  const renderScreen = (s) => {
    switch(s) {
      case "dashboard":    return <Dashboard session={session} navigate={navigate} />;
      case "flowboard":    return <OccFlowboard />;
      case "employers":    return <Employers navigate={navigate} />;
      case "encounters":   return <Encounters navigate={navigate} session={session} />;
      case "surveillance": return <Surveillance />;
      case "fitness":      return <FitnessCerts />;
      case "iod":          return <IODRegister />;
      case "drug":         return <DrugTesting />;
      case "stock":        return <StockCalibration />;
      case "portal":       return <EmployerPortal session={session} />;
      case "finance":      return <FinanceBilling session={session} />;
      case "settings":     return <Settings session={session} />;
      default:             return <div style={{ color: C.textSub }}>Coming soon</div>;
    }
  };

  const nav = view === "employer" ? NAV_EMPLOYER : NAV_OHP;

  return (
    <AuthContext.Provider value={{ session, view, setView }}>
      <DataContext.Provider value={dataCtx}>
        <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text }}>
          <Sidebar screen={screen} setScreen={setScreen} session={session} onLogout={handleLogout} view={view} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <TopBar screen={screen} nav={nav} />

            {dataLoading && (
              <div style={{ background: C.tealLight, borderBottom: `0.5px solid ${C.tealMid}`, padding: "4px 1.5rem", fontSize: 12, color: C.teal }}>
                Loading your data...
              </div>
            )}
            <div style={{ flex: 1, padding: "1.5rem", overflowY: "auto", maxWidth: 800 }}>
              {renderScreen(screen)}
            </div>
          </div>
        </div>
      </DataContext.Provider>
    </AuthContext.Provider>
  );
}
