import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {readPdfCorpus} from '../lib/pdf.mjs';
import {chunkCorpus} from '../lib/artifacts.mjs';
// Minimal in-memory test document with real xref offsets; not a distributed PDF artifact.
function testPdf(text) {
 const content=`BT /F1 12 Tf 40 700 Td (${text}) Tj ET`;
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`];
 let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${o}\nendobj\n`;});const xref=Buffer.byteLength(pdf);
 pdf+=`xref\n0 6\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 return Buffer.from(pdf);
}
test('PDF extraction preserves filename, page provenance and document hash',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'rag-pdf-test-'));
 try{
  const file=join(dir,'factory manual with spaces.pdf');await writeFile(file,testPdf('Cooling room: keep the door closed.'));
  const corpus=await readPdfCorpus(file);assert.equal(corpus.input.name,'factory manual with spaces.pdf');assert.equal(corpus.input.pages,1);assert.equal(corpus.input.sha256.length,64);
  const chunks=chunkCorpus(corpus).chunks;assert.equal(chunks[0].page,1);assert.match(chunks[0].text,/keep the door closed/);assert.deepEqual(chunks[0].roles,[]);
  assert.equal((await readPdfCorpus(file,'Original manual.pdf')).documents[0].title,'Original manual.pdf');
  await writeFile(file,'not a PDF');await assert.rejects(readPdfCorpus(file),/not a PDF/);
  await writeFile(file,testPdf(''));await assert.rejects(readPdfCorpus(file),/No selectable text/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
