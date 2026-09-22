import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.0";

const SU=Deno.env.get("SUPABASE_URL")||"";
const SK=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const VERSION="2021-07-28";
const GHL="https://services.leadconnectorhq.com";
const db=createClient(SU,SK,{auth:{persistSession:false,autoRefreshToken:false}});

const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const safe=(v:unknown,n=400)=>String(v??"").replace(/Bearer\s+\S+/gi,"Bearer [redacted]").replace(/pit-[A-Za-z0-9_-]+/g,"[redacted]").slice(0,n);
function equal(a:string,b:string){if(!a||!b||a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
async function internalKey(){const {data}=await db.rpc("get_reasoning_runtime_config",{p_key:"reasoning_internal_key"});return String(data||"")}
async function ghl(token:string,path:string,method="GET",body?:unknown){
  const r=await fetch(GHL+path,{method,headers:{Authorization:`Bearer ${token}`,Version:VERSION,Accept:"application/json","content-type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
  const text=await r.text(); let parsed:any={}; try{parsed=text?JSON.parse(text):{}}catch{parsed={raw:safe(text)}}
  return {ok:r.ok,status:r.status,body:parsed};
}
async function runtime(entityKey:string){
  const {data:rt,error}=await db.from("crm_ghl_entity_runtime_map").select("entity_key,ghl_location_id,credential_status,is_active,metadata").eq("entity_key",entityKey).maybeSingle();
  if(error||!rt)throw new Error("entity_runtime_missing");
  if(!rt.is_active)throw new Error("entity_runtime_inactive");
  const credKey=String(rt.metadata?.credential_key||"");
  if(!credKey)throw new Error("credential_key_missing");
  const {data:cred}=await db.from("private_runtime_credentials").select("secret_value,status").eq("credential_key",credKey).eq("status","active").maybeSingle();
  if(!cred?.secret_value)throw new Error("active_location_pit_missing");
  return {locationId:String(rt.ghl_location_id),token:String(cred.secret_value),credentialKey:credKey};
}
async function syncOne(rt:any,c:any){
  const tags=Array.isArray(c.tags)?[...new Set(c.tags.map((x:any)=>String(x).trim().toLowerCase()).filter(Boolean))]:[];
  const body:any={
    locationId:rt.locationId,
    name:String(c.name||"").slice(0,180),
    source:String(c.source||"ICONIC LIVE — Nightmare on Channelside — DC Promo").slice(0,180),
    city:String(c.city||"Washington").slice(0,80),
    state:String(c.state||"DC").slice(0,80),
    country:"US"
  };
  if(c.email)body.email=String(c.email).trim().toLowerCase();
  if(c.phone)body.phone=String(c.phone).trim();
  if(c.website)body.website=String(c.website).slice(0,500);
  if(!body.email&&!body.phone)return {ok:false,name:body.name,status:422,error:"email_or_phone_required"};

  const up=await ghl(rt.token,"/contacts/upsert","POST",body);
  const contact=up.body?.contact||up.body;
  const id=String(contact?.id||up.body?.id||"");
  if(!up.ok||!id){
    return {ok:false,name:body.name,status:up.status,error:safe(up.body?.message||up.body?.error||JSON.stringify(up.body)),record_ids:c.record_ids||[]};
  }

  let tagStatus:number|null=null,tagError:string|null=null;
  if(tags.length){
    const tr=await ghl(rt.token,`/contacts/${encodeURIComponent(id)}/tags`,"POST",{tags});
    tagStatus=tr.status;
    if(!tr.ok)tagError=safe(tr.body?.message||tr.body?.error||JSON.stringify(tr.body));
  }

  await db.from("crm_legacy_ghl_runtime_call_log").insert({
    runtime_slug:"ghl-contact-sync-v1",
    action:"contact_upsert",
    disposition:tagError?"contact_upserted_tag_error":"success",
    request_metadata:{
      entity_key:c.entity_key||"iconic-live-entertainment",
      ghl_location_id:rt.locationId,
      ghl_contact_id:id,
      source_record_ids:c.record_ids||[],
      contact_type:c.type||null,
      priority:c.priority||null,
      tags,
      upsert_http:up.status,
      tag_http:tagStatus,
      tag_error:tagError,
      secret_transport:false
    },
    occurred_at:new Date().toISOString()
  });

  return {ok:true,name:body.name,contact_id:id,upsert_http:up.status,tag_http:tagStatus,tag_error:tagError,record_ids:c.record_ids||[]};
}

async function pool(items:any[],limit:number,fn:(x:any)=>Promise<any>){
  const out:any[]=[]; let idx=0;
  async function worker(){while(true){const i=idx++; if(i>=items.length)return; try{out[i]=await fn(items[i])}catch(e){out[i]={ok:false,error:safe(e instanceof Error?e.message:e)}}}}
  await Promise.all(Array.from({length:Math.min(limit,items.length)},()=>worker()));
  return out;
}

Deno.serve(async(req)=>{
  if(req.method==="GET")return json({ok:true,system:"KHG GHL Contact Sync",secret_transport:false});
  if(req.method!=="POST")return json({ok:false,error:"method_not_allowed"},405);
  const key=await internalKey();
  if(!key||!equal(req.headers.get("x-khg-reasoning-key")||"",key))return json({ok:false,error:"unauthorized"},401);
  const body=await req.json().catch(()=>({}));
  const entityKey=String(body?.entity_key||"").trim();
  const contacts=Array.isArray(body?.contacts)?body.contacts.slice(0,100):[];
  if(!entityKey||!contacts.length)return json({ok:false,error:"entity_key_and_contacts_required"},400);

  try{
    const rt=await runtime(entityKey);
    const idProbe=await ghl(rt.token,`/locations/${encodeURIComponent(rt.locationId)}`);
    if(!idProbe.ok)return json({ok:false,error:"location_identity_failed",http_status:idProbe.status},idProbe.status);

    const results=await pool(contacts,5,(c)=>syncOne(rt,{...c,entity_key:entityKey}));
    const success=results.filter(x=>x?.ok).length;
    const failures=results.length-success;
    return json({ok:failures===0,entity_key:entityKey,location_id:rt.locationId,processed:results.length,success,failures,secrets_returned:false,results});
  }catch(e){return json({ok:false,error:safe(e instanceof Error?e.message:e)},500)}
});