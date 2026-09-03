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
      service: "ghl-agency-activator",
      status: "retired_shared_write_runtime",
      mode: "quarantined",
      reason: "New or existing entity writes must use exact per-location PIT architecture; shared agency credential writes are disabled.",
      allowed_actions: ["health"],
      location_creation_enabled: false,
    });
  }

  return json({
    ok: false,
    error: "legacy_shared_location_activation_retired",
    action,
    replacement: "Provision or manage each HighLevel entity using its exact entity/location Private Integration credential.",
  }, 410);
});
