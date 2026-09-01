import { useTheme } from '../../context/ThemeContext';
import kMarkBlack from '../../assets/kode-k-mark-black.png';
import kMarkWhite from '../../assets/kode-k-mark-white.png';

export default function BrandLockup({ size = 'md' }) {
  const { isDark } = useTheme();
  return (
    <div className={`brand-lockup brand-lockup--${size}`}>
      <img src={isDark ? kMarkWhite : kMarkBlack} alt="" className="brand-lockup__icon" />
      <span className="brand-lockup__word">KODE</span>
    </div>
  );
}