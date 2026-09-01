import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import Field, { TextInput } from '../components/ui/Field';
import Button from '../components/ui/Button';
import LanguageSwitch from '../components/ui/LanguageSwitch';
import ThemeToggle from '../components/ui/ThemeToggle';
import BrandLockup from '../components/ui/BrandLockup';
import { validateRequired } from '../utils/validators';

export default function LoginPage() {
  const { login, sessionExpired, clearSessionExpired } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(sessionExpired ? t('auth.sessionExpired') : '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = {
      name: validateRequired(name) ? t('errors.required') : null,
      employeeId: validateRequired(employeeId) ? t('errors.required') : null,
    };
    setFieldErrors(errors);
    if (errors.name || errors.employeeId) return;

    setFormError('');
    setSubmitting(true);
    try {
      await login(name.trim(), employeeId.trim());
      clearSessionExpired();
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setFormError(err.code === 'VALIDATION_ERROR' ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="flex justify-between items-center">
          <BrandLockup size="lg" />
          <div className="flex items-center gap-2"><ThemeToggle /><LanguageSwitch /></div>
        </div>
        <h1>{t('auth.loginTitle')}</h1>
        <p className="auth-card__subtitle">{t('auth.loginSubtitle')}</p>
        {formError && <div className="banner banner--error">{formError}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <Field label={t('auth.employeeName')} htmlFor="employee-name" error={fieldErrors.name}>
            <TextInput id="employee-name" type="text" autoComplete="name" value={name} error={fieldErrors.name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={t('auth.employeeId')} htmlFor="employee-id" error={fieldErrors.employeeId}>
            <TextInput id="employee-id" type="text" autoComplete="off" value={employeeId} error={fieldErrors.employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
          </Field>
          <Button type="submit" variant="primary" block loading={submitting}>
            {submitting ? t('auth.loggingIn') : t('auth.loginButton')}
          </Button>
        </form>
        <div className="auth-card__hint">{t('auth.sharedLoginHint')}</div>
      </div>
    </div>
  );
}
