import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.0";
const SU=Deno.env.get("SUPABASE_URL")||"", SK=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const db=createClient(SU,SK,{auth:{persistSession:false,autoRefreshToken:false}});
const enc=new TextEncoder();
const html=(s:string,status=200)=>new Response(s,{status,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}});
function b64urlDecode(v:string){const p=v.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-v.length%4)%4);return atob(p)}
async function hmac(v:string){const k=await crypto.subtle.importKey("raw",enc.encode(SK),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("HMAC",k,enc.encode(v));return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,"0")).join("")}
function eq(a:string,b:string){if(!a||!b||a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
Deno.serve(async req=>{
  if(req.method!=="GET")return html("<h1>Method not allowed</h1>",405);
  const u=new URL(req.url),p=u.searchParams.get("p")||"",s=u.searchParams.get("s")||"";
  if(!p||!s||!eq(await hmac(p),s))return html("<h1>Invalid unsubscribe link</h1><p>This link is invalid or has been altered.</p>",400);
  let data:any;try{data=JSON.parse(b64urlDecode(p))}catch{return html("<h1>Invalid unsubscribe link</h1>",400)}
  const brand=String(data?.b||"").trim().toLowerCase(),email=String(data?.e||"").trim().toLowerCase();
  if(!/^[a-z0-9][a-z0-9-]{1,90}$/.test(brand)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return html("<h1>Invalid unsubscribe link</h1>",400);
  const now=new Date().toISOString();
  const {data:existing}=await db.from("email_suppression").select("id").eq("email_norm",email).eq("brand_key",brand).eq("scope","brand").maybeSingle();
  if(existing?.id){
    await db.from("email_suppression").update({reason:"unsubscribe",detail:"Signed email unsubscribe link",suppressed_at:now}).eq("id",existing.id);
  }else{
    await db.from("email_suppression").insert({email,reason:"unsubscribe",brand_key:brand,scope:"brand",detail:"Signed email unsubscribe link",suppressed_at:now});
  }
  await db.from("email_consent").update({unsubscribed_at:now}).eq("brand_key",brand).eq("email_norm",email).is("unsubscribed_at",null);
  const label=brand.split("-").map((x:string)=>x?x[0].toUpperCase()+x.slice(1):x).join(" ");
  return html(`<!doctype html><html><body style="font-family:Arial,sans-serif;max-width:640px;margin:60px auto;padding:20px"><h1>Unsubscribed</h1><p>You will no longer receive marketing email from <strong>${label}</strong>.</p><p>This preference applies to this brand only.</p></body></html>`);
});