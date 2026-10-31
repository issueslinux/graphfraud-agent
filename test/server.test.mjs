import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {makeServer} from '../src/server.mjs';
const fixture={transactions:[{id:'T1',from:'alice',to:'bob',currency:'USD',amount_minor:100,
  timestamp:'2026-10-31T12:00:00Z'}]};
test('HTTP evidence service: health, valid batch, unsupported type, malformed request',async()=>{
  const s=makeServer();
  s.listen(0,'127.0.0.1');await once(s,'listening');
  try {
    const url='http://127.0.0.1:'+s.address().port;
    let r=await fetch(url+'/health');assert.equal(r.status,200);
    r=await fetch(url+'/assess',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(fixture)});
    assert.equal(r.status,200);assert.equal((await r.json()).transactions_processed,1);
    r=await fetch(url+'/assess',{method:'POST',headers:{'Content-Type':'text/plain'},body:'test'});
    assert.equal(r.status,415);
    r=await fetch(url+'/assess',{method:'POST',headers:{'Content-Type':'application/json'},body:'not-json'});
    assert.equal(r.status,422);
    r=await fetch(url+'/not-real');assert.equal(r.status,404);
  } finally {s.close();await once(s,'close');}
});
