import en from './en.json';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function t(key: string): string {
  const parts = key.split('.');
  let current: any = en;
  for (const part of parts) {
    if (FORBIDDEN_KEYS.has(part)) {
      return key;
    }
    if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, part)) {
      current = Reflect.get(current, part);
    } else {
      return key;
    }
  }
  return typeof current === 'string' ? current : key;
}

export function useTranslation() {
  return { t };
}
