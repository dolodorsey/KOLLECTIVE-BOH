import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.0";

const SU = Deno.env.get("SUPABASE_URL") || "";
const SK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GHL = "https://services.leadconnectorhq.com";
const db = createClient(SU, SK, { auth: { persistSession:false, autoRefreshToken:false } });
const FOCUS = ["the-kollective","good-times","sole-exchange","s-o-s","stush","bodega","fenyx","iconic-live-entertainment","mission-365"];
const ALL_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const json = (b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const safe = (v:unknown,n=600)=>String(v??"").replace(/Bearer\s+\S+/gi,"Bearer [redacted]").replace(/pit-[A-Za-z0-9_-]+/g,"[redacted]").slice(0,n);
function equal(a:string,b:string){ if(!a||!b||a.length!==b.length)return false; let d=0; for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i); return d===0; }
async function consumeNonce(nonce:string){
  if(!/^[0-9a-f-]{36}$/i.test(nonce)) return false;
  const now=new Date().toISOString();
  const {data}=await db.from("runtime_bootstrap_nonces")
    .update({used_at:now})
    .eq("nonce",nonce)
    .eq("purpose","ghl_email_campaign_runtime_v1")
    .is("used_at",null)
    .gt("expires_at",now)
    .select("nonce").maybeSingle();
  return Boolean(data?.nonce);
}

