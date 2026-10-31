import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, chmodSync, rmSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const load=path=>readFileSync(resolve(root,path),'utf8');

test('demo wrapper rejects a false-success IRIS response',()=>{
  const tmp=mkdtempSync(join(tmpdir(),'graphfraud-docker-stub-'));
  try {
    const fake=join(tmp,'docker');
    writeFileSync(fake,[
      '#!/bin/sh',
      'if [ "$1" = compose ] && [ "$2" = up ]; then exit 0; fi',
      'if [ "$1" = compose ] && [ "$2" = exec ]; then',
      '  if [ "$MOCK_IRIS" = pass ]; then echo GRAPHFRAUD_DEMO_OK; echo GRAPHFRAUD_AI_HUB_USED; elif [ "$MOCK_IRIS" = workflow ]; then echo GRAPHFRAUD_DEMO_OK; else echo GRAPHFRAUD_DEMO_FAILED:missing_agent; fi',
      '  exit 0',
      'fi',
      'exit 7'
    ].join('\n')+'\n');
    chmodSync(fake,0o755);
    const invoke=(mode,arg='--require-ai')=>spawnSync('bash',[resolve(root,'scripts/run-demo.sh'),arg],{
      encoding:'utf8',env:{...process.env,MOCK_IRIS:mode,PATH:tmp+':'+process.env.PATH}
    });
    const fail=invoke('fail');
    assert.equal(fail.status,1,fail.stdout+fail.stderr);
    assert.match(fail.stderr,/did not confirm production start/);
    const pass=invoke('pass');
    assert.equal(pass.status,0,pass.stdout+pass.stderr);
    assert.match(pass.stdout,/AI Hub agent use confirmed/);
    const incomplete=invoke('workflow');
    assert.equal(incomplete.status,3,incomplete.stdout+incomplete.stderr);
    assert.match(incomplete.stderr,/no actual IRIS AI Hub agent use/);
    const fallback=invoke('workflow','--allow-fallback');
    assert.equal(fallback.status,0,fallback.stdout+fallback.stderr);
  } finally {rmSync(tmp,{recursive:true,force:true});}
});

test('demo wrapper validates terminal status and has valid shell syntax',()=>{
  assert.match(load('scripts/run-demo.sh'),/grep -qx 'GRAPHFRAUD_DEMO_OK'/);
  assert.match(load('scripts/run-demo.sh'),/grep -qx 'GRAPHFRAUD_AI_HUB_USED'/);
  assert.match(load('run-demo.script'),/Set demoStatus = ##class\(GraphFraud\.Interop\.Demo\)\.Run\(\)/);
  assert.match(load('run-demo.script'),/\$SYSTEM\.Status\.IsError\(demoStatus\)/);
  const r=spawnSync('bash',['-n',resolve(root,'scripts/run-demo.sh')],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
});
