import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
});

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

async function audit(action: string, req: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE) return;
  await fetch(`${SUPABASE_URL}/rest/v1/crm_legacy_ghl_runtime_call_log`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE,
      authorization: `Bearer ${SERVICE_ROLE}`,
      "content-type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      runtime_slug: "ghl-agency-activator",
      action,
      disposition: "blocked_410",
      request_metadata: {
        method: req.method,
        user_agent: String(req.headers.get("user-agent") || "").slice(0, 180),
        authorization_header_present: Boolean(req.headers.get("authorization")),
      },
    }),
  }).catch(() => undefined);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "health");

  if (action === "health") {
    return json({
      ok: true,
      service: "ghl-agency-activator",
      status: "retired_shared_write_runtime",
      mode: "quarantined",
      reason: "New or existing entity writes must use exact per-location PIT architecture; shared agency credential writes are disabled.",
      allowed_actions: ["health"],
      location_creation_enabled: false,
    });
  }

  await audit(action, req);
  return json({
    ok: false,
    error: "legacy_shared_location_activation_retired",
    action,
    replacement: "Provision or manage each HighLevel entity using its exact entity/location Private Integration credential.",
  }, 410);
});
