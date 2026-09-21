import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { isReadOnlyTable } from "./read-policy.mjs";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const VALIDATOR_URL="https://thedoctordorsey.com/api/internal/cron-auth-check";

const ALLOWED=new Set([
  "growth_content_operations",
  "v_marketing_entity_command_current","v_marketing_execution_matrix_v1","tasks","direct_integration_registry",
  "scheduled_operations","v_marketing_instagram_schedule","v_marketing_master_timeline","company_annual_plans",
  "company_channel_plans","enterprise_random_ideas","v_marketing_entity_agents","v_marketing_operating_checks",
  "marketing_native_campaigns","growth_ambassador_campaigns","growth_ambassador_outreach",
  "growth_social_engagement_targets","company_platform_accounts","v_crm_ghl_pipeline_deployment_dashboard",
  "v_crm_ghl_scope_probe_status","enterprise_directory_records","v_growth_sponsor_opportunities_active",
  "growth_relationships","growth_ambassador_members","v_focus_ambassador_candidate_readiness","v_focus_ambassador_program_readiness","v_focus_social_execution_command_v1","v_instagram_connection_truth_v1","social_execution_receipts","communication_first_send_drafts","communication_send_log","communication_send_ramp_state","v_communication_send_ramp_current",
  "khg_revenue_actions","enterprise_focus_scope","v_focus_marketing_entity_command_current","v_focus_marketing_execution_matrix_v1","v_focus_daily_audit","v_enterprise_focus_pulse_current","v_enterprise_pulse_current","v_founder_executive_readiness_v1","enterprise_product_acceptance",
  "marketing_app_launch_controls_v1","crm_ghl_entity_runtime_map","ghl_location_readiness",
  "crm_ghl_pipeline_deployment_queue","noc_ghl_blueprint","enterprise_pulse_snapshots","enterprise_pulse_deliveries"
]);

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
const headers=(extra:Record<string,string>={})=>({apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,"content-type":"application/json",...extra});

async function authorized(req:Request){
  const auth=req.headers.get("authorization")||"";
  if(!auth.toLowerCase().startsWith("bearer "))return false;
  try{
    const res=await fetch(VALIDATOR_URL,{method:"POST",headers:{authorization:auth,"x-khg-bridge-validate":"1"},signal:AbortSignal.timeout(10000)});
    return res.status===204&&res.headers.get("x-khg-internal-auth")==="ok";
  }catch{return false}
}

async function readBody(res:Response){
  const text=await res.text();
  if(!text)return null;
  try{return JSON.parse(text)}catch{return {raw:text.slice(0,1000)}}
}

