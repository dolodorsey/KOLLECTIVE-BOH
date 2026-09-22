import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.0";

const SU=Deno.env.get("SUPABASE_URL")||"";
const SK=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const BOH_VERIFY="https://wfkohcwxxsrhcxhepfql.supabase.co/functions/v1/ghl-bridge-verifier";
const GHL="https://services.leadconnectorhq.com";
const VERSION="2021-07-28";
const db=createClient(SU,SK,{auth:{persistSession:false,autoRefreshToken:false}});
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const safe=(v:unknown,n=500)=>String(v??"").replace(/Bearer\s+\S+/gi,"Bearer [redacted]").slice(0,n);

async function provider(token:string,path:string,method="GET",body?:unknown){
  const r=await fetch(`${GHL}${path}`,{
    method,
    headers:{Authorization:`Bearer ${token}`,Version:VERSION,Accept:"application/json","content-type":"application/json"},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await r.text();
  let parsed:any={}; try{parsed=text?JSON.parse(text):{}}catch{parsed={raw:safe(text)}}
  return {status:r.status,ok:r.ok,body:parsed};
}
function pipelineScope(status:number){
  if(status===400||status===422||status===200||status===201)return "granted";
  if(status===401||status===403)return "scope_missing";
  return status===0?"network_error":`http_${status}`;
}

Deno.serve(async(req)=>{
  if(req.method==="GET")return json({ok:true,system:"KHG GHL Runtime Truth Export",secrets_returned:false,pipeline_create_probe:true});
  if(req.method!=="POST")return json({ok:false,error:"method_not_allowed"},405);

  const incoming=await req.json().catch(()=>({}));
  const payloadRaw=typeof incoming?.payload_raw==="string"?incoming.payload_raw:"";
  const signature=typeof incoming?.signature==="string"?incoming.signature:"";
  if(!payloadRaw||!signature)return json({ok:false,error:"signed_payload_required"},401);

  const verify=await fetch(BOH_VERIFY,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({payload_raw:payloadRaw,signature})});
  const verdict=await verify.json().catch(()=>({valid:false}));
  if(!verify.ok||verdict?.valid!==true)return json({ok:false,error:"boh_signature_invalid"},401);

  let payload:any; try{payload=JSON.parse(payloadRaw)}catch{return json({ok:false,error:"invalid_payload"},400)}
  const issued=Date.parse(String(payload?.issued_at||""));
  if(!Number.isFinite(issued)||Math.abs(Date.now()-issued)>5*60*1000)return json({ok:false,error:"payload_expired"},401);
  const locations=Array.isArray(payload?.location_ids)?payload.location_ids.map(String).filter(Boolean).slice(0,100):[];
  if(!locations.length)return json({ok:false,error:"location_ids_required"},400);

  const {data:locRows}=await db.from("ghl_locations")
    .select("location_id,brand_key,location_name,company,is_active,pit_token,api_key,updated_at")
    .in("location_id",locations);

  const out:any[]=[];
  for(const loc of locRows||[]){
    const {data:latest}=await db.from("ghl_pit_validation_results")
      .select("entity_key,ghl_location_id,location_label,credential_source,token_present,auth_status,auth_http_code,resolved_location_name,location_id_match,conversation_ai_scope,conversation_ai_http_code,crm_read_scope,crm_read_http_code,crm_write_scope,crm_write_http_code,pipelines_http_code,blocker,checked_at")
      .eq("ghl_location_id",loc.location_id).order("checked_at",{ascending:false}).limit(1).maybeSingle();

    const token=String(loc.pit_token||loc.api_key||"").trim();
    const exactPit=token.length>=20;
    let pipelineCreate={status:0,scope:"not_testable",message:null as string|null};
    if(exactPit){
      const probe=await provider(token,"/opportunities/pipelines","POST",{locationId:loc.location_id});
      pipelineCreate={status:probe.status,scope:pipelineScope(probe.status),message:safe(probe.body?.message||probe.body?.error||"",240)||null};
    }

    out.push({
      location_id:loc.location_id,
      brand_key:loc.brand_key||latest?.entity_key||null,
      location_name:loc.location_name||loc.company||latest?.resolved_location_name||null,
      exact_pit_present:exactPit,
      credential_source:latest?.credential_source||"ghl_locations",
      token_present:latest?.token_present ?? exactPit,
      auth_status:latest?.auth_status||"unvalidated",
      auth_http_code:latest?.auth_http_code||null,
      location_id_match:latest?.location_id_match??null,
      resolved_location_name:latest?.resolved_location_name||null,
      crm_read_scope:latest?.crm_read_scope||"unknown",
      crm_read_http_code:latest?.crm_read_http_code||null,
      crm_write_scope:latest?.crm_write_scope||"unknown",
      crm_write_http_code:latest?.crm_write_http_code||null,
      pipelines_http_code:latest?.pipelines_http_code||null,
      pipeline_create_scope:pipelineCreate.scope,
      pipeline_create_http_code:pipelineCreate.status||null,
      pipeline_create_message:pipelineCreate.message,
      conversation_ai_scope:latest?.conversation_ai_scope||"unknown",
      conversation_ai_http_code:latest?.conversation_ai_http_code||null,
      blocker:latest?.blocker||null,
      checked_at:latest?.checked_at||null,
      secrets_returned:false
    });
  }

  return json({ok:true,requested:locations.length,returned:out.length,secrets_returned:false,receipts:out,at:new Date().toISOString()});
});