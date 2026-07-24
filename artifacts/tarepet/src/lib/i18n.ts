// Lightweight internationalization (i18n) utility for Tarepet Montessori
// Supports string lookup and fallback for UI localization safely without prototype pollution.

const defaultTranslations = new Map<string, string>();

export function t(key: string, fallback?: string): string {
  if (typeof key !== 'string' || key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return fallback ?? String(key);
  }
  if (defaultTranslations.has(key)) {
    return defaultTranslations.get(key) ?? fallback ?? key;
  }
  return fallback ?? key;
}

export function useTranslation() {
  return {
    t: (key: string, fallback?: string) => t(key, fallback),
    i18n: {
      language: 'en',
      changeLanguage: async (_lang: string) => {
        // Safe placeholder for dynamic translation pack loading
      },
    },
  };
}
