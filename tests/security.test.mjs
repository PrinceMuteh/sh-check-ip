import test from 'node:test';
import assert from 'node:assert/strict';
import { publicAddress, targetURL, authorize } from '../lib/security.mjs';
test('rejects private, loopback, link-local and mapped private addresses',()=>{
  for(const ip of ['127.0.0.1','10.0.0.1','192.168.1.1','169.254.169.254','::1','fc00::1','::ffff:127.0.0.1','0.0.0.0']) assert.equal(publicAddress(ip),false,ip);
  assert.equal(publicAddress('8.8.8.8'),true);
});
test('requires exact allowed host and refuses embedded credentials',()=>{
  process.env.ALLOWED_HOSTS='api.example.com';
  assert.equal(targetURL('https://api.example.com/test').hostname,'api.example.com');
  assert.throws(()=>targetURL('https://api.example.com.attacker.com'));
  assert.throws(()=>targetURL('https://user:pass@api.example.com'));
  assert.throws(()=>targetURL('file:///etc/passwd'));
  delete process.env.ALLOWED_HOSTS;
});
test('enforces configured password and supports production without environment settings',()=>{
  process.env.TOOL_PASSWORD='test-secret';
  assert.throws(()=>authorize(new Request('https://example.com')));
  authorize(new Request('https://example.com',{headers:{'x-tool-password':'test-secret'}}));
  delete process.env.TOOL_PASSWORD;
  const previous=process.env.NODE_ENV; process.env.NODE_ENV='production';
  assert.doesNotThrow(()=>authorize(new Request('https://example.com')));
  assert.equal(targetURL('https://example.com').hostname, 'example.com');
  if(previous) process.env.NODE_ENV=previous; else delete process.env.NODE_ENV;
});
