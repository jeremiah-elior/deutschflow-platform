export function StatCard({ title, value, caption }: { title: string; value: string | number; caption?: string }) {
  return (
    <div className="statCard">
      <span>{title}</span>
      <strong>{value}</strong>
      {caption ? <small>{caption}</small> : null}
    </div>
  );
}
