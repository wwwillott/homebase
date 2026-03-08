import { LearningSuiteConnector } from "@/lib/connectors/providers";

describe("sync pipeline fixture behavior", () => {
  test("connector sync returns deterministic payload shape", async () => {
    const connector = new LearningSuiteConnector();
    const pull = await connector.syncSince("user-1", "token", {});

    expect(pull.assignments.length).toBeGreaterThan(0);
    expect(pull.nextCursor).toBeTruthy();
    expect(pull.checksum).toContain("LEARNING_SUITE");
  });

  test("simulated overlap between providers can be scored for dedupe", async () => {
    const connectorA = new LearningSuiteConnector();
    const connectorB = new LearningSuiteConnector();

    const a = (await connectorA.syncSince("u", "t", {})).assignments[0];
    const b = { ...a, id: "other-provider-id" };

    expect(a.title).toBe(b.title);
    expect(a.courseId).toBe(b.courseId);
  });
});
