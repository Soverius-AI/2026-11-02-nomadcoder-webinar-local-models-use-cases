// Experimental API: rehearse against the actual presentation Chrome build.
let proofreader;

export async function prepareProofreader(report = console.log) {
  if (!globalThis.Proofreader) throw new Error('Proofreader API is not exposed.');
  if (proofreader) return proofreader;
  proofreader = await Proofreader.create({
    expectedInputLanguages: ['en'],
    monitor(m) {
      m.addEventListener('downloadprogress', e => report(Math.round(e.loaded * 100)));
    },
  });
  return proofreader;
}

export async function proofread(text) {
  if (!proofreader) throw new Error('Prepare the proofreader first.');
  return proofreader.proofread(text); // Inspect the result and its corrections.
}

export function releaseProofreader() {
  proofreader?.destroy();
  proofreader = undefined;
}
// If unavailable, explicitly label a Prompt API correction as a different demo.
