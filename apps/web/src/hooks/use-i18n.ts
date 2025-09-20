import { useTranslations } from 'next-intl';

export function useI18n() {
  return useTranslations();
}

export function useScopedI18n(scope: string) {
  return useTranslations(scope);
}