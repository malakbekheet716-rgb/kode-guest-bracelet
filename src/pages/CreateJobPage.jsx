import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { useToast } from '../context/ToastContext';
import * as jobsApi from '../api/jobsApi';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { SkeletonRows } from '../components/ui/Skeleton';
import { MAX_GUESTS_PER_JOB } from '../utils/constants';
import { validateQuantity } from '../utils/validators';

function makeIdempotencyKey() {
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function CreateJobPage() {
  const { operator } = useAuth();
  const { t } = useLocale();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [allowance, setAllowance] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(makeIdempotencyKey);

  useEffect(() => {
    jobsApi.getAllowance(operator.id).then(setAllowance);
  }, [operator.id]);

  const maxAllowed = useMemo(() => {
    if (!allowance) return MAX_GUESTS_PER_JOB;
    return Math.max(0, Math.min(MAX_GUESTS_PER_JOB, allowance.remaining));
  }, [allowance]);

  useEffect(() => {
    if (allowance && quantity > maxAllowed && maxAllowed > 0) {
      setQuantity(maxAllowed);
    }
  }, [allowance, maxAllowed, quantity]);

  function adjust(delta) {
    setQuantity((q) => Math.min(maxAllowed, Math.max(1, q + delta)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validateQuantity(quantity, { max: maxAllowed });
    if (validationError) {
      setError(t(`errors.${validationError}`, { max: maxAllowed }));
      return;
    }
    setError(null);
    setFormError('');
    setSubmitting(true);
    try {
      const job = await jobsApi.createJob({
        quantity: Number(quantity),
        operatorId: operator.id,
        idempotencyKey,
      });
      setResult(job);
      notify(t('toast.jobCreated'), { type: 'success' });
    } catch (err) {
      if (err.code === 'ALLOWANCE_EXCEEDED') {
        setFormError(t('createJob.limitExceeded', { remaining: allowance?.remaining ?? 0 }));
      } else if (err.code === 'INSUFFICIENT_GUESTS') {
        setFormError(err.message);
      } else {
        setFormError(t('errors.generic'));
      }
      notify(t('toast.jobCreateFailed'), { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  function startAnother() {
    setResult(null);
    setQuantity(1);
    setIdempotencyKey(makeIdempotencyKey());
    jobsApi.getAllowance(operator.id).then(setAllowance);
  }

  if (!allowance) {
    return (
      <div>
        <div className="page-header">
          <h1>{t('createJob.title')}</h1>
        </div>
        <SkeletonRows rows={3} />
      </div>
    );
  }

  if (result) {
    return (
      <div className="card result-panel">
        <div className="result-panel__icon" style={{ background: 'var(--color-lime)' }}>
          ✓
        </div>
        <h1>{t('createJob.successTitle')}</h1>
        <p className="mt-4">{t('createJob.successBody', { quantity: result.quantity })}</p>
        <div className="result-panel__actions">
          <Button variant="primary" onClick={() => navigate(`/jobs/${result.id}`)}>
            {t('createJob.viewJob')}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/')}>
            {t('createJob.backToDashboard')}
          </Button>
        </div>
        <div className="mt-5">
          <Button variant="ghost" size="sm" onClick={startAnother} disabled={maxAllowed <= 0}>
            + {t('dashboard.createCta')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t('createJob.title')}</h1>
        <p>{t('createJob.subtitle')}</p>
      </div>

      <div className="card" style={{ maxWidth: 420 }}>
        {formError && <div className="banner banner--error">{formError}</div>}

        {maxAllowed <= 0 ? (
          <div className="banner banner--warning">
            {t('dashboard.limitReachedBanner', { max: allowance.max })}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <Field
              label={t('createJob.quantityLabel')}
              error={error}
              help={!error ? t('createJob.quantityHelp', { max: maxAllowed }) : null}
            >
              <div className="stepper">
                <button
                  type="button"
                  className="stepper__btn"
                  onClick={() => adjust(-1)}
                  disabled={quantity <= 1}
                  aria-label="decrease"
                >
                  −
                </button>
                <input
                  type="number"
                  className="stepper__input"
                  value={quantity}
                  min={1}
                  max={maxAllowed}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <button
                  type="button"
                  className="stepper__btn"
                  onClick={() => adjust(1)}
                  disabled={quantity >= maxAllowed}
                  aria-label="increase"
                >
                  +
                </button>
              </div>
            </Field>

            <p className="text-sm text-muted mt-4" style={{ marginBottom: 'var(--space-4)' }}>
              {t('createJob.remainingNote', { remaining: allowance.remaining, max: allowance.max })}
            </p>

            <Button type="submit" variant="primary" block loading={submitting}>
              {submitting ? t('createJob.submitting') : t('createJob.submitButton')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
