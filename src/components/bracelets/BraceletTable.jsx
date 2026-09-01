import { useNavigate } from 'react-router-dom';
import { BraceletStatusBadge } from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';
import { useLocale } from '../../i18n/LocaleContext';
import { formatDateTime } from '../../utils/formatters';

export default function BraceletTable({ items, emptyTitle, emptyDescription }) {
  const navigate = useNavigate();
  const { t, lang } = useLocale();

  if (!items.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>{t('bracelets.braceletNumber')}</th>
            <th>{t('bracelets.statusCol')}</th>
            <th>{t('bracelets.updatedAt')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.id} className="is-clickable" onClick={() => navigate(`/bracelets/${b.id}`)}>
              <td className="mono">{b.braceletNumber}</td>
              <td>
                <BraceletStatusBadge status={b.status} />
              </td>
              <td className="text-muted">
                {formatDateTime(b.issuedAt || b.createdAt, lang)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
