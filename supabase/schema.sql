-- OccHealth Pro SA — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- Version: 1.0.0 | Date: 2026-06-20

-- ── EXTENSIONS ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TENANCY & IDENTITY ───────────────────────────────────────────────────────
CREATE TABLE tenant (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text        NOT NULL,
  type                text        CHECK (type IN ('independent_ohp', 'bureau', 'employer_clinic')),
  coida_registration  text,
  created_at          timestamptz DEFAULT NOW()
);

CREATE TABLE employer (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES tenant(id),
  name            text        NOT NULL,
  coida_ref       text,
  industry_class  text,
  coida_insurer   text        CHECK (coida_insurer IN ('compensation_fund', 'rma', 'fem')),
  contact_email   text,
  created_at      timestamptz DEFAULT NOW()
);

CREATE TABLE person (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id       uuid        NOT NULL REFERENCES employer(id),
  employee_number   text,
  id_number         text,
  first_name        text        NOT NULL,
  last_name         text        NOT NULL,
  date_of_birth     date,
  gender            text,
  job_title         text,
  department        text,
  site              text,
  employment_status text        CHECK (employment_status IN ('active', 'terminated', 'contractor')),
  start_date        date,
  end_date          date,
  created_at        timestamptz DEFAULT NOW()
);

CREATE TABLE practitioner (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid        NOT NULL REFERENCES tenant(id),
  name                text        NOT NULL,
  sanc_number         text,
  hpcsa_number        text,
  qualification       text,
  registration_expiry date,
  created_at          timestamptz DEFAULT NOW()
);

-- ── HAZARD PROFILES ──────────────────────────────────────────────────────────
CREATE TABLE hazard_profile (
  id                          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id                 uuid  NOT NULL REFERENCES employer(id),
  name                        text  NOT NULL,
  hazard_codes                text[],
  surveillance_types          text[],
  surveillance_period_months  int   NOT NULL
);

CREATE TABLE person_hazard (
  person_id          uuid  NOT NULL REFERENCES person(id),
  hazard_profile_id  uuid  NOT NULL REFERENCES hazard_profile(id),
  enrolled_at        date  NOT NULL,
  PRIMARY KEY (person_id, hazard_profile_id)
);

