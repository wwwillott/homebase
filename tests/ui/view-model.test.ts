import { groupAssignmentsByDay, sortAssignments } from "@/lib/view-model";
import { AggregatedAssignment } from "@/types/lms";

const fixture = (id: string, due: string): AggregatedAssignment => ({
  canonicalAssignmentId: id,
  memberAssignmentIds: [id],
  dedupeConfidence: 1,
  needsReview: false,
  mergedFields: {
    title: id,
    dueAt: new Date(due),
    courseName: "Course",
    status: "OPEN",
    assignmentType: "OTHER"
  }
});

describe("view models", () => {
  test("sorts ascending by due date", () => {
    const sorted = sortAssignments([
      fixture("B", "2026-03-11T23:00:00Z"),
      fixture("A", "2026-03-10T23:00:00Z")
    ]);

    expect(sorted.map((x) => x.canonicalAssignmentId)).toEqual(["A", "B"]);
  });

  test("groups by YYYY-MM-DD", () => {
    const grouped = groupAssignmentsByDay([
      fixture("A", "2026-03-10T10:00:00Z"),
      fixture("B", "2026-03-10T14:00:00Z"),
      fixture("C", "2026-03-11T14:00:00Z")
    ]);

    expect(Object.keys(grouped)).toEqual(["2026-03-10", "2026-03-11"]);
    expect(grouped["2026-03-10"]).toHaveLength(2);
  });
});
