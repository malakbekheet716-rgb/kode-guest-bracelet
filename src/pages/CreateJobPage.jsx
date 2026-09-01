import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { useToast } from '../context/ToastContext';
import * as jobsApi from '../api/jobsApi';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { MAX_BRACELETS_PER_BATCH } from '../utils/constants';
import { validateQuantity } from '../utils/validators';

function makeIdempotencyKey() { return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
const MAX_ALLOWED = MAX_BRACELETS_PER_BATCH;

export default function CreateJobPage() {
  const { operator } = useAuth();
  const { t } = useLocale();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(makeIdempotencyKey);

  function applyQuantity(next) {
    if (Number.isNaN(next)) { setQuantity(''); setError(null); return; }
    if (next > MAX_ALLOWED) { setQuantity(MAX_ALLOWED); setError(t('errors.quantityTooHigh', { max: MAX_ALLOWED })); return; }
    if (next < 1) { setQuantity(1); setError(null); return; }
    setQuantity(next); setError(null);
  }
  function adjust(delta) { applyQuantity((quantity === '' ? 0 : quantity) + delta); }
  function handleInputChange(e) { const raw = e.target.value; if (raw === '') { setQuantity(''); setError(null); return; } applyQuantity(Number(raw)); }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validateQuantity(quantity, { max: MAX_ALLOWED });
    if (validationError) { setError(t(`errors.${validationError}`, { max: MAX_ALLOWED })); return; }
    setError(null); setFormError(''); setSubmitting(true);
    try {
      const job = await jobsApi.createJob({ quantity: Number(quantity), operatorId: operator.employeeId || operator.id, operatorName: operator.name, idempotencyKey });
      setResult(job);
      notify(t('toast.jobCreated'), { type: 'success' });
    } catch (err) {
      setFormError(err.code === 'BATCH_LIMIT_EXCEEDED' ? t('errors.quantityTooHigh', { max: MAX_ALLOWED }) : err.code === 'INSUFFICIENT_GUESTS' ? err.message : t('errors.generic'));
      notify(t('toast.jobCreateFailed'), { type: 'error' });
    } finally { setSubmitting(false); }
  }
  function startAnother() { setResult(null); setQuantity(1); setError(null); setFormError(''); setIdempotencyKey(makeIdempotencyKey()); }

  if (result) {
    const ids = result.braceletNumbers || [];
    return <div className="card result-panel">
      <div className="result-panel__icon" style={{ background: 'var(--color-lime)' }}>✓</div>
      <h1>{t('createJob.successTitle')}</h1>
      <p className="mt-4">{t('createJob.successBody', { quantity: result.quantity, name: result.createdBy?.name || operator.name, employeeId: result.createdBy?.employeeId || operator.employeeId })}</p>
      {ids.length > 0 && <p className="mono mt-4">{ids.length > 1 ? `${ids[0]} → ${ids[ids.length - 1]}` : ids[0]}</p>}
      <div className="result-panel__actions">
        <Button variant="primary" onClick={() => navigate(`/jobs/${result.id}`)}>{t('createJob.viewJob')}</Button>
        <Button variant="secondary" onClick={() => navigate('/')}>{t('createJob.backToDashboard')}</Button>
      </div>
      <div className="mt-5"><Button variant="ghost" size="sm" onClick={startAnother}>+ {t('dashboard.createCta')}</Button></div>
    </div>;
  }

  return <div>
    <div className="page-header"><h1>{t('createJob.title')}</h1><p>{t('createJob.subtitle')}</p></div>
    <div className="card" style={{ maxWidth: 420 }}>
      <div className="banner" style={{ marginBottom: 'var(--space-4)' }}><strong>{operator.name}</strong><span className="text-muted"> · {operator.employeeId}</span></div>
      {formError && <div className="banner banner--error">{formError}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <Field label={t('createJob.quantityLabel')} error={error} help={!error ? t('createJob.quantityHelp', { max: MAX_ALLOWED }) : null}>
          <div className="stepper">
            <button type="button" className="stepper__btn" onClick={() => adjust(-1)} disabled={quantity <= 1} aria-label="decrease">−</button>
            <input type="number" className="stepper__input" value={quantity} min={1} max={MAX_ALLOWED} onChange={handleInputChange} />
            <button type="button" className="stepper__btn" onClick={() => adjust(1)} aria-label="increase">+</button>
          </div>
        </Field>
        <Button type="submit" variant="primary" block loading={submitting}>{submitting ? t('createJob.submitting') : t('createJob.submitButton')}</Button>
      </form>
    </div>
  </div>;
}
