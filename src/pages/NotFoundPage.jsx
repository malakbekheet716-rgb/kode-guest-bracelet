import { Link } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleContext';

export default function NotFoundPage() {
  const { t } = useLocale();
  return (
    <div className="empty-state">
      <h1>404</h1>
      <p className="mt-4">{t('errors.notFound')}</p>
      <div className="mt-5">
        <Link to="/" className="btn btn--primary">
          {t('dashboard.title')}
        </Link>
      </div>
    </div>
  );
}
