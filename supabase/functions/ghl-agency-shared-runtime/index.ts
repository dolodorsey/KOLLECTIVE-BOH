import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
});

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

  return json({
    ok: false,
    error: "legacy_shared_credential_write_path_retired",
    action,
    replacement: "Use the exact entity/location PIT and the canonical CRM runtime/deployment queues.",
  }, 410);
});
