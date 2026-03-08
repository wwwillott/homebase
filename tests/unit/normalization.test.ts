import { CanvasConnector } from "@/lib/connectors/providers";

describe("connector normalization", () => {
  test("normalizes canvas assignment shape", () => {
    const connector = new CanvasConnector();
    const normalized = connector.normalize(
      {
        id: "a1",
        courseId: "c1",
        courseName: "Physics 101",
        title: "Problem Set #1",
        dueAt: "2026-03-11T23:59:00Z",
        description: "Upload PDF"
      },
      "user-1"
    );

    expect(normalized.source).toBe("CANVAS");
    expect(normalized.title).toBe("problem set 1");
    expect(normalized.userId).toBe("user-1");
    expect(normalized.status).toBe("OPEN");
    expect(normalized.assignmentType).toBe("HOMEWORK");
  });
});
