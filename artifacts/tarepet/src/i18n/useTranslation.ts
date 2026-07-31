import en from './en.json';

export function t(key: string): string {
  const parts = key.split('.');
  let current: any = en;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return key;
    }
  }
  return typeof current === 'string' ? current : key;
}

export function useTranslation() {
  return { t };
}
