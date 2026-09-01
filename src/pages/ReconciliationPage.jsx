import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as braceletsApi from '../api/braceletsApi';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { SkeletonRows } from '../components/ui/Skeleton';
import { BRACELET_STATUS } from '../utils/constants';
import { formatDateTime } from '../utils/formatters';

export default function ReconciliationPage() {
  const { t, lang } = useLocale();
  const { operator } = useAuth();
  const { notify } = useToast();

  const [items, setItems] = useState(null);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await braceletsApi.getBracelets({
      status: BRACELET_STATUS.RECONCILIATION_REQUIRED,
      pageSize: 100,
    });
    setItems(res.items);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  async function resolve(outcome) {
    setActionLoading(true);
    try {
      await braceletsApi.reconcileBracelet(selected.id, outcome, operator.id);
      notify(t('toast.reconcileResolved'), { type: 'success' });
      setSelected(null);
      load();
    } catch {
      notify(t('errors.generic'), { type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t('reconciliation.title')}</h1>
        <p>{t('reconciliation.subtitle')}</p>
      </div>

      {items === null ? (
        <SkeletonRows rows={4} />
      ) : items.length === 0 ? (
        <EmptyState title={t('reconciliation.empty')} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t('bracelets.braceletNumber')}</th>
                <th>{t('braceletDetail.lastError')}</th>
                <th>{t('bracelets.updatedAt')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id}>
                  <td className="mono">
                    <Link to={`/bracelets/${b.id}`}>{b.braceletNumber}</Link>
                  </td>
                  <td className="text-muted">{b.lastIssueError}</td>
                  <td className="text-muted">{formatDateTime(b.createdAt, lang)}</td>
                  <td>
                    <Button variant="secondary" size="sm" onClick={() => setSelected(b)}>
                      {t('braceletDetail.reconcileButton')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <Modal title={t('braceletDetail.reconcileTitle')} onClose={() => setSelected(null)}>
          <p className="mono">{selected.braceletNumber}</p>
          <p>{t('braceletDetail.reconcileBody')}</p>
          <div className="banner banner--warning">{t('braceletDetail.reconcileWarning')}</div>
          <div className="flex flex-col gap-2">
            <Button variant="primary" loading={actionLoading} onClick={() => resolve('CONFIRMED_EXISTS')}>
              {t('braceletDetail.reconcileExists')}
            </Button>
            <Button variant="secondary" loading={actionLoading} onClick={() => resolve('CONFIRMED_MISSING')}>
              {t('braceletDetail.reconcileMissing')}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
