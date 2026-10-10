import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.0";

const SU=Deno.env.get("SUPABASE_URL")||"";
const SK=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const MCP="https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/boh-social-publish-runtime-v1";
const db=createClient(SU,SK,{auth:{persistSession:false,autoRefreshToken:false}});
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const safe=(v:unknown,n=700)=>String(v??"").replace(/Bearer\s+\S+/gi,"Bearer [redacted]").slice(0,n);
async function hmac(value:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(SK),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value));return Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,"0")).join("")}
async function internalKey(){const {data}=await db.rpc("get_reasoning_runtime_config",{p_key:"reasoning_internal_key"});return String(data||"")}
function equal(a:string,b:string){if(!a||!b||a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
function mediaUrls(refs:any){const rows=Array.isArray(refs)?refs:[refs];return rows.filter((r:any)=>!r||typeof r!=="object"||r.usage_role!=="source_reference").flatMap((r:any)=>{if(typeof r==="string")return [r];if(!r||typeof r!=="object")return [];for(const k of ["url","public_url","href","asset_url","media_url"]){if(typeof r[k]==="string"&&r[k].startsWith("https://"))return [r[k]]}return []}).filter((x:string)=>x.startsWith("https://"))}
function mediaUserTags(meta:any){const raw=Array.isArray(meta?.media_user_tags)?meta.media_user_tags:(Array.isArray(meta?.partner_tags)?meta.partner_tags:[]);return [...new Set(raw.map((v:any)=>typeof v==="string"?v:v?.username).filter(Boolean).map((v:any)=>String(v).replace(/^@/,"").trim().toLowerCase()).filter(Boolean))].slice(0,20)}
async function latestReceipt(contentId:string){const {data}=await db.from("social_execution_receipts").select("id,provider_status,external_id,permalink,occurred_at").eq("content_operation_id",contentId).order("occurred_at",{ascending:false}).limit(1).maybeSingle();return data}
async function upsertProof(row:any,rec:any){
 const proofAt=String(rec.published_at||new Date().toISOString());
 const existing=await latestReceipt(row.id);
 if(!(existing?.provider_status==="published"&&existing?.external_id===rec.provider_publish_id)){
   const {error:re}=await db.from("social_execution_receipts").insert({
     enterprise_entity_id:row.enterprise_entity_id,
     entity_key:row.entity_key,
     content_operation_id:row.id,
     platform:"instagram",
     provider:"meta",
     action_type:`publish_${String(row.content_type||"post")}`,
     external_id:String(rec.provider_publish_id),
     permalink:String(rec.permalink),
     provider_status:"published",
     request_fingerprint:`boh_social_bridge:${String(rec.job_id||rec.idempotency_key||row.id)}`,
     occurred_at:proofAt,
     raw_receipt:{
       mcp_gateway_job_id:rec.job_id||null,
       reconciled_from:"boh-social-publish-runtime-v1",
       proof_rule:"provider post ID + permalink required",
       provider_proof_received: rec.proof===true,
       provider_proof_received_at: new Date().toISOString(),
       bridge_idempotency_key:rec.idempotency_key,
     }
   });
   if(re)throw new Error(`receipt_insert_failed:${re.message}`);
 }
 const metadata={...(row.metadata||{}),provider_queue_status:"PUBLISHED_VERIFIED",provider_publish_job_id:rec.job_id||null,provider_post_id:rec.provider_publish_id,provider_permalink:rec.permalink,provider_receipt_at:proofAt,provider_schedule_verification:"PUBLISHED_VERIFIED",provider_queue_checked_at:new Date().toISOString(),provider_queue_error:null};
 const {error:ue}=await db.from("growth_content_operations").update({publish_status:"published",published_at:proofAt,metadata,updated_at:new Date().toISOString()}).eq("id",row.id);
 if(ue)throw new Error(`boh_publish_reconcile_failed:${ue.message}`);
}
async function updateQueueState(row:any,rec:any){
 const metadata={...(row.metadata||{}),provider_queue_status:rec.status==="blocked"?"BLOCKED":"MCP_JOB_QUEUED",provider_publish_job_id:rec.job_id||null,provider_schedule_verification:rec.status==="blocked"?"BLOCKED":String(rec.publish_status||rec.status||"QUEUED").toUpperCase(),provider_queue_checked_at:new Date().toISOString(),provider_queue_error:rec.error||null};
 const {error}=await db.from("growth_content_operations").update({metadata,updated_at:new Date().toISOString()}).eq("id",row.id);
 if(error)throw new Error(`boh_queue_state_update_failed:${error.message}`);
}

Deno.serve(async(req)=>{
 if(req.method==="GET")return json({ok:true,system:"KHG BOH→MCP Social Publish Bridge",source_gate:"v_marketing_instagram_schedule.ready_to_publish",proof_required:true});
 if(req.method!=="POST")return json({ok:false,error:"method_not_allowed"},405);
 const expected=await internalKey();
 if(!expected||!equal(req.headers.get("x-khg-reasoning-key")||"",expected))return json({ok:false,error:"unauthorized"},401);
 const body=await req.json().catch(()=>({}));
 const limit=Math.max(1,Math.min(Number(body?.limit||25),30));
 const horizonMinutes=Math.max(1,Math.min(Number(body?.horizon_minutes||15),1440));
 const now=new Date();
 const future=new Date(now.getTime()+horizonMinutes*60000).toISOString();
 const past=new Date(now.getTime()-36*3600000).toISOString();

 let query=db.from("v_marketing_instagram_schedule")
   .select("id,content_key,enterprise_entity_id,entity_key,entity_name,ig_handle,content_type,content_pillar,caption_draft,cta,asset_refs,publish_status,scheduled_at,metadata,ready_to_publish")
   .eq("ready_to_publish",true)
   .gte("scheduled_at",past)
   .lte("scheduled_at",future)
   .order("scheduled_at",{ascending:true})
   .limit(limit);
 const only=Array.isArray(body?.entity_keys)?body.entity_keys.map(String).filter(Boolean):[];
 if(only.length)query=query.in("entity_key",only);
 const {data:rows,error:qerr}=await query;
 if(qerr)return json({ok:false,error:"boh_schedule_query_failed",detail:safe(qerr.message)},500);
 if(!rows?.length)return json({ok:true,eligible:0,processed:0,published_verified:0,blocked:0,message:"no_ready_to_publish_rows",at:new Date().toISOString()});


 const allowedRows:any[]=[];const blockedPreflight:any[]=[];
 for(const row of rows){
   const {data:check,error:checkError}=await db.rpc("khg_marketing_release_preflight",{p_content_id:row.id});
   if(checkError||!check?.ok){
     blockedPreflight.push({content_operation_id:row.id,status:"blocked",reason:check?.code||"SOURCE_PREFLIGHT_UNAVAILABLE"});
     continue;
   }
   allowedRows.push(row);
 }
 if(!allowedRows.length)return json({ok:true,eligible:0,processed:0,published_verified:0,blocked:blockedPreflight.length,preflight_rejections:blockedPreflight,message:"pre_dispatch_source_gate_blocked",at:new Date().toISOString()});
 const rowMap=new Map(allowedRows.map((r:any)=>[String(r.id),r]));
 const jobs=allowedRows.map((r:any)=>({
   content_operation_id:String(r.id),
   entity_key:String(r.entity_key),
   ig_handle:String(r.ig_handle||""),
   content_type:String(r.content_type||""),
   caption:String(r.caption_draft||""),
   media_urls:(Array.isArray(r.metadata?.provider_media_urls)&&r.metadata.provider_media_urls.some((x:any)=>typeof x==="string"&&x.startsWith("https://")))?r.metadata.provider_media_urls:mediaUrls(r.asset_refs),
   user_tags:mediaUserTags(r.metadata),
   scheduled_at:r.scheduled_at,
   content_pillar:r.content_pillar||null,
   cta:r.cta||null,
   link_url:r.metadata?.khg_tracking_url||null,
   approval_note:`BOH launch_authorized exact-package QA for ${String(r.id)}`,
   idempotency_key:`boh:${String(r.id)}`,
 }));
 const payloadRaw=JSON.stringify({issued_at:new Date().toISOString(),nonce:`social:${crypto.randomUUID()}`,jobs});
 const signature=await hmac(payloadRaw);
 const response=await fetch(MCP,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({payload_raw:payloadRaw,signature})});
 const text=await response.text();let result:any={};try{result=text?JSON.parse(text):{}}catch{result={raw:safe(text)}}
 if(!response.ok)return json({ok:false,error:"mcp_social_runtime_failed",http_status:response.status,detail:safe(result?.error||text)},response.status);

 const receipts=Array.isArray(result?.receipts)?result.receipts:[];
 const applied:any[]=[];
 for(const rec of receipts){
   const row=rowMap.get(String(rec?.content_operation_id||""));if(!row)continue;
   try{
     if(rec?.proof===true&&rec?.provider_publish_id&&/^https:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels|stories|tv)\//i.test(String(rec?.permalink||""))){
       await upsertProof(row,rec);applied.push({content_operation_id:row.id,status:"published_verified",job_id:rec.job_id,provider_publish_id:rec.provider_publish_id,permalink:rec.permalink});
     }else{
       await updateQueueState(row,rec);applied.push({content_operation_id:row.id,status:rec?.status||"queued",job_id:rec?.job_id||null,error:rec?.error||null});
     }
   }catch(e){applied.push({content_operation_id:row.id,status:"apply_error",error:safe(e instanceof Error?e.message:e)})}
 }
 return json({ok:true,eligible:allowedRows.length,preflight_rejections:blockedPreflight,processed:receipts.length,published_verified:applied.filter(x=>x.status==="published_verified").length,blocked:applied.filter(x=>x.status==="blocked"||x.status==="apply_error").length,provider_dispatch:result?.dispatch||null,applied,at:new Date().toISOString()});
});