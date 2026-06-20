import { useState, useEffect, useRef, createContext, useContext } from "react";

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
  const { encounters, fitnessCerts, employers, persons } = useData();
  const overdue = MOCK_SURVEILLANCE.filter(s => s.status === "overdue").length;
  const certsExpiring = fitnessCerts.filter(fc => {
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
        <StatCard label="Employers" value={employers.length} />
        <StatCard label="Employees" value={persons.length} />
        <StatCard label="Surveillance due" value={MOCK_SURVEILLANCE.filter(s => s.status !== "completed").length} color={overdue > 0 ? C.amber : C.teal} />
        <StatCard label="Encounters this month" value={encounters.length} />
        <StatCard label="Active fitness certs" value={fitnessCerts.filter(f => !f.superseded).length} />
        <StatCard label="Open IOD cases" value={MOCK_IOD.length} color={MOCK_IOD.length > 0 ? C.amber : C.teal} />
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

const FitnessCerts = () => {
  const { fitnessCerts, persons, employers } = useData();
  return (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: 18, fontWeight: 500 }}>Fitness certificates</div>
      <Btn size="sm">+ Issue certificate</Btn>
    </div>
    {fitnessCerts.map(fc => {
      const person = persons.find(p => p.id === fc.person_id);
      const employer = employers.find(e => e.id === person?.employer_id);
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
};

const IODRegister = () => {
  const { persons, employers } = useData();
  const [generatingId, setGeneratingId] = useState(null);

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
      <Btn size="sm">+ Log IOD</Btn>
    </div>
    {MOCK_IOD.map(iod => {
      const person = persons.find(p => p.id === iod.person_id);
      const employer = employers.find(e => e.id === iod.employer_id);
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
            <Btn size="sm" variant="ghost" onClick={() => generateWCL2(iod)} disabled={generatingId === iod.id + "_wcl2"}>
              {generatingId === iod.id + "_wcl2" ? "Generating..." : "Generate W.Cl.2"}
            </Btn>
            <Btn size="sm" variant="ghost">Generate W.Cl.4</Btn>
          </div>
        </Card>
      );
    })}
  </div>
  );
};

const DrugTesting = () => {
  const { persons, employers } = useData();
  const [generatingId, setGeneratingId] = useState(null);

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
      <Btn size="sm">+ New test</Btn>
    </div>
    {MOCK_DRUG_TESTS.map(dt => {
      const person = persons.find(p => p.id === dt.person_id);
      const employer = employers.find(e => e.id === dt.employer_id);
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
const sbAuth = (token) => ({
  headers: () => ({
    "apikey": SUPABASE_ANON,
    "Authorization": `Bearer ${token || SUPABASE_ANON}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  }),
  from: (table) => ({
    insert: async (row) => {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: "POST",
          headers: { ...sbAuth(token).headers() },
          body: JSON.stringify(row),
        });
        const data = await r.json();
        return { data: Array.isArray(data) ? data : [data], error: r.ok ? null : data };
      } catch(e) { return { data: null, error: e }; }
    },
    select: async (filter = "") => {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}&order=created_at.desc`, {
          headers: { ...sbAuth(token).headers() },
        });
        const data = await r.json();
        return { data: Array.isArray(data) ? data : [], error: r.ok ? null : data };
      } catch(e) { return { data: null, error: e }; }
    },
    update: async (vals, match) => {
      try {
        const qs = Object.entries(match).map(([k,v]) => `${k}=eq.${v}`).join("&");
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
          method: "PATCH",
          headers: { ...sbAuth(token).headers() },
          body: JSON.stringify(vals),
        });
        const data = await r.json();
        return { data, error: r.ok ? null : data };
      } catch(e) { return { data: null, error: e }; }
    },
  }),
});

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
  const db = token ? sbAuth(token) : null;

  // Derived: use live data when available, else mock
  const employers = liveEmployers ?? MOCK_EMPLOYERS;
  const persons = livePersons ?? MOCK_PERSONS;
  const encounters = liveEncounters ?? MOCK_ENCOUNTERS;
  const fitnessCerts = liveFitnessCerts ?? MOCK_FITNESS_CERTS;

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Load live data when session exists and Supabase connected
  useEffect(() => {
    if (!session || USE_MOCK || !token) return;
    loadAllData();
  }, [session?.access_token]);

  const loadAllData = async () => {
    if (!db) return;
    setDataLoading(true);
    try {
      const [empRes, persRes, encRes, fcRes] = await Promise.all([
        db.from("employer").select("tenant_id=not.is.null"),
        db.from("person").select("employer_id=not.is.null"),
        db.from("clinical_encounter").select("id=not.is.null&limit=100"),
        db.from("fitness_certificate").select("superseded=eq.false&limit=100"),
      ]);
      if (empRes.data) setLiveEmployers(empRes.data);
      if (persRes.data) setLivePersons(persRes.data);
      if (encRes.data) setLiveEncounters(encRes.data);
      if (fcRes.data) setLiveFitnessCerts(fcRes.data);

      // Check if onboarding needed (no employers = never set up)
      if (empRes.data && empRes.data.length === 0) {
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
    // Check onboarding for new real users
    if (!USE_MOCK && sess?.access_token) {
      const onboarded = sess?.user?.user_metadata?.onboarding_complete;
      if (!onboarded) setNeedsOnboarding(true);
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

  const dataCtx = { employers, persons, encounters, fitnessCerts, db, token, refreshData, dataLoading,
    setLiveEncounters, setLiveFitnessCerts, setLiveEmployers, setLivePersons };

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
      <DataContext.Provider value={dataCtx}>
        <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text }}>
          <Sidebar screen={screen} setScreen={setScreen} session={session} onLogout={handleLogout} view={view} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <TopBar screen={screen} nav={nav} />
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
            {dataLoading && (
              <div style={{ background: C.tealLight, borderBottom: `0.5px solid ${C.tealMid}`, padding: "4px 1.5rem", fontSize: 12, color: C.teal }}>
                Loading your data...
              </div>
            )}
            <div style={{ flex: 1, padding: "1.5rem", overflowY: "auto", maxWidth: 800 }}>
              {screens[screen] || <div style={{ color: C.textSub }}>Coming soon</div>}
            </div>
          </div>
        </div>
      </DataContext.Provider>
    </AuthContext.Provider>
  );
}
