import http from 'node:http';
import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { publicAddress } from './security.mjs';
export async function send(url, { method = 'GET', headers = {}, body = '' } = {}) {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(hostname) ? [{address:hostname,family:isIP(hostname)}] : await lookup(hostname,{all:true});
  if (!addresses.length || addresses.some(a=>!publicAddress(a.address))) throw new Error('Only public internet addresses can be tested.');
  const pinned = addresses[0];
  return new Promise((resolve,reject)=> {
    const req = (url.protocol === 'https:' ? https : http).request(url, {method, headers, lookup: (_host, options, cb) => options.all ? cb(null,[pinned]) : cb(null,pinned.address,pinned.family)}, res=> {
      const chunks=[]; let size=0;
      res.on('data',chunk=>{size+=chunk.length; if(size>1024*1024) { res.destroy(); reject(new Error('Response exceeds the 1 MB limit.')); } else chunks.push(chunk);});
      res.on('error',reject);
      res.on('end',()=>resolve({status:res.statusCode,statusText:res.statusMessage,headers:res.headers,body:Buffer.concat(chunks).toString('utf8')}));
    });
    const timer=setTimeout(()=>req.destroy(new Error('Request timed out after 20 seconds.')),20000);
    req.on('close',()=>clearTimeout(timer)); req.on('error',reject);
    if(body) req.write(body); req.end();
  });
}
