import "jsr:@supabase/functions-js/edge-runtime.d.ts";
Deno.serve(async(req)=>{
  if(req.method==="GET")return Response.json({ok:false,disabled:true,replacement:"Use authenticated brand asset/media ingestion runtime."},{status:410,headers:{"cache-control":"no-store"}});
  return Response.json({ok:false,disabled:true,error:"legacy_upload_endpoint_retired"},{status:410,headers:{"cache-control":"no-store"}});
});