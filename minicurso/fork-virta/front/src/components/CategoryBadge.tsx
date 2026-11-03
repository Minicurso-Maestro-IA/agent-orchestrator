/** Small colored pill showing a category, tinted with its own color. */
export function CategoryBadge({
  name,
  color,
}: {
  name: string;
  color: string | null;
}) {
  const c = "#71717a" ?? color;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${c}1a`, color: c }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {name}
    </span>
  );
}
