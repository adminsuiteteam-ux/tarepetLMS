import en from './en.json';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function t(key: string, fallback?: string): string {
  const parts = key.split('.');
  let current: any = en;
  for (const part of parts) {
    if (FORBIDDEN_KEYS.has(part)) {
      return fallback ?? key;
    }
    if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, part)) {
      current = Reflect.get(current, part);
    } else {
      return fallback ?? key;
    }
  }
  return typeof current === 'string' ? current : (fallback ?? key);
}

export function useTranslation() {
  return { t };
}
