import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleContext';
import * as authApi from '../api/authApi';
import Field, { TextInput } from '../components/ui/Field';
import Button from '../components/ui/Button';
import LanguageSwitch from '../components/ui/LanguageSwitch';
import ThemeToggle from '../components/ui/ThemeToggle';
import BrandLockup from '../components/ui/BrandLockup';
import { validateEmail, validatePassword, validateRequired, passwordsMatch } from '../utils/validators';

export default function SignupPage() {
  const { t } = useLocale();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {
      name: validateRequired(form.name) ? t('errors.required') : null,
      email: validateEmail(form.email) ? t(`errors.${validateEmail(form.email)}`) : null,
      password: validatePassword(form.password) ? t(`errors.${validatePassword(form.password)}`) : null,
      confirmPassword: passwordsMatch(form.password, form.confirmPassword)
        ? t(`errors.${passwordsMatch(form.password, form.confirmPassword)}`)
        : null,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setFormError('');
    setSubmitting(true);
    try {
      await authApi.requestSignup(form);
      setDone(true);
    } catch (err) {
      setFormError(err.code === 'CONFLICT' ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="auth-layout">
        <div className="auth-card">
          <BrandLockup size="lg" />
          <div className="result-panel" style={{ padding: 0 }}>
            <div className="result-panel__icon" style={{ background: 'var(--color-lime)' }}>
              ✓
            </div>
            <h1>{t('auth.signupSuccessTitle')}</h1>
            <p className="mt-4">{t('auth.signupSuccessBody')}</p>
            <div className="result-panel__actions">
              <Button variant="primary" onClick={() => navigate('/login')}>
                {t('auth.backToLogin')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="flex justify-between items-center">
          <BrandLockup size="lg" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitch />
          </div>
        </div>
        <h1>{t('auth.signupTitle')}</h1>
        <p className="auth-card__subtitle">{t('auth.signupSubtitle')}</p>

        {formError && <div className="banner banner--error">{formError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <Field label={t('auth.fullName')} htmlFor="name" error={errors.name}>
            <TextInput
              id="name"
              value={form.name}
              error={errors.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </Field>
          <Field label={t('auth.email')} htmlFor="signup-email" error={errors.email}>
            <TextInput
              id="signup-email"
              type="email"
              autoComplete="username"
              value={form.email}
              error={errors.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </Field>
          <Field label={t('auth.password')} htmlFor="signup-password" error={errors.password}>
            <TextInput
              id="signup-password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              error={errors.password}
              onChange={(e) => update('password', e.target.value)}
            />
          </Field>
          <Field label={t('auth.confirmPassword')} htmlFor="confirm-password" error={errors.confirmPassword}>
            <TextInput
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              error={errors.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
            />
          </Field>
          <Button type="submit" variant="primary" block loading={submitting}>
            {submitting ? t('auth.signingUp') : t('auth.signupButton')}
          </Button>
        </form>

        <div className="auth-card__footer">
          {t('auth.haveAccount')} <Link to="/login">{t('auth.goToLogin')}</Link>
        </div>
      </div>
    </div>
  );
}