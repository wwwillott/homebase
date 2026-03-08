import { AggregatedAssignment } from "@/types/lms";

interface Props {
  items: AggregatedAssignment[];
}

export function InsightsPanel({ items }: Props) {
  const overdue = items.filter((x) => x.mergedFields.status === "OVERDUE").length;
  const open = items.filter((x) => x.mergedFields.status === "OPEN").length;

  return (
    <aside className="card">
      <h2>Snapshot</h2>
      <div style={{ marginTop: "0.9rem", display: "grid", gap: "0.8rem" }}>
        <div>
          <strong>{open}</strong>
          <div className="muted">Open assignments</div>
        </div>
        <div>
          <strong>{overdue}</strong>
          <div className="muted">Overdue assignments</div>
        </div>
        <div>
          <strong>{items.filter((x) => x.needsReview).length}</strong>
          <div className="muted">Possible duplicate pairs</div>
        </div>
      </div>
    </aside>
  );
}
