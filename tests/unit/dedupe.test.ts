import { scoreDuplicate } from "@/lib/dedupe/scoring";

describe("dedupe scoring", () => {
  test("marks highly similar assignments as high-confidence duplicate", () => {
    const a = {
      id: "1",
      userId: "u1",
      sourceCourseId: "course-a",
      title: "Homework 3 - Derivatives",
      dueAt: new Date("2026-03-10T18:00:00Z")
    };

    const b = {
      ...a,
      id: "2",
      title: "Homework 3 Derivatives",
      dueAt: new Date("2026-03-10T19:00:00Z")
    };

    const result = scoreDuplicate(a, b);
    expect(result.isHighConfidence).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.85);
  });

  test("keeps unrelated assignments separate", () => {
    const result = scoreDuplicate(
      {
        id: "1",
        userId: "u1",
        sourceCourseId: "math",
        title: "Lab report",
        dueAt: new Date("2026-03-12T10:00:00Z")
      },
      {
        id: "2",
        userId: "u1",
        sourceCourseId: "history",
        title: "Midterm essay",
        dueAt: new Date("2026-03-30T10:00:00Z")
      }
    );

    expect(result.isPossibleDuplicate).toBe(false);
  });
});
