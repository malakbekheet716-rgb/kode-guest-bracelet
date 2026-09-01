import { STATUS_COLOR, JOB_STATUS_COLOR } from '../../utils/constants';
import { useLocale } from '../../i18n/LocaleContext';

export function BraceletStatusBadge({ status }) {
  const { t } = useLocale();
  const color = STATUS_COLOR[status] || '#6B7280';
  return (
    <span
      className="status-badge"
      style={{ '--badge-color': color, '--badge-bg': `${color}1A` }}
    >
      <span className="status-badge__dot" />
      {t(`statuses.${status}`)}
    </span>
  );
}

export function JobStatusBadge({ status }) {
  const { t } = useLocale();
  const color = JOB_STATUS_COLOR[status] || '#6B7280';
  return (
    <span
      className="status-badge"
      style={{ '--badge-color': color, '--badge-bg': `${color}1A` }}
    >
      <span className="status-badge__dot" />
      {t(`jobStatuses.${status}`)}
    </span>
  );
}
