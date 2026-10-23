import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.0";

const SU=Deno.env.get("SUPABASE_URL")||"";
const SK=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const BOH_VERIFY="https://wfkohcwxxsrhcxhepfql.supabase.co/functions/v1/ghl-bridge-verifier";
const db=createClient(SU,SK,{auth:{persistSession:false,autoRefreshToken:false}});
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const safe=(v:unknown,n=700)=>String(v??"").replace(/Bearer\s+\S+/gi,"Bearer [redacted]").slice(0,n);
async function sha256(value:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,"0")).join("")}
async function sha256Body(buffer:ArrayBuffer){const d=await crypto.subtle.digest("SHA-256",buffer);return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,"0")).join("")}
function normalizeHandle(v:string){return String(v||"").replace(/^@/,"").trim().toLowerCase()}
function normalizeUserTags(v:any){const rows=Array.isArray(v)?v:[];return [...new Set(rows.map((x:any)=>typeof x==="string"?x:x?.username).filter(Boolean).map((x:any)=>normalizeHandle(String(x))).filter(Boolean))].slice(0,20)}
function driveFileId(url:string){const a=url.match(/\/file\/d\/([^/?#]+)/);if(a?.[1])return a[1];try{const u=new URL(url);if(u.hostname.includes("drive.google.com"))return u.searchParams.get("id")}catch{}return null}
function mediaExt(contentType:string,url:string){const t=String(contentType||"").toLowerCase();if(t.includes("png"))return "png";if(t.includes("jpeg")||t.includes("jpg"))return "jpg";if(t.includes("webp"))return "webp";if(t.includes("gif"))return "gif";if(t.includes("mp4"))return "mp4";if(t.includes("webm"))return "webm";const m=url.match(/\.([a-z0-9]{2,5})(?:[?#]|$)/i);return m?.[1]?.toLowerCase()||"bin"}
async function stageProviderMedia(url:string,entityKey:string,contentId:string,expectedFileId:string,expectedSha256:string){
  const fileId=driveFileId(url);
  if(!fileId||fileId!==expectedFileId||!(/^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]{20,}\/view$/.test(url))||!(/^[a-f0-9]{64}$/.test(expectedSha256)))
   throw new Error("untrusted_drive_media_source_or_sha256");

  const candidates=[
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}&confirm=t`
  ];
  let last="";
  for(const candidate of candidates){
    try{
      const res=await fetch(candidate,{redirect:"follow"});
      const ct=String(res.headers.get("content-type")||"").toLowerCase();
      if(!res.ok){last=`http_${res.status}`;continue}
      if(!(ct.startsWith("image/")||ct.startsWith("video/"))){last=`invalid_content_type:${ct||"missing"}`;continue}
      const body=await res.arrayBuffer();
      if(!body.byteLength){last="empty_body";continue}
      const actualSha256=await sha256Body(body);
      if(actualSha256!==expectedSha256)throw new Error("source_media_digest_mismatch");
      const ext=mediaExt(ct,candidate);
      const safeEntity=String(entityKey||"entity").replace(/[^a-z0-9_-]/gi,"-").toLowerCase();
      const path=`${safeEntity}/scheduled-source/${contentId}/${fileId}/${actualSha256}.${ext}`;
      const {error:uploadError}=await db.storage.from("brand-graphics").upload(path,body,{contentType:ct,upsert:false,cacheControl:"31536000"});
      if(uploadError){
        if(!/already exists|duplicate|conflict/i.test(uploadError.message))throw new Error(`storage_upload_failed:${uploadError.message}`);
        const existing=db.storage.from("brand-graphics").getPublicUrl(path).data.publicUrl;
        const check=await fetch(existing,{cache:"no-store"});
        if(!check.ok||await sha256Body(await check.arrayBuffer())!==expectedSha256)
          throw new Error("staged_existing_media_digest_mismatch");
      }
      const {data:pub}=db.storage.from("brand-graphics").getPublicUrl(path);
      const publicUrl=String(pub?.publicUrl||"");
      if(!publicUrl.startsWith("https://"))throw new Error("storage_public_url_missing");
      return {url:publicUrl,source:url,staged:true,file_id:fileId,sha256:actualSha256,content_type:ct,bytes:body.byteLength,path};
    }catch(e){last=e instanceof Error?e.message:String(e)}
  }
  throw new Error(`drive_media_stage_failed:${fileId}:${last||"unknown"}`);
}
function publishType(job:any){const t=String(job?.content_type||"").trim().toLowerCase();const media=Array.isArray(job?.media_urls)?job.media_urls:[];if(t==="reel")return "reel";if(t==="story")return "story";if(t==="carousel")return "carousel";if(t==="image")return "image";if(["feed","feed_post","post","static"].includes(t))return media.length>1?"carousel":"image";return null}
async function currentJob(key:string){const {data,error}=await db.from("social_publish_jobs").select("id,account_id,idempotency_key,status,publish_status,content_status,scheduled_for,provider_publish_id,provider_response,published_at,error,attempt_count,updated_at,caption,media_urls,publish_type,requested_by").eq("idempotency_key",key).order("created_at",{ascending:false}).limit(1).maybeSingle();if(error)throw error;return data}
async function receipt(job:any,input:any){return {content_operation_id:input.content_operation_id,entity_key:input.entity_key,idempotency_key:input.idempotency_key,job_id:job?.id||null,status:job?.status||"not_created",publish_status:job?.publish_status||null,content_status:job?.content_status||null,provider_publish_id:job?.provider_publish_id||null,permalink:job?.provider_response?.permalink||null,published_at:job?.published_at||null,error:job?.error?safe(job.error):null,proof:Boolean(job?.provider_publish_id&&job?.provider_response?.permalink&&job?.published_at)}}

Deno.serve(async(req)=>{
 if(req.method==="GET")return json({ok:true,system:"KHG BOH Social Publish Runtime",execution_path:"direct_meta_api",idempotent:true});
 if(req.method!=="POST")return json({ok:false,error:"method_not_allowed"},405);
 const incoming=await req.json().catch(()=>({}));
 const payloadRaw=typeof incoming?.payload_raw==="string"?incoming.payload_raw:"";
 const signature=typeof incoming?.signature==="string"?incoming.signature:"";
 if(!payloadRaw||!signature)return json({ok:false,error:"signed_payload_required"},401);

 const verify=await fetch(BOH_VERIFY,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({payload_raw:payloadRaw,signature})});
 const verdict=await verify.json().catch(()=>({valid:false}));
 if(!verify.ok||verdict?.valid!==true)return json({ok:false,error:"boh_signature_invalid"},401);

 let payload:any;try{payload=JSON.parse(payloadRaw)}catch{return json({ok:false,error:"invalid_payload"},400)}
 const issued=Date.parse(String(payload?.issued_at||""));
 if(!Number.isFinite(issued)||Math.abs(Date.now()-issued)>5*60*1000)return json({ok:false,error:"payload_expired"},401);
 const nonce=String(payload?.nonce||"");
 const jobs=Array.isArray(payload?.jobs)?payload.jobs.slice(0,30):[];
 if(!nonce||!jobs.length)return json({ok:false,error:"nonce_and_jobs_required"},400);

 const payloadHash=await sha256(payloadRaw);
 const {error:nonceErr}=await db.from("ghl_pipeline_bridge_nonces").insert({nonce,issued_at:new Date(issued).toISOString(),job_count:jobs.length,payload_hash:payloadHash});
 if(nonceErr)return json({ok:false,error:"replay_or_nonce_conflict"},409);

 try{await db.rpc("khg_reconcile_social_dispatch_transport_v2",{p_limit:100});}catch{}

 const receipts:any[]=[];
 for(const input of jobs){
   const contentId=String(input?.content_operation_id||"");
   const entityKey=String(input?.entity_key||"");
   const handle=normalizeHandle(String(input?.ig_handle||""));
   const key=String(input?.idempotency_key||`boh:${contentId}`);
   const mediaSource=Array.isArray(input?.media_urls)?input.media_urls.map(String):[];
   const manifest=Array.isArray(input?.media_manifest)?input.media_manifest:[];
   if(!contentId||!manifest.length||mediaSource.length!==manifest.length||manifest.some((m:any,i:number)=>
     !(/^[A-Za-z0-9_-]{20,}$/.test(String(m?.file_id||""))) ||
     !(/^[a-f0-9]{64}$/.test(String(m?.sha256||""))) ||
     mediaSource[i]!==`https://drive.google.com/file/d/${String(m?.file_id)}/view` ||
     mediaSource[i]!==String(m?.url||""))){
       receipts.push({content_operation_id:contentId||null,entity_key:entityKey||null,idempotency_key:key,status:"blocked",error:"trusted_media_manifest_required",proof:false});
       continue;
   }
   const stagedMedia=[] as any[];
   try{
     for(let i=0;i<manifest.length;i++)stagedMedia.push(await stageProviderMedia(mediaSource[i],entityKey,contentId,String(manifest[i].file_id),String(manifest[i].sha256)));
   }catch(e){
     receipts.push({content_operation_id:contentId||null,entity_key:entityKey||null,idempotency_key:key,status:"blocked",error:safe(e instanceof Error?e.message:e),proof:false});
     continue;
   }
   const media=stagedMedia.map((x:any)=>String(x.url));
   const type=publishType({...input,media_urls:media});
   const tags=normalizeUserTags(input?.user_tags);
   if(!contentId||!entityKey||!handle||!type||!media.length){
     receipts.push({content_operation_id:contentId||null,entity_key:entityKey||null,idempotency_key:key,status:"blocked",error:"invalid_bridge_job_identity_or_media",proof:false});
     continue;
   }

   try{
     let existing=await currentJob(key);
     const existedBeforeThisRequest=Boolean(existing);
     if(!existing){
       const note=String(input?.approval_note||`BOH launch-authorized exact-package QA for ${contentId}`).trim();
       const {data:jobId,error:scheduleError}=await db.rpc("khg_schedule_direct_social_publish_job",{
         p_account_handle:handle,
         p_publish_type:type,
         p_media_urls:media,
         p_caption:String(input?.caption||""),
         p_scheduled_for:String(input?.scheduled_at||new Date().toISOString()),
         p_approval_note:note.length>=8?note:`BOH approved ${contentId}`,
         p_requested_by:"boh_social_bridge",
         p_idempotency_key:key,
         p_content_pillar:input?.content_pillar?String(input.content_pillar):null,
         p_cta:input?.cta?String(input.cta):null,
         p_link_url:input?.link_url?String(input.link_url):null,
       });
       if(scheduleError)throw new Error(`schedule_failed:${scheduleError.message}`);
       existing=jobId?await currentJob(key):null;
     }
     if(existing){
       const approvedMedia=Array.isArray(existing.media_urls)?existing.media_urls:[];
       const retainedStages=Array.isArray(existing.provider_response?.media_staging)?existing.provider_response.media_staging:[];
       const matchesApproved=
         String(existing.caption||"")===String(input.caption||"") &&
         String(existing.publish_type||"")===type &&
         String(existing.requested_by||"")==="boh_social_bridge" &&
         Date.parse(String(existing.scheduled_for||""))===Date.parse(String(input.scheduled_at||"")) &&
         JSON.stringify(approvedMedia)===JSON.stringify(media) &&
         (!existedBeforeThisRequest || (
           existing.provider_response?.media_binding_verified===true &&
           normalizeHandle(existing.provider_response?.boh_approved_handle||"")===handle &&
           retainedStages.length===stagedMedia.length &&
           retainedStages.every((p:any,i:number)=>
             String(p?.file_id||"")===String(stagedMedia[i]?.file_id||"") &&
             String(p?.sha256||"")===String(stagedMedia[i]?.sha256||"") &&
             String(p?.url||"")===String(stagedMedia[i]?.url||"")
           )));
       if(!matchesApproved)throw new Error("stale_job_content_mismatch_or_missing_binding");
       const taggedResponse={...(existing.provider_response||{}),media_user_tags:tags,entity_tagging_requested:true,entity_tagging_mode:"meta_user_tags+caption_mentions",source_media_urls:mediaSource,provider_media_urls:media,media_staging:stagedMedia,media_binding_verified:true,boh_approved_handle:handle,boh_verified_manifest:manifest,boh_verified_at:new Date().toISOString()};
       const {error:tagError}=await db.from("social_publish_jobs").update({provider_response:taggedResponse,updated_at:new Date().toISOString()}).eq("id",existing.id);
       if(tagError)throw new Error(`media_tag_persist_failed:${tagError.message}`);
       existing=await currentJob(key);
     }
     receipts.push({...await receipt(existing,input),media_user_tags_requested:tags});
   }catch(e){
     receipts.push({content_operation_id:contentId,entity_key:entityKey,idempotency_key:key,status:"blocked",error:safe(e instanceof Error?e.message:e),proof:false});
   }
 }

 const {data:dispatch,error:dispatchError}=await db.rpc("khg_dispatch_due_social_publish_jobs",{p_max:Math.min(30,jobs.length)});
 return json({
   ok:true,
   processed:receipts.length,
   scheduled_or_existing:receipts.filter(r=>!["blocked","not_created"].includes(String(r.status))).length,
   published_verified:receipts.filter(r=>r.proof).length,
   blocked:receipts.filter(r=>r.status==="blocked").length,
   dispatch:dispatchError?{error:safe(dispatchError.message)}:dispatch,
   receipts,
   at:new Date().toISOString()
 });
});