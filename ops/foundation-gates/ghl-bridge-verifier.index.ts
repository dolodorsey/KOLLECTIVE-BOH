import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.0";
const SK=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const SU=Deno.env.get("SUPABASE_URL")||"";
const db=createClient(SU,SK,{auth:{persistSession:false,autoRefreshToken:false}});
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
async function hmac(value:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(SK),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value));return Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,"0")).join("")}
function equal(a:string,b:string){if(!a||!b||a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
function normalizedHandle(v:unknown){return String(v||"").replace(/^@/,"").trim().toLowerCase()}
function approvedMediaUrls(refs:any){const rows=Array.isArray(refs)?refs:[refs];return rows.filter((r:any)=>!r||typeof r!=="object"||r.usage_role!=="source_reference").flatMap((r:any)=>{if(typeof r==="string")return [r];if(!r||typeof r!=="object")return [];for(const k of ["url","public_url","href","asset_url","media_url"]){if(typeof r[k]==="string"&&r[k].startsWith("https://"))return [r[k]]}return []}).filter((x:string)=>x.startsWith("https://"))}
Deno.serve(async(req)=>{
 if(req.method!=="POST")return json({valid:false,code:"method_not_allowed"},405);
 if(!SK||!SU)return json({valid:false,code:"server_config_missing"},503);
 const body=await req.json().catch(()=>({}));
 const raw=typeof body?.payload_raw==="string"?body.payload_raw:"";
 const signature=typeof body?.signature==="string"?body.signature:"";
 if(!raw||!signature||!equal(await hmac(raw),signature))return json({valid:false,code:"signature_invalid"},401);
 let payload:any;try{payload=JSON.parse(raw)}catch{return json({valid:false,code:"invalid_payload_json"},400)}
 const jobs=payload?.jobs;
 if(Array.isArray(jobs)&&jobs.some((j:any)=>j?.ig_handle||String(j?.idempotency_key||"").startsWith("boh:")||j?.content_operation_id)){
   if(!jobs.length||jobs.length>30)return json({valid:false,code:"invalid_job_count"},403);
   for(const job of jobs){
      const id=String(job?.content_operation_id||"");
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
        return json({valid:false,code:"missing_content_operation_id"},403);
      const {data,error}=await db.rpc("khg_marketing_release_preflight",{p_content_id:id});
      if(error||data?.ok!==true)
        return json({valid:false,code:"marketing_preflight_rejected",reason:data?.code||"preflight_unavailable"},403);
      const {data:row,error:rowError}=await db.from("growth_content_operations")
       .select("id,caption_draft,asset_refs,enterprise_entity_id,scheduled_at,content_type")
       .eq("id",id).maybeSingle();
      if(rowError||!row)return json({valid:false,code:"approved_campaign_record_unavailable"},403);
      const {data:company,error:companyError}=await db.from("enterprise_directory_records")
       .select("id,entity_key,instagram").eq("id",row.enterprise_entity_id).maybeSingle();
      if(companyError||!company)return json({valid:false,code:"approved_brand_unavailable"},403);
      if(String(job?.caption||"")!==String(row.caption_draft||"")
        || String(job?.entity_key||"")!==String(company.entity_key||"")
        || normalizedHandle(job?.ig_handle)!==normalizedHandle(company.instagram)
        || String(job?.content_type||"")!==String(row.content_type||"")
        || !Number.isFinite(Date.parse(String(job?.scheduled_at||"")))
        || Date.parse(String(job?.scheduled_at||""))!==Date.parse(String(row.scheduled_at||""))
        || JSON.stringify(job?.media_urls||[])!==JSON.stringify(approvedMediaUrls(row.asset_refs)))
        return json({valid:false,code:"signed_media_or_campaign_mismatch"},403);

      if(String(job?.idempotency_key||"")!==`boh:${id}`)
        return json({valid:false,code:"invalid_social_idempotency_key"},403);
   }
 }
 return json({valid:true});
});