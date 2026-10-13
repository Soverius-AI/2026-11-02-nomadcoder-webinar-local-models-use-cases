// Reference module. Run in the demo page's secure, top-level context.
export const promptOptions = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

export async function inspectCapabilities() {
  const checks = [
    ['Chat', 'LanguageModel', promptOptions],
    ['Summary', 'Summarizer', { expectedInputLanguages: ['en'], outputLanguage: 'en' }],
    ['Proofreading', 'Proofreader', { expectedInputLanguages: ['en'] }],
    ['English to German', 'Translator', { sourceLanguage: 'en', targetLanguage: 'de' }],
    ['English to Spanish', 'Translator', { sourceLanguage: 'en', targetLanguage: 'es' }],
  ];
  return Promise.all(checks.map(async ([feature, apiName, options]) => {
    const api = globalThis[apiName];
    if (!api || typeof api.availability !== 'function') {
      return { feature, state: 'unsupported' };
    }
    try {
      return { feature, state: await api.availability(options) };
    } catch (error) {
      return { feature, state: 'error', message: error.message };
    }
  }));
}
// await inspectCapabilities(): unavailable / downloadable / downloading / available.
// These are capability states, not a list of model files or a RAM inspection.
