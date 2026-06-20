/**
 * surveillance-scheduler.mjs
 * Netlify scheduled function — runs nightly at 01:00 SAST (23:00 UTC)
 *
 * Two jobs:
 *   1. MARK OVERDUE — any surveillance_event with status='scheduled'
 *      and scheduled_date < today gets status='overdue'
 *
 *   2. GENERATE NEXT CYCLE — any surveillance_event with status='completed'
 *      that has no next-cycle row yet gets a new row created with
 *      scheduled_date = completed_date + hazard_profile.surveillance_period_months
 *
 * Uses Supabase service role key (SUPABASE_SERVICE_KEY) — bypasses RLS
 * so it can operate across all tenants. Never expose this key client-side.
 *
 * All actions written to audit_log with actor_type='system'.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function sbGet(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function sbPatch(path, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH", headers, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function sbPost(path, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`POST ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function writeAudit(entries) {
  if (!entries.length) return;
  await sbPost("audit_log", entries).catch(e => console.warn("Audit log write failed:", e.message));
}

export async function handler(event) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY");
    return { statusCode: 500, body: "Missing env vars" };
  }

  const today = new Date().toISOString().slice(0, 10);
  const now   = new Date().toISOString();
  const log   = [];

  try {
    // ── JOB 1: MARK OVERDUE ──────────────────────────────────────────────────
    // Select all scheduled events past their due date
    const overdueEvents = await sbGet(
      `surveillance_event?status=eq.scheduled&scheduled_date=lt.${today}&select=id,person_id,employer_id`
    );

    if (overdueEvents.length > 0) {
      const ids = overdueEvents.map(e => e.id);
      // Supabase REST: update where id is in list
      // Use in filter: id=in.(uuid1,uuid2,...)
      await sbPatch(
        `surveillance_event?id=in.(${ids.join(",")})`,
        { status: "overdue" }
      );

      log.push(...overdueEvents.map(e => ({
        actor_type: "system",
        action: "update",
        table_name: "surveillance_event",
        record_id: e.id,
        person_id: e.person_id,
        employer_id: e.employer_id,
        client_timestamp: now,
        detail: { job: "mark_overdue", scheduled_date_was_before: today },
      })));

      console.log(`Marked ${overdueEvents.length} events as overdue`);
    }

    // ── JOB 2: GENERATE NEXT CYCLE ───────────────────────────────────────────
    // Find completed events — get their hazard_profile to compute next due date
    // Only generate if no future row already exists for same person+profile+test_type
    const completedEvents = await sbGet(
      `surveillance_event?status=eq.completed&completed_date=not.is.null&select=id,person_id,hazard_profile_id,test_type,completed_date,employer_id`
    );

    if (completedEvents.length > 0) {
      // Load all hazard profiles (small table)
      const profiles = await sbGet("hazard_profile?select=id,surveillance_period_months");
      const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));

      // Load all existing future scheduled/overdue events (to avoid duplicates)
      const futureEvents = await sbGet(
        `surveillance_event?status=in.(scheduled,overdue)&select=person_id,hazard_profile_id,test_type`
      );
      const futureSet = new Set(
        futureEvents.map(e => `${e.person_id}|${e.hazard_profile_id}|${e.test_type}`)
      );

      const toInsert = [];
      for (const ev of completedEvents) {
        const key = `${ev.person_id}|${ev.hazard_profile_id}|${ev.test_type}`;
        if (futureSet.has(key)) continue; // next cycle already exists

        const profile = profileMap[ev.hazard_profile_id];
        if (!profile) continue;

        const periodMonths = profile.surveillance_period_months || 12;
        const baseDate = new Date(ev.completed_date);
        baseDate.setMonth(baseDate.getMonth() + periodMonths);
        const nextDue = baseDate.toISOString().slice(0, 10);

        toInsert.push({
          person_id: ev.person_id,
          hazard_profile_id: ev.hazard_profile_id,
          test_type: ev.test_type,
          scheduled_date: nextDue,
          status: "scheduled",
          created_at: now,
        });

        // Mark as processed so we don't re-generate on next run
        futureSet.add(key);
      }

      if (toInsert.length > 0) {
        const inserted = await sbPost("surveillance_event", toInsert);

        log.push(...(Array.isArray(inserted) ? inserted : []).map(e => ({
          actor_type: "system",
          action: "insert",
          table_name: "surveillance_event",
          record_id: e.id,
          person_id: e.person_id,
          client_timestamp: now,
          detail: { job: "generate_next_cycle", scheduled_date: e.scheduled_date },
        })));

        console.log(`Generated ${toInsert.length} next-cycle surveillance events`);
      }
    }

    // Write audit log
    await writeAudit(log);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        marked_overdue: overdueEvents?.length ?? 0,
        next_cycles_generated: log.filter(l => l.detail?.job === "generate_next_cycle").length,
        ran_at: now,
      }),
    };

  } catch (err) {
    console.error("Scheduler error:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
