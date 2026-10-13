import { promptOptions } from './availability.js';

let session;

// Call from a Prepare button click after the capability check has finished.
export async function prepareConversation(report = console.log) {
  if (!globalThis.LanguageModel) throw new Error('Prompt API is not exposed.');
  if (session) return session;
  report('Preparing session');
  session = await LanguageModel.create({
    ...promptOptions,
    monitor(m) {
      m.addEventListener('downloadprogress', event => {
        report(`Preparation progress: ${Math.round(event.loaded * 100)}%`);
      });
    },
  });
  report('Session ready'); // create() resolving is the readiness signal.
  return session;
}

export async function ask(text, onChunk = console.log, signal) {
  if (!session) throw new Error('Prepare the model first.');
  const stream = session.promptStreaming(text, { signal });
  for await (const chunk of stream) onChunk(chunk);
}

export function resetConversation() {
  session?.destroy();
  session = undefined;
  // This releases the session; it does not uninstall the downloaded model.
}
// Await each ask() before starting the next; disable Run while busy.
// Reuse the session for follow-ups. Prepare again after reset or page reload.
