import { authorize, targetURL } from '../../../lib/security.mjs';
import { send } from '../../../lib/transport.mjs';
export const runtime = 'nodejs';
export async function POST(request) {
  try {
    authorize(request);
    const raw = await request.text();
    if(raw.length>65536) throw new Error('Request input exceeds 64 KB.');
    const input=JSON.parse(raw), url=targetURL(input.url);
    const method=input.method || 'GET';
    if(!['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'].includes(method)) throw new Error('Unsupported method.');
    const token=String(input.token||'').trim();
    const authorization=input.authMode==='bearer' ? (token ? `Bearer ${token.replace(/^Bearer\s+/i,'')}` : '') : token;
    if(/[\r\n]/.test(authorization)) throw new Error('Authorization must be a single line.');
    const headers={Accept:'application/json'};
    if(authorization) headers.Authorization=authorization;
    const body=['GET','HEAD'].includes(method) ? '' : String(input.body||'');
    if(body) headers['Content-Type']='application/json';
    const started=Date.now();
    const response=await send(url,{method,headers,body});
    return Response.json({request:{url:url.href,method,headers:{...headers,...(authorization?{Authorization:'[redacted]'}:{})},body},response,durationMs:Date.now()-started},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return Response.json({error:error.message},{status:400,headers:{'Cache-Control':'no-store'}}); }
}
