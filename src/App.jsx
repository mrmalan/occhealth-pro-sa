import { useState, useEffect, useRef, createContext, useContext } from "react";
import * as React from "react";

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

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.bgCard, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "1rem 1.25rem", ...style }}>
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
  const overdue = MOCK_SURVEILLANCE.filter(s => s.status === "overdue").length;
  const certsExpiring = MOCK_FITNESS_CERTS.filter(fc => {
    const days = (new Date(fc.valid_until) - new Date()) / 86400000;
    return days < 30 && days > 0;
  }).length;

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textTert, marginBottom: 4 }}>Good morning</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: C.text }}>{meta.full_name}</div>
        <div style={{ fontSize: 13, color: C.textSub }}>{meta.tenant_name}</div>
      </div>

      {(overdue > 0 || certsExpiring > 0) && (
        <div style={{ background: C.amberLight, border: `1px solid #E8C56A`, borderRadius: 8, padding: "0.875rem 1rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.amber, marginBottom: 4 }}>⚠ Action required</div>
          {overdue > 0 && <div style={{ fontSize: 13, color: C.amber }}>{overdue} surveillance test{overdue > 1 ? "s" : ""} overdue</div>}
          {certsExpiring > 0 && <div style={{ fontSize: 13, color: C.amber }}>{certsExpiring} fitness certificate{certsExpiring > 1 ? "s" : ""} expiring within 30 days</div>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
        <StatCard label="Employers" value={MOCK_EMPLOYERS.length} />
        <StatCard label="Employees" value={MOCK_PERSONS.length} />
        <StatCard label="Surveillance due" value={MOCK_SURVEILLANCE.filter(s => s.status !== "completed").length} color={overdue > 0 ? C.amber : C.teal} />
        <StatCard label="Encounters this month" value={MOCK_ENCOUNTERS.length} />
        <StatCard label="Active fitness certs" value={MOCK_FITNESS_CERTS.filter(f => !f.superseded).length} />
        <StatCard label="Open IOD cases" value={MOCK_IOD.length} color={MOCK_IOD.length > 0 ? C.amber : C.teal} />
      </div>

      <SectionTitle>Recent activity</SectionTitle>
      {[...MOCK_ENCOUNTERS].reverse().map(enc => {
        const person = MOCK_PERSONS.find(p => p.id === enc.person_id);
        const employer = MOCK_EMPLOYERS.find(e => e.id === enc.employer_id);
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

const Employers = ({ navigate }) => {
  const [sel, setSel] = useState(null);
  if (sel) {
    const persons = MOCK_PERSONS.filter(p => p.employer_id === sel.id);
    return (
      <div>
        <Btn variant="ghost" size="sm" onClick={() => setSel(null)} style={{ marginBottom: "1rem" }}>← Back</Btn>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{sel.name}</div>
        <div style={{ fontSize: 13, color: C.textSub, marginBottom: "1.25rem" }}>COIDA ref: {sel.coida_ref} · Insurer: {sel.coida_insurer.replace(/_/g, " ").toUpperCase()}</div>
        <SectionTitle>Employees ({persons.length})</SectionTitle>
        {persons.map(p => (
          <Card key={p.id} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.first_name} {p.last_name}</div>
                <div style={{ fontSize: 12, color: C.textSub }}>{p.job_title} · {p.department} · {p.site}</div>
              </div>
              <Badge color="teal">{p.employment_status}</Badge>
            </div>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Employers</div>
        <Btn size="sm">+ Add employer</Btn>
      </div>
      {MOCK_EMPLOYERS.map(e => (
        <Card key={e.id} style={{ marginBottom: 8, cursor: "pointer" }} onClick={() => setSel(e)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{e.name}</div>
              <div style={{ fontSize: 12, color: C.textSub }}>{e.industry_class} · {e.person_count} employees</div>
              <div style={{ fontSize: 11, color: C.textTert, marginTop: 2 }}>COIDA: {e.coida_ref}</div>
            </div>
            <Badge color={e.coida_insurer === "fem" ? "amber" : "teal"}>{e.coida_insurer.replace(/_/g, " ").toUpperCase()}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
const sb = {
  headers: () => ({
    "apikey": SUPABASE_ANON,
    "Authorization": `Bearer ${SUPABASE_ANON}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  }),
  from: (table) => ({
    insert: async (row) => {
      if (USE_MOCK) return { data: [{ ...row, id: crypto.randomUUID() }], error: null };
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: "POST", headers: sb.headers(), body: JSON.stringify(row),
        });
        const data = await r.json();
        return { data: Array.isArray(data) ? data : [data], error: r.ok ? null : data };
      } catch(e) { return { data: null, error: e }; }
    },
    select: async (filter = "") => {
      if (USE_MOCK) return { data: [], error: null };
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}&order=created_at.desc`, { headers: sb.headers() });
        const data = await r.json();
        return { data: Array.isArray(data) ? data : [], error: r.ok ? null : data };
      } catch(e) { return { data: null, error: e }; }
    },
  }),
};

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
const EncounterDetail = ({ enc, onBack, session }) => {
  const person = MOCK_PERSONS.find(p => p.id === enc.person_id);
  const employer = MOCK_EMPLOYERS.find(e => e.id === enc.employer_id);
  const fc = MOCK_FITNESS_CERTS.find(f => f.encounter_id === enc.id);
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
              <Btn size="sm" variant="ghost" style={{ borderColor: C.teal, color: C.teal }}>Print cert</Btn>
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
const useVoiceToNote = (onResult) => {
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
      const systemPrompt = `You are an occupational health clinical note assistant for South Africa. Generate structured SOAP notes from voice transcripts. ${styleExamples ? `Here are examples of the practitioner's writing style:\n\n${styleExamples}` : ""} Respond ONLY with JSON: {"subjective":"...","objective":"...","assessment":"...","plan":"..."}`;
      const res = await fetch("/.netlify/functions/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          messages: [{ role: "user", content: `Generate a SOAP note from this transcript: ${transcript}` }],
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
  const [encounters, setEncounters] = useState(MOCK_ENCOUNTERS);
  const [fitnessCerts, setFitnessCerts] = useState(MOCK_FITNESS_CERTS);
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

  const person = MOCK_PERSONS.find(p => p.id === form.person_id);
  const employer = person ? MOCK_EMPLOYERS.find(e => e.id === person.employer_id) : null;

  // Voice to note
  const voice = useVoiceToNote((parsed) => {
    setForm(f => ({ ...f,
      subjective: parsed.subjective || f.subjective,
      objective: parsed.objective || f.objective,
      assessment: parsed.assessment || f.assessment,
      plan: parsed.plan || f.plan,
    }));
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
    if (navigator.onLine && !USE_MOCK) {
      const { error } = await sb.from("clinical_encounter").insert(encRecord);
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
        await sb.from("fitness_certificate").insert(fcRecord);
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

    // Flush offline queue if online
    if (navigator.onLine) offlineQ.flush();

    setShowSign(false);
    setView("detail");
    setSelEnc(newEnc);
    setTimeout(() => setSyncStatus(null), 3000);
  };

  // ── List view ──
  if (view === "list") return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Clinical encounters</div>
        <Btn size="sm" onClick={() => { setForm(EMPTY_FORM); setView("new"); }}>+ New encounter</Btn>
      </div>
      {encounters.map(enc => {
        const p = MOCK_PERSONS.find(x => x.id === enc.person_id);
        const emp = MOCK_EMPLOYERS.find(x => x.id === enc.employer_id);
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
          <Field label="Employee">
            <Select value={form.person_id} onChange={e => setField("person_id", e.target.value)}>
              <option value="">Select employee...</option>
              {MOCK_PERSONS.map(p => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name} — {MOCK_EMPLOYERS.find(e => e.id === p.employer_id)?.name}</option>
              ))}
            </Select>
          </Field>
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

const Surveillance = () => (
  <div>
    <div style={{ fontSize: 18, fontWeight: 500, marginBottom: "1.25rem" }}>Health surveillance</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: "1.25rem" }}>
      <StatCard label="Scheduled" value={MOCK_SURVEILLANCE.filter(s => s.status === "scheduled").length} />
      <StatCard label="Overdue" value={MOCK_SURVEILLANCE.filter(s => s.status === "overdue").length} color={C.red} />
      <StatCard label="Completed this month" value={0} />
    </div>
    <SectionTitle>Upcoming & overdue</SectionTitle>
    {MOCK_SURVEILLANCE.map(sv => {
      const person = MOCK_PERSONS.find(p => p.id === sv.person_id);
      const employer = MOCK_EMPLOYERS.find(e => e.id === person?.employer_id);
      return (
        <Card key={sv.id} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{person?.first_name} {person?.last_name}</div>
              <div style={{ fontSize: 12, color: C.textSub }}>{employer?.name} · {sv.test_type}</div>
              <div style={{ fontSize: 11, color: C.textTert }}>Due: {new Date(sv.scheduled_date).toLocaleDateString("en-ZA")}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <Badge color={sv.status === "overdue" ? "red" : sv.status === "completed" ? "teal" : "gray"}>{sv.status}</Badge>
              <Btn size="sm" variant="ghost">Capture result</Btn>
            </div>
          </div>
        </Card>
      );
    })}
  </div>
);

const FitnessCerts = () => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: 18, fontWeight: 500 }}>Fitness certificates</div>
      <Btn size="sm">+ Issue certificate</Btn>
    </div>
    {MOCK_FITNESS_CERTS.map(fc => {
      const person = MOCK_PERSONS.find(p => p.id === fc.person_id);
      const employer = MOCK_EMPLOYERS.find(e => e.id === person?.employer_id);
      const daysLeft = Math.round((new Date(fc.valid_until) - new Date()) / 86400000);
      return (
        <Card key={fc.id} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{person?.first_name} {person?.last_name}</div>
              <div style={{ fontSize: 12, color: C.textSub }}>{employer?.name} · {fc.role_category}</div>
              <div style={{ fontSize: 11, color: C.textTert }}>Valid: {new Date(fc.valid_from).toLocaleDateString("en-ZA")} – {new Date(fc.valid_until).toLocaleDateString("en-ZA")}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <Badge color={fc.fitness_status === "fit" ? "teal" : "amber"}>{fc.fitness_status.replace(/_/g," ")}</Badge>
              <span style={{ fontSize: 11, color: daysLeft < 30 ? C.amber : C.textTert }}>{daysLeft}d remaining</span>
            </div>
          </div>
        </Card>
      );
    })}
  </div>
);

const IODRegister = () => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: 18, fontWeight: 500 }}>IOD register</div>
      <Btn size="sm">+ Log IOD</Btn>
    </div>
    {MOCK_IOD.map(iod => {
      const person = MOCK_PERSONS.find(p => p.id === iod.person_id);
      const employer = MOCK_EMPLOYERS.find(e => e.id === iod.employer_id);
      return (
        <Card key={iod.id} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{person?.first_name} {person?.last_name}</div>
              <div style={{ fontSize: 12, color: C.textSub }}>{employer?.name}</div>
              <div style={{ fontSize: 11, color: C.textTert }}>{new Date(iod.incident_at).toLocaleString("en-ZA")}</div>
            </div>
            <Badge color={iod.severity === "medical_treatment" ? "amber" : iod.severity === "lost_time" ? "red" : "gray"}>{iod.severity.replace(/_/g," ")}</Badge>
          </div>
          <div style={{ fontSize: 12, color: C.textSub, background: C.bgSub, borderRadius: 6, padding: "6px 10px", marginBottom: 8 }}>{iod.narrative}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" variant="ghost">Generate W.Cl.2</Btn>
            <Btn size="sm" variant="ghost">Generate W.Cl.4</Btn>
          </div>
        </Card>
      );
    })}
  </div>
);

const DrugTesting = () => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: 18, fontWeight: 500 }}>Drug & alcohol testing</div>
      <Btn size="sm">+ New test</Btn>
    </div>
    {MOCK_DRUG_TESTS.map(dt => {
      const person = MOCK_PERSONS.find(p => p.id === dt.person_id);
      const employer = MOCK_EMPLOYERS.find(e => e.id === dt.employer_id);
      return (
        <Card key={dt.id} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{person?.first_name} {person?.last_name}</div>
              <div style={{ fontSize: 12, color: C.textSub }}>{employer?.name} · {dt.test_reason.replace(/_/g," ")} · {dt.specimen_type}</div>
              <div style={{ fontSize: 11, color: C.textTert }}>{new Date(dt.tested_at).toLocaleDateString("en-ZA")}</div>
              <div style={{ fontSize: 11, color: C.textTert, marginTop: 2 }}>Substances: {dt.substances_tested.join(", ")}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <Badge color={dt.result === "negative" ? "teal" : dt.result === "positive" ? "red" : "amber"}>{dt.result}</Badge>
              <Btn size="sm" variant="ghost">Certificate</Btn>
            </div>
          </div>
        </Card>
      );
    })}
  </div>
);

const EmployerPortal = ({ session }) => (
  <div>
    <div style={{ background: C.tealDark, borderRadius: 10, padding: "1.25rem 1.5rem", marginBottom: "1.25rem", color: "#fff" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5DCAA5", marginBottom: 4 }}>Employer portal</div>
      <div style={{ fontSize: 18, fontWeight: 500 }}>Cape Construction (Pty) Ltd</div>
      <div style={{ fontSize: 13, color: "#9FE1CB", marginTop: 2 }}>Aggregate compliance view — no individual clinical records</div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.25rem" }}>
      <StatCard label="Surveillance compliance" value="67%" color={C.amber} />
      <StatCard label="Fitness certs current" value="2/2" color={C.teal} />
      <StatCard label="IOD incidents (MTD)" value="1" color={C.amber} />
      <StatCard label="Drug tests (MTD)" value="1" sub="0 positives" />
    </div>
    <Card style={{ background: C.tealLight, border: `1px solid ${C.tealMid}`, marginBottom: "1rem" }}>
      <div style={{ fontSize: 12, color: C.tealDark, lineHeight: 1.6 }}>
        <strong>Confidentiality notice:</strong> This portal shows aggregate workforce health metrics only. Individual clinical records, fitness status, drug test results, and medical information are confidential and accessible to occupational health practitioners only.
      </div>
    </Card>
    <SectionTitle>Surveillance compliance by test type</SectionTitle>
    {[{ type: "Audiometry", due: 2, done: 1 }, { type: "Spirometry", due: 1, done: 0 }].map(row => (
      <Card key={row.type} style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13 }}>{row.type}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: C.textSub }}>{row.done}/{row.due} complete</span>
            <Badge color={row.done === row.due ? "teal" : row.done === 0 ? "red" : "amber"}>{Math.round(row.done / row.due * 100)}%</Badge>
          </div>
        </div>
        <div style={{ marginTop: 8, height: 6, background: C.bgSub, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${row.done / row.due * 100}%`, background: row.done === row.due ? C.teal : C.amber, borderRadius: 3 }} />
        </div>
      </Card>
    ))}
  </div>
);

const Settings = ({ session }) => {
  const meta = session.user.user_metadata;
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: "1.25rem" }}>Settings</div>
      <SectionTitle>Practice details</SectionTitle>
      <Card style={{ marginBottom: "1rem" }}>
        {[
          { label: "Practitioner name", value: meta.full_name },
          { label: "Practice / tenant", value: meta.tenant_name },
          { label: "Practice type", value: meta.tenant_type?.replace(/_/g," ") },
          { label: "Email", value: session.user.email },
        ].map(row => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 13 }}>
            <span style={{ color: C.textSub }}>{row.label}</span>
            <span style={{ fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}
      </Card>
      <SectionTitle>System</SectionTitle>
      <Card>
        {[
          { label: "App version", value: APP_VERSION },
          { label: "Data mode", value: USE_MOCK ? "Demo (in-memory)" : "Live (Supabase)" },
          { label: "VAT rate", value: `${VAT_RATE * 100}%` },
          { label: "localStorage prefix", value: "oh_" },
          { label: "Audit log", value: "Append-only, monthly partitioned" },
          { label: "Document retention", value: "40 years (max statutory)" },
        ].map(row => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 13 }}>
            <span style={{ color: C.textSub }}>{row.label}</span>
            <span style={{ fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Enter email and password"); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 600));
    if (USE_MOCK) {
      onLogin(MOCK_SESSION);
    } else {
      setError("Supabase not yet connected — use demo mode");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.tealDark, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "2rem", width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: C.tealDark, letterSpacing: "-0.02em" }}>OccHealth Pro SA</div>
          <div style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>Occupational health practice management</div>
        </div>
        {USE_MOCK && (
          <div style={{ background: C.tealLight, border: `1px solid ${C.tealMid}`, borderRadius: 8, padding: "8px 12px", marginBottom: "1rem", fontSize: 12, color: C.teal }}>
            Demo mode — any credentials will work
          </div>
        )}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 4 }}>Email</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@practice.co.za" style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 14, outline: "none" }} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 4 }}>Password</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 14, outline: "none" }} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        {error && <div style={{ fontSize: 12, color: C.red, marginBottom: 10 }}>{error}</div>}
        <Btn onClick={handleLogin} disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
          {loading ? "Signing in..." : "Sign in"}
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
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "employers", label: "Employers", icon: "🏭" },
  { id: "encounters", label: "Encounters", icon: "📋" },
  { id: "surveillance", label: "Surveillance", icon: "📊" },
  { id: "fitness", label: "Fitness certs", icon: "✅" },
  { id: "iod", label: "IOD register", icon: "⚠" },
  { id: "drug", label: "Drug testing", icon: "🧪" },
  { id: "settings", label: "Settings", icon: "⚙" },
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

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(() => {
    try { const s = localStorage.getItem(LS.SESSION); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [screen, setScreen] = useState("dashboard");
  const [view, setView] = useState("ohp"); // ohp | employer | bureau

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const handleLogin = (sess) => {
    setSession(sess);
    localStorage.setItem(LS.SESSION, JSON.stringify(sess));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem(LS.SESSION);
    setScreen("dashboard");
  };

  if (!session) return <LoginScreen onLogin={handleLogin} />;

  const navigate = (s) => setScreen(s);

  const screens = {
    dashboard: <Dashboard session={session} navigate={navigate} />,
    employers: <Employers navigate={navigate} />,
    encounters: <Encounters navigate={navigate} session={session} />,
    surveillance: <Surveillance />,
    fitness: <FitnessCerts />,
    iod: <IODRegister />,
    drug: <DrugTesting />,
    portal: <EmployerPortal session={session} />,
    settings: <Settings session={session} />,
  };

  const nav = view === "employer" ? NAV_EMPLOYER : NAV_OHP;

  return (
    <AuthContext.Provider value={{ session, view, setView }}>
      <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text }}>
        <Sidebar screen={screen} setScreen={setScreen} session={session} onLogout={handleLogout} view={view} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <TopBar screen={screen} nav={nav} />
          {/* View switcher — dev only, remove before first customer */}
          {USE_MOCK && (
            <div style={{ background: C.bgSub, borderBottom: `0.5px solid ${C.border}`, padding: "6px 1.5rem", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: C.textTert }}>View:</span>
              {["ohp","employer","bureau"].map(v => (
                <button key={v} onClick={() => { setView(v); setScreen(v === "employer" ? "portal" : "dashboard"); }} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, border: `1px solid ${C.border}`, background: view === v ? C.teal : "#fff", color: view === v ? "#fff" : C.textSub, cursor: "pointer" }}>
                  {v === "ohp" ? "OHP Clinical" : v === "employer" ? "Employer Portal" : "Bureau Ops"}
                </button>
              ))}
            </div>
          )}
          <div style={{ flex: 1, padding: "1.5rem", overflowY: "auto", maxWidth: 800 }}>
            {screens[screen] || <div style={{ color: C.textSub }}>Coming soon — Phase {screen}</div>}
          </div>
        </div>
      </div>
    </AuthContext.Provider>
  );
}