-- ── CLINICAL ENCOUNTERS ───────────────────────────────────────────────────────
-- IMMUTABILITY: trigger prevents UPDATE after signed_at is set
-- OFFLINE: client_timestamp = device time; event_at = server sync time
CREATE TABLE clinical_encounter (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id        uuid        NOT NULL REFERENCES person(id),
  practitioner_id  uuid        NOT NULL REFERENCES practitioner(id),
  employer_id      uuid        NOT NULL REFERENCES employer(id),
  encounter_at     timestamptz NOT NULL,
  client_timestamp timestamptz,
  encounter_type   text        CHECK (encounter_type IN (
                     'pre_employment','periodic','exit','iod_treatment',
                     'surveillance','sick','chronic_review','drug_test_linked'
                   )),
  site             text,
  vitals           jsonb,
  subjective       text,
  objective        text,
  assessment       text,
  plan             text,
  signed_by        text,
  signed_at        timestamptz,
  ai_generated     boolean     DEFAULT false,
  created_at       timestamptz DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION prevent_signed_encounter_edit()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.signed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot modify a signed clinical encounter. Supersede instead.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_signed_encounter
  BEFORE UPDATE ON clinical_encounter
  FOR EACH ROW EXECUTE FUNCTION prevent_signed_encounter_edit();

-- ── FITNESS CERTIFICATES ──────────────────────────────────────────────────────
CREATE TABLE fitness_certificate (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id     uuid        NOT NULL REFERENCES clinical_encounter(id),
  person_id        uuid        NOT NULL REFERENCES person(id),
  fitness_status   text        CHECK (fitness_status IN (
                     'fit','fit_with_restrictions','temporarily_unfit','permanently_unfit'
                   )),
  restrictions     text[],
  valid_from       date        NOT NULL,
  valid_until      date        NOT NULL,
  role_category    text,
  notes            text,
  superseded       boolean     DEFAULT false,
  pdf_url          text,
  client_timestamp timestamptz,
  created_at       timestamptz DEFAULT NOW()
);

-- ── HEALTH SURVEILLANCE ───────────────────────────────────────────────────────
CREATE TABLE surveillance_event (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id          uuid        NOT NULL REFERENCES person(id),
  hazard_profile_id  uuid        NOT NULL REFERENCES hazard_profile(id),
  encounter_id       uuid        REFERENCES clinical_encounter(id),
  test_type          text        CHECK (test_type IN (
                       'audiometry','spirometry','bio_monitor',
                       'vision','blood_pressure','glucose','lung_function'
                     )),
  scheduled_date     date        NOT NULL,
  completed_date     date,
  status             text        CHECK (status IN ('scheduled','completed','overdue','waived')),
  results            jsonb,
  flagged            boolean     DEFAULT false,
  flag_detail        text,
  client_timestamp   timestamptz,
  created_at         timestamptz DEFAULT NOW()
);

-- Typed sub-tables for AI-comparable surveillance results
CREATE TABLE surveillance_audiometry (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surveillance_event_id uuid NOT NULL REFERENCES surveillance_event(id),
  left_500hz   numeric(5,1), left_1khz   numeric(5,1), left_2khz  numeric(5,1),
  left_4khz    numeric(5,1), left_8khz   numeric(5,1),
  right_500hz  numeric(5,1), right_1khz  numeric(5,1), right_2khz numeric(5,1),
  right_4khz   numeric(5,1), right_8khz  numeric(5,1)
);

CREATE TABLE surveillance_spirometry (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surveillance_event_id uuid NOT NULL REFERENCES surveillance_event(id),
  fvc            numeric(5,2),
  fev1           numeric(5,2),
  fev1_fvc_ratio numeric(5,2),
  pef            numeric(6,2)
);

CREATE TABLE surveillance_bio_monitor (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surveillance_event_id uuid NOT NULL REFERENCES surveillance_event(id),
  substance             text NOT NULL,
  result                numeric(10,4),
  unit                  text,
  reference_range_low   numeric(10,4),
  reference_range_high  numeric(10,4),
  specimen_type         text
);

-- ── IOD & COIDA ───────────────────────────────────────────────────────────────
CREATE TABLE iod_incident (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id        uuid        NOT NULL REFERENCES person(id),
  employer_id      uuid        NOT NULL REFERENCES employer(id),
  encounter_id     uuid        REFERENCES clinical_encounter(id),
  incident_at      timestamptz NOT NULL,
  client_timestamp timestamptz,
  incident_type    text        CHECK (incident_type IN ('injury','near_miss','occupational_disease')),
  mechanism        text,
  body_part        text,
  severity         text        CHECK (severity IN ('first_aid','medical_treatment','lost_time','fatality')),
  witness_ids      uuid[],
  first_aid_given  text[],
  narrative        text,
  created_at       timestamptz DEFAULT NOW()
);

CREATE TABLE coida_claim (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  iod_incident_id     uuid        NOT NULL REFERENCES iod_incident(id),
  insurer             text        CHECK (insurer IN ('compensation_fund','rma','fem')),
  claim_reference     text,
  status              text        CHECK (status IN (
                        'draft','submitted','acknowledged','assessed',
                        'approved','paid','disputed','rejected'
                      )),
  wcl2_form_url       text,
  wcl4_form_url       text,
  covering_letter_url text,
  submitted_at        timestamptz,
  acknowledged_at     timestamptz,
  assessed_at         timestamptz,
  amount_awarded      numeric(10,2),
  notes               text,
  created_at          timestamptz DEFAULT NOW()
);

-- ── DRUG & ALCOHOL TESTING ────────────────────────────────────────────────────
CREATE TABLE drug_test (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id           uuid        NOT NULL REFERENCES person(id),
  practitioner_id     uuid        NOT NULL REFERENCES practitioner(id),
  employer_id         uuid        NOT NULL REFERENCES employer(id),
  test_reason         text        CHECK (test_reason IN (
                        'random','post_incident','reasonable_suspicion',
                        'pre_employment','return_to_duty'
                      )),
  specimen_type       text        CHECK (specimen_type IN ('urine','breath','oral_fluid','blood')),
  device_brand        text,
  device_lot          text,
  substances_tested   text[],
  result              text        CHECK (result IN ('negative','positive','invalid','dilute')),
  substances_positive text[],
  consent_given       boolean     NOT NULL,
  refusal             boolean     NOT NULL DEFAULT false,
  refusal_reason      text,
  collector_id        uuid        REFERENCES practitioner(id),
  witness_id          uuid        REFERENCES person(id),
  tested_at           timestamptz NOT NULL,
  client_timestamp    timestamptz,
  certificate_url     text,
  created_at          timestamptz DEFAULT NOW()
);

-- ── DOCUMENTS ─────────────────────────────────────────────────────────────────
CREATE TABLE document (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id    uuid        NOT NULL,
  entity_type  text        NOT NULL,
  doc_type     text        NOT NULL,
  storage_url  text        NOT NULL,
  signed_by    text,
  created_at   timestamptz DEFAULT NOW()
);

-- ── OPERATIONS ────────────────────────────────────────────────────────────────
CREATE TABLE appointment (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id        uuid        NOT NULL REFERENCES person(id),
  practitioner_id  uuid        NOT NULL REFERENCES practitioner(id),
  employer_id      uuid        NOT NULL REFERENCES employer(id),
  scheduled_at     timestamptz NOT NULL,
  duration_minutes int,
  appointment_type text,
  site             text,
  status           text        CHECK (status IN ('scheduled','arrived','in_progress','completed','dna','cancelled')),
  notes            text
);

CREATE TABLE practitioner_roster (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id  uuid        NOT NULL REFERENCES practitioner(id),
  employer_id      uuid        NOT NULL REFERENCES employer(id),
  site             text,
  session_date     date        NOT NULL,
  start_time       time,
  end_time         time,
  rate_type        text        CHECK (rate_type IN ('per_session','per_hour','retainer')),
  rate_amount      numeric(10,2)
);

CREATE TABLE stock_item (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES tenant(id),
  site           text,
  name           text        NOT NULL,
  category       text,
  quantity       int         NOT NULL DEFAULT 0,
  reorder_level  int,
  supplier       text,
  unit_cost      numeric(10,2)
);

CREATE TABLE calibration_record (
  id              uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_item_id   uuid  NOT NULL REFERENCES stock_item(id),
  equipment_name  text  NOT NULL,
  serial_number   text,
  last_calibrated date,
  next_due        date  NOT NULL,
  calibrated_by   text,
  certificate_url text,
  notes           text
);

CREATE TABLE invoice (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES tenant(id),
  employer_id     uuid        NOT NULL REFERENCES employer(id),
  invoice_number  text        NOT NULL,
  issue_date      date        NOT NULL,
  due_date        date,
  billing_model   text        CHECK (billing_model IN ('per_session','per_head','retainer')),
  subtotal        numeric(10,2),
  vat_amount      numeric(10,2),
  total           numeric(10,2),
  status          text        CHECK (status IN ('draft','issued','paid','overdue','written_off')),
  xero_invoice_id text,
  created_at      timestamptz DEFAULT NOW()
);

CREATE TABLE invoice_line (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid         NOT NULL REFERENCES invoice(id),
  description  text         NOT NULL,
  quantity     numeric(10,2),
  unit_amount  numeric(10,2),
  vat_rate     numeric(5,4) DEFAULT 0.15,
  line_total   numeric(10,2),
  ref_type     text,
  ref_id       uuid
);

-- ── AUDIT LOG — append-only, partitioned by month ─────────────────────────────
-- event_at = server receipt/sync time (DEFAULT NOW())
-- client_timestamp = device time for offline-originated records; NULL for online/system
CREATE TABLE audit_log (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  event_at         timestamptz NOT NULL DEFAULT NOW(),
  client_timestamp timestamptz,
  actor_id         uuid,
  actor_type       text,
  action           text,
  table_name       text,
  record_id        uuid,
  person_id        uuid,
  employer_id      uuid,
  ip_address       inet,
  detail           jsonb
) PARTITION BY RANGE (event_at);

CREATE TABLE audit_log_2026_06 PARTITION OF audit_log
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE audit_log_2026_07 PARTITION OF audit_log
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE audit_log_2026_08 PARTITION OF audit_log
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

-- ── EMPLOYER-FACING MATERIALISED VIEWS ───────────────────────────────────────
-- No individual names, no clinical content, no fitness status per person

CREATE MATERIALIZED VIEW employer_surveillance_summary AS
SELECT
  employer_id,
  date_trunc('month', scheduled_date)                                       AS month,
  test_type,
  COUNT(*)                                                                   AS total_due,
  COUNT(*) FILTER (WHERE status = 'completed')                              AS completed,
  COUNT(*) FILTER (WHERE status = 'overdue')                                AS overdue,
  ROUND(COUNT(*) FILTER (WHERE status = 'completed')::numeric
    / NULLIF(COUNT(*),0) * 100, 1)                                          AS compliance_pct
FROM surveillance_event
GROUP BY employer_id, date_trunc('month', scheduled_date), test_type;

CREATE MATERIALIZED VIEW employer_iod_summary AS
SELECT
  i.employer_id,
  date_trunc('month', i.incident_at)                                        AS month,
  COUNT(*)                                                                   AS iod_count,
  COUNT(*) FILTER (WHERE i.severity = 'lost_time')                         AS lost_time_injuries,
  COUNT(*) FILTER (WHERE i.severity = 'fatality')                          AS fatalities,
  COUNT(c.id)                                                                AS claims_submitted,
  COUNT(c.id) FILTER (WHERE c.status = 'paid')                             AS claims_paid
FROM iod_incident i
LEFT JOIN coida_claim c ON c.iod_incident_id = i.id
GROUP BY i.employer_id, date_trunc('month', i.incident_at);

CREATE MATERIALIZED VIEW employer_fitness_summary AS
SELECT
  p.employer_id,
  COUNT(*)                                                                   AS total_certs,
  COUNT(*) FILTER (WHERE fc.valid_until >= CURRENT_DATE)                    AS current,
  COUNT(*) FILTER (WHERE fc.valid_until < CURRENT_DATE)                     AS expired,
  COUNT(*) FILTER (WHERE fc.valid_until BETWEEN CURRENT_DATE
                                            AND CURRENT_DATE + 30)          AS expiring_30_days
FROM fitness_certificate fc
JOIN person p ON p.id = fc.person_id
WHERE fc.superseded = false
GROUP BY p.employer_id;

CREATE MATERIALIZED VIEW employer_drug_test_summary AS
SELECT
  employer_id,
  date_trunc('month', tested_at)                                            AS month,
  COUNT(*)                                                                   AS tests_conducted,
  COUNT(*) FILTER (WHERE result = 'positive')                               AS positives,
  COUNT(*) FILTER (WHERE refusal = true)                                    AS refusals,
  ROUND(COUNT(*) FILTER (WHERE result = 'positive')::numeric
    / NULLIF(COUNT(*),0) * 100, 1)                                          AS positivity_rate
FROM drug_test
GROUP BY employer_id, date_trunc('month', tested_at);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
ALTER TABLE tenant             ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer           ENABLE ROW LEVEL SECURITY;
ALTER TABLE person             ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioner       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hazard_profile     ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_hazard      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_encounter ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_certificate ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveillance_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE iod_incident       ENABLE ROW LEVEL SECURITY;
ALTER TABLE coida_claim        ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_test          ENABLE ROW LEVEL SECURITY;
ALTER TABLE document           ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment        ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice            ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log          ENABLE ROW LEVEL SECURITY;

-- NOTE: Full RLS policies require the practitioner<>auth.uid() join to be
-- implemented once auth is wired. Placeholder policies below allow authenticated
-- users to read/write — replace with tenant-scoped policies before going live.
-- TODO: Replace with: USING (tenant_id = (SELECT tenant_id FROM practitioner WHERE auth_id = auth.uid()))

