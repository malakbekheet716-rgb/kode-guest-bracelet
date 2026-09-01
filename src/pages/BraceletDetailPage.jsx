import { useCallback, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as braceletsApi from '../api/braceletsApi';
import { BraceletStatusBadge } from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { SkeletonRows } from '../components/ui/Skeleton';
import { BRACELET_STATUS, ROLES } from '../utils/constants';
import { formatDateTime } from '../utils/formatters';

export default function BraceletDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLocale();
  const { operator } = useAuth();
  const { notify } = useToast();
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const fetchBracelet = useCallback(() => braceletsApi.getBracelet(id), [id]);
  const isTerminal = useCallback((b) => ![BRACELET_STATUS.QUEUED].includes(b.status), []);
  const { data: bracelet, loading, refetch } = usePolling(fetchBracelet, { isTerminal, deps: [id] });

  async function handleRetry() {
    setActionLoading(true);
    try { await braceletsApi.retryBracelet(id, operator.employeeId || operator.id, operator.name); notify(t('toast.retryQueued'), { type: 'success' }); setModal(null); refetch(); }
    catch { notify(t('errors.generic'), { type: 'error' }); } finally { setActionLoading(false); }
  }
  async function handleReconcile(outcome) {
    setActionLoading(true);
    try { await braceletsApi.reconcileBracelet(id, outcome, operator.employeeId || operator.id, operator.name); notify(t('toast.reconcileResolved'), { type: 'success' }); setModal(null); refetch(); }
    catch { notify(t('errors.generic'), { type: 'error' }); } finally { setActionLoading(false); }
  }
  async function handleStatusChange(newStatus) {
    setActionLoading(true);
    try { await braceletsApi.updateBraceletStatus(id, newStatus, { operatorId: operator.employeeId || operator.id, operatorName: operator.name, role: operator.role }); notify(t('toast.statusUpdated'), { type: 'success' }); setModal(null); refetch(); }
    catch { notify(t('errors.generic'), { type: 'error' }); } finally { setActionLoading(false); }
  }

  if (loading && !bracelet) return <SkeletonRows rows={5} />;
  if (!bracelet) return <div className="banner banner--error">{t('errors.notFound')}</div>;
  const isAdmin = operator.role === ROLES.ADMIN;
  const creator = bracelet.createdBy;

  return (
    <div>
      <div className="page-header"><div className="page-header__row"><h1 className="mono">{bracelet.braceletNumber}</h1><BraceletStatusBadge status={bracelet.status} /></div></div>
      {bracelet.lastIssueError && <div className="banner banner--error">{bracelet.lastIssueError}</div>}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <DetailRow label={t('braceletDetail.braceletCode')} value={bracelet.braceletCode} />
        <DetailRow label={t('jobDetail.requestedBy')} value={creator ? `${creator.name} (${creator.employeeId})` : t('common.none')} />
        <DetailRow label={t('braceletDetail.job')}>{bracelet.jobId ? <Link to={`/jobs/${bracelet.jobId}`}>{bracelet.jobId.slice(-8)}</Link> : t('common.none')}</DetailRow>
        <DetailRow label={t('braceletDetail.issuedAt')} value={formatDateTime(bracelet.issuedAt, lang)} />
        <DetailRow label={t('braceletDetail.activatedAt')} value={formatDateTime(bracelet.activatedAt, lang)} />
        <DetailRow label={t('braceletDetail.revokedAt')} value={formatDateTime(bracelet.revokedAt, lang)} last />
      </div>
      <div className="section"><div className="section__title">{t('braceletDetail.actions')}</div><div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
        {bracelet.status === BRACELET_STATUS.FAILED && <Button variant="primary" onClick={() => setModal('retry')}>{t('braceletDetail.retryButton')}</Button>}
        {bracelet.status === BRACELET_STATUS.RECONCILIATION_REQUIRED && <Button variant="primary" onClick={() => setModal('reconcile')}>{t('braceletDetail.reconcileButton')}</Button>}
        {bracelet.status === BRACELET_STATUS.ISSUED && <Button variant="secondary" onClick={() => handleStatusChange(BRACELET_STATUS.ACTIVE)}>{t('braceletDetail.markActive')}</Button>}
        {bracelet.status === BRACELET_STATUS.ACTIVE && <><Button variant="secondary" onClick={() => handleStatusChange(BRACELET_STATUS.LOST)}>{t('braceletDetail.markLost')}</Button><Button variant="danger" onClick={() => setModal('revoke')} disabled={!isAdmin} title={!isAdmin ? t('braceletDetail.adminOnly') : undefined}>{t('braceletDetail.markRevoked')}{!isAdmin && ` (${t('braceletDetail.adminOnly')})`}</Button></>}
        {[BRACELET_STATUS.FAILED, BRACELET_STATUS.RECONCILIATION_REQUIRED, BRACELET_STATUS.ISSUED, BRACELET_STATUS.ACTIVE].includes(bracelet.status) || <span className="text-sm text-muted">{t('common.none')}</span>}
      </div></div>
      <div className="section"><div className="section__title">{t('braceletDetail.eventHistory')}</div>{bracelet.events.length === 0 ? <p className="text-muted text-sm">{t('braceletDetail.noEvents')}</p> : <div className="table-wrap"><table className="table"><tbody>{[...bracelet.events].reverse().map((ev) => <tr key={ev.id}><td className="text-muted" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(ev.createdAt, lang)}</td><td>{ev.eventType}</td><td className="text-muted">{ev.triggeredByName ? `${ev.triggeredByName} (${ev.employeeId || ev.triggeredBy})` : ev.triggeredBy}</td><td className="text-muted">{ev.oldStatus ? `${ev.oldStatus} → ${ev.newStatus}` : ev.newStatus}</td></tr>)}</tbody></table></div>}</div>
      <Button variant="ghost" onClick={() => navigate(-1)}>{t('common.back')}</Button>
      {modal === 'retry' && <Modal title={t('braceletDetail.retryConfirmTitle')} onClose={() => setModal(null)} actions={<><Button variant="secondary" onClick={() => setModal(null)}>{t('common.cancel')}</Button><Button variant="primary" loading={actionLoading} onClick={handleRetry}>{t('common.confirm')}</Button></Modal>}><p>{t('braceletDetail.retryConfirmBody')}</p></Modal>}
      {modal === 'reconcile' && <Modal title={t('braceletDetail.reconcileTitle')} onClose={() => setModal(null)}><p>{t('braceletDetail.reconcileBody')}</p><div className="banner banner--warning">{t('braceletDetail.reconcileWarning')}</div><div className="flex flex-col gap-2"><Button variant="primary" loading={actionLoading} onClick={() => handleReconcile('CONFIRMED_EXISTS')}>{t('braceletDetail.reconcileExists')}</Button><Button variant="secondary" loading={actionLoading} onClick={() => handleReconcile('CONFIRMED_MISSING')}>{t('braceletDetail.reconcileMissing')}</Button></div></Modal>}
      {modal === 'revoke' && <Modal title={t('braceletDetail.confirmRevokeTitle')} onClose={() => setModal(null)} actions={<><Button variant="secondary" onClick={() => setModal(null)}>{t('common.cancel')}</Button><Button variant="danger" loading={actionLoading} onClick={() => handleStatusChange(BRACELET_STATUS.REVOKED)}>{t('braceletDetail.markRevoked')}</Button></Modal>}><p>{t('braceletDetail.confirmRevokeBody')}</p></Modal>}
    </div>
  );
}
function DetailRow({ label, value, children, last }) { return <div className="flex justify-between text-sm" style={{ paddingBlockEnd: last ? 0 : 'var(--space-2)', marginBlockEnd: last ? 0 : 'var(--space-2)' }}><span className="text-muted">{label}</span><span>{children || value}</span></div>; }
