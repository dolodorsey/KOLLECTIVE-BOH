import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const TOKEN=Deno.env.get("GHL_PRIVATE_INTEGRATION_TOKEN")||Deno.env.get("GHL_PIT")||"";
const VERSION=Deno.env.get("GHL_API_VERSION")||"2021-07-28";
async function db(path:string,init:RequestInit={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{apikey:SERVICE,authorization:`Bearer ${SERVICE}`,"content-type":"application/json",...(init.headers||{})}});const t=await r.text();let b:any=null;try{b=t?JSON.parse(t):null}catch{b={raw:t}}if(!r.ok)throw new Error(`db_${r.status}:${b?.message||t}`);return b}
async function ghl(path:string,init:RequestInit={}){if(!TOKEN)throw Object.assign(new Error("agency_credential_missing"),{status:503});const r=await fetch(`https://services.leadconnectorhq.com${path}`,{...init,headers:{Authorization:`Bearer ${TOKEN}`,Version:VERSION,"content-type":"application/json",Accept:"application/json",...(init.headers||{})}});const t=await r.text();let b:any={};try{b=t?JSON.parse(t):{}}catch{b={raw:t}}if(!r.ok)throw Object.assign(new Error(`ghl_${r.status}:${b?.message||t}`),{status:r.status,body:b});return b}
async function findLocation(name:string){const b=await ghl(`/locations/search?limit=100&skip=0`);const arr=b?.locations||b?.data||[];return arr.find((x:any)=>String(x.name||"").toLowerCase()===name.toLowerCase())||null}
async function createInnerCircle(){const map=(await db(`ghl_entity_mappings?entity_key=eq.the-inner-circle-llc&select=*&limit=1`))?.[0];if(!map)throw new Error("inner_circle_mapping_missing");if(map.ghl_location_id)return {existing:true,location_id:map.ghl_location_id};let loc=await findLocation("The Inner Circle LLC");if(!loc){const payload={name:"The Inner Circle LLC",address:"649 11th Street NW",city:"Atlanta",state:"GA",country:"US",postalCode:"30318",timezone:"America/New_York"};loc=await ghl(`/locations/`,{method:"POST",body:JSON.stringify(payload)});loc=loc?.location||loc}
const id=loc?.id;if(!id)throw new Error("location_id_missing_after_create");
await db(`ghl_entity_mappings?entity_key=eq.the-inner-circle-llc`,{method:"PATCH",body:JSON.stringify({ghl_location_id:id,ghl_location_name:"The Inner Circle LLC",mapping_status:"verified",create_status:"created",sync_status:"ready",location_created_at:new Date().toISOString(),last_synced_at:new Date().toISOString(),last_error:null})});
await db(`integration_entity_bindings?provider=eq.highlevel&brand_key=eq.the-inner-circle-llc`,{method:"PATCH",body:JSON.stringify({external_container_id:id,external_name:"The Inner Circle LLC",binding_status:"ready",last_verified_at:new Date().toISOString(),last_success_at:new Date().toISOString(),last_error:null})});
await db(`ghl_a2p_registrations?brand_key=eq.the-inner-circle-llc`,{method:"PATCH",body:JSON.stringify({ghl_location_id:id,brand_status:"blocked",campaign_status:"blocked",number_status:"blocked",updated_at:new Date().toISOString()})});
return {existing:false,location_id:id}}
async function revalidateAll(){const maps=await db(`ghl_entity_mappings?select=id,entity_key,ghl_location_id,expected_location_name`);const results=[];for(const m of maps){if(!m.ghl_location_id){results.push({entity_key:m.entity_key,status:"missing_location"});continue}try{const loc=await ghl(`/locations/${encodeURIComponent(m.ghl_location_id)}`);await db(`integration_entity_bindings?provider=eq.highlevel&brand_key=eq.${encodeURIComponent(m.entity_key)}`,{method:"PATCH",body:JSON.stringify({external_container_id:m.ghl_location_id,external_name:loc?.location?.name||m.expected_location_name,binding_status:"ready",last_verified_at:new Date().toISOString(),last_success_at:new Date().toISOString(),last_error:null})});results.push({entity_key:m.entity_key,status:"ready"})}catch(e){results.push({entity_key:m.entity_key,status:"error",error:String((e as Error).message).slice(0,180)})}}return results}
async function ensureBodegaFestivalTour(){
  const map=(await db(`ghl_entity_mappings?entity_key=eq.bodega&select=*&limit=1`))?.[0];
  if(!map)throw new Error("bodega_mapping_missing");
  let locationId=map.ghl_location_id||null;
  let locationName=map.ghl_location_name||"BODEGA";
  if(!locationId){
    let loc=await findLocation("BODEGA");
    if(!loc){
      const payload={name:"BODEGA",address:"649 11th Street NW",city:"Atlanta",state:"GA",country:"US",postalCode:"30318",timezone:"America/New_York"};
      const created=await ghl(`/locations/`,{method:"POST",body:JSON.stringify(payload)});
      loc=created?.location||created;
    }
    locationId=loc?.id||null;
    locationName=loc?.name||"BODEGA";
    if(!locationId)throw new Error("bodega_location_id_missing_after_create");
    await db(`ghl_entity_mappings?entity_key=eq.bodega`,{method:"PATCH",body:JSON.stringify({ghl_location_id:locationId,ghl_location_name:locationName,mapping_status:"verified",create_status:"created",sync_status:"ready",location_created_at:new Date().toISOString(),last_synced_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()})});
  }
  const calendars=await ghl(`/calendars/?locationId=${encodeURIComponent(locationId)}`);
  const list=calendars?.calendars||calendars?.data||[];
  let cal=list.find((x:any)=>String(x.name||"").toLowerCase()==="festival tour schedule")||null;
  if(!cal){
    const payload={isActive:true,locationId,name:"Festival Tour Schedule",description:"BODEGA festival tour stops, load-ins, travel, activation/service windows and strike schedule.",slug:"bodega-festival-tour",widgetSlug:"bodega-festival-tour",calendarType:"event",widgetType:"default",eventTitle:"{{contact.name}} — Festival Tour",eventColor:"#FFB878",slotDuration:60,slotDurationUnit:"mins",slotInterval:60,slotIntervalUnit:"mins",appointmentPerSlot:1,appointmentPerDay:50,allowReschedule:true,allowCancellation:true};
    const created=await ghl(`/calendars/`,{method:"POST",body:JSON.stringify(payload)});
    cal=created?.calendar||created;
  }
  const calendarId=cal?.id||null;
  if(!calendarId)throw new Error("festival_calendar_id_missing_after_create");
  const now=new Date().toISOString();
  const binding=[{entity_key:"bodega",location_id:locationId,location_name:locationName,calendar_id:calendarId,calendar_name:"Festival Tour Schedule",binding_status:"verified_existing_or_created"}];
  await db(`calendar_streams?stream_key=eq.festival_tour_schedule`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({metadata:{parent_stream:"upcoming_bookings",booking_type:"festival_tour",desired_color_hex:"#FFB878",platform:"highlevel",brand_isolation_required:true,live_ghl_bindings:binding,last_live_sync_at:now},updated_at:now})});
  await db(`calendar_streams?stream_key=eq.bodega_festival_tour`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({metadata:{parent_stream:"upcoming_bookings",booking_type:"festival_tour",desired_color_hex:"#FFB878",platform:"highlevel",entity_locked:"bodega",brand_isolation_required:true,live_ghl_bindings:binding,last_live_sync_at:now},updated_at:now})});
  await db(`direct_integration_registry?integration_key=eq.ghl-direct`,{method:"PATCH",body:JSON.stringify({status:"connected",last_verified_at:now,last_success_at:now,last_error:null,updated_at:now})});
  return {location_id:locationId,location_name:locationName,calendar_id:calendarId,calendar_name:"Festival Tour Schedule"};
}
Deno.serve(async(req)=>{if(req.method!=="POST")return json({error:"method_not_allowed"},405);try{const body=await req.json().catch(()=>({}));const action=String(body.action||"health");if(action==="health")return json({ok:true,credential_present:Boolean(TOKEN),credential_scope:"all_highlevel_subaccounts",mode:"agency_shared",actions:["health","create_inner_circle","revalidate_all","bootstrap_bodega_festival_tour"]});if(action==="create_inner_circle")return json({ok:true,result:await createInnerCircle()});if(action==="revalidate_all")return json({ok:true,results:await revalidateAll()});if(action==="bootstrap_bodega_festival_tour")return json({ok:true,result:await ensureBodegaFestivalTour()});return json({error:"unknown_action"},400)}catch(e:any){return json({ok:false,error:String(e?.message||e),details:e?.body||null},Number(e?.status||500))}});
