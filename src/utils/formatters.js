export function formatDateTime(value, locale = 'en') {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const intlLocale = locale === 'ar' ? 'ar-EG' : 'en-US';
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatRelativeTime(value, locale = 'en') {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const intlLocale = locale === 'ar' ? 'ar-EG' : 'en-US';
  const rtf = new Intl.RelativeTimeFormat(intlLocale, { numeric: 'auto' });

  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ];
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffSec) >= secondsInUnit || unit === 'second') {
      const value2 = Math.round(diffSec / secondsInUnit);
      return rtf.format(value2, unit);
    }
  }
  return '—';
}

export function formatNumber(value, locale = 'en') {
  const intlLocale = locale === 'ar' ? 'ar-EG' : 'en-US';
  return new Intl.NumberFormat(intlLocale).format(value);
}
