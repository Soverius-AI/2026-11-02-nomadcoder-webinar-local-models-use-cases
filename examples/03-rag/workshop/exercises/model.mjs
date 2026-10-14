// Control the workshop llama.cpp router without shell-specific curl syntax.
const [action, model] = process.argv.slice(2);
if (!['load', 'unload'].includes(action) || !model) {
  throw new Error('Usage: node model.mjs <load|unload> <model-alias>');
}
const base = (process.env.LLAMA_BASE_URL ?? 'http://127.0.0.1:8080').replace(/\/v1\/?$/, '').replace(/\/$/, '');
if (action === 'load') {
  const status = await fetch(`${base}/v1/models`, {signal: AbortSignal.timeout(10000)});
  if (!status.ok) throw new Error(`Model status failed: ${status.status}`);
  const entries = (await status.json()).data;
  if (!entries.some(entry => entry.id === model)) throw new Error('Unknown model alias: ' + model);
  const other = entries.find(entry => entry.id !== model && ['loaded', 'loading'].includes(entry.status?.value));
  if (other) throw new Error(`Unload ${other.id} explicitly before loading ${model}.`);
}
console.log(action === 'load' ? `Loading ${model}; the first load may download weights.` : `Unloading ${model}`);
const response = await fetch(`${base}/models/${action}`, {
  method: 'POST', headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({model}), signal: AbortSignal.timeout(120000),
});
if (!response.ok) throw new Error(`${action} failed: ${response.status} ${await response.text()}`);
for (let attempt = 0; attempt < 120; attempt++) {
  const status = await fetch(`${base}/v1/models`, {signal: AbortSignal.timeout(10000)});
  if (!status.ok) throw new Error(`Model status failed: ${status.status}`);
  const entry = (await status.json()).data.find(entry => entry.id === model);
  if (entry?.status?.value === (action === 'load' ? 'loaded' : 'unloaded')) {
    console.log(model, entry.status.value); break;
  }
  if (attempt === 119) throw new Error('Timed out waiting for ' + model);
  await new Promise(resolve => setTimeout(resolve, 1000));
}
