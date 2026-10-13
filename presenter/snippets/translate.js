const translators = new Map();
const allowedTargets = new Set(['de', 'es']);

// Call from the Prepare translation button for the selected language.
export async function prepareTranslation(targetLanguage, report = console.log) {
  if (!allowedTargets.has(targetLanguage)) throw new Error('Choose de or es.');
  if (!globalThis.Translator) throw new Error('Translator API is not exposed.');
  if (translators.has(targetLanguage)) return translators.get(targetLanguage);
  const translator = await Translator.create({
    sourceLanguage: 'en', targetLanguage,
    monitor(m) {
      m.addEventListener('downloadprogress', e => report(Math.round(e.loaded * 100)));
    },
  });
  translators.set(targetLanguage, translator);
  return translator;
}

export async function translate(text, targetLanguage) {
  const translator = translators.get(targetLanguage);
  if (!translator) throw new Error('Prepare this language pair first.');
  return translator.translate(text);
}

export function releaseTranslations() {
  for (const translator of translators.values()) translator.destroy();
  translators.clear();
}
// Language-pack persistence belongs to Chrome; this map holds active objects only.
