let summarizer;

// Call preparation from a user click. Preflight with the same language options.
export async function prepareSummary(report = console.log) {
  if (!globalThis.Summarizer) throw new Error('Summarizer API is not exposed.');
  if (summarizer) return summarizer;
  summarizer = await Summarizer.create({
    type: 'key-points', format: 'plain-text', length: 'short',
    expectedInputLanguages: ['en'], outputLanguage: 'en',
    monitor(m) {
      m.addEventListener('downloadprogress', e => report(Math.round(e.loaded * 100)));
    },
  });
  return summarizer;
}

export async function summarize(text) {
  if (!summarizer) throw new Error('Prepare the summarizer first.');
  return summarizer.summarize(text);
}

export function releaseSummary() {
  summarizer?.destroy();
  summarizer = undefined;
}
