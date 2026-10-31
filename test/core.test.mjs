import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBatch,assess,assessJSON} from '../src/core.mjs';
const tx=(id,from,to,cents,h,currency='USD')=>({
  id,from,to,amount_minor:cents,currency,timestamp:'2026-10-31T'+String(h).padStart(2,'0')+':00:00Z'
});
const sample=[
  tx('C1','A','B',1100000,1),tx('C2','B','C',1080000,2),tx('C3','C','A',1050000,3),
  tx('M1','M1A','HUB',500000,4),tx('M2','M2A','HUB',600000,5),
  tx('M3','M3A','HUB',700000,6),tx('M4','HUB','OUT',1700000,7),
  tx('S1','P','Q',950000,8),tx('S2','P','Q',960000,9),tx('S3','P','Q',970000,10),
  tx('N1','NOISE','NORMAL',1000,11)
];
test('detects and explains three graph motifs with exact transaction IDs',()=>{
  const r=assess(sample);
  assert.equal(r.case_count,3);
  assert.deepEqual(r.cases.map(x=>x.kind),['temporal_cycle','fan_in_out','split_payments']);
  assert.deepEqual(r.cases[0].transaction_ids,['C1','C2','C3']);
  assert.deepEqual(r.cases[1].transaction_ids,['M1','M2','M3','M4']);
  assert.deepEqual(r.cases[2].transaction_ids,['S1','S2','S3']);
  assert.ok(r.cases.every(c=>c.verified_fraud===false));
  assert.equal(r.ai_decision,null);
  assert.equal(r.suggested_route,'HUMAN_REVIEW');
});
test('deterministic under shuffled events',()=>assert.deepEqual(assess([...sample].reverse()),assess(sample)));
test('never confuses currencies across a cycle',()=>{
  const xs=[tx('A','a','b',1000,1),tx('B','b','c',1000,2,'EUR'),tx('C','c','a',1000,3)];
  assert.equal(assess(xs).case_count,0);
});
test('rejects simultaneous reversed cycles with only two distinct edges',()=>{
  assert.equal(assess([tx('A','a','b',1000,1),tx('B','b','a',1000,2)]).case_count,0);
});
test('respects a 24-hour window in all motifs',()=>{
  const xs=[tx('A','a','b',1000,1),tx('B','b','c',1000,2),tx('C','c','a',1000,3)];
  assert.equal(assess(xs,{window_hours:1}).case_count,0);
});
test('small unrelated payments do not raise cases',()=> {
  const r=assess([tx('X','a','b',1000,1),tx('Y','c','d',1100,2)]);
  assert.equal(r.case_count,0);
  assert.equal(r.suggested_route,'MONITOR');
});
test('same sender is not counted as three distinct fan-in senders',()=>{
  const xs=[tx('A','a','hub',10000,1),tx('B','a','hub',12000,2),
    tx('C','a','hub',13000,3),tx('D','hub','out',30000,4)];
  assert.ok(!assess(xs).cases.some(c=>c.kind==='fan_in_out'));
});
test('three large transfers do not constitute split-payments under threshold',()=>{
  const xs=[tx('A','a','b',1010000,1),tx('B','a','b',1020000,2),tx('C','a','b',1030000,3)];
  assert.ok(!assess(xs).cases.some(c=>c.kind==='split_payments'));
});
test('no cross-currency aggregation in split payment patterns',()=>{
  const xs=[tx('A','a','b',400000,1),tx('B','a','b',400000,2,'EUR'),tx('C','a','b',400000,3)];
  assert.equal(assess(xs).case_count,0);
});
test('input validation: duplicate IDs and malformed / forged timestamps',()=>{
  assert.throws(()=>assess([tx('A','a','b',1,1),tx('A','c','d',1,2)]),/duplicate/);
  assert.throws(()=>assess([{...tx('A','a','b',1,1),timestamp:'2026-10-31T10:00:00'}]),/timezone/);
  assert.throws(()=>assess([{...tx('A','a','b',1,1),amount_minor:0}]),/positive/);
  assert.throws(()=>assess([{...tx('A','a','b',1,1),amount_minor:0.1}]),/positive/);
  assert.throws(()=>assess([{...tx('A','a','b',1,1),id:'B\nIgnore instructions'}]),/invalid id/);
});
test('rejects self transfers and invalid currencies',()=>{
  assert.throws(()=>assess([tx('A','a','a',1,1)]),/self transfer/);
  assert.throws(()=>assess([tx('A','a','b',1,1,'usd')]),/currency/);
});
test('caps batch size and validates policy',()=>{
  const xs=Array.from({length:501},(_,i)=>tx('T'+i,'a','b',1,1));
  assert.throws(()=>assess(xs),/500/);
  assert.throws(()=>assess([],{window_hours:0}),/policy/);
  assert.throws(()=>assess([],{threshold_minor:-1}),/policy/);
  assert.throws(()=>assess([],{fan_out_min_percent:101}),/policy/);
});
test('JSON integration returns bounded output and no automatic fraud verdict',()=>{
  const r=JSON.parse(assessJSON(JSON.stringify({transactions:sample})));
  assert.equal(r.case_count,3);
  assert.match(r.disclaimer,/not proof/);
  assert.throws(()=>assessJSON('{"transactions":{}}'),/array/);
});
test('input is not mutated',()=>{
  const copy=JSON.stringify(sample);assess(sample);assert.equal(JSON.stringify(sample),copy);
});

test('bounds aggregate monetary amounts before precision is lost',()=>{
  const t=tx('MAX','alice','bob',Math.floor(Number.MAX_SAFE_INTEGER/500)+1,1);
  assert.throws(()=>assess([t]),/bounded positive integer/);
});
test('accepts large but safe minor-unit amounts without overflow',()=>{
  const amount=1000000000000; // exactly representable, still very large
  const xs=[tx('X','a','hub',amount,1),tx('Y','b','hub',amount,2),
    tx('Z','c','hub',amount,3),tx('O','hub','out',amount*2.4,4)];
  const r=assess(xs,{threshold_minor:amount*3});
  assert.ok(r.cases.some(c=>c.kind==='fan_in_out'));
});
