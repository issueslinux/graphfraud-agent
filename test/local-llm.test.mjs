import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const read = file => readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8');
const provider = read('../iris/GraphFraud/Agent/RiskReviewer.cls');
const compose = read('../docker-compose.yml');
const score = read('../iris/GraphFraud/Interop/ScoreOperation.cls');

test('IRIS AI Hub supports private, local OpenAI-compatible model without external token',()=>{
  assert.match(provider,/OLLAMA_BASE_URL/);
  assert.match(provider,/OLLAMA_MODEL/);
  assert.match(provider,/base_url/);
  assert.match(provider,/##class\(%AI\.Provider\)\.Create\("openai"/);
  assert.match(provider,/OPENAI_API_KEY/);
  assert.match(provider,/##super\(\)/);
});
test('local Ollama is opt-in, network-private and persists model weights',()=>{
  assert.match(compose,/profiles:\s*\["local-llm"\]/);
  assert.match(compose,/ollama\/ollama:/);
  assert.match(compose,/ollama-models:\/root\/\.ollama/);
  assert.match(compose,/OLLAMA_BASE_URL:/);
  assert.match(compose,/OLLAMA_MODEL:/);
  assert.doesNotMatch(compose,/11434:11434/);
});
test('compiled ScoreOperation avoids forbidden value-QUIT inside TRY',()=>{
  const body=score.split('  Try {')[1]?.split('  } Catch ex {')[0];
  assert.ok(body);
  assert.doesNotMatch(body,/\bQuit\s+(?:\w+|\$)/);
  assert.match(body,/\bReturn\s+\$\$\$OK/);
});
