import { useState, useEffect } from 'react';

type Locale = 'en-US' | 'pt-BR';
type Translations = Record<string, any>;

export const useI18n = () => {
  const [locale, setLocale] = useState<Locale>('en-US');
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadTranslations = async (locale: Locale): Promise<Translations> => {
    try {
      const response = await fetch(`/src/locales/${locale}.json`);
      return await response.json();
    } catch (error) {
      console.error('Failed to load translations:', error);
      return {};
    }
  };

  useEffect(() => {
    const savedLocale = localStorage.getItem('user-locale') as Locale | null;
    const browserLang = navigator.language as Locale;
    const initialLocale = savedLocale || (browserLang.startsWith('pt') ? 'pt-BR' : 'en-US');
    
    const initialize = async () => {
      const loadedTranslations = await loadTranslations(initialLocale);
      setTranslations(loadedTranslations);
      setLocale(initialLocale);
      localStorage.setItem('user-locale', initialLocale);
      document.documentElement.lang = initialLocale;
      setIsLoading(false);
    };

    initialize();
  }, []);

  const changeLocale = async (newLocale: Locale) => {
    if (newLocale === locale || isLoading) return;
    
    setIsLoading(true);
    try {
      const loadedTranslations = await loadTranslations(newLocale);
      setTranslations(loadedTranslations);
      setLocale(newLocale);
      localStorage.setItem('user-locale', newLocale);
      document.documentElement.lang = newLocale;
    } catch (error) {
      console.error('Failed to change locale:', error);
      if (newLocale !== 'en-US') {
        await changeLocale('en-US');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string, values?: Record<string, string | number>): string => {
    if (isLoading) return '';
    
    const keys = key.split('.');
    const value = keys.reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : ''), translations as any);
    
    if (typeof value === 'string' && values && Object.keys(values).length > 0) {
      let result = value;
      Object.entries(values).forEach(([k, v]) => {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
      return result || key;
    }
    
    return value || key;
  };

  return { t, locale, changeLocale, isLoading };
};

// This is a fallback function that will be replaced when useI18n is used
export const t = (key: string, _values?: Record<string, string | number>): string => {
  return key;
};
