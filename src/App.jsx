import { useState, useEffect, createContext, useContext } from "react";

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

const Encounters = ({ navigate }) => {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ person_id: "", encounter_type: "periodic", subjective: "", objective: "", assessment: "", plan: "" });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Clinical encounters</div>
        <Btn size="sm" onClick={() => setShowNew(true)}>+ New encounter</Btn>
      </div>

      {showNew && (
        <Card style={{ marginBottom: "1rem", border: `1px solid ${C.teal}` }}>
          <SectionTitle>New encounter</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: C.textSub, marginBottom: 4 }}>Employee</div>
              <select value={form.person_id} onChange={e => setForm(f => ({ ...f, person_id: e.target.value }))} style={{ width: "100%", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}>
                <option value="">Select employee...</option>
                {MOCK_PERSONS.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} — {MOCK_EMPLOYERS.find(e => e.id === p.employer_id)?.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textSub, marginBottom: 4 }}>Type</div>
              <select value={form.encounter_type} onChange={e => setForm(f => ({ ...f, encounter_type: e.target.value }))} style={{ width: "100%", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}>
                {["pre_employment","periodic","exit","iod_treatment","surveillance","sick","chronic_review","drug_test_linked"].map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
              </select>
            </div>
          </div>
          {["subjective","objective","assessment","plan"].map(field => (
            <div key={field} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: C.textSub, marginBottom: 4, textTransform: "capitalize" }}>{field}</div>
              <textarea value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} rows={2} style={{ width: "100%", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" onClick={() => setShowNew(false)}>Save draft</Btn>
            <Btn size="sm" variant="primary" disabled={!form.person_id || !form.assessment}>Sign & finalise</Btn>
            <Btn size="sm" variant="secondary" onClick={() => setShowNew(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {MOCK_ENCOUNTERS.map(enc => {
        const person = MOCK_PERSONS.find(p => p.id === enc.person_id);
        const employer = MOCK_EMPLOYERS.find(e => e.id === enc.employer_id);
        return (
          <Card key={enc.id} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{person?.first_name} {person?.last_name}</div>
                <div style={{ fontSize: 12, color: C.textSub }}>{employer?.name} · {enc.encounter_type.replace(/_/g," ")}</div>
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
    encounters: <Encounters navigate={navigate} />,
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
