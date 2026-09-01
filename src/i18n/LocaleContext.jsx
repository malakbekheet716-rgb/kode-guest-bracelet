import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import en from './en';
import ar from './ar';

const DICTS = { en, ar };
const RTL_LANGS = new Set(['ar']);
const STORAGE_KEY = 'kode_gbs_lang';

const LocaleContext = createContext(null);

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => (vars[key] !== undefined ? vars[key] : `{{${key}}}`));
}

export function LocaleProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return window.localStorage.getItem(STORAGE_KEY) || 'en';
  });

  const dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang, dir]);

  const t = useCallback(
    (path, vars) => {
      const dict = DICTS[lang] || DICTS.en;
      const value = getByPath(dict, path) ?? getByPath(DICTS.en, path);
      if (value === undefined) return path;
      return interpolate(value, vars);
    },
    [lang]
  );

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  }, []);

  const value = useMemo(
    () => ({ lang, dir, isRtl: dir === 'rtl', setLang, toggleLang, t }),
    [lang, dir, toggleLang, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider');
  return ctx;
}
