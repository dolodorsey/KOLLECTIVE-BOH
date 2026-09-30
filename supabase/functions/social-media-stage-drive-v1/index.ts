import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.0";

const SU=Deno.env.get("SUPABASE_URL")||"";
const SK=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const db=createClient(SU,SK,{auth:{persistSession:false,autoRefreshToken:false}});
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
async function consumeNonce(nonce:string){
  if(!/^[0-9a-f-]{36}$/i.test(nonce))return false;
  const now=new Date().toISOString();
  const {data}=await db.from("runtime_bootstrap_nonces")
    .update({used_at:now})
    .eq("nonce",nonce)
    .eq("purpose","social_media_stage_drive_v1")
    .is("used_at",null)
    .gt("expires_at",now)
    .select("nonce").maybeSingle();
  return Boolean(data?.nonce);
}
function safeToken(v:string){return /^[a-z0-9][a-z0-9._-]{1,120}$/i.test(v)}
function safeDriveId(v:string){return /^[A-Za-z0-9_-]{10,200}$/.test(v)}
function allowedBridgeUrl(v:string){try{const u=new URL(v);const h=u.hostname.toLowerCase();return u.protocol==="https:"&&(h==="drive.usercontent.google.com"||h==="drive.google.com"||h.endsWith(".oaiusercontent.com")||h==="oaiusercontent.com")}catch{return false}}

Deno.serve(async(req)=>{
  if(req.method==="GET") return json({ok:true,system:"KHG Drive→Provider Media Stage",proof:"public_storage_url",supports_authorized_bridge_url:true});
  if(req.method!=="POST") return json({ok:false,error:"method_not_allowed"},405);
  const body=await req.json().catch(()=>({}));
  if(!await consumeNonce(String(body?.nonce||"")))return json({ok:false,error:"unauthorized_or_nonce_expired"},401);
  const driveFileId=String(body?.drive_file_id||"").trim();
  const brand=String(body?.brand||"").trim().toLowerCase();
  const asset=String(body?.asset||"").trim().toLowerCase();
  const fileName=String(body?.file_name||`${asset}.bin`).trim();
  const bridgeUrl=String(body?.source_url||"").trim();
  if(!safeDriveId(driveFileId)||!safeToken(brand)||!safeToken(asset)) return json({ok:false,error:"invalid_input"},400);
  if(bridgeUrl&&!allowedBridgeUrl(bridgeUrl)) return json({ok:false,error:"source_url_not_allowed"},400);

  const sourceUrl=bridgeUrl||`https://drive.usercontent.google.com/download?id=${encodeURIComponent(driveFileId)}&export=download&confirm=t`;
  const r=await fetch(sourceUrl,{redirect:"follow",headers:{"user-agent":"KHG-Social-Media-Stage/2.0"}});
  if(!r.ok) return json({ok:false,error:"source_fetch_failed",status:r.status},502);
  const ct=(r.headers.get("content-type")||"").split(";")[0].toLowerCase();
  const allowed=new Set(["image/png","image/jpeg","image/webp"]);
  if(!allowed.has(ct)) return json({ok:false,error:"invalid_content_type",content_type:ct},415);
  const bytes=new Uint8Array(await r.arrayBuffer());
  if(!bytes.length||bytes.length>15_000_000) return json({ok:false,error:"invalid_size",size:bytes.length},413);

  const bucket="social-provider-media";
  const {data:buckets,error:be}=await db.storage.listBuckets();
  if(be) return json({ok:false,error:"bucket_list_failed",detail:be.message},500);
  if(!buckets?.some((b:any)=>b.name===bucket)){
    const {error:ce}=await db.storage.createBucket(bucket,{public:true,fileSizeLimit:15000000,allowedMimeTypes:["image/png","image/jpeg","image/webp"]});
    if(ce) return json({ok:false,error:"bucket_create_failed",detail:ce.message},500);
  }
  const ext=ct==="image/png"?"png":ct==="image/webp"?"webp":"jpg";
  const path=`${brand}/${asset}.${ext}`;
  const {error:ue}=await db.storage.from(bucket).upload(path,bytes,{contentType:ct,upsert:true,cacheControl:"31536000"});
  if(ue) return json({ok:false,error:"upload_failed",detail:ue.message},500);
  const {data:pub}=db.storage.from(bucket).getPublicUrl(path);
  return json({ok:true,brand,asset,drive_file_id:driveFileId,file_name:fileName,content_type:ct,size:bytes.length,public_url:pub.publicUrl,path,source:bridgeUrl?"authorized_connector_bridge":"google_drive_registered_asset"});
});