import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import Field, { TextInput } from '../components/ui/Field';
import Button from '../components/ui/Button';
import LanguageSwitch from '../components/ui/LanguageSwitch';
import ThemeToggle from '../components/ui/ThemeToggle';
import BrandLockup from '../components/ui/BrandLockup';
import { validateEmail, validateRequired } from '../utils/validators';

export default function LoginPage() {
  const { login, sessionExpired, clearSessionExpired } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(sessionExpired ? t('auth.sessionExpired') : '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = {
      email: validateEmail(email) ? t(`errors.${validateEmail(email)}`) : null,
      password: validateRequired(password) ? t('errors.required') : null,
    };
    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    setFormError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      clearSessionExpired();
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(err.code === 'UNAUTHENTICATED' ? t('auth.loginError') : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
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
        <h1>{t('auth.loginTitle')}</h1>
        <p className="auth-card__subtitle">{t('auth.loginSubtitle')}</p>

        {formError && <div className="banner banner--error">{formError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <Field label={t('auth.email')} htmlFor="email" error={fieldErrors.email}>
            <TextInput
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              error={fieldErrors.email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label={t('auth.password')} htmlFor="password" error={fieldErrors.password}>
            <TextInput
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              error={fieldErrors.password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" variant="primary" block loading={submitting}>
            {submitting ? t('auth.loggingIn') : t('auth.loginButton')}
          </Button>
        </form>

        <div className="auth-card__hint">{t('auth.demoHint')}</div>

        <div className="auth-card__footer">
          {t('auth.noAccount')}{' '}
          <Link to="/signup">{t('auth.goToSignup')}</Link>
        </div>
      </div>
    </div>
  );
}