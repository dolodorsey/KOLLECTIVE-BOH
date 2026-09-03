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
      runtime_slug: "ghl-agency-shared-runtime",
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
      service: "ghl-agency-shared-runtime",
      status: "retired_write_runtime",
      mode: "quarantined",
      reason: "Entity automation now requires exact per-location PITs and strict entity isolation.",
      allowed_actions: ["health"],
      entity_write_actions_enabled: false,
    });
  }

  await audit(action, req);
  return json({
    ok: false,
    error: "legacy_shared_credential_write_path_retired",
    action,
    replacement: "Use the exact entity/location PIT and the canonical CRM runtime/deployment queues.",
  }, 410);
});
