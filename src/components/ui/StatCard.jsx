export default function StatCard({ label, value, color }) {
  return (
    <div className="stat-card" style={color ? { '--stat-color': color } : undefined}>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value mono">{value}</div>
    </div>
  );
}
