import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const load = name => readFileSync(resolve(root, name), 'utf8');
const compose = load('docker-compose.yml');
const dockerfile = load('Dockerfile.iris');
const compile = load('iris-init.script');

test('derived image uses the exact locally loaded AI Hub build 154', () => {
  assert.match(dockerfile, /ARG IRIS_BASE=iris-community:2026\.3\.0AI\.154\.0/);
  assert.match(dockerfile, /FROM \$\{IRIS_BASE\}/);
  assert.match(compose, /IRIS_BASE: iris-community:2026\.3\.0AI\.154\.0/);
  assert.match(compose, /dockerfile: Dockerfile\.iris/);
});

test('compiled ObjectScript source and synthetic demo travel into the derived image', () => {
  assert.match(dockerfile, /COPY iris\/ \/opt\/graphfraud\/iris\//);
  assert.match(dockerfile, /COPY demo_batch\.json \/opt\/graphfraud\/demo_batch\.json/);
  assert.match(dockerfile, /iris session IRIS -U USER/);
});

test('failed class compile prevents Docker build from claiming success', () => {
  assert.match(compile, /\$SYSTEM\.OBJ\.LoadDir\(/);
  assert.match(compile, /\$SYSTEM\.Status\.IsError\(compileStatus\)/);
  assert.match(compile, /GRAPHFRAUD_COMPILE_FAILED/);
  assert.match(compile, /GRAPHFRAUD_CLASS_COMPILE_OK/);
  assert.match(dockerfile, /grep -qx 'GRAPHFRAUD_CLASS_COMPILE_OK'/);
  assert.match(dockerfile, /trap 'iris stop IRIS quietly \|\| true' EXIT/);
});

test('the evidence service stays internal and has a health gate', () => {
  assert.match(compose, /graphfraud-evidence:[\s\S]*?healthcheck:/);
  assert.match(compose, /condition: service_healthy/);
  assert.match(compose, /127\.0\.0\.1:1972:1972/);
  assert.doesNotMatch(compose, /- ['"]?(?:0\.0\.0\.0:)?8787:8787/);
});

test('no secrets or EAP binary content are embedded in packaging', () => {
  assert.doesNotMatch(dockerfile + compile, /OPENAI_API_KEY=\S+|sk-[A-Za-z0-9]+/);
  assert.doesNotMatch(dockerfile, /https?:\/\/.*(?:docker.*154|eap.*\.tar)/);
});

test('Docker build context is allowlisted so secrets and EAP archives are excluded',()=>{
  const ignore=load('.dockerignore');
  assert.match(ignore,/^\*\*$/m);
  for(const entry of ['!Dockerfile.iris','!iris/','!iris/**','!iris-init.script','!demo_batch.json'])
    assert.ok(ignore.split('\n').includes(entry),'missing '+entry);
  assert.doesNotMatch(ignore,/^!(?:\.env|\.git|.*\.tar\.gz)$/m);
});
