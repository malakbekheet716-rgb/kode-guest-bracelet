import { useTheme } from '../../context/ThemeContext';
import kLogoBlue from '../../assets/kode-k-logo-blue.png';
import kLogoBlueDark from '../../assets/kode-k-logo-blue-dark.png';
import kodeWordmarkBlue from '../../assets/kode-wordmark-blue.png';

export default function BrandLockup({ size = 'md' }) {
  const { isDark } = useTheme();
  return (
    <div className={`brand-lockup brand-lockup--${size}`}>
      <img src={isDark ? kLogoBlueDark : kLogoBlue} alt="" className="brand-lockup__icon" />
      <img src={kodeWordmarkBlue} alt="KODE" className="brand-lockup__wordmark" />
    </div>
  );
}