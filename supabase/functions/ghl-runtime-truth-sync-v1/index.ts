import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.0";
const SU=Deno.env.get("SUPABASE_URL")||"";
const SK=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const MCP="https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/ghl-runtime-truth-export-v1";
const db=createClient(SU,SK,{auth:{persistSession:false,autoRefreshToken:false}});
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
async function hmac(value:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(SK),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign({name:"HMAC"},key,new TextEncoder().encode(value));return Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,"0")).join("")}
function safe(v:unknown,n=600){return String(v??"").replace(/Bearer\s+\S+/gi,"Bearer [redacted]").slice(0,n)}
async function internalKey(){const {data}=await db.rpc("get_reasoning_runtime_config",{p_key:"reasoning_internal_key"});return String(data||"")}
function equal(a:string,b:string){if(!a||!b||a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}

Deno.serve(async(req)=>{
 if(req.method==="GET")return json({ok:true,system:"KHG GHL Runtime Truth Sync",secret_transport:false,inactive_self_heal:true,pipeline_create_probe:true,targeted_entities:true});
 if(req.method!=="POST")return json({ok:false,error:"method_not_allowed"},405);
 const expected=await internalKey(); if(!expected||!equal(req.headers.get("x-khg-reasoning-key")||"",expected))return json({ok:false,error:"unauthorized"},401);
 const body=await req.json().catch(()=>({}));
 const limit=Math.max(1,Math.min(Number(body?.limit||100),100));
 const entityKeys=Array.isArray(body?.entity_keys)?body.entity_keys.map((x:any)=>String(x)).filter(Boolean).slice(0,50):[];

 let q=db.from("crm_ghl_entity_runtime_map")
   .select("entity_key,entity_name,enterprise_entity_id,ghl_location_id,is_active,metadata")
   .not("ghl_location_id","is",null);
 if(entityKeys.length)q=q.in("entity_key",entityKeys);
 const {data:maps,error}=await q.limit(limit);
 if(error)return json({ok:false,error:error.message},500);

 const ids=[...new Set((maps||[]).map((r:any)=>String(r.ghl_location_id)).filter(Boolean))];
 if(!ids.length)return json({ok:true,entities_checked:0,provider_receipts:0,verified:0,blocked:0,scope_blocked:0,reactivated:0,queue_unblocked:0,secrets_returned:false});
 const payloadRaw=JSON.stringify({issued_at:new Date().toISOString(),nonce:crypto.randomUUID(),location_ids:ids});
 const signature=await hmac(payloadRaw);
 const r=await fetch(MCP,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({payload_raw:payloadRaw,signature})});
 const text=await r.text(); let result:any={}; try{result=text?JSON.parse(text):{}}catch{result={raw:safe(text)}}
 if(!r.ok)return json({ok:false,error:"mcp_truth_export_failed",http_status:r.status,detail:safe(result?.error||text)},r.status);

 const receipts=Array.isArray(result?.receipts)?result.receipts:[]; const byLoc=new Map(receipts.map((x:any)=>[String(x.location_id),x]));
 let verified=0,blocked=0,queueUnblocked=0,scopeBlocked=0,reactivated=0;

 for(const row of maps||[]){
   const rec:any=byLoc.get(String(row.ghl_location_id)); if(!rec)continue;
   const valid=Boolean(rec.exact_pit_present)&&["valid","authenticated"].includes(String(rec.auth_status))&&rec.location_id_match!==false;
   const pipelineCreate=String(rec.pipeline_create_scope)==="granted";
   const convo=String(rec.conversation_ai_scope)==="granted";
   const now=new Date().toISOString();
   const meta={...(row.metadata||{}),
     gateway_pit_present:Boolean(rec.exact_pit_present),
     gateway_auth_status:rec.auth_status,
     gateway_location_id_match:rec.location_id_match,
     gateway_credential_source:rec.credential_source,
     gateway_last_validated_at:rec.checked_at,
     gateway_crm_read_scope:rec.crm_read_scope,
     gateway_crm_write_scope:rec.crm_write_scope,
     gateway_pipelines_http_code:rec.pipelines_http_code,
     gateway_pipeline_create_scope:rec.pipeline_create_scope,
     gateway_pipeline_create_http_code:rec.pipeline_create_http_code,
     gateway_conversation_ai_scope:rec.conversation_ai_scope,
     gateway_truth_sync_at:now,
     strict_entity_isolation:true,
     secret_transport:false
   };

   await db.from("crm_ghl_entity_runtime_map").update({
     credential_strategy:valid?"mcp_gateway_exact_location_pit":"mcp_gateway_location_check",
     credential_status:valid?"gateway_pit_verified":"exact_location_pit_missing",
     pipeline_create_scope_status:valid&&pipelineCreate?"authorized_validation_only":(valid?"exact_location_scope_blocked":"exact_location_pit_missing"),
     conversation_ai_scope_status:valid&&convo?"authorized_validation_only":(valid?"pending_probe":"exact_location_pit_missing"),
     is_active:valid?true:Boolean(row.is_active),
     metadata:meta,updated_at:now
   }).eq("entity_key",row.entity_key);

   if(valid){
     verified++; if(!row.is_active)reactivated++;
     await db.from("integration_entity_bindings").update({
       binding_status:"ready",
       last_verified_at:rec.checked_at||now,
       last_success_at:rec.checked_at||now,
       last_error:pipelineCreate?null:"Missing HighLevel scope: pipelines.create",
       metadata:{provider_runtime:"mcp_gateway",exact_location_pit:true,pipeline_create_scope:rec.pipeline_create_scope,pipeline_create_http_code:rec.pipeline_create_http_code,secret_transport:false,checked_at:rec.checked_at||now},
       updated_at:now
     }).eq("provider","highlevel").eq("brand_key",row.entity_key).eq("external_container_id",row.ghl_location_id);

     if(pipelineCreate){
       const {data:rows}=await db.from("crm_ghl_pipeline_deployment_queue").update({
         scope_status:"authorized_validation_only",last_error:null,
         metadata:{gateway_pit_verified:true,gateway_checked_at:rec.checked_at,pipeline_create_verified:true,secret_transport:false},
         updated_at:now
       }).eq("entity_key",row.entity_key)
         .in("scope_status",["exact_location_pit_missing","exact_location_scope_blocked","pending_probe","entity_remediation_required"])
         .in("deployment_status",["queued","blocked_scope"]).select("id");
       queueUnblocked+=(rows||[]).length;
     }else{
       scopeBlocked++;
       await db.from("crm_ghl_pipeline_deployment_queue").update({
         scope_status:"exact_location_scope_blocked",
         last_error:"Exact location PIT verified; HighLevel pipelines.create scope is missing.",
         metadata:{gateway_pit_verified:true,gateway_checked_at:rec.checked_at,pipeline_create_verified:false,required_scope:"pipelines.create",secret_transport:false},
         updated_at:now
       }).eq("entity_key",row.entity_key).in("deployment_status",["queued","blocked_scope"]);
     }
   } else blocked++;
 }

 return json({ok:true,entities_checked:(maps||[]).length,provider_receipts:receipts.length,verified,blocked,scope_blocked:scopeBlocked,reactivated,queue_unblocked:queueUnblocked,secrets_returned:false,at:new Date().toISOString()});
});