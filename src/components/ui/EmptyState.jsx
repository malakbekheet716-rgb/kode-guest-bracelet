export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      {title && <div className="empty-state__title">{title}</div>}
      {description && <p>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
