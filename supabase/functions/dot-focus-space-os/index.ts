import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ ok:false, error:"method_not_allowed" }), { status:405, headers });
  }

  const u = new URL(req.url);
  const entityKey = u.searchParams.get("entity_key");
  const full = u.searchParams.get("full") === "true";
  const gaps = u.searchParams.get("gaps") === "true";
  const includeSections = full || u.searchParams.get("sections") === "true";
  const includeDaily = full || u.searchParams.get("daily") === "true";
  const includeArtifacts = full || u.searchParams.get("artifacts") === "true";
  const includeWorkforce = full || u.searchParams.get("workforce") === "true";
  const includeCheckpoints = full || u.searchParams.get("checkpoints") !== "false";

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ ok:false, error:"server_configuration_missing" }), { status:500, headers });
  }

  const db = createClient(supabaseUrl, serviceRole, { auth:{ persistSession:false, autoRefreshToken:false } });

  const view = gaps ? "v_dot_focus_space_gaps_v1" : "v_dot_focus_space_command_v1";
  let sq = db.from(view).select("*").order("focus_rank", { ascending:true });
  if (entityKey) sq = sq.eq("entity_key", entityKey);
  const spaceResult = await sq;
  if (spaceResult.error) {
    return new Response(JSON.stringify({ ok:false, error:"focus_space_query_failed", detail:spaceResult.error.message }), { status:500, headers });
  }

  let sections: unknown[] | undefined;
  if (includeSections) {
    let q = db.from("enterprise_chatgpt_space_sections")
      .select("entity_key,section_key,section_label,section_order,content,last_verified_at")
      .order("entity_key", { ascending:true }).order("section_order", { ascending:true });
    if (entityKey) q = q.eq("entity_key", entityKey);
    const r = await q;
    if (r.error) return new Response(JSON.stringify({ ok:false, error:"space_sections_query_failed", detail:r.error.message }), { status:500, headers });
    sections = r.data ?? [];
  }

  let dailyQueue: unknown[] | undefined;
  if (includeDaily) {
    let q = db.from("v_dot_focus_daily_queue_v1").select("*").order("focus_rank", { ascending:true }).order("lane_key", { ascending:true });
    if (entityKey) q = q.eq("entity_key", entityKey);
    const r = await q;
    if (r.error) return new Response(JSON.stringify({ ok:false, error:"daily_queue_query_failed", detail:r.error.message }), { status:500, headers });
    dailyQueue = r.data ?? [];
  }

  let artifacts: unknown[] | undefined;
  if (includeArtifacts) {
    let q = db.from("v_dot_focus_execution_artifacts_v1")
      .select("entity_key,lane_key,step_key,artifact_type,evidence_status,content,source_refs,verified_at")
      .order("entity_key", { ascending:true }).order("lane_key", { ascending:true });
    if (entityKey) q = q.eq("entity_key", entityKey);
    const r = await q;
    if (r.error) return new Response(JSON.stringify({ ok:false, error:"artifact_query_failed", detail:r.error.message }), { status:500, headers });
    artifacts = r.data ?? [];
  }

  let workforce: Record<string, unknown> | undefined;
  if (includeWorkforce) {
    const [coverageResult, riskResult, truthResult, rosterResult, workerResult] = await Promise.all([
      db.from("v_digital_employee_coverage_current_v1").select("*").limit(1),
      db.from("v_focus_dead_execution_risk_v1")
        .select("entity_key,focus_group,focus_rank,last_progress_at,dead_execution_risk,open_work_count")
        .order("dead_execution_risk", { ascending:false })
        .order("focus_rank", { ascending:true }),
      db.from("v_focus_operating_truth_v1")
        .select("entity_key,focus_group,focus_rank,applicable_daily_lanes,active_or_completed_lanes,blocked_lanes,queued_not_operating_lanes,proof_backed_lanes,reconciled_external_actions,operating_state")
        .order("focus_rank", { ascending:true }),
      db.from("digital_employee_roster")
        .select("employee_key,display_name,system_name,role_title,coverage_mode,expected_heartbeat_minutes,takeover_after_minutes,primary_responsibilities,active,updated_at")
        .eq("active", true)
        .order("employee_key", { ascending:true }),
      db.from("system_component_registry")
        .select("component_key,status,health_score,last_checked_at,last_success_at,last_error,metadata")
        .in("component_key", ["runtime:digital-workforce","runtime:agent-worker"])
        .order("component_key", { ascending:true })
    ]);

    for (const [name, result] of [
      ["coverage", coverageResult],
      ["dead_execution_risk", riskResult],
      ["operating_truth", truthResult],
      ["digital_employee_roster", rosterResult],
      ["worker_components", workerResult],
    ] as const) {
      if (result.error) {
        return new Response(JSON.stringify({ ok:false, error:`${name}_query_failed`, detail:result.error.message }), { status:500, headers });
      }
    }

    const riskRows = riskResult.data ?? [];
    workforce = {
      coverage: coverageResult.data?.[0] ?? null,
      roster: rosterResult.data ?? [],
      dead_execution_risk: riskRows,
      dead_execution_count: riskRows.filter((x:any) => x.dead_execution_risk === true).length,
      operating_truth: truthResult.data ?? [],
      worker_components: workerResult.data ?? [],
    };
  }

  let checkpoints: Record<string, unknown> | undefined;
  if (includeCheckpoints) {
    let currentQ = db.from("v_entity_execution_checkpoint_current_v1")
      .select("id,captured_at,entity_key,entity_name,focus_rank,pulse_status,operating_state,dead_execution_risk,last_progress_at,open_work_count,movement_summary,miss_summary,root_cause,corrective_plan,next_60m_target,expected_proof,founder_decision_required,founder_decision,previous_checkpoint_id,metadata")
      .order("focus_rank", { ascending:true });
    if (entityKey) currentQ = currentQ.eq("entity_key", entityKey);

    let queueQ = db.from("v_entity_execution_checkpoint_queue_v1")
      .select("entity_key,entity_name,focus_rank,pulse_status,operating_state,dead_execution_risk,last_progress_at,open_work_count,last_checkpoint_at,founder_decision_count,founder_decision,queue_rank")
      .order("queue_rank", { ascending:true })
      .limit(entityKey ? 1 : 5);
    if (entityKey) queueQ = queueQ.eq("entity_key", entityKey);

    const [currentResult, queueResult] = await Promise.all([currentQ, queueQ]);
    if (currentResult.error) {
      return new Response(JSON.stringify({ ok:false, error:"checkpoint_current_query_failed", detail:currentResult.error.message }), { status:500, headers });
    }
    if (queueResult.error) {
      return new Response(JSON.stringify({ ok:false, error:"checkpoint_queue_query_failed", detail:queueResult.error.message }), { status:500, headers });
    }

    checkpoints = {
      cadence_minutes: 30,
      founder_update_cadence_minutes: 60,
      one_entity_at_a_time: true,
      no_end_of_day_surprises: true,
      improvement_loop: "CHECK -> COMPARE -> DIAGNOSE -> CORRECT -> EXECUTE -> PROVE -> NEXT",
      current: currentResult.data ?? [],
      next_queue: queueResult.data ?? [],
    };
  }

  const nextResult = await db.from("enterprise_focus_next_queue")
    .select("queue_key,parent_entity_key,item_name,item_type,priority,status,objective,entry_criteria,next_action,proof_required")
    .eq("status","next").order("priority",{ ascending:true });
  if (nextResult.error) {
    return new Response(JSON.stringify({ ok:false, error:"next_queue_query_failed", detail:nextResult.error.message }), { status:500, headers });
  }

  const rows = spaceResult.data ?? [];
  const machineReady = rows.filter((x:any)=>x.dot_space_readiness==="machine_ready").length;
  const daily = dailyQueue ?? [];
  const evidence = artifacts ?? [];
  const currentCheckpoints = ((checkpoints as any)?.current ?? []) as unknown[];

  return new Response(JSON.stringify({
    ok:true,
    schema_version:"dot_focus_space_os_v4",
    source_scope_version:"2026-10-04-founder-focus-v8-space-os",
    native_chatgpt_space_visibility:"not_exposed_to_dot",
    machine_access_mode:"supabase_mirror",
    counts:{
      focus_spaces:rows.length,
      machine_ready:machineReady,
      sections:sections?.length,
      daily_queue:daily.length || undefined,
      execution_artifacts:evidence.length || undefined,
      current_checkpoints:currentCheckpoints.length || undefined,
      next_queue:(nextResult.data ?? []).length,
      dead_execution_count:(workforce as any)?.dead_execution_count,
    },
    spaces:rows,
    sections,
    daily_queue:dailyQueue,
    execution_artifacts:artifacts,
    checkpoints,
    workforce,
    next_queue:nextResult.data ?? [],
    rules:{
      brand_isolation:true,
      scheduled_is_not_posted:true,
      drafted_is_not_sent:true,
      configured_is_not_running:true,
      unknown_means_unknown:true,
      external_execution_requires_verified_entity_adapter:true,
      continuous_coverage_contract:"dot_muse_24_7",
      one_entity_at_a_time:true,
      checkpoint_cadence_minutes:30,
      founder_update_cadence_minutes:60,
      stale_without_proof_minutes:90,
      no_end_of_day_surprises:true,
      improvement_loop:"CHECK -> COMPARE -> DIAGNOSE -> CORRECT -> EXECUTE -> PROVE -> NEXT",
      founder_escalation_only_for:["binding terms","new spend","equity/ownership","high-risk compliance commitments","irreversible/destructive changes","true founder-only blockers"]
    },
    generated_at:new Date().toISOString()
  }), { status:200, headers });
});