/**
 * Offline evidence service for IRIS Interoperability HTTP OutboundAdapter.
 * Intentionally no public HTTP listener: compose binds it to an internal network.
 */
import http from 'node:http';
import {assessJSON} from './core.mjs';

export function makeServer() {
  return http.createServer((req,res)=>{
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Type','application/json; charset=utf-8');
    if(req.method==='GET' && req.url==='/health'){
      res.writeHead(200);res.end(JSON.stringify({status:'ok',engine:'GraphFraud'}));return;
    }
    if(req.method!=='POST' || req.url!=='/assess'){
      res.writeHead(404);res.end(JSON.stringify({error:'not found'}));return;
    }
    if(req.headers['content-type']?.split(';')[0].trim()!=='application/json'){
      res.writeHead(415);res.end(JSON.stringify({error:'content-type must be application/json'}));return;
    }
    let data='',exceeded=false;
    req.on('data', chunk=>{
      if(exceeded)return;
      if(Buffer.byteLength(data)+chunk.length>256000){
        exceeded=true;res.writeHead(413);res.end(JSON.stringify({error:'payload too large'}));
      }else data+=chunk.toString('utf8');
    });
    req.on('end',()=>{
      if(exceeded)return;
      try{const answer=assessJSON(data);res.writeHead(200);res.end(answer);}
      catch(e){res.writeHead(422);res.end(JSON.stringify({error:'invalid transaction batch',detail:String(e.message).slice(0,180)}));}
    });
  });
}
if(process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href){
  const port=Number(process.env.PORT||8787);
  const host=process.env.HOST||'127.0.0.1';
  if(!Number.isSafeInteger(port)||port<1||port>65535)throw new Error('invalid PORT');
  makeServer().listen(port,host,()=>console.log('GraphFraud evidence service listening on '+host+':'+port));
}