async function ghl(token:string,path:string,method="GET",body?:unknown,version="v3",contentType="application/json"){
  const headers:any={Authorization:"Bearer "+token,Version:version,Accept:"application/json"};
  let payload:any=undefined;
  if(body!==undefined){
    headers["content-type"]=contentType;
    payload=contentType==="application/x-www-form-urlencoded" ? String(body) : JSON.stringify(body);
  }
  const r=await fetch(GHL+path,{method,headers,body:payload,signal:AbortSignal.timeout(60000)});
  const t=await r.text(); let p:any={};
  try{p=t?JSON.parse(t):{}}catch{p={raw:safe(t)}}
  return {ok:r.ok,status:r.status,body:p};
}
async function runtime(entityKey:string){
  const {data:rt,error}=await db.from("crm_ghl_entity_runtime_map")
    .select("entity_key,ghl_location_id,is_active,metadata")
    .eq("entity_key",entityKey).eq("is_active",true).maybeSingle();
  if(error||!rt?.ghl_location_id) throw new Error("entity_runtime_missing");
  const credentialKey=String(rt.metadata?.credential_key||("ghl_location_"+entityKey.replace(/-/g,"_")));
  const {data:cred}=await db.from("private_runtime_credentials").select("secret_value,status,metadata")
    .eq("credential_key",credentialKey).eq("status","active").maybeSingle();
  if(!cred?.secret_value) throw new Error("exact_location_credential_missing");
  return {entityKey,locationId:String(rt.ghl_location_id),credentialKey,token:String(cred.secret_value),credentialMeta:cred.metadata||{}};
}
async function repairFenyx(){
  const entityKey="fenyx", locationId="iMnrTkqOiutj7ayQMeFT", companyId="2wRk01C87UqX19yrailL";
  const {data:agency}=await db.from("private_runtime_credentials").select("secret_value,status").eq("credential_key","ghl_agency").eq("status","active").maybeSingle();
  if(!agency?.secret_value) return {ok:false,error:"agency_credential_missing"};
  const form=new URLSearchParams({companyId,locationId}).toString();
  const r=await ghl(String(agency.secret_value),"/oauth/location-token","POST",form,"v3","application/x-www-form-urlencoded");
  if(!r.ok||!r.body?.access_token) return {ok:false,error:"location_token_exchange_failed",http:r.status,detail:safe(r.body?.message||r.body?.error||JSON.stringify(r.body))};
  const now=new Date().toISOString();
  const expiresAt=new Date(Date.now()+Math.max(3600,Number(r.body?.expires_in||86400))*1000).toISOString();
  await db.from("private_runtime_credentials").upsert({
    credential_key:"ghl_location_fenyx",
    secret_value:String(r.body.access_token),
    credential_type:"ghl_location_oauth",
    source_system:"ghl_location_token_exchange",
    status:"active",
    last_validated_at:now,
    metadata:{entity_key:entityKey,validated_location_id:locationId,identity_verified:true,strict_entity_isolation:true,received_via:"agency_location_token_exchange",expires_at:expiresAt,scope:String(r.body?.scope||""),refresh_available:Boolean(r.body?.refresh_token)}
  },{onConflict:"credential_key"});
  if(r.body?.refresh_token){
    await db.from("private_runtime_credentials").upsert({
      credential_key:"ghl_location_fenyx_refresh",
      secret_value:String(r.body.refresh_token),
      credential_type:"ghl_location_refresh_token",
      source_system:"ghl_location_token_exchange",
      status:"active",
      last_validated_at:now,
      metadata:{entity_key:entityKey,validated_location_id:locationId,strict_entity_isolation:true,expires_at:expiresAt}
    },{onConflict:"credential_key"});
  }
  await db.from("crm_ghl_entity_runtime_map").update({
    credential_strategy:"agency_location_token_exchange",
    credential_status:"verified",
    metadata:{credential_key:"ghl_location_fenyx",credential_source:"agency_location_token_exchange",credential_validated_at:now},
    updated_at:now
  }).eq("entity_key",entityKey).eq("ghl_location_id",locationId).eq("is_active",true);
  return {ok:true,entity_key:entityKey,location_id:locationId,expires_at:expiresAt,scope:String(r.body?.scope||""),secrets_returned:false};
}
async function getUser(rt:any){
  const loc=await ghl(rt.token,"/locations/"+encodeURIComponent(rt.locationId),"GET",undefined,"v3");
  const companyId=String(loc.body?.location?.companyId||loc.body?.companyId||"");
  if(!loc.ok||!companyId) return {ok:false,error:"location_identity_failed",http:loc.status,companyId:null,user:null};
  let users=await ghl(rt.token,"/users/search?companyId="+encodeURIComponent(companyId)+"&locationId="+encodeURIComponent(rt.locationId)+"&limit=10","GET",undefined,"v3");
  let rows=Array.isArray(users.body?.users)?users.body.users:[];
  if(!rows.length){
    users=await ghl(rt.token,"/users/?locationId="+encodeURIComponent(rt.locationId),"GET",undefined,"2021-07-28");
    rows=Array.isArray(users.body?.users)?users.body.users:[];
  }
  const u=rows.find((x:any)=>x?.id)||null;
  return {ok:Boolean(u?.id),companyId,user:u?{id:String(u.id),name:String([u.firstName,u.lastName].filter(Boolean).join(" ")||u.name||"Kollective Operator")} : null,http:users.status};
}
async function probeEntity(entityKey:string){
  try{
    const rt=await runtime(entityKey);
    const [loc,camps,contacts]=await Promise.all([
      ghl(rt.token,"/locations/"+encodeURIComponent(rt.locationId),"GET",undefined,"v3"),
      ghl(rt.token,"/emails/locations/"+encodeURIComponent(rt.locationId)+"/campaigns/emails?limit=1&offset=0","GET",undefined,"v3"),
      ghl(rt.token,"/contacts/?locationId="+encodeURIComponent(rt.locationId)+"&limit=1","GET",undefined,"2021-07-28")
    ]);
    const conv=await ghl(rt.token,"/conversations/messages","POST",{
      type:"Email",contactId:"__khg_scope_probe__",subject:"KHG scope probe",message:"scope probe",status:"pending"
    },"v3");
    const user=await getUser(rt);
    const total=Number(contacts.body?.meta?.total??contacts.body?.total??contacts.body?.meta?.totalCount??0);
    const nativeReady=[200,201].includes(camps.status)&&user.ok;
    const conversationReady=[200,201,400,404,409,422].includes(conv.status);
    const now=new Date().toISOString();
    const {data:profile}=await db.from("communication_sender_profiles").select("id,provider,from_address,metadata,daily_cap").eq("brand_key",entityKey).eq("channel","email").eq("stream","marketing").maybeSingle();
    const fromAddress=String(profile?.from_address||"").trim().toLowerCase();
    const crossBrandBlocked=(entityKey==="iconic-live-entertainment" && /kollective/.test(fromAddress))
      || (entityKey==="fenyx" && (/kollective/.test(fromAddress)||/bodega/.test(fromAddress)));
    const placementHold=profile?.metadata?.deliverability_hold===true;
    const senderAddressReady=Boolean(fromAddress)&&!crossBrandBlocked;
    const executionReady=(nativeReady||conversationReady)&&senderAddressReady&&!placementHold;
    const executionMode=executionReady?(nativeReady?"native_campaign":"conversation_email"):null;
    if(profile){
      const m={...(profile.metadata||{}),native_campaign_api_http:camps.status,native_campaign_api_verified:nativeReady,conversation_email_probe_http:conv.status,conversation_email_verified:conversationReady,email_execution_mode:executionMode,exact_location_credential:true,last_runtime_probe_at:now};
      if(executionReady){
        delete m.transport_blocker;
        await db.from("communication_sender_profiles").update({provider:"highlevel_gateway",verified:true,sending_enabled:true,connection_status:"connected",daily_cap:Math.max(1000,Number(profile.daily_cap||0)),last_verified_at:now,metadata:m,updated_at:now}).eq("id",profile.id);
      }else{
        m.transport_blocker=crossBrandBlocked?"cross_brand_marketing_sender_prohibited":(!fromAddress?"brand_sender_address_missing":(placementHold?"gmail_qa_spam_placement_hold":m.transport_blocker||"email_execution_scope_not_verified"));
        await db.from("communication_sender_profiles").update({sending_enabled:false,connection_status:"needs_verification",metadata:m,updated_at:now}).eq("id",profile.id);
      }
    }
    const {data:route}=await db.from("enterprise_entity_sender_routes").select("route_status,reason,evidence").eq("entity_key",entityKey).eq("channel","email").eq("stream","marketing").maybeSingle();
    const hardHold=entityKey==="mission-365" && String(route?.reason||"").toLowerCase().includes("owner hold");
    const routeStatus=executionReady && !hardHold ? "ready" : "blocked";
    const blockedReason=hardHold?String(route?.reason||"Owner hold"):(crossBrandBlocked?"Marketing sender is owned by another brand; cross-brand sender fallback is prohibited.":(!fromAddress?"No brand-owned marketing sender address is configured.":(placementHold?"Latest Gmail QA placement is Spam; production send is held until inbox placement is re-verified.":"Exact-location token does not currently have a verified email execution path.")));
    await db.from("enterprise_entity_sender_routes").update({
      route_provider:"highlevel_gateway",
      route_status:routeStatus,
      daily_cap:1000,
      evidence:{...(route?.evidence||{}),native_campaign_api_http:camps.status,native_campaign_api_verified:nativeReady,conversation_email_probe_http:conv.status,conversation_email_verified:conversationReady,email_execution_mode:executionMode,exact_location_credential:true,contacts_total:Number.isFinite(total)?total:null,user_id_resolved:Boolean(user.ok),runtime_probe_at:now},
      reason:executionReady?`Exact-location HighLevel token verified for ${executionMode}; sender is production-capable subject to campaign approval, audience/DND rules, unsubscribe controls, and delivery health.`:blockedReason,
      updated_at:now
    }).eq("entity_key",entityKey).eq("channel","email").eq("stream","marketing");
    return {entity_key:entityKey,location_id:rt.locationId,location_http:loc.status,email_campaign_http:camps.status,conversation_email_http:conv.status,contacts_http:contacts.status,contacts_total:Number.isFinite(total)?total:null,user_resolved:Boolean(user.ok),from_address:fromAddress||null,cross_brand_sender_blocked:crossBrandBlocked,deliverability_hold:placementHold,execution_mode:executionMode,ready:executionReady&&!hardHold,hard_hold:hardHold};
  }catch(e){return {entity_key:entityKey,ready:false,error:safe(e instanceof Error?e.message:e)}}
}
function campaignHtml(c:any){
  const meta=c.metadata||{},pre=String(c.preheader||"");
  const dest=String(c.destination_url||"#");
  const media=Array.isArray(meta.media_urls)?meta.media_urls.filter((x:any)=>typeof x==="string"&&/^https:\/\//.test(x)):[];
  const hidden=pre?'<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">'+pre.replace(/[<>&]/g," ")+'</div>':"";
  if(media.length){
    return '<!doctype html><html><body style="margin:0;padding:0;background:#fff">'+hidden+'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">'+
      media.map((u:string)=>'<a href="'+dest+'" style="display:block;text-decoration:none"><img src="'+u+'" alt="" width="620" style="display:block;width:100%;max-width:620px;height:auto;border:0"></a>').join("")+
      '</td></tr></table></body></html>';
  }
  const body=String(meta.body||c.preheader||c.campaign_name||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>");
  const cta=String(c.primary_cta||"LEARN MORE");
  return '<!doctype html><html><body style="font-family:Arial,sans-serif;margin:0;padding:32px;background:#fff;color:#111">'+hidden+'<div style="max-width:620px;margin:0 auto;font-size:16px;line-height:1.55">'+body+'<p style="margin-top:28px"><a href="'+dest+'" style="display:inline-block;padding:14px 20px;background:#111;color:#fff;text-decoration:none;font-weight:700">'+cta+'</a></p></div></body></html>';
}
async function collectRecipients(rt:any,c:any,maxRecipients:number){
  const meta=c.metadata||{},filter=meta.provider_filter||{};
  const existingRes=await db.from("communication_send_log").select("recipient").eq("brand_key",c.brand_key).eq("campaign_key",c.campaign_key).in("status",["queued","submitted","accepted","delivered"]);
  const existing=new Set((existingRes.data||[]).map((x:any)=>String(x.recipient||"").toLowerCase()).filter(Boolean));
  const suppressRes=await db.from("email_suppression").select("email_norm,scope,brand_key").or("scope.eq.global,and(scope.eq.brand,brand_key.eq."+c.brand_key+")");
  const suppressed=new Set((suppressRes.data||[]).map((x:any)=>String(x.email_norm||"").toLowerCase()).filter(Boolean));
  const out:any[]=[]; let startAfterId="",startAfter="",pages=0;
  while(out.length<maxRecipients && pages<30){
    let path="/contacts/?locationId="+encodeURIComponent(rt.locationId)+"&limit=100";
    if(startAfterId)path+="&startAfterId="+encodeURIComponent(startAfterId);
    if(startAfter)path+="&startAfter="+encodeURIComponent(startAfter);
    const r=await ghl(rt.token,path,"GET",undefined,"2021-07-28");
    if(!r.ok) throw new Error("contact_list_failed_"+r.status);
    const rows=Array.isArray(r.body?.contacts)?r.body.contacts:[];
    if(!rows.length)break;
    for(const x of rows){
      const email=String(x?.email||"").trim().toLowerCase();
      if(!email||existing.has(email)||suppressed.has(email))continue;
      if(x?.dnd===true)continue;
      if(String(x?.dndSettings?.email?.status||"").toLowerCase()==="active")continue;
      if(filter?.field==="city"&&filter?.operator==="eq"&&String(x?.city||"").trim().toLowerCase()!==String(filter?.value||"").trim().toLowerCase())continue;
      if(!x?.id)continue;
      out.push({id:String(x.id),email});
      if(out.length>=maxRecipients)break;
    }
    const metaR=r.body?.meta||{};
    const last=rows[rows.length-1]||{};
    const nextId=String(metaR?.startAfterId||metaR?.nextStartAfterId||last?.id||"");
    const next=String(metaR?.startAfter||metaR?.nextStartAfter||"");
    if(!nextId||nextId===startAfterId)break;
    startAfterId=nextId; startAfter=next; pages++;
  }
  return {recipients:out,pages};
}
const encoder=new TextEncoder();
async function hmacHex(v:string){const k=await crypto.subtle.importKey("raw",encoder.encode(SK),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("HMAC",k,encoder.encode(v));return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,"0")).join("")}
function b64url(v:string){return btoa(v).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
async function unsubscribeUrl(brand:string,email:string){const p=b64url(JSON.stringify({b:brand,e:email}));const s=await hmacHex(p);return SU+"/functions/v1/email-unsubscribe-v1?p="+encodeURIComponent(p)+"&s="+encodeURIComponent(s)}
async function conversationHtml(c:any,email:string){
  const base=campaignHtml(c);
  const u=await unsubscribeUrl(String(c.brand_key),email);
  return base.replace("</body></html>",`<div style="max-width:620px;margin:24px auto 0;padding:16px 12px;font:12px/1.4 Arial,sans-serif;color:#777;text-align:center">You are receiving this email from ${String(c.brand_key).replace(/-/g," ")}. <a href="${u}" style="color:#555;text-decoration:underline">Unsubscribe</a></div></body></html>`);
}
async function pool<T,R>(items:T[],limit:number,fn:(x:T)=>Promise<R>){const out:R[]=[];let idx=0;async function worker(){while(true){const i=idx++;if(i>=items.length)return;out[i]=await fn(items[i])}}await Promise.all(Array.from({length:Math.min(limit,items.length)},()=>worker()));return out}
async function dispatchConversationChunk(c:any,rt:any,profile:any,route:any,cap:number,dryRun=false){
  const {count:acceptedCount}=await db.from("communication_send_log").select("id",{count:"exact",head:true}).eq("brand_key",c.brand_key).eq("campaign_key",c.campaign_key).eq("provider","highlevel_conversation").in("status",["accepted","delivered"]);
  const already=Number(acceptedCount||0);
  const remaining=Math.max(0,cap-already);
  if(remaining<=0)return {ok:true,entity_key:c.brand_key,campaign_id:c.id,execution_mode:"conversation_email",accepted_recipients:already,target_cap:cap,status:"submitted_complete"};
  const chunk=Math.min(100,remaining);
  const aud=await collectRecipients(rt,c,chunk);
  if(!aud.recipients.length)return {ok:false,error:"no_eligible_recipients",accepted_recipients:already,target_cap:cap,pages:aud.pages};
  if(dryRun)return {ok:true,dry_run:true,entity_key:c.brand_key,campaign_id:c.id,execution_mode:"conversation_email",eligible_recipients:aud.recipients.length,already_accepted:already,target_cap:cap,chunk_size:chunk,pages:aud.pages,from:profile.from_address};
  const now=new Date().toISOString();
  const results=await pool(aud.recipients,8,async (x:any)=>{
    const html=await conversationHtml(c,x.email);
    const plain=String(c.preheader||c.campaign_name||"")+"\n\n"+String(c.destination_url||"");
    const r=await ghl(rt.token,"/conversations/messages","POST",{type:"Email",contactId:x.id,emailFrom:String(profile.from_address||""),emailTo:x.email,subject:String(c.subject||c.campaign_name||"").slice(0,500),html,message:plain,status:"pending"},"v3");
    const mid=String(r.body?.messageId||r.body?.id||r.body?.message?.id||"");
    await db.from("communication_send_log").insert({channel:"email",brand_key:c.brand_key,stream:"marketing",sender_profile_id:profile.id,provider:"highlevel_conversation",provider_message_id:mid||null,recipient:x.email,status:r.ok&&mid?"accepted":"failed",subject:c.subject,body_preview:String(c.preheader||c.campaign_name||"").slice(0,240),campaign_key:c.campaign_key,error_message:r.ok?null:safe(r.body?.message||r.body?.error||"provider_message_id_missing"),metadata:{ghl_contact_id:x.id,http_status:r.status,execution_mode:"conversation_email",unsubscribe_link_signed:true},submitted_at:now,updated_at:now});
    return {ok:r.ok&&Boolean(mid),http:r.status,message_id:mid||null};
  });
  const okCount=results.filter((x:any)=>x.ok).length,failCount=results.length-okCount,newTotal=already+okCount;
  const done=newTotal>=cap;
  const oldMeta=c.metadata||{};
  await db.from("marketing_native_campaigns").update({status:done?"submitted_complete":"sending",metadata:{...oldMeta,dispatch_mode:"highlevel_conversation",conversation_target_cap:cap,conversation_accepted_count:newTotal,conversation_last_chunk_accepted:okCount,conversation_last_chunk_failed:failCount,conversation_last_dispatch_at:now,unsubscribe_control:"signed_brand_suppression_link"},updated_at:now}).eq("id",c.id);
  if(okCount>0)await db.from("communication_sender_profiles").update({last_send_at:now,updated_at:now}).eq("id",profile.id);
  return {ok:failCount===0,entity_key:c.brand_key,campaign_id:c.id,execution_mode:"conversation_email",chunk_accepted:okCount,chunk_failed:failCount,accepted_recipients:newTotal,target_cap:cap,status:done?"submitted_complete":"sending"};
}
async function dispatchCampaign(campaignId:string,maxOverride?:number,dryRun=false){
  const {data:c,error}=await db.from("marketing_native_campaigns").select("*").eq("id",campaignId).maybeSingle();
  if(error||!c) return {ok:false,error:"campaign_not_found"};
  const entityKey=String(c.brand_key||"");
  if(!FOCUS.includes(entityKey))return {ok:false,error:"entity_not_in_focus_scope"};
  const meta:any=c.metadata||{};
  if(meta.paused_for_20260929_newsletter_refresh===true||meta.paused===true)return {ok:false,error:"campaign_paused",pause_reason:String(meta.pause_reason||"")};
  const authorized=meta.launch_authorized===true||c.status==="ready_for_native_execution"||c.status==="sending";
  if(!authorized)return {ok:false,error:"campaign_not_launch_authorized",status:c.status};
  const audienceReady=meta.audience_ready===true||c.status==="ready_for_native_execution"||c.status==="sending";
  if(!audienceReady)return {ok:false,error:"campaign_audience_not_verified",status:c.status};
  if(c.provider!=="enterprise_email")return {ok:false,error:"provider_not_highlevel_email",provider:c.provider};
  const rt=await runtime(entityKey);
  const {data:profile}=await db.from("communication_sender_profiles").select("*").eq("brand_key",entityKey).eq("channel","email").eq("stream","marketing").maybeSingle();
  const {data:route}=await db.from("enterprise_entity_sender_routes").select("*").eq("entity_key",entityKey).eq("channel","email").eq("stream","marketing").maybeSingle();
  if(!profile||profile.provider!=="highlevel_gateway"||!profile.verified||!profile.sending_enabled||profile.connection_status!=="connected")return {ok:false,error:"sender_profile_not_ready"};
  if(route?.route_status!=="ready")return {ok:false,error:"sender_route_not_ready",route_status:route?.route_status};
  const cap=Math.min(1000,Math.max(1,Number(maxOverride||meta.initial_send_cap||profile.daily_cap||route.daily_cap||1000)));
  const mode=String(route?.evidence?.email_execution_mode||profile?.metadata?.email_execution_mode||"");
  if(mode==="conversation_email") return await dispatchConversationChunk(c,rt,profile,route,cap,dryRun);
  if(mode!=="native_campaign")return {ok:false,error:"no_verified_email_execution_mode"};
  const user=await getUser(rt); if(!user.ok||!user.user)return {ok:false,error:"highlevel_user_not_resolved"};
  const aud=await collectRecipients(rt,c,cap);
  if(!aud.recipients.length)return {ok:false,error:"no_eligible_recipients",pages:aud.pages};
  const html=campaignHtml(c);
  if(dryRun)return {ok:true,dry_run:true,entity_key:entityKey,campaign_id:campaignId,eligible_recipients:aud.recipients.length,pages:aud.pages,cap,from:profile.from_address,execution_mode:"native_campaign"};
  const lock=await db.from("marketing_native_campaigns").update({status:"dispatching",updated_at:new Date().toISOString(),metadata:{...meta,dispatch_started_at:new Date().toISOString(),dispatch_target_count:aud.recipients.length}}).eq("id",campaignId).eq("status",c.status).select("id").maybeSingle();
  if(!lock.data)return {ok:false,error:"campaign_already_claimed_or_status_changed"};
  const create=await ghl(rt.token,"/emails/locations/"+encodeURIComponent(rt.locationId)+"/campaigns/emails","POST",{
    name:String(c.campaign_name||c.campaign_key).slice(0,180),editorType:"html",editorContent:html,timeZone:"America/New_York",userId:user.user.id,userName:user.user.name
  },"v3");
  if(!create.ok||!create.body?.id){
    await db.from("marketing_native_campaigns").update({status:"dispatch_failed",metadata:{...meta,dispatch_error:"native_campaign_create_failed",dispatch_http:create.status,dispatch_detail:safe(create.body?.message||create.body?.error||JSON.stringify(create.body))},updated_at:new Date().toISOString()}).eq("id",campaignId);
    return {ok:false,error:"native_campaign_create_failed",http:create.status,detail:safe(create.body?.message||create.body?.error||JSON.stringify(create.body))};
  }
  const nativeId=String(create.body.id);
  const now=new Date();
  const parts=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:true}).formatToParts(now).filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
  const sendAt=`${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} ${parts.dayPeriod}`;
  const schedule=await ghl(rt.token,"/emails/locations/"+encodeURIComponent(rt.locationId)+"/campaigns/emails/"+encodeURIComponent(nativeId)+"/schedule","POST",{
    scheduleType:"batch",timeZone:"America/New_York",userId:user.user.id,userName:user.user.name,
    emailMeta:{subject:String(c.subject||c.campaign_name||"").slice(0,500),fromName:String(profile.from_name||c.campaign_name||"").slice(0,180),fromEmail:String(profile.from_address||meta.sender_from||""),replyToAddress:String(profile.reply_to||profile.from_address||""),previewText:String(c.preheader||"").slice(0,500)},
    recipients:{type:"contact",contactIds:aud.recipients.map((x:any)=>x.id),freezeList:true},
    sendDays:ALL_DAYS,
    scheduleConfig:{sendAt,batch:{batchSize:100,interval:5,intervalUnit:"minutes",skipDays:[]}}
  },"v3");
  if(!schedule.ok){
    await db.from("marketing_native_campaigns").update({status:"dispatch_failed",native_campaign_id:nativeId,metadata:{...meta,dispatch_error:"native_campaign_schedule_failed",dispatch_http:schedule.status,dispatch_detail:safe(schedule.body?.message||schedule.body?.error||JSON.stringify(schedule.body))},updated_at:new Date().toISOString()}).eq("id",campaignId);
    return {ok:false,error:"native_campaign_schedule_failed",native_campaign_id:nativeId,http:schedule.status,detail:safe(schedule.body?.message||schedule.body?.error||JSON.stringify(schedule.body))};
  }
  const sourceId=String(schedule.body?.sourceId||""),traceId=String(schedule.body?.traceId||""),submittedAt=new Date().toISOString();
  const rows=aud.recipients.map((x:any)=>({channel:"email",brand_key:entityKey,stream:"marketing",sender_profile_id:profile.id,provider:"highlevel_native_campaign",provider_message_id:nativeId,recipient:x.email,status:"submitted",subject:c.subject,body_preview:String(c.preheader||c.campaign_name||"").slice(0,240),campaign_key:c.campaign_key,error_message:null,metadata:{native_campaign_id:nativeId,source_id:sourceId,trace_id:traceId,ghl_contact_id:x.id,dispatch_mode:"native_batch",batch_size:100,interval_minutes:5},submitted_at:submittedAt,updated_at:submittedAt}));
  for(let i=0;i<rows.length;i+=200)await db.from("communication_send_log").insert(rows.slice(i,i+200));
  await db.from("communication_sender_profiles").update({last_send_at:submittedAt,updated_at:submittedAt}).eq("id",profile.id);
  await db.from("marketing_native_campaigns").update({status:"scheduled",native_campaign_id:nativeId,metadata:{...meta,native_source_id:sourceId,native_trace_id:traceId,dispatch_target_count:aud.recipients.length,dispatch_scheduled_at:submittedAt,dispatch_mode:"highlevel_native_batch",batch_size:100,interval_minutes:5},updated_at:submittedAt}).eq("id",campaignId);
  return {ok:true,entity_key:entityKey,campaign_id:campaignId,native_campaign_id:nativeId,source_id:sourceId,trace_id:traceId,submitted_recipients:aud.recipients.length,status:"scheduled",execution_mode:"native_campaign"};
}
async function reconcileCampaign(c:any){
  const sourceId=String(c.metadata?.native_source_id||"");
  if(!c.native_campaign_id||!sourceId)return {ok:false,error:"native_ids_missing"};
  const rt=await runtime(String(c.brand_key));
  const get=await ghl(rt.token,"/emails/locations/"+encodeURIComponent(rt.locationId)+"/campaigns/emails/"+encodeURIComponent(String(c.native_campaign_id)),"GET",undefined,"v3");
  const stats=await ghl(rt.token,"/emails/locations/"+encodeURIComponent(rt.locationId)+"/campaigns/stats/email/"+encodeURIComponent(sourceId),"GET",undefined,"v3");
  const nativeStatus=String(get.body?.status||get.body?.campaign?.status||"");
  const complete=["sent","complete","completed"].includes(nativeStatus.toLowerCase());
  const now=new Date().toISOString();
  const meta={...(c.metadata||{}),native_status:nativeStatus,native_status_http:get.status,native_stats_http:stats.status,native_stats:stats.ok?stats.body:undefined,last_native_reconcile_at:now};
  await db.from("marketing_native_campaigns").update({status:complete?"sent":(nativeStatus||c.status),metadata:meta,updated_at:now}).eq("id",c.id);
  if(complete) await db.from("communication_send_log").update({status:"accepted",updated_at:now}).eq("brand_key",c.brand_key).eq("campaign_key",c.campaign_key).eq("provider_message_id",c.native_campaign_id).eq("status","submitted");
  return {ok:get.ok,entity_key:c.brand_key,campaign_id:c.id,native_campaign_id:c.native_campaign_id,native_status:nativeStatus,stats_http:stats.status};
}
async function reconcileAll(){
  const {data}=await db.from("marketing_native_campaigns").select("*").in("status",["scheduled","processing","sending"]).not("native_campaign_id","is",null).limit(50);
  const out=[]; for(const c of data||[])out.push(await reconcileCampaign(c)); return out;
}

