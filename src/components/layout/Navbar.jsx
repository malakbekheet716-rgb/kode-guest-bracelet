import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../i18n/LocaleContext';
import LanguageSwitch from '../ui/LanguageSwitch';
import ThemeToggle from '../ui/ThemeToggle';
import BrandLockup from '../ui/BrandLockup';
import Button from '../ui/Button';
import * as braceletsApi from '../../api/braceletsApi';
import { BRACELET_STATUS } from '../../utils/constants';

export default function Navbar() {
  const { operator, logout } = useAuth();
  const { t } = useLocale();
  const [reconciliationCount, setReconciliationCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await braceletsApi.getBracelets({
          status: BRACELET_STATUS.RECONCILIATION_REQUIRED,
          pageSize: 1,
        });
        if (!cancelled) setReconciliationCount(res.total);
      } catch {
        // silent — nav badge is a convenience, not critical
      }
    }
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const navLinkClass = ({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`;

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <BrandLockup size="sm" />
        <span className="topbar__title">{t('common.appSubtitle')}</span>
      </div>

      <nav className="topbar__nav">
        <NavLink to="/" end className={navLinkClass}>
          {t('nav.dashboard')}
        </NavLink>
        <NavLink to="/bracelets" className={navLinkClass}>
          {t('nav.bracelets')}
        </NavLink>
        <NavLink to="/reconciliation" className={navLinkClass}>
          {t('nav.reconciliation')}
          {reconciliationCount > 0 && (
            <span className="nav-link__dot">{reconciliationCount}</span>
          )}
        </NavLink>
      </nav>

      <div className="topbar__right">
        <ThemeToggle />
        <LanguageSwitch />
        <span className="text-sm text-muted">{operator?.name}</span>
        <Button variant="ghost" size="sm" onClick={logout}>
          {t('nav.logout')}
        </Button>
      </div>
    </header>
  );
}