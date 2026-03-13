"use client";

import dayjs from "dayjs";
import { AggregatedAssignment } from "@/types/lms";

interface Props {
  items: AggregatedAssignment[];
  mode: "day" | "week" | "month";
  onModeChange: (nextMode: "day" | "week" | "month") => void;
  onShift: (direction: -1 | 1) => void;
}

function truncateTitle(title: string) {
  const parts = title.trim().split(/\s+/);
  if (parts.length <= 3) {
    return title;
  }
  return parts.slice(0, 4).join(" ");
}

export function CalendarView({
  items,
  mode,
  onModeChange,
  onShift
}: Props) {
  const anchor = dayjs();
  const rangeStart =
    mode === "day" ? anchor.startOf("day") : mode === "week" ? anchor.startOf("week") : anchor.startOf("month").startOf("week");
  const rangeEnd =
    mode === "day" ? anchor.endOf("day") : mode === "week" ? anchor.endOf("week") : anchor.endOf("month").endOf("week");

  const days: dayjs.Dayjs[] = [];
  let cursor = rangeStart;
  while (cursor.isBefore(rangeEnd) || cursor.isSame(rangeEnd, "day")) {
    days.push(cursor);
    cursor = cursor.add(1, "day");
  }

  const weeks: dayjs.Dayjs[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const assignmentsByDay = new Map<string, AggregatedAssignment[]>();
  for (const item of items) {
    const key = dayjs(item.mergedFields.dueAt).format("YYYY-MM-DD");
    const existing = assignmentsByDay.get(key) ?? [];
    existing.push(item);
    assignmentsByDay.set(key, existing);
  }

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="card calendar-fullbleed">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.8rem" }}>
        <div className="row">
          {(["day", "week", "month"] as const).map((option) => (
            <button
              key={option}
              type="button"
              style={{ borderColor: mode === option ? "#1d4ed8" : undefined }}
              onClick={() => onModeChange(option)}
            >
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
          <div className="row">
            <button type="button" onClick={() => onShift(-1)}>
              Prev
            </button>
            <button type="button" onClick={() => onShift(1)}>
              Next
            </button>
          </div>
        </div>
        <button type="button" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div className="calendar-title">
        {mode === "month"
          ? anchor.format("MMMM YYYY")
          : mode === "week"
          ? `${rangeStart.format("MMM D")} - ${rangeEnd.format("MMM D")}`
          : anchor.format("dddd, MMM D")}
      </div>

      <div className="calendar-grid">
        <div className="calendar-header-row">
          {weekdayLabels.map((label) => (
            <div key={label} className="calendar-header">
              {label}
            </div>
          ))}
        </div>
        {weeks.map((week, idx) => (
          <div key={`week-${idx}`} className="calendar-week">
            {week.map((day) => {
              const key = day.format("YYYY-MM-DD");
              const dayItems = assignmentsByDay.get(key) ?? [];
              const inRange =
                mode === "day"
                  ? day.isSame(anchor, "day")
                  : mode === "week"
                  ? day.isSame(anchor, "week")
                  : day.isSame(anchor, "month");
              return (
                <div key={key} className={`calendar-day${inRange ? "" : " is-muted"}`}>
                  <div className="calendar-date">{day.format("MMM D")}</div>
                  <ul className="calendar-list">
                    {dayItems.map((item) => (
                      <li key={item.canonicalAssignmentId}>
                        <span className="calendar-pill" style={{ background: item.mergedFields.courseColor ?? "#dbeafe" }}>
                          {truncateTitle(item.mergedFields.title)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