async function qaSend(entityKey:string,recipient:string){
  const allowedRecipients=new Set(["thedoctordorsey@gmail.com","dolodorsey@gmail.com"]);
  const email=String(recipient||"thedoctordorsey@gmail.com").trim().toLowerCase();
  if(!allowedRecipients.has(email))return {ok:false,error:"qa_recipient_not_allowlisted"};
  if(!FOCUS.includes(entityKey))return {ok:false,error:"entity_not_in_focus_scope"};
  const rt=await runtime(entityKey);
  const {data:profile}=await db.from("communication_sender_profiles").select("*").eq("brand_key",entityKey).eq("channel","email").eq("stream","marketing").maybeSingle();
  const {data:route}=await db.from("enterprise_entity_sender_routes").select("*").eq("entity_key",entityKey).eq("channel","email").eq("stream","marketing").maybeSingle();
  if(!profile?.verified||!profile?.from_address)return {ok:false,error:"sender_profile_not_qa_ready"};
  if(route?.route_status==="blocked")return {ok:false,error:"sender_route_blocked",route_status:route?.route_status};
  const up=await ghl(rt.token,"/contacts/upsert","POST",{locationId:rt.locationId,firstName:"Dr.",lastName:"Dorsey",email,source:"KHG internal email QA",tags:["khg-internal-qa"],createNewIfDuplicateAllowed:false},"2021-07-28");
  const contactId=String(up.body?.contact?.id||up.body?.id||"");
  if(!up.ok||!contactId)return {ok:false,error:"qa_contact_upsert_failed",http:up.status,detail:safe(up.body?.message||up.body?.error||JSON.stringify(up.body))};
  const label=entityKey.toUpperCase();
  const stamp=new Date().toISOString().replace(/\.\d{3}Z$/,"Z");
  const subject="[INTERNAL PLACEMENT QA] "+label+" — "+stamp;
  const body="Internal placement certification for "+label+". This message verifies the exact-brand HighLevel sender identity, provider receipt, and Gmail placement after sender alignment.";
  const html="<div style=\"font-family:Arial,sans-serif;max-width:620px;margin:40px auto\"><h2>"+label+" Email QA</h2><p>"+body+"</p><p><strong>Internal QA only.</strong></p></div>";
  const sent=await ghl(rt.token,"/conversations/messages","POST",{type:"Email",contactId,emailFrom:String(profile.from_address),emailTo:email,subject,html,message:body,status:"pending"},"v3");
  const messageId=String(sent.body?.messageId||sent.body?.id||sent.body?.message?.id||"");
  const now=new Date().toISOString();
  await db.from("communication_send_log").insert({channel:"email",brand_key:entityKey,stream:"marketing",sender_profile_id:profile.id,provider:"highlevel_conversation",provider_message_id:messageId||null,recipient:email,status:sent.ok&&messageId?"accepted":"failed",subject,body_preview:body.slice(0,240),campaign_key:"internal-qa:email-runtime:20260930",error_message:sent.ok?null:safe(sent.body?.message||sent.body?.error||"provider_message_id_missing"),metadata:{test:true,is_test:true,internal_qa:true,http_status:sent.status,ghl_contact_id:contactId,exact_brand_sender:true},submitted_at:now,updated_at:now});
  return {ok:sent.ok&&Boolean(messageId),entity_key:entityKey,recipient:email,from_address:profile.from_address,http_status:sent.status,provider_message_id:messageId||null,error:sent.ok?null:safe(sent.body?.message||sent.body?.error||"provider_message_id_missing")};
}

