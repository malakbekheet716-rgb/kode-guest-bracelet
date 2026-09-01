import { useLocale } from '../../i18n/LocaleContext';
import { BRACELET_STATUS } from '../../utils/constants';

export default function BraceletFilters({ search, onSearchChange, status, onStatusChange }) {
  const { t } = useLocale();

  return (
    <div className="flex gap-3 mt-4" style={{ flexWrap: 'wrap' }}>
      <input
        type="text"
        className="field__input"
        style={{ maxWidth: 280 }}
        placeholder={t('bracelets.searchPlaceholder')}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        className="field__input"
        style={{ maxWidth: 220 }}
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="">{t('bracelets.allStatuses')}</option>
        {Object.values(BRACELET_STATUS).map((s) => (
          <option key={s} value={s}>
            {t(`statuses.${s}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
