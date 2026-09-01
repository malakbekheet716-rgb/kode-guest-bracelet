import { useNavigate } from 'react-router-dom';
import { JobStatusBadge } from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';
import { useLocale } from '../../i18n/LocaleContext';
import { formatDateTime } from '../../utils/formatters';

export default function JobTable({ items, emptyTitle, emptyDescription }) {
  const navigate = useNavigate();
  const { t, lang } = useLocale();
  if (!items.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return <div className="table-wrap"><table className="table"><thead><tr><th>{t('jobDetail.jobId')}</th><th>{t('jobDetail.quantity')}</th><th>{t('jobDetail.requestedBy')}</th><th>{t('jobDetail.status')}</th><th>{t('jobDetail.createdAt')}</th></tr></thead><tbody>
    {items.map((job) => <tr key={job.id} className="is-clickable" onClick={() => navigate(`/jobs/${job.id}`)}>
      <td className="mono">{job.id.slice(-8)}</td><td>{job.quantity}</td>
      <td><strong>{job.createdBy?.name || job.requestedByName || job.requestedBy}</strong><div className="text-muted text-sm">{job.createdBy?.employeeId || job.requestedBy}</div></td>
      <td><JobStatusBadge status={job.status} />{job.needsAttention && <span className="nav-link__dot" style={{ marginInlineStart: 8 }}>!</span>}</td>
      <td className="text-muted">{formatDateTime(job.createdAt, lang)}</td>
    </tr>)}
  </tbody></table></div>;
}
