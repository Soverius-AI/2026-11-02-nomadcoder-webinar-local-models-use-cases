import {test} from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL??'http://localhost:4342';
const enabled=process.env.RUN_INTEGRATION==='1';
async function request(path,{data,cookie,origin=true}={}){
 const res=await fetch(base+'/api/'+path,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{'Content-Type':'application/json'}),...(origin?{Origin:base}:{}),...(cookie?{Cookie:cookie}:{})},body:data===undefined?undefined:JSON.stringify(data)});
 return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0],headers:res.headers};
}
test('real PostgreSQL: login, RLS, graph access, SQL boundary and sessions',{skip:!enabled},async()=>{
 assert.equal((await request('security')).status,401);
 assert.equal((await request('login',{data:{username:'operator',password:'wrong'}})).status,401);
 assert.equal((await request('login',{data:{username:'operator',password:'workshop'},origin:false})).status,400);
 const op=await request('login',{data:{username:'operator',password:process.env.WORKSHOP_PASSWORD??'workshop'}});
 const maint=await request('login',{data:{username:'maintenance',password:process.env.WORKSHOP_PASSWORD??'workshop'}});
 assert.equal(op.status,200);assert.match(op.headers.get('set-cookie'),/HttpOnly/);assert.match(op.headers.get('set-cookie'),/SameSite=Strict/);
 const operator=(await request('security',{cookie:op.cookie})).body;
 const maintenance=(await request('security',{cookie:maint.cookie})).body;
 assert.equal(operator.databaseRole,'rag_operator');assert.equal(maintenance.databaseRole,'rag_maintenance');
 assert.ok(!operator.documents.some(d=>d.id==='SOV-MAINT-017'));assert.ok(maintenance.documents.some(d=>d.id==='SOV-MAINT-017'));
 const graph=(await request('relationships',{cookie:op.cookie})).body;
 assert.ok(graph.links.every(l=>l.source!=='SOV-MAINT-017'&&l.target!=='SOV-MAINT-017'));
 const blocked=await request('expand',{cookie:op.cookie,data:{source:'SOV-MAINT-017',role:'maintenance'}});assert.deepEqual(blocked.body.hits,[]);
 const allowed=await request('expand',{cookie:maint.cookie,data:{source:'SOV-MAINT-017'}});assert.ok(allowed.body.hits.length);
 const sql=sql=>request('sql',{cookie:op.cookie,data:{sql}});
 assert.equal((await sql('SELECT current_user')).body.rows[0].current_user,'lab_writer');
 assert.equal((await sql('SELECT * FROM protected.chunks')).status,400);
 assert.equal((await sql('SELECT 1; SELECT 2')).status,400);
 assert.equal((await sql("SELECT set_config('role','lab_admin',false)")).status,400);
 assert.equal((await sql("INSERT INTO practice.chunks(id,source,title,content) VALUES('integration-check','test','Test','cooling test') ON CONFLICT(id) DO UPDATE SET content=EXCLUDED.content RETURNING id")).status,200);
 assert.equal((await request('search',{cookie:op.cookie,data:{scope:'protected',mode:'keyword',question:'service',role:'maintenance'}})).body.hits.some(h=>h.source==='SOV-MAINT-017'),false);
 assert.equal((await request('logout',{cookie:op.cookie})).status,404);
 assert.equal((await request('me',{cookie:op.cookie})).status,200);
 assert.equal((await request('logout',{cookie:op.cookie,data:{},origin:false})).status,400);
 assert.equal((await sql("WITH removed AS (DELETE FROM practice.chunks WHERE id='integration-check' AND source='test' RETURNING id) SELECT count(*) FROM removed")).status,200);
 await request('logout',{cookie:op.cookie,data:{}});assert.equal((await request('me',{cookie:op.cookie})).status,401);
 await request('logout',{cookie:maint.cookie,data:{}});
});
