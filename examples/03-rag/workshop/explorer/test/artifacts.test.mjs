import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chunkCorpus,validateArtifact,cosine,resolveEmbeddingConfig} from '../lib/artifacts.mjs';
const corpus={documents:[{id:'manual',title:'Manual',version:'1',roles:['maintenance'],sections:[{heading:'Door',page:6,text:'A'.repeat(320)}]}]};
test('chunk boundaries, overlap and source metadata survive splitting',()=>{
 const a=chunkCorpus(corpus,{size:150,overlap:20,strategy:'fixed'});
 assert.deepEqual(a.chunks.map(c=>c.text.length),[150,150,60]);
 assert.equal(a.chunks.map(c=>c.text).reduce((s,t,i)=>s+(i?t.slice(20):t),''),corpus.documents[0].sections[0].text);
 assert.ok(a.chunks.every(c=>c.page===6&&c.roles[0]==='maintenance'&&c.sourceHash.length===64));
 assert.deepEqual(a,chunkCorpus(corpus,{size:150,overlap:20,strategy:'fixed'}));
 assert.notEqual(a.chunks[0].id,chunkCorpus(corpus,{size:160,overlap:20}).chunks[0].id);
});
test('invalid overlap cannot create an infinite chunk loop',()=>assert.throws(()=>chunkCorpus(corpus,{size:100,overlap:100})));
test('embedding import rejects duplicate IDs, missing, zero and mixed dimension vectors',()=>{
 const a={embedding:{model:'test',documentPrefix:''},chunks:[{id:'a',text:'one',vector:[1,0]},{id:'b',text:'two',vector:[0,1]}]};
 assert.equal(validateArtifact(a,{vectors:true}).dimensions,2);
 for(const replacement of [{id:'a'}, {vector:[0,0]}, {vector:[1]}, {vector:undefined},{vector:[NaN,1]}])assert.throws(()=>validateArtifact({...a,chunks:[a.chunks[0],{...a.chunks[1],...replacement}]},{vectors:true}));
 assert.throws(()=>validateArtifact({...a,embedding:{}},{vectors:true}));
});
test('cosine uses the full vector, independent of magnitude',()=>{assert.equal(cosine([1,2,3],[2,4,6]),1);assert.equal(cosine([1,0],[0,2]),0);assert.throws(()=>cosine([1],[1,2]));});

test('Explorer supplies its own space and query prefix for simple and legacy uploads',()=>{
 const config={model:'workshop-embed',documentPrefix:'title: none | text: ',spaceId:'local-space',queryPrefix:'task: search result | query: '};
 const simple={model:config.model,documentPrefix:config.documentPrefix};
 assert.deepEqual(resolveEmbeddingConfig(simple,config),config);
 assert.deepEqual(resolveEmbeddingConfig({...simple,spaceId:'uploaded-space',queryPrefix:'uploaded-query'},config),config);
 assert.deepEqual(simple,{model:'workshop-embed',documentPrefix:'title: none | text: '});
 assert.throws(()=>resolveEmbeddingConfig({...simple,model:'different'},config),/different model/);
 assert.throws(()=>resolveEmbeddingConfig({...simple,documentPrefix:''},config),/document prefix/);
});
