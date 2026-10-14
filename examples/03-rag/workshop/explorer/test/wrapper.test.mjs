import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,realpath,rm} from 'node:fs/promises';
import {join,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
const wrapper=fileURLToPath(new URL('../../chunk-pdf.sh',import.meta.url));
test('Bash wrapper quotes PDF paths, converts Git Bash arguments and propagates failures',{skip:process.platform==='win32'},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'rag-wrapper-'));
 try{
  const pdf=join(dir,'manual, with spaces.pdf'),log=join(dir,'args');await writeFile(pdf,'PDF placeholder: extraction is covered separately');
  await writeFile(join(dir,'docker'),'#!/bin/sh\nprintf "%s\\n" "${MSYS_NO_PATHCONV:-unset}" "${MSYS2_ARG_CONV_EXCL:-unset}" "$@" > "$RAG_TEST_LOG"\nexit "${RAG_TEST_EXIT:-0}"\n',{mode:0o755});
  const physicalPdf=await realpath(pdf);
  const env={...process.env,PATH:dir+':'+process.env.PATH,RAG_TEST_LOG:log};
  const run=(extraEnv={},args=[pdf,'--size','450','--overlap','50'])=>spawnSync('bash',[wrapper,...args],{cwd:dir,env:{...env,...extraEnv},encoding:'utf8'});
  const first=run();assert.equal(first.status,0,first.stderr);let tokens=(await readFile(log,'utf8')).split('\n');assert.ok(tokens.includes(physicalPdf+':/input/document.pdf:ro'));assert.ok(tokens.includes('manual, with spaces.pdf'));assert.ok(tokens.includes('--no-deps'));assert.ok(tokens.includes('450'));
  assert.equal(run({},[pdf]).status,0); // Defaults must work with an empty options array in macOS Bash 3.2.
  for (const out of ['optyma.json','nested folder/custom.json',join(dir,'absolute file.json')]) {
   const result=run({},[pdf,'--out',out]);assert.equal(result.status,0,result.stderr);
   const expected=out.startsWith('/')?out:join(dir,out);
   tokens=(await readFile(log,'utf8')).split('\n');
   assert.ok(tokens.includes((await realpath(dirname(expected)))+':/result'));
   assert.ok(tokens.includes('/result/'+basename(expected)));
  }
  assert.equal(run({RAG_TEST_EXIT:'7'}).status,7);
  assert.notEqual(run({},['missing.pdf']).status,0);assert.notEqual(run({},[pdf,'--unknown']).status,0);
  await writeFile(join(dir,'uname'),'#!/bin/sh\nprintf "MINGW64_NT\\n"\n',{mode:0o755});
  await writeFile(join(dir,'cygpath'),'#!/bin/sh\nprintf "C:%s\\n" "$2"\n',{mode:0o755});
  assert.equal(run({},[pdf,'--out','optyma.json']).status,0);tokens=(await readFile(log,'utf8')).split('\n');assert.deepEqual(tokens.slice(0,2),['1','*']);assert.ok(tokens.includes('C:'+physicalPdf+':/input/document.pdf:ro'));assert.ok(tokens.includes('/input/document.pdf'));assert.ok(tokens.includes('C:'+(await realpath(dir))+':/result'));assert.ok(tokens.includes('/result/optyma.json'));
 }finally{await rm(dir,{recursive:true,force:true});}
});
