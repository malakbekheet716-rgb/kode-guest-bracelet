import { useEffect, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import * as braceletsApi from '../api/braceletsApi';
import BraceletTable from '../components/bracelets/BraceletTable';
import BraceletFilters from '../components/bracelets/BraceletFilters';
import Button from '../components/ui/Button';
import { SkeletonRows } from '../components/ui/Skeleton';

const PAGE_SIZE = 20;

export default function BraceletsPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    braceletsApi
      .getBracelets({ braceletNumber: search || undefined, status: status || undefined, page, pageSize: PAGE_SIZE })
      .then((res) => {
        if (!cancelled) {
          setResult(res);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [search, status, page]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <div className="page-header">
        <h1>{t('bracelets.title')}</h1>
      </div>

      <BraceletFilters search={search} onSearchChange={setSearch} status={status} onStatusChange={setStatus} />

      <div className="mt-5">
        {loading && !result ? (
          <SkeletonRows rows={6} />
        ) : (
          <BraceletTable
            items={result.items}
            emptyTitle={search || status ? t('bracelets.noResults') : t('bracelets.empty')}
          />
        )}
      </div>

      {result && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t('common.previous')}
          </Button>
          <span className="text-sm text-muted">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
