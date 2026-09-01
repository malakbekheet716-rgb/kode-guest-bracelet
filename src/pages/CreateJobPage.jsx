import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { useToast } from '../context/ToastContext';
import * as jobsApi from '../api/jobsApi';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { MAX_BRACELETS_PER_BATCH } from '../utils/constants';
import { validateQuantity } from '../utils/validators';

function makeIdempotencyKey() {
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const MAX_ALLOWED = Math.min(30, MAX_BRACELETS_PER_BATCH);

export default function CreateJobPage() {
  const { operator, isAuthenticated } = useAuth();
  const { t, locale } = useLocale();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(makeIdempotencyKey);

  useEffect(() => {
    if (!isAuthenticated || !operator?.employeeId || !operator?.name) {
      navigate('/login', { replace: true, state: { from: '/create' } });
    }
  }, [isAuthenticated, operator, navigate]);

  function applyQuantity(next) {
    if (Number.isNaN(next)) {
      setQuantity('');
      setError(null);
      return;
    }
    if (next > MAX_ALLOWED) {
      setQuantity(MAX_ALLOWED);
      setError(t('errors.quantityTooHigh', { max: MAX_ALLOWED }));
      return;
    }
    if (next < 1) {
      setQuantity(1);
      setError(null);
      return;
    }
    setQuantity(next);
    setError(null);
  }

  function adjust(delta) {
    applyQuantity((quantity === '' ? 0 : Number(quantity)) + delta);
  }

  function handleInputChange(e) {
    const raw = e.target.value;
    if (raw === '') {
      setQuantity('');
      setError(null);
      return;
    }
    applyQuantity(Number(raw));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!operator?.employeeId || !operator?.name) {
      setFormError(t('errors.sessionNotFound'));
      notify(t('errors.sessionNotFound'), { type: 'error' });
      navigate('/login', { replace: true, state: { from: '/create' } });
      return;
    }

    const validationError = validateQuantity(quantity, { max: MAX_ALLOWED });
    if (validationError) {
      setError(t(`errors.${validationError}`, { max: MAX_ALLOWED }));
      return;
    }

    setError(null);
    setFormError('');
    setSubmitting(true);

    try {
      const job = await jobsApi.createJob({
        quantity: Number(quantity),
        operatorId: operator.employeeId,
        operatorName: operator.name,
        idempotencyKey,
      });

      setResult(job);
      notify(t('toast.jobCreated'), { type: 'success' });
    } catch (err) {
      let message = t('errors.generic');

      if (err.code === 'UNAUTHENTICATED') {
        message = t('errors.sessionNotFound');
      } else if (err.code === 'BATCH_LIMIT_EXCEEDED') {
        message = t('errors.quantityTooHigh', { max: MAX_ALLOWED });
      } else if (err.code === 'INSUFFICIENT_GUESTS') {
        message = t('errors.insufficientGuests', { count: err.available ?? 0 });
      } else if (err.code === 'NETWORK_ERROR') {
        message = t('errors.network');
      }

      setFormError(message);
      notify(message, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  function startAnother() {
    setResult(null);
    setQuantity(1);
    setError(null);
    setFormError('');
    setIdempotencyKey(makeIdempotencyKey());
  }

  if (!isAuthenticated || !operator) return null;

  if (result) {
    const ids = result.braceletNumbers || [];
    return (
      <div className="create-page create-page--centered" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="card result-panel create-card">
          <div className="result-panel__icon" aria-hidden="true">✓</div>
          <h1>{t('createJob.successTitle')}</h1>
          <p className="mt-4">
            {t('createJob.successBody', {
              quantity: result.quantity,
              name: result.createdBy?.name || operator.name,
              employeeId: result.createdBy?.employeeId || operator.employeeId,
            })}
          </p>
          {ids.length > 0 && (
            <p className="mono mt-4">
              {ids.length > 1 ? `${ids[0]} → ${ids[ids.length - 1]}` : ids[0]}
            </p>
          )}
          <div className="result-panel__actions">
            <Button variant="primary" onClick={() => navigate(`/jobs/${result.id}`)}>
              {t('createJob.viewJob')}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/')}>
              {t('createJob.backToDashboard')}
            </Button>
          </div>
          <div className="mt-5">
            <Button variant="ghost" size="sm" onClick={startAnother}>
              + {t('dashboard.createCta')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-page create-page--centered" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="card create-card">
        <div className="create-card__header">
          <div className="create-card__badge" aria-hidden="true">⌁</div>
          <div>
            <h1>{t('createJob.title')}</h1>
            <p>{t('createJob.subtitle')}</p>
          </div>
        </div>

        <div className="banner create-card__operator">
          <strong>{operator.name}</strong>
          <span className="text-muted"> · {operator.employeeId}</span>
        </div>

        {formError && (
          <div className="banner banner--error create-card__error" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Field
            label={t('createJob.quantityLabel')}
            error={error}
            help={!error ? t('createJob.quantityHelp', { max: MAX_ALLOWED }) : null}
          >
            <div className="stepper">
              <button
                type="button"
                className="stepper__btn"
                onClick={() => adjust(-1)}
                disabled={submitting || quantity <= 1}
                aria-label={t('createJob.decrease')}
              >
                −
              </button>
              <input
                type="number"
                className="stepper__input"
                value={quantity}
                min={1}
                max={MAX_ALLOWED}
                onChange={handleInputChange}
                disabled={submitting}
                inputMode="numeric"
              />
              <button
                type="button"
                className="stepper__btn"
                onClick={() => adjust(1)}
                disabled={submitting || quantity >= MAX_ALLOWED}
                aria-label={t('createJob.increase')}
              >
                +
              </button>
            </div>
          </Field>

          <div className="create-card__limit">
            <span>{t('createJob.batchLimit')}</span>
            <strong>{MAX_ALLOWED}</strong>
          </div>

          <Button type="submit" variant="primary" block loading={submitting}>
            {submitting ? t('createJob.submitting') : t('createJob.submitButton')}
          </Button>
        </form>
      </div>

      <style>{`
        .create-page--centered {
          min-height: calc(100vh - 120px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px 48px;
        }
        .create-card {
          width: min(100%, 520px);
          max-width: 520px !important;
          padding: 32px;
          box-sizing: border-box;
          box-shadow: 0 18px 50px rgba(20, 30, 60, .12);
        }
        .create-card__header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .create-card__header h1 { margin: 0 0 6px; }
        .create-card__header p { margin: 0; color: var(--color-text-muted, #667085); }
        .create-card__badge {
          width: 52px;
          height: 52px;
          flex: 0 0 52px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--color-blue, #0072BC), var(--color-purple, #7F3F98));
          color: white;
          font-size: 28px;
          font-weight: 800;
        }
        .create-card__operator { margin-bottom: 18px; }
        .create-card__error { margin-bottom: 18px; }
        .create-card__limit {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: -4px 0 20px;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(0,114,188,.06);
          font-size: 13px;
        }
        .create-card__limit strong { font-size: 16px; }
        .result-panel { text-align: center; }
        .result-panel__icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: var(--color-lime, #7A9926);
          color: white;
          font-size: 32px;
          font-weight: 800;
        }
        .result-panel__actions { justify-content: center; }
        @media (max-width: 600px) {
          .create-page--centered { padding: 20px 12px 32px; }
          .create-card { padding: 24px 20px; }
        }
      `}</style>
    </div>
  );
}
