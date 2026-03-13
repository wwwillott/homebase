"use client";

import dayjs from "dayjs";
import { AggregatedAssignment } from "@/types/lms";

interface Props {
  items: AggregatedAssignment[];
  rangeStart: string;
  rangeEnd: string;
  onRangeChange: (nextStart: string, nextEnd: string) => void;
}

function truncateTitle(title: string) {
  const parts = title.trim().split(/\s+/);
  if (parts.length <= 3) {
    return title;
  }
  return parts.slice(0, 4).join(" ");
}

export function CalendarView({ items, rangeStart, rangeEnd, onRangeChange }: Props) {
  const start = dayjs(rangeStart);
  const end = dayjs(rangeEnd);

  const days: dayjs.Dayjs[] = [];
  let cursor = start;
  while (cursor.isBefore(end) || cursor.isSame(end, "day")) {
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

  const weekdayLabels =
    weeks[0]?.map((day) => day.format("ddd")) ?? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.8rem" }}>
        <div className="row">
          <label className="row">
            <span>Start</span>
            <input
              type="date"
              value={rangeStart}
              onChange={(event) => onRangeChange(event.target.value, rangeEnd)}
            />
          </label>
          <label className="row">
            <span>End</span>
            <input
              type="date"
              value={rangeEnd}
              onChange={(event) => onRangeChange(rangeStart, event.target.value)}
            />
          </label>
        </div>
        <button type="button" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div className="calendar-grid">
        {weekdayLabels.map((label) => (
          <div key={label} className="calendar-header">
            {label}
          </div>
        ))}
        {weeks.map((week, idx) => (
          <div key={`week-${idx}`} className="calendar-week">
            {week.map((day) => {
              const key = day.format("YYYY-MM-DD");
              const dayItems = assignmentsByDay.get(key) ?? [];
              return (
                <div key={key} className="calendar-day">
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
