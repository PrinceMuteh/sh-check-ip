import ipaddr from 'ipaddr.js';
import { timingSafeEqual } from 'node:crypto';
export function publicAddress(address) {
  try { let ip = ipaddr.parse(address); if (ip.kind() === 'ipv6' && ip.isIPv4MappedAddress()) ip = ip.toIPv4Address(); return ip.range() === 'unicast'; } catch { return false; }
}
export function authorize(request) {
  const expected = process.env.TOOL_PASSWORD;
  if (!expected) { if (process.env.NODE_ENV === 'production') throw new Error('Set TOOL_PASSWORD on the server before using this tool.'); return; }
  const supplied = request.headers.get('x-tool-password') || '';
  const a = Buffer.from(supplied), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a,b)) throw new Error('Incorrect tool password.');
}
export function targetURL(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Use an HTTP(S) URL without embedded credentials.');
  const hosts = (process.env.ALLOWED_HOSTS || '').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if (process.env.NODE_ENV === 'production' && !hosts.length) throw new Error('Set ALLOWED_HOSTS on the server before sending requests.');
  if (hosts.length && !hosts.includes(url.hostname.toLowerCase())) throw new Error('This hostname is not in ALLOWED_HOSTS.');
  url.hash = ''; return url;
}