Deno.serve(async(req)=>{
  if(req.method!=="POST")return json({ok:false,error:"method_not_allowed"},405);
  if(!SUPABASE_URL||!SERVICE_KEY)return json({ok:false,error:"server_config_missing"},503);
  if(!(await authorized(req)))return json({ok:false,error:"unauthorized"},401);

  const body=await req.json().catch(()=>({}));
  const op=String(body.op||"select");
  const table=String(body.table||"");

  if(op==="outreach_outcome"){
    const allowedOutcomes=new Set(["no_reply","wrong_department","replied","correct_decision_maker","meeting_booked","explicit_no"]);
    const accountId=String(body.account_id||"").trim();
    const contactId=String(body.contact_id||"").trim();
    const outcome=String(body.outcome||"").trim().toLowerCase();
    const notes=String(body.notes||"").slice(0,1000);
    if(!accountId||!contactId||!allowedOutcomes.has(outcome))return json({ok:false,error:"invalid_outreach_outcome"},400);

    const accountRes=await fetch(
      `${SUPABASE_URL}/rest/v1/outreach_accounts?select=id,entity_key,lane,active&id=eq.${encodeURIComponent(accountId)}&limit=1`,
      {headers:headers(),cache:"no-store"}
    );
    const accounts=await readBody(accountRes);
    const account=Array.isArray(accounts)?accounts[0]:null;
    const permittedAccount=Boolean(
      account && account.active===true && (
        (account.entity_key==="casper-group" && account.lane==="casper_location") ||
        (account.entity_key==="the-kollective" && account.lane==="sponsor")
      )
    );
    if(!accountRes.ok||!permittedAccount){
      return json({ok:false,error:"outreach_account_not_authorized"},403);
    }

    const contactRes=await fetch(
      `${SUPABASE_URL}/rest/v1/outreach_account_contacts?select=id,account_id&id=eq.${encodeURIComponent(contactId)}&account_id=eq.${encodeURIComponent(accountId)}&limit=1`,
      {headers:headers(),cache:"no-store"}
    );
    const contacts=await readBody(contactRes);
    const contact=Array.isArray(contacts)?contacts[0]:null;
    if(!contactRes.ok||!contact)return json({ok:false,error:"outreach_contact_not_found"},404);

    const rpcRes=await fetch(`${SUPABASE_URL}/rest/v1/rpc/outreach_record_outcome`,{
      method:"POST",
      headers:headers({Prefer:"return=representation"}),
      body:JSON.stringify({
        p_account_id:accountId,
        p_contact_id:contactId,
        p_channel:String(body.channel||"phone").slice(0,50),
        p_outcome:outcome,
        p_notes:notes||null,
        p_provider:"khg-dashboard",
        p_message_id:null,
        p_thread_id:null
      }),
      cache:"no-store"
    });
    const data=await readBody(rpcRes);
    return json({ok:rpcRes.ok,status:rpcRes.status,data},rpcRes.ok?200:502);
  }

  if(!ALLOWED.has(table)&&!isReadOnlyTable(table))return json({ok:false,error:"table_not_allowed"},403);
  if(table==="growth_content_operations"&&!["select","update","insert"].includes(op))return json({ok:false,error:"operation_not_allowed"},403);
  if(table==='growth_content_operations'&&op==='insert'){
    const d=body.data||{};
    if(!String(d.content_key||'').startsWith('workspace:')||!d.enterprise_entity_id||d.platform!=='instagram'||!['in_production','review'].includes(d.publish_status)||d.scheduled_at||d.published_at||d.compliance_status!=='review_required'||d.metadata?.launch_authorized!==false)return json({ok:false,error:'draft_only_insert_required'},400);
  }
  if(table==='enterprise_entity_daily_ops'&&op==='update'){
    const query=new URLSearchParams(String(body.query||''));
    if(!['id','entity_key','updated_at'].every(k=>query.get(k)?.startsWith('eq.')))return json({ok:false,error:'scoped_revision_required'},400);
    const fields=['owner','task_summary','update_summary','next_action','blocker','deadline_at','status','proof','completed_at','updated_at'];
    if(Object.keys(body.data||{}).some(k=>!fields.includes(k)))return json({ok:false,error:'field_not_allowed'},400);
  }
  if(isReadOnlyTable(table)&&op!=="select"&&!(table==='enterprise_entity_daily_ops'&&op==='update'))return json({ok:false,error:"operation_not_allowed"},403);

  try{
    if(op==="select"){
      const query=String(body.query||"");
      const url=`${SUPABASE_URL}/rest/v1/${table}${query?"?"+query:""}`;
      const res=await fetch(url,{headers:headers(),cache:"no-store"});
      const data=await readBody(res);
      return json({ok:res.ok,status:res.status,data},res.ok?200:502);
    }

    if(op==="insert"){
      const res=await fetch(`${SUPABASE_URL}/rest/v1/${table}`,{method:"POST",headers:headers({Prefer:"return=representation"}),body:JSON.stringify(body.data||{}),cache:"no-store"});
      const data=await readBody(res);return json({ok:res.ok,status:res.status,data},res.ok?200:502);
    }

    if(op==="update"){
      const query=String(body.query||"");
      if(!query)return json({ok:false,error:"update_query_required"},400);
      const res=await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`,{method:"PATCH",headers:headers({Prefer:"return=representation"}),body:JSON.stringify(body.data||{}),cache:"no-store"});
      const data=await readBody(res);return json({ok:res.ok,status:res.status,data},res.ok?200:502);
    }

    if(op==="upsert"){
      const conflict=String(body.on_conflict||"");
      const suffix=conflict?`?on_conflict=${encodeURIComponent(conflict)}`:"";
      const res=await fetch(`${SUPABASE_URL}/rest/v1/${table}${suffix}`,{method:"POST",headers:headers({Prefer:"resolution=merge-duplicates,return=representation"}),body:JSON.stringify(body.data||{}),cache:"no-store"});
      const data=await readBody(res);return json({ok:res.ok,status:res.status,data},res.ok?200:502);
    }

    return json({ok:false,error:"operation_not_allowed"},400);
  }catch(error){
    return json({ok:false,error:error instanceof Error?error.message:String(error)},502);
  }
});
