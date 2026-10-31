import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const router = readFileSync(fileURLToPath(new URL('../iris/GraphFraud/Interop/Router.cls', import.meta.url)), 'utf8');

test('IRIS router fails closed on truncated graph evidence before MONITOR',()=>{
  const truncated = router.indexOf('If evidence.%Get("analysis_truncated") {');
  const monitor = router.indexOf('If count<1 {');
  assert.ok(truncated>=0 && monitor>truncated);
  const guard=router.slice(truncated,monitor);
  assert.match(guard,/Set pResponse\.Decision = "INCOMPLETE_REVIEW"/);
  assert.match(guard,/Set pResponse\.AgentUsed = 0/);
  assert.match(guard,/Quit \$\$\$OK/);
});
