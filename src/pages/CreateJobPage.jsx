import {
  useEffect,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { useToast } from '../context/ToastContext';

import * as jobsApi from '../api/jobsApi';

import Button from '../components/ui/Button';
import Field from '../components/ui/Field';

import {
  MAX_BRACELETS_PER_BATCH,
} from '../utils/constants';

import {
  validateQuantity,
} from '../utils/validators';

function makeIdempotencyKey() {
  return `idem-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

const MAX_ALLOWED = Math.min(
  30,
  MAX_BRACELETS_PER_BATCH
);

export default function CreateJobPage() {
  const {
    operator,
    isAuthenticated,
  } = useAuth();

  const {
    t,
    dir,
  } = useLocale();

  const {
    notify,
  } = useToast();

  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(makeIdempotencyKey);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !operator?.employeeId ||
      !operator?.name
    ) {
      navigate('/login', {
        replace: true,
        state: {
          from: '/create',
        },
      });
    }
  }, [
    isAuthenticated,
    operator,
    navigate,
  ]);

  function adjust(delta) {
    const current = quantity === '' ? 1 : Number(quantity);
    let next = current + delta;
    if (Number.isNaN(next)) next = 1;
    if (next < 1) next = 1;
    if (next > MAX_ALLOWED) next = MAX_ALLOWED;
    setQuantity(next);
    setError(null);
  }

  function handleInputChange(e) {
    const raw = e.target.value;

    if (raw === '') {
      setQuantity('');
      setError(t('errors.required'));
      return;
    }

    setQuantity(raw);

    const validationError = validateQuantity(raw, {
      max: MAX_ALLOWED,
    });

    if (validationError) {
      setError(
        t(`errors.${validationError}`, {
          max: MAX_ALLOWED,
        })
      );
    } else {
      setError(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setFormError('');

    if (
      !operator?.employeeId ||
      !operator?.name
    ) {
      const message = t('errors.sessionNotFound');
      setFormError(message);
      notify(message, {
        type: 'error',
      });
      navigate('/login', {
        replace: true,
        state: {
          from: '/create',
        },
      });
      return;
    }

    const validationError = validateQuantity(quantity, {
      max: MAX_ALLOWED,
    });

    if (validationError) {
      const message = t(`errors.${validationError}`, {
        max: MAX_ALLOWED,
      });
      setError(message);
      return;
    }

    setError(null);
    setFormError('');
    setSubmitting(true);

    try {
      const job = await jobsApi.createJob({
        quantity: Number(quantity),
        operatorId: operator.employeeId || operator.id,
        operatorName: operator.name,
        idempotencyKey,
      });

      setResult(job);

      notify(t('toast.jobCreated'), {
        type: 'success',
      });
    } catch (err) {
      let message = t('errors.generic');

      if (err?.code === 'UNAUTHENTICATED') {
        message = t('errors.sessionNotFound');
      } else if (err?.code === 'BATCH_LIMIT_EXCEEDED') {
        message = t('errors.quantityTooHigh', {
          max: MAX_ALLOWED,
        });
      } else if (err?.code === 'INSUFFICIENT_GUESTS') {
        message = t('errors.insufficientGuests', {
          count: err?.available ?? 0,
        });
      } else if (err?.code === 'NETWORK_ERROR') {
        message = t('errors.network');
      } else if (err?.code === 'VALIDATION_ERROR') {
        message = err?.message || t('errors.generic');
      }

      setFormError(message);
      notify(message, {
        type: 'error',
      });

      if (err?.code === 'UNAUTHENTICATED') {
        navigate('/login', {
          replace: true,
          state: {
            from: '/create',
          },
        });
      }
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

  if (
    !isAuthenticated ||
    !operator
  ) {
    return null;
  }

  if (result) {
    const ids = result.braceletNumbers || [];

    return (
      <div
        className="create-page create-page--centered"
        dir={dir}
      >
        <div className="card result-panel create-card">
          <div
            className="result-panel__icon"
            aria-hidden="true"
            style={{ background: 'var(--color-lime)' }}
          >
            ✓
          </div>

          <h1>
            {t('createJob.successTitle')}
          </h1>

          <p className="mt-4">
            {t('createJob.successBody', {
              quantity: result.quantity,
              name: result.createdBy?.name || operator.name,
              employeeId: result.createdBy?.employeeId || operator.employeeId || operator.id,
            })}
          </p>

          {ids.length > 0 && (
            <div
              className="banner banner--info mt-4 mono"
              style={{
                justifyContent: 'center',
                fontSize: '1.1rem',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              {ids.length > 1
                ? `${ids[0]} → ${ids[ids.length - 1]}`
                : ids[0]}
            </div>
          )}

          <div className="result-panel__actions">
            <Button
              variant="primary"
              onClick={() => navigate(`/jobs/${result.id}`)}
            >
              {t('createJob.viewJob')}
            </Button>

            <Button
              variant="secondary"
              onClick={() => navigate('/')}
            >
              {t('createJob.backToDashboard')}
            </Button>
          </div>

          <div className="mt-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={startAnother}
            >
              + {t('dashboard.createCta')}
            </Button>
          </div>
        </div>

        <style>{`
          .create-page--centered {
            min-height: calc(100vh - 140px);
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px 40px;
            box-sizing: border-box;
          }

          .create-card {
            width: min(100%, 520px);
            max-width: 520px !important;
            margin: 0 auto;
            padding: 32px;
            box-sizing: border-box;
            box-shadow: var(--shadow-md);
          }

          .result-panel {
            text-align: center;
          }

          .result-panel__icon {
            width: 60px;
            height: 60px;
            margin: 0 auto 16px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            color: white;
            font-size: 28px;
            font-weight: 800;
          }

          .result-panel__actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className="create-page create-page--centered"
      dir={dir}
    >
      <div className="card create-card">
        <div className="create-card__header">
          <div
            className="create-card__badge"
            aria-hidden="true"
          >
            ⌁
          </div>

          <div>
            <h1>
              {t('createJob.title')}
            </h1>

            <p>
              {t('createJob.subtitle')}
            </p>
          </div>
        </div>

        <div className="banner create-card__operator">
          <strong>
            {operator.name}
          </strong>

          <span className="text-muted">
            {' '}
            · {operator.employeeId || operator.id}
          </span>
        </div>

        {formError && (
          <div
            className="banner banner--error create-card__error"
            role="alert"
          >
            {formError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
        >
          <Field
            label={t('createJob.quantityLabel')}
            error={error}
            help={
              !error
                ? t('createJob.quantityHelp', {
                    max: MAX_ALLOWED,
                  })
                : null
            }
          >
            <div className="stepper">
              <button
                type="button"
                className="stepper__btn"
                onClick={() => adjust(-1)}
                disabled={
                  submitting ||
                  Number(quantity) <= 1
                }
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
                disabled={
                  submitting ||
                  Number(quantity) >= MAX_ALLOWED
                }
                aria-label={t('createJob.increase')}
              >
                +
              </button>
            </div>
          </Field>

          <div className="create-card__limit">
            <span>
              {t('createJob.batchLimit')}
            </span>

            <strong>
              {MAX_ALLOWED}
            </strong>
          </div>

          <Button
            type="submit"
            variant="primary"
            block
            loading={submitting}
            disabled={Boolean(error) || submitting}
          >
            {submitting
              ? t('createJob.submitting')
              : t('createJob.submitButton')}
          </Button>
        </form>
      </div>

      <style>{`
        .create-page--centered {
          min-height: calc(100vh - 140px);
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px 40px;
          box-sizing: border-box;
        }

        .create-card {
          width: min(100%, 520px);
          max-width: 520px !important;
          margin: 0 auto;
          padding: 32px;
          box-sizing: border-box;
          box-shadow: var(--shadow-md);
        }

        .create-card__header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .create-card__header h1 {
          margin: 0 0 6px;
        }

        .create-card__header p {
          margin: 0;
          color: var(--color-muted, #667085);
        }

        .create-card__badge {
          width: 52px;
          height: 52px;
          flex: 0 0 52px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: linear-gradient(
            135deg,
            var(--color-blue, #0072bc),
            var(--color-purple, #7f3f98)
          );
          color: white;
          font-size: 28px;
          font-weight: 800;
        }

        .create-card__operator {
          margin-bottom: 18px;
        }

        .create-card__error {
          margin-bottom: 18px;
        }

        .create-card__limit {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: -4px 0 20px;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(0, 114, 188, 0.06);
          font-size: 13px;
        }

        .create-card__limit strong {
          font-size: 16px;
        }

        @media (max-width: 600px) {
          .create-page--centered {
            padding: 16px 12px 28px;
          }

          .create-card {
            padding: 24px 18px;
          }

          .create-card__header {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}