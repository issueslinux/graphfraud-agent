/**
 * GraphFraud Agent — deterministic, explainable temporal transaction graph.
 * Amounts are integer minor units. Dates MUST include an explicit timezone.
 * This is a review aid, never a fraud verdict or a payment blocking engine.
 */
const LIMIT = 500;
const MAX_CASES = 40;
// Dense multigraphs can generate exponentially many short paths.
const MAX_CYCLE_EDGE_CHECKS = 25000;
const ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/;
const DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

export function validateBatch(raw) {
  if (!Array.isArray(raw) || raw.length > LIMIT) throw new Error('transactions must be an array of at most 500 items');
  const ids = new Set();
  const out = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('invalid transaction');
    const {id, from, to, currency, timestamp, amount_minor, device} = row;
    for (const [label, value] of [['id',id],['from',from],['to',to]]) {
      if (typeof value !== 'string' || !ID.test(value)) throw new Error('invalid '+label);
    }
    if (ids.has(id)) throw new Error('duplicate transaction id');
    ids.add(id);
    if (from===to) throw new Error('self transfer not accepted');
    if (typeof currency!=='string' || !/^[A-Z]{3}$/.test(currency)) throw new Error('invalid currency');
    if (!Number.isSafeInteger(amount_minor) || amount_minor<=0 || amount_minor>Math.floor(Number.MAX_SAFE_INTEGER/LIMIT)) throw new Error('amount_minor outside bounded positive integer range');
    if (typeof timestamp!=='string' || !DATE.test(timestamp)) throw new Error('timestamp requires ISO 8601 timezone');
    const ms=Date.parse(timestamp);
    if (!Number.isFinite(ms) || new Date(ms).getUTCFullYear()<2000) throw new Error('invalid timestamp');
    if (device!==undefined && (typeof device!=='string' || !ID.test(device))) throw new Error('invalid device');
    out.push({id,from,to,currency,timestamp,ms,amount_minor,...(device ? {device}: {})});
  }
  out.sort((a,b)=>a.ms-b.ms || a.id.localeCompare(b.id));
  return out;
}
function emit(cases, kind, currency, txs, details) {
  const transactions=[...new Set(txs.map(t=>t.id))].sort();
  const signature=kind+'|'+currency+'|'+transactions.join(',');
  if(cases.some(c=>c.signature===signature)||cases.length>=MAX_CASES)return;
  cases.push({signature,kind,currency,transaction_ids:transactions,
    accounts:[...new Set(txs.flatMap(t=>[t.from,t.to]))].sort(),
    evidence:details, verified_fraud:false});
}
function cycles(rows,cases,windowMs) {
  const outgoing=new Map();
  for(const t of rows){if(!outgoing.has(t.from))outgoing.set(t.from,[]);outgoing.get(t.from).push(t);}
  let examined=0,truncated=false;
  for(const start of rows){
    if(truncated || cases.length>=MAX_CASES){truncated=true;break;}
    const visited=new Set([start.from,start.to]);
    function dfs(account,path) {
      if(path.length>=5 || truncated)return;
      for(const edge of outgoing.get(account)||[]){
        if(cases.length>=MAX_CASES){truncated=true;break;}
        if(examined>=MAX_CYCLE_EDGE_CHECKS){truncated=true;break;}
        examined++;
        if(edge.currency!==start.currency || edge.ms<path[path.length-1].ms ||
           edge.ms-start.ms>windowMs || path.some(p=>p.id===edge.id))continue;
        if(edge.to===start.from) {
          if(path.length>=2)emit(cases,'temporal_cycle',start.currency,[...path,edge],
            {ordered_path:[...path,edge].map(p=>p.id), hops:path.length+1,
             window_hours:(edge.ms-start.ms)/3600000,
             explanation:'time-ordered transfers return to the origin account'});
          continue;
        }
        if(visited.has(edge.to))continue;
        visited.add(edge.to);dfs(edge.to,[...path,edge]);visited.delete(edge.to);
        if(truncated)break;
      }
    }
    dfs(start.to,[start]);
  }
  return {examined_edges:examined,truncated};
}
function convergence(rows,cases,windowMs,ratio) {
  const incoming=new Map();
  for(const t of rows){const key=t.to+'|'+t.currency;if(!incoming.has(key))incoming.set(key,[]);incoming.get(key).push(t);}
  for(const out of rows){
    const ins=(incoming.get(out.from+'|'+out.currency)||[]).filter(i=>
      i.ms<=out.ms && out.ms-i.ms<=windowMs && i.from!==out.to && i.id!==out.id);
    const bySrc=new Map();
    for(const i of ins)if(!bySrc.has(i.from))bySrc.set(i.from,[]);
    for(const i of ins)bySrc.get(i.from).push(i);
    if(bySrc.size<3)continue;
    const total=ins.reduce((s,i)=>s+i.amount_minor,0);
    if(BigInt(out.amount_minor)*100n < BigInt(total)*BigInt(ratio) || out.amount_minor > total)continue;
    emit(cases,'fan_in_out',out.currency,[...ins,out],{
      hub:out.from,unique_senders:bySrc.size,inflow_minor:total,outflow_minor:out.amount_minor,
      explanation:'three or more distinct senders fund a subsequent outgoing transfer'});
  }
}
function structuring(rows,cases,windowMs,threshold) {
  const groups=new Map();
  for(const t of rows){
    if(t.amount_minor>=threshold)continue;
    const key=[t.from,t.to,t.currency].join('|');
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(t);
  }
  for(const ts of groups.values()){
    let left=0,sum=0;
    for(let right=0;right<ts.length;right++){
      sum+=ts[right].amount_minor;
      while(ts[right].ms-ts[left].ms>windowMs){sum-=ts[left].amount_minor;left++;}
      if(right-left+1>=3 && sum>=threshold){
        const matches=ts.slice(left,right+1);
        emit(cases,'split_payments',ts[right].currency,matches,{
          count:matches.length,total_minor:sum,threshold_minor:threshold,
          explanation:'multiple individually sub-threshold transfers aggregate above the threshold'});
        break;
      }
    }
  }
}
export function assess(batch, config={}) {
  const txs=validateBatch(batch);
  const hours=config.window_hours??24;
  const threshold=config.threshold_minor??1000000;
  const ratio=config.fan_out_min_percent??70;
  if(!Number.isSafeInteger(hours)||hours<1||hours>168 ||
     !Number.isSafeInteger(threshold)||threshold<1||
     !Number.isSafeInteger(ratio)||ratio<1||ratio>100)throw new Error('invalid policy');
  const windowMs=hours*3600000,cases=[];
  const cycleSearch=cycles(txs,cases,windowMs);
  convergence(txs,cases,windowMs,ratio);
  structuring(txs,cases,windowMs,threshold);
  const analysisTruncated=cycleSearch.truncated || cases.length>=MAX_CASES;
  const kindOrder={temporal_cycle:0,fan_in_out:1,split_payments:2};
  cases.sort((a,b)=>kindOrder[a.kind]-kindOrder[b.kind]||a.signature.localeCompare(b.signature));
  return {
    schema_version:'1.0',engine:'GraphFraud TemporalGraph',transactions_processed:txs.length,
    policy:{window_hours:hours,threshold_minor:threshold,fan_out_min_percent:ratio},
    cases,case_count:cases.length,
    analysis_truncated:analysisTruncated,
    search_limits:{max_cases:MAX_CASES,max_cycle_edge_checks:MAX_CYCLE_EDGE_CHECKS,
      cycle_edges_examined:cycleSearch.examined_edges},
    suggested_route:cases.length?'HUMAN_REVIEW':analysisTruncated?'INCOMPLETE_REVIEW':'MONITOR',
    ai_decision:null,
    disclaimer:'Indicators are not proof of fraud. Incomplete analyses require review. No transactions were blocked. Human review required for adverse action.'
  };
}
export function assessJSON(json) {
  const input=JSON.parse(json);
  if(!input || !Array.isArray(input.transactions))throw new Error('expected transactions array');
  return JSON.stringify(assess(input.transactions,input.policy||{}));
}