Deno.serve(async(req)=>{
  if(req.method==="GET")return json({ok:true,system:"KHG HighLevel Native Email Campaign Runtime",version:"1",focus:FOCUS,secrets_returned:false});
  if(req.method!=="POST")return json({ok:false,error:"method_not_allowed"},405);
  const body:any=await req.json().catch(()=>({}));
  const allowed=await consumeNonce(String(body?.nonce||""));
  if(!allowed)return json({ok:false,error:"unauthorized_or_nonce_expired"},401);
  const action=String(body?.action||"probe_all");
  try{
    if(action==="repair_fenyx")return json(await repairFenyx());
    if(action==="probe"){
      const entity=String(body?.entity_key||""); if(!entity)return json({ok:false,error:"entity_key_required"},400);
      const r=await probeEntity(entity); return json(r,r.ready?200:207);
    }
    if(action==="probe_all"){
      const results=[]; for(const e of FOCUS)results.push(await probeEntity(e));
      await db.from("crm_legacy_ghl_runtime_call_log").insert({runtime_slug:"ghl-email-campaign-runtime-v1",action:"probe_all",disposition:"observed",request_metadata:{results,secrets_returned:false},occurred_at:new Date().toISOString()});
      return json({ok:true,results,secrets_returned:false});
    }
    if(action==="qa_send"){
      const entity=String(body?.entity_key||""); if(!entity)return json({ok:false,error:"entity_key_required"},400);
      const r=await qaSend(entity,String(body?.recipient||"thedoctordorsey@gmail.com")); return json(r,r.ok?200:409);
    }
    if(action==="dry_run"){
      const id=String(body?.campaign_id||""); if(!id)return json({ok:false,error:"campaign_id_required"},400);
      return json(await dispatchCampaign(id,Number(body?.max_recipients||0)||undefined,true));
    }
    if(action==="dispatch"){
      const id=String(body?.campaign_id||""); if(!id)return json({ok:false,error:"campaign_id_required"},400);
      const r=await dispatchCampaign(id,Number(body?.max_recipients||0)||undefined,false); return json(r,r.ok?200:409);
    }
    if(action==="reconcile"){
      const id=String(body?.campaign_id||""); if(!id)return json({ok:false,error:"campaign_id_required"},400);
      const {data:c}=await db.from("marketing_native_campaigns").select("*").eq("id",id).maybeSingle(); if(!c)return json({ok:false,error:"campaign_not_found"},404);
      return json(await reconcileCampaign(c));
    }
    if(action==="dispatch_ready"){
      const {data:cands}=await db.from("marketing_native_campaigns").select("*")
        .eq("provider","enterprise_email")
        .in("status",["ready_for_native_execution","authorized_pending_audience","draft","sending"])
        .limit(25);
      const results:any[]=[];
      for(const c of cands||[]){
        const m:any=c.metadata||{};
        if(m.paused_for_20260929_newsletter_refresh===true||m.paused===true)continue;
        if(!(m.launch_authorized===true||c.status==="ready_for_native_execution"))continue;
        if(c.status!=="ready_for_native_execution" && m.audience_ready!==true)continue;
        results.push(await dispatchCampaign(String(c.id),undefined,false));
      }
      return json({ok:true,results});
    }
    if(action==="reconcile_all")return json({ok:true,results:await reconcileAll()});
    return json({ok:false,error:"unknown_action"},400);
  }catch(e){return json({ok:false,error:safe(e instanceof Error?e.message:e)},500)}
});