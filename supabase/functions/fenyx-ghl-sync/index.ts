import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const LOC="iMnrTkqOiutj7ayQMeFT";
const SU=Deno.env.get("SUPABASE_URL")||""; const SK=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const safe=(v:unknown,n=500)=>String(v??"").replace(/Bearer\s+\S+/gi,"Bearer [redacted]").slice(0,n);
async function ghl(token:string,path:string,method="GET",body:any=undefined,version="2021-07-28"){
 const r=await fetch(`https://services.leadconnectorhq.com${path}`,{method,headers:{Authorization:`Bearer ${token}`,Version:version,Accept:"application/json","content-type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
 const t=await r.text();let b:any={};try{b=t?JSON.parse(t):{}}catch{b={raw:safe(t)}};if(!r.ok)throw Object.assign(new Error(`ghl_${r.status}:${safe(b?.message||t)}`),{status:r.status,body:b});return b;
}
Deno.serve(async(req)=>{
 if(req.method!=="POST")return json({ok:false,error:"method_not_allowed"},405);
 const admin=createClient(SU,SK,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:ikey}=await admin.rpc("get_reasoning_runtime_config",{p_key:"reasoning_internal_key"});
 if(!ikey||req.headers.get("x-khg-reasoning-key")!==String(ikey))return json({ok:false,error:"unauthorized"},401);
 const body=await req.json().catch(()=>({}));const action=String(body.action||"health");
 const {data:cred}=await admin.from("private_runtime_credentials").select("secret_value,status,last_validated_at,metadata").eq("credential_key","ghl_location_fenyx").eq("status","active").maybeSingle();
 if(action==="health")return json({ok:true,service:"fenyx-ghl-sync",location_id:LOC,credential_present:Boolean(cred?.secret_value),credential_last_validated_at:cred?.last_validated_at||null,pipeline_target:"sales_conversion",at:new Date().toISOString()});
 if(!cred?.secret_value)return json({ok:false,error:"fenyx_location_pit_missing",location_id:LOC},409);
 const token=String(cred.secret_value);
 try{
   const loc=await ghl(token,`/locations/${LOC}`);const locName=String(loc?.location?.name||loc?.name||"");
   if(locName!=="FĚNYX")return json({ok:false,error:"credential_location_mismatch",verified_name:locName||null},409);
   const {data:pipeline}=await admin.from("crm_ghl_pipeline_deployment_queue").select("ghl_pipeline_id,deployment_status,pipeline_name").eq("entity_key","fenyx").eq("pipeline_key","sales_conversion").in("deployment_status",["deployed","already_exists"]).not("ghl_pipeline_id","is",null).maybeSingle();
   let q=admin.from("fenyx_site_leads").select("id,email,first_name,audience,interests,source_page,consent,marketing_consent,ghl_sync_status,ghl_contact_id,ghl_opportunity_id").eq("consent",true).eq("marketing_consent",true).in("ghl_sync_status",["pending_credentials","retry","contact_synced_waiting_pipeline"]);
   if(action==="sync_email"){const email=String(body.email||"").trim().toLowerCase();if(!email)return json({ok:false,error:"email_required"},400);q=q.eq("email",email).limit(1)} else if(action==="sync_pending"){q=q.limit(Math.max(1,Math.min(50,Number(body.limit||25))))} else return json({ok:false,error:"unknown_action"},400);
   const {data:leads,error:qerr}=await q;if(qerr)throw qerr;
   const results:any[]=[];
   for(const lead of leads||[]){let contactId=lead.ghl_contact_id||null;let opportunityId=lead.ghl_opportunity_id||null;try{
     if(!contactId){
       const tags=["fenyx","brand:fenyx","fenyx-early-access","email_opted_in","consent:explicit","newsletter_subscriber",`fenyx-audience-${lead.audience||"all"}`,...(Array.isArray(lead.interests)?lead.interests.map((x:string)=>`fenyx-interest-${x}`):[])];
       const c=await ghl(token,"/contacts/upsert","POST",{locationId:LOC,firstName:lead.first_name||undefined,email:lead.email,source:"FĚNYX website",tags,createNewIfDuplicateAllowed:false});
       contactId=String(c?.contact?.id||c?.id||"");if(!contactId)throw new Error("contact_id_missing_after_upsert");
     }
     if(!pipeline?.ghl_pipeline_id){
       await admin.from("fenyx_site_leads").update({ghl_sync_status:"contact_synced_waiting_pipeline",ghl_contact_id:contactId,ghl_sync_error:null,updated_at:new Date().toISOString()}).eq("id",lead.id);
       results.push({lead_id:lead.id,status:"contact_synced_waiting_pipeline",contact_id:contactId});continue;
     }
     if(!opportunityId){
       const p=await ghl(token,`/opportunities/pipelines/${pipeline.ghl_pipeline_id}`,"GET",undefined,"v3");const stages=Array.isArray(p?.stages)?p.stages:Array.isArray(p?.pipeline?.stages)?p.pipeline.stages:[];const first=stages[0];
       if(!first?.id)throw new Error("sales_pipeline_first_stage_missing");
       const o=await ghl(token,"/opportunities/","POST",{pipelineId:pipeline.ghl_pipeline_id,locationId:LOC,name:`${lead.first_name||lead.email} — FĚNYX Website Lead`,pipelineStageId:first.id,status:"open",contactId},"v3");
       opportunityId=String(o?.opportunity?.id||o?.id||"");if(!opportunityId)throw new Error("opportunity_id_missing_after_create");
     }
     await admin.from("fenyx_site_leads").update({ghl_sync_status:"synced",ghl_contact_id:contactId,ghl_opportunity_id:opportunityId,ghl_pipeline_id:pipeline.ghl_pipeline_id,ghl_sync_error:null,ghl_synced_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",lead.id);
     results.push({lead_id:lead.id,status:"synced",contact_id:contactId,opportunity_id:opportunityId});
   }catch(e:any){const err=safe(e?.message||e);await admin.from("fenyx_site_leads").update({ghl_sync_status:"retry",ghl_contact_id:contactId,ghl_opportunity_id:opportunityId,ghl_sync_error:err,updated_at:new Date().toISOString()}).eq("id",lead.id);results.push({lead_id:lead.id,status:"retry",error:err})}}
   return json({ok:true,action,processed:results.length,pipeline_ready:Boolean(pipeline?.ghl_pipeline_id),results,at:new Date().toISOString()});
 }catch(e:any){return json({ok:false,error:safe(e?.message||e)},Number(e?.status||500))}
});