import { AggregatedAssignment } from "@/types/lms";

interface Props {
  mode: "daily" | "weekly" | "monthly";
  items: AggregatedAssignment[];
}

export function ScheduleView({ mode, items }: Props) {
  const grouped = new Map<string, AggregatedAssignment[]>();
  for (const item of items) {
    const key = new Date(item.mergedFields.dueAt).toLocaleDateString();
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  return (
    <div className="card">
      <h2>{mode[0].toUpperCase() + mode.slice(1)} Schedule</h2>
      <div style={{ marginTop: "0.8rem", display: "grid", gap: "0.8rem" }}>
        {Array.from(grouped.entries()).map(([date, dayItems]) => (
          <section key={date} style={{ border: "1px solid #e6ebf4", borderRadius: 10, padding: "0.7rem" }}>
            <h3 style={{ fontSize: "0.95rem" }}>{date}</h3>
            <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem" }}>
              {dayItems.map((item) => (
                <li key={item.canonicalAssignmentId}>
                  {item.mergedFields.title} ({item.mergedFields.courseName})
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!grouped.size ? <p className="muted">Nothing due in this window.</p> : null}
      </div>
    </div>
  );
}
