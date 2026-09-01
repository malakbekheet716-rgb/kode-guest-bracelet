import { useLocale } from '../../i18n/LocaleContext';

export default function LanguageSwitch() {
  const { toggleLang, t } = useLocale();
  return (
    <button type="button" className="btn btn--ghost btn--sm" onClick={toggleLang}>
      {t('nav.language')}
    </button>
  );
}
