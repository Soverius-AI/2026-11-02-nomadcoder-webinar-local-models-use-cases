import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import pg from 'pg';
import {connection} from '../lib/database.mjs';
// An isolated temporary database and HTTP fixtures test plumbing, never model quality.
test('model contracts: embed, pgvector retrieval, rerank order, grounded context',{skip:process.env.RUN_MODEL_CONTRACT!=='1',timeout:30000},async()=>{
 const database='raglab_contract_test_'+process.pid;
 const admin=new pg.Client(connection('lab_admin'));await admin.connect();
 await admin.query(`CREATE DATABASE ${database}`);
 const calls=[];let broken=false;
 const model=createServer(async(req,res)=>{let raw='';for await(const c of req)raw+=c;const b=JSON.parse(raw);calls.push({path:req.url,body:b});res.setHeader('Content-Type','application/json');
 if(req.url==='/v1/embeddings')res.end(JSON.stringify({data:b.input.map((_,i)=>({index:i,embedding:[1,0,0]}))}));
 else if(req.url==='/v1/rerank')res.end(JSON.stringify({results:broken?[]:b.documents.map((_,i)=>({index:i,relevance_score:i})).reverse()}));
 else res.end(JSON.stringify({choices:[{message:{content:'Fixture answer for adapter test only.'}}]}));
 });
 await new Promise(r=>model.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+model.address().port+'/v1';
 const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PGDATABASE:database,PORT:'4342',PUBLIC_ORIGIN:'http://127.0.0.1:4342',EMBED_BASE_URL:url,RERANK_BASE_URL:url,CHAT_BASE_URL:url,EMBED_MODEL:'contract-test',EMBED_SPACE_ID:'contract-test',DOCUMENT_PREFIX:'',QUERY_PREFIX:'query: '},stdio:['ignore','pipe','pipe']});
 try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Test server startup timeout')),7000);child.stdout.on('data',d=>{if(String(d).includes('listening')){clearTimeout(timer);resolve();}});child.on('exit',code=>{clearTimeout(timer);reject(Error('Server exited '+code));});child.stderr.on('data',d=>process.stderr.write(d));});
 let cookie;async function request(path,data){const r=await fetch('http://127.0.0.1:4342/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:4342',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(data)});cookie??=r.headers.get('set-cookie')?.split(';')[0];return {status:r.status,body:await r.json()};}
 assert.equal((await request('login',{username:'operator',password:process.env.WORKSHOP_PASSWORD??'workshop'})).status,200);
 const missingPdf=await fetch('http://127.0.0.1:4342/pdf/optyma-cooler.pdf',{headers:{Cookie:cookie}});assert.equal(missingPdf.status,404);assert.match((await missingPdf.json()).error,/Original PDF not installed/);
 const a={embedding:{model:'contract-test',documentPrefix:''},chunks:[{id:'test-a',text:'door is open',vector:[1,0,0]},{id:'test-b',text:'cooling procedure',vector:[1,1,0]},{id:'test-c',text:'service note',vector:[0,1,0]},{id:'test-d',text:'unrelated',vector:[-1,0,0]}]};
 assert.equal((await request('import',a)).body.count,4);
 const stored=(await request('sql',{sql:'SELECT embedding FROM practice.settings'})).body.rows[0].embedding;
 assert.equal(stored.spaceId,'contract-test');assert.equal(stored.queryPrefix,'query: ');
 assert.equal((await request('sql',{sql:'SELECT DISTINCT space_id FROM practice.chunks'})).body.rows[0].space_id,'contract-test');
 assert.equal((await request('import',{...a,embedding:{...a.embedding,model:'different'}})).status,400);
 assert.equal((await request('import',{...a,embedding:{...a.embedding,documentPrefix:'different'}})).status,400);
 assert.equal((await request('sql',{sql:'SELECT count(*)::int AS n FROM practice.chunks'})).body.rows[0].n,4);
 const query={scope:'practice',mode:'vector',question:'The cooling room is too warm. What should I do?'};
 assert.deepEqual((await request('embed-query',query)).body.vector,[1,0,0]);assert.equal(calls.at(-1).body.input[0],'query: '+query.question);
 const result=await request('search',query);assert.equal(result.status,200);assert.deepEqual(result.body.hits.map(x=>x.id),['test-a','test-b','test-c','test-d']);
 const ranked=await request('rerank',query);assert.equal(ranked.body.hits[0].id,'test-d');assert.equal(ranked.body.hits[0].before,4);
 broken=true;assert.equal((await request('rerank',query)).status,400);broken=false;
 const answer=await request('ground',{...query,injection:true,rerank:true});assert.equal(answer.status,200);assert.equal(answer.body.hits.length,3);assert.match(answer.body.messages[1].content,/Workshop injection test/);assert.equal(calls.at(-1).body.messages[0].role,'system');
 const secure=await request('ground',{scope:'protected',mode:'keyword',question:'service',role:'maintenance'});assert.equal(secure.status,200);assert.ok(secure.body.hits.every(h=>h.source!=='SOV-MAINT-017'));assert.ok(secure.body.messages[1].content.indexOf('SOV-MAINT-017')<0);
 assert.equal((await request('import',{...a,chunks:[{...a.chunks[0],vector:[0,0,0]}]})).status,400);
 assert.equal((await request('sql',{sql:'SELECT count(*)::int AS n FROM practice.chunks'})).body.rows[0].n,4);
 }finally{
 if(child.exitCode===null){const exited=once(child,'exit');child.kill('SIGTERM');await exited;}await new Promise(r=>model.close(r));
 await admin.query(`DROP DATABASE ${database}`);await admin.end();
 }
});
