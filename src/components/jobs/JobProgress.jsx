import { useLocale } from '../../i18n/LocaleContext';
import { STATUS_COLOR } from '../../utils/constants';

export default function JobProgress({ counts, total }) {
  const { t } = useLocale();

  const segments = [
    { key: 'issued', label: t('jobDetail.issued'), value: counts.issued, color: STATUS_COLOR.ISSUED },
    { key: 'reconciliationRequired', label: t('jobDetail.reconciliationRequired'), value: counts.reconciliationRequired, color: STATUS_COLOR.RECONCILIATION_REQUIRED },
    { key: 'failed', label: t('jobDetail.failed'), value: counts.failed, color: STATUS_COLOR.FAILED },
    { key: 'queued', label: t('jobDetail.queued'), value: counts.queued, color: STATUS_COLOR.QUEUED },
    { key: 'pending', label: t('jobDetail.pending'), value: counts.pending, color: STATUS_COLOR.PENDING },
  ].filter((s) => s.value > 0);

  return (
    <div>
      <div className="progress-bar">
        {segments.map((s) => (
          <div
            key={s.key}
            className="progress-bar__seg"
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
          />
        ))}
      </div>
      <div className="legend">
        {segments.map((s) => (
          <span key={s.key} className="legend__item">
            <span className="legend__dot" style={{ background: s.color }} />
            {s.label}: {s.value}
          </span>
        ))}
      </div>
    </div>
  );
}
