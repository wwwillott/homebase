import { AggregatedAssignment } from "@/types/lms";

export function sortAssignments(items: AggregatedAssignment[]) {
  return [...items].sort((a, b) => +new Date(a.mergedFields.dueAt) - +new Date(b.mergedFields.dueAt));
}

export function groupAssignmentsByDay(items: AggregatedAssignment[]) {
  return items.reduce<Record<string, AggregatedAssignment[]>>((acc, item) => {
    const key = new Date(item.mergedFields.dueAt).toISOString().slice(0, 10);
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});
}
