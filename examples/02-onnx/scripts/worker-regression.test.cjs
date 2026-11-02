const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const root = require('node:path').resolve(__dirname, '..');
const ts = createRequire(root + '/package.json')('typescript');
const source = ts.transpileModule(readFileSync(root + '/src/app/app.worker.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function worker({
  load = async () => ({ model: {}, tokenizer: {} }),
  prompt = async (_t, _m, _messages, onText) => onText('Hello!'),
} = {}) {
  let handle;
  const posted = [];
  let prompts = 0;
  vm.runInNewContext(source, {
    Error,
    exports: {},
    require(id) {
      if (id === '@huggingface/transformers') return {};
      if (id === './download') return { downloadModel: load };
      if (id === './prompt')
        return {
          runPrompt: async (...args) => {
            prompts++;
            return prompt(...args);
          },
        };
      throw new Error(id);
    },
    addEventListener(_event, listener) {
      handle = listener;
    },
    postMessage(message) {
      posted.push(message);
    },
  });
  return { send: (data) => handle({ data }), posted, prompts: () => prompts };
}
test('load followed by prompt streams text and completes', async () => {
  const w = worker();
  await w.send({ type: 'load' });
  assert.equal(w.posted.at(-1)?.type, 'ready');
  await w.send({ type: 'generate', messages: [{ role: 'user', content: 'Hello' }] });
  assert.equal(w.prompts(), 1, 'the loaded worker must accept the next prompt');
  assert.equal(w.posted.find((m) => m.type === 'token')?.text, 'Hello!');
  assert.equal(w.posted.at(-1)?.type, 'done');
  await w.send({ type: 'generate', messages: [{ role: 'user', content: 'Again' }] });
  assert.equal(w.prompts(), 2, 'follow-up prompts must be accepted');
});
test('load errors are reported and a retry is accepted', async () => {
  let attempts = 0;
  const w = worker({
    load: async () => {
      if (!attempts++) throw new Error('load failed');
      return { model: {}, tokenizer: {} };
    },
  });
  await w.send({ type: 'load' });
  assert.equal(w.posted.at(-1)?.type, 'error');
  assert.equal(w.posted.at(-1)?.error, 'load failed');
  await w.send({ type: 'load' });
  assert.equal(w.posted.at(-1)?.type, 'ready');
});
test('generation errors are reported and the next prompt is accepted', async () => {
  let attempts = 0;
  const w = worker({
    prompt: async (_t, _m, _messages, onText) => {
      if (!attempts++) throw new Error('generation failed');
      onText('Recovered');
    },
  });
  await w.send({ type: 'load' });
  await w.send({ type: 'generate', messages: [] });
  assert.equal(w.posted.at(-1)?.type, 'error');
  await w.send({ type: 'generate', messages: [] });
  assert.equal(w.posted.at(-1)?.type, 'done');
  assert.equal(w.posted.find((m) => m.type === 'token')?.text, 'Recovered');
});
