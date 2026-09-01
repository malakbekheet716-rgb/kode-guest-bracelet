import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import * as jobsApi from '../api/jobsApi';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import JobTable from '../components/jobs/JobTable';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import { JobStatusBadge } from '../components/ui/StatusBadge';
import { formatDateTime } from '../utils/formatters';

export default function DashboardPage() {
  const { operator } = useAuth();
  const { t, lang } = useLocale();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [loading, setLoading] = useState(true);

  const employeeId = operator?.employeeId || operator?.id;

  const load = useCallback(async () => {
    if (!employeeId) return;
    const [statsRes, jobsRes] = await Promise.all([
      jobsApi.getCreationStats(employeeId),
      jobsApi.getJobs({ requestedBy: employeeId, page: 1, pageSize: 100 }),
    ]);
    setStats(statsRes);
    setJobs(jobsRes.items);
    setLoading(false);
  }, [employeeId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const attentionJobs = (jobs || []).filter((j) => j.status === 'FAILED' || j.needsAttention);
  const recentJobs = (jobs || []).slice(0, 6);

  return (
    <div>
      <div className="page-header">
        <div className="page-header__row">
          <div>
            <h1>{t('dashboard.welcomeBack', { name: operator?.name || '' })}</h1>
            <p className="text-muted text-sm">
              {t('auth.employeeId')}: <strong>{employeeId}</strong>
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonRows rows={2} />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label={t('dashboard.todayCreated')} value={stats?.today ?? 0} color="var(--color-blue)" />
            <StatCard label={t('dashboard.created')} value={stats?.total ?? 0} color="var(--color-lime)" />
          </div>

          <div className="mt-4" style={{ marginBottom: 'var(--space-6)' }}>
            <Button variant="primary" size="lg" block onClick={() => navigate('/create')}>
              + {t('dashboard.createCta')}
            </Button>
          </div>

          {attentionJobs.length > 0 && (
            <div className="section">
              <div className="section__title">{t('dashboard.needsAttentionTitle')}</div>
              <div className="table-wrap">
                <table className="table">
                  <tbody>
                    {attentionJobs.map((job) => (
                      <tr key={job.id} className="is-clickable" onClick={() => navigate(`/jobs/${job.id}`)}>
                        <td className="mono">{job.id.slice(-8)}</td>
                        <td>
                          <JobStatusBadge status={job.status} />
                        </td>
                        <td className="text-muted">{formatDateTime(job.createdAt, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="section">
            <div className="page-header__row">
              <div className="section__title">{t('dashboard.recentJobs')}</div>
              {jobs && jobs.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/bracelets')}>
                  {t('dashboard.viewAllJobs')}
                </Button>
              )}
            </div>
            {!jobs || recentJobs.length === 0 ? (
              <EmptyState title={t('dashboard.noJobs')} />
            ) : (
              <JobTable items={recentJobs} />
            )}
          </div>
        </>
      )}
    </div>
  );
}