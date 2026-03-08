"use client";

import { AggregatedAssignment } from "@/types/lms";

interface Props {
  items: AggregatedAssignment[];
  onToggled: () => Promise<void>;
}

export function AssignmentList({ items, onToggled }: Props) {
  if (items.length === 0) {
    return <p className="muted">No assignments found for this range.</p>;
  }

  return (
    <div className="card">
      <h2>Assignments</h2>
      <div style={{ marginTop: "0.8rem", display: "grid", gap: "0.75rem" }}>
        {items.map((item) => (
          <article
            key={item.canonicalAssignmentId}
            style={{
              border: "1px solid var(--list-item-line)",
              borderRadius: 12,
              padding: "0.75rem",
              opacity: item.mergedFields.status === "COMPLETED" ? 0.55 : 1,
              background:
                item.mergedFields.status === "COMPLETED"
                  ? "var(--list-item-complete-bg)"
                  : "var(--list-item-bg)"
            }}
          >
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="row">
                <input
                  type="checkbox"
                  checked={item.mergedFields.status === "COMPLETED"}
                  onChange={async (event) => {
                    await fetch(`/api/assignments/${item.canonicalAssignmentId}/completion`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        completed: event.currentTarget.checked
                      })
                    });
                    await onToggled();
                  }}
                />
                <h3
                  style={{
                    fontSize: "1rem",
                    textDecoration:
                      item.mergedFields.status === "COMPLETED" ? "line-through" : "none"
                  }}
                >
                  {item.mergedFields.title}
                </h3>
              </div>
              {item.needsReview ? <small>Possible duplicate</small> : null}
            </div>
            <p className="muted" style={{ margin: "0.45rem 0" }}>
              {item.mergedFields.description || "No description provided."}
            </p>
            <div className="row">
              <span
                className="pill"
                style={{ background: item.mergedFields.courseColor ?? "#dbeafe" }}
              >
                {item.mergedFields.courseName}
              </span>
              <small>Source: {formatSource(item.mergedFields.source)}</small>
              <small>Type: {item.mergedFields.assignmentType}</small>
              <small>{new Date(item.mergedFields.dueAt).toLocaleString()}</small>
              <small>Status: {item.mergedFields.status}</small>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function formatSource(source: AggregatedAssignment["mergedFields"]["source"]) {
  switch (source) {
    case "CANVAS":
      return "Canvas";
    case "GRADESCOPE":
      return "Gradescope";
    case "LEARNING_SUITE":
      return "Learning Suite";
    case "MAX":
      return "Max";
    default:
      return source;
  }
}
