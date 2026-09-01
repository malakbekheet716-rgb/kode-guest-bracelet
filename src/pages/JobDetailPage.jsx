import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleContext';
import { useToast } from '../context/ToastContext';
import * as jobsApi from '../api/jobsApi';
import * as braceletsApi from '../api/braceletsApi';
import { usePolling } from '../hooks/usePolling';
import { JobStatusBadge } from '../components/ui/StatusBadge';
import JobProgress from '../components/jobs/JobProgress';
import BraceletTable from '../components/bracelets/BraceletTable';
import Button from '../components/ui/Button';
import { SkeletonRows } from '../components/ui/Skeleton';
import { JOB_STATUS } from '../utils/constants';
import { formatDateTime } from '../utils/formatters';

const TERMINAL_STATUSES = [JOB_STATUS.COMPLETED, JOB_STATUS.COMPLETED_WITH_ERRORS, JOB_STATUS.FAILED];

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLocale();
  const { notify } = useToast();
  const [retrying, setRetrying] = useState(false);
  const [bracelets, setBracelets] = useState(null);

  const fetchJob = useCallback(() => jobsApi.getJob(id), [id]);
  const isTerminal = useCallback((job) => TERMINAL_STATUSES.includes(job.status), []);

  const { data: job, error, loading, timedOut } = usePolling(fetchJob, {
    isTerminal,
    deps: [id],
  });

  const loadBracelets = useCallback(async () => {
    const res = await braceletsApi.getBracelets({ jobId: id, pageSize: 100 });
    setBracelets(res.items);
  }, [id]);

  // Refresh the guest list whenever the polled job data changes, so newly
  // resolved outcomes (ISSUED / FAILED / RECONCILIATION_REQUIRED) show up.
  useEffect(() => {
    loadBracelets();
  }, [loadBracelets, job]);

  async function handleRetryDispatch() {
    setRetrying(true);
    try {
      await jobsApi.retryJobDispatch(id);
      notify(t('toast.statusUpdated'), { type: 'success' });
    } catch {
      notify(t('errors.generic'), { type: 'error' });
    } finally {
      setRetrying(false);
    }
  }

  if (loading && !job) {
    return <SkeletonRows rows={4} />;
  }

  if (error || !job) {
    return <div className="banner banner--error">{t('errors.notFound')}</div>;
  }

  const total = job.quantity;

  return (
    <div>
      <div className="page-header">
        <div className="page-header__row">
          <div>
            <h1>
              {t('jobDetail.title')} · <span className="mono">{job.id.slice(-8)}</span>
            </h1>
          </div>
          <JobStatusBadge status={job.status} />
        </div>
      </div>

      {timedOut && <div className="banner banner--warning">{t('jobDetail.takingLonger')}</div>}
      {job.needsAttention && (
        <div className="banner banner--warning">{t('jobDetail.needsAttentionFlag')}</div>
      )}
      {job.status === JOB_STATUS.FAILED && (
        <div className="banner banner--error">
          <div style={{ flex: 1 }}>
            {t('jobDetail.dispatchFailedNote')}
            <div className="mt-4">
              <Button variant="secondary" size="sm" loading={retrying} onClick={handleRetryDispatch}>
                {t('jobDetail.retryDispatch')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="card mt-4" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="flex justify-between text-sm text-muted" style={{ marginBottom: 'var(--space-2)' }}>
          <span>{t('jobDetail.requestedBy')}</span>
          <span>{jobsApi.getOperatorLabel(job.requestedBy)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted" style={{ marginBottom: 'var(--space-2)' }}>
          <span>{t('jobDetail.quantity')}</span>
          <span>{job.quantity}</span>
        </div>
        <div className="flex justify-between text-sm text-muted" style={{ marginBottom: 'var(--space-4)' }}>
          <span>{t('jobDetail.createdAt')}</span>
          <span>{formatDateTime(job.createdAt, lang)}</span>
        </div>
        <JobProgress counts={job.guestCounts} total={total} />
      </div>

      <div className="section">
        <div className="section__title">{t('jobDetail.backToBracelets')}</div>
        {bracelets ? (
          <BraceletTable items={bracelets} emptyTitle={t('bracelets.empty')} />
        ) : (
          <SkeletonRows rows={3} />
        )}
      </div>

      <Button variant="ghost" onClick={() => navigate('/')}>
        {t('common.back')}
      </Button>
    </div>
  );
}
