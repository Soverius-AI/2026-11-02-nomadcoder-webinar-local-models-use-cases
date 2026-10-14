import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readPdfCorpus} from '../lib/pdf.mjs';
import {chunkCorpus} from '../lib/artifacts.mjs';
import {layoutLines,paragraphsFromLines} from '../lib/pdf-layout.mjs';
const pdf=name=>fileURLToPath(new URL('../../corpus/reference-documents/'+name+'.pdf',import.meta.url));

test('paragraph packing preserves whole content, flags oversized units and rejects misleading overlap',()=>{
 const paragraphs=['First complete paragraph.','A second whole paragraph.','Long paragraph: '+'x'.repeat(150)];
 const corpus={documents:[{id:'test',sections:[{heading:'Section',page:1,text:paragraphs.join('\n\n'),paragraphs}]}]};
 const result=chunkCorpus(corpus,{strategy:'paragraph',size:100,overlap:0});
 assert.equal(result.chunks.map(c=>c.text).join('\n\n'),paragraphs.join('\n\n'));
 assert.equal(result.chunks.length,2);assert.equal(result.chunks[1].oversized,true);
 assert.throws(()=>chunkCorpus(corpus,{strategy:'paragraph',size:100,overlap:10}),/overlap 0/);
 const run=(str,x,y)=>({str,transform:[9,0,0,9,x,y],height:9,width:40});
 const lines=layoutLines([run('First line',10,700),run('continues.',10,690),run('Next paragraph.',10,670)]);
 assert.deepEqual(paragraphsFromLines(lines),['First line continues.','Next paragraph.']);
});

test('real PDF structure: AK-RC bookmarks separate wiring and probes and report the stale final bookmark',async()=>{
 const corpus=await readPdfCorpus(pdf('ak-rc-305w-sd'),undefined,{strategy:'structure'});
 assert.equal(corpus.input.layout.bookmarks,23);assert.equal(corpus.input.layout.matchedBookmarks,22);
 assert.deepEqual(corpus.input.layout.unmatchedBookmarks,[{title:'11.  Ordering',page:22}]);
 const chunks=chunkCorpus(corpus,{strategy:'structure',size:900,overlap:0}).chunks;
 const wiring=chunks.filter(c=>c.page===5&&/Wiring/.test(c.section));
 const probes=chunks.filter(c=>c.page===5&&/Installation of the probes/.test(c.section));
 assert.ok(wiring.length);assert.ok(probes.length);
 assert.ok(probes.some(c=>c.text.includes('Location of the ambient probe')));
 assert.ok(probes.some(c=>c.text.includes('Location of the evaporator probe')));
 assert.ok(wiring.every(c=>!c.text.includes('Location of the ambient probe')));
 assert.ok(chunks.filter(c=>c.page===22).every(c=>c.boundary==='unsectioned'));
 assert.ok(probes.every(c=>c.text.startsWith(c.section)));
});

test('real PDF paragraphs work for both manuals; Optyma cannot silently fall back from structure',async()=>{
 for(const name of ['optyma-cooler','ak-rc-305w-sd']){
  const corpus=await readPdfCorpus(pdf(name),undefined,{strategy:'paragraph'});
  const chunks=chunkCorpus(corpus,{strategy:'paragraph',size:900,overlap:0}).chunks;
  assert.ok(chunks.length>corpus.input.pages);
  assert.ok(chunks.every(c=>c.boundary==='layout-paragraphs'));
  assert.ok(chunks.every(c=>c.paragraphEnd>=c.paragraphStart));
  for(const section of corpus.documents[0].sections){
   assert.equal(chunks.filter(c=>c.page===section.page).map(c=>c.text).join('\n\n'),section.text);
  }
 }
 await assert.rejects(readPdfCorpus(pdf('optyma-cooler'),undefined,{strategy:'structure'}),/No PDF bookmarks/);
});
