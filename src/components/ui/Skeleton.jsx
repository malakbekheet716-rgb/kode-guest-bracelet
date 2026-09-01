export function SkeletonLine({ width = '100%', height = 14 }) {
  return <div className="skeleton" style={{ width, height, marginBlock: 4 }} />;
}

export function SkeletonRows({ rows = 3 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} />
      ))}
    </div>
  );
}
