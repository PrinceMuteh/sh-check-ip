import { authorize } from '../../../lib/security.mjs';
import { send } from '../../../lib/transport.mjs';
export const runtime = 'nodejs';
export async function POST(request) {
  try {
    authorize(request);
    const response=await send(new URL('https://api.ipify.org?format=json'));
    if(response.status!==200) throw new Error('IP lookup service is unavailable.');
    const serverIp=JSON.parse(response.body).ip;
    const visitorIp=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'Unavailable locally';
    return Response.json({serverIp,visitorIp,checkedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return Response.json({error:error.message},{status:400,headers:{'Cache-Control':'no-store'}}); }
}
