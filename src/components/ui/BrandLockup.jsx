import { useTheme } from '../../context/ThemeContext';
import kLogo from '../../assets/kode-k-logo.png';
import kLogoDark from '../../assets/kode-k-logo-dark.png';
import kodeWordmark from '../../assets/kode-wordmark-purple.png';

export default function BrandLockup({ size = 'md' }) {
  const { isDark } = useTheme();
  return (
    <div className={`brand-lockup brand-lockup--${size}`}>
      <img src={isDark ? kLogoDark : kLogo} alt="" className="brand-lockup__icon" />
      <img src={kodeWordmark} alt="KODE" className="brand-lockup__wordmark" />
    </div>
  );
}