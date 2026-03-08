import { Worker } from "bullmq";
import { prisma } from "@/lib/db/prisma";
import { dueSoonAssignments } from "@/lib/reminders/service";
import { runSync } from "@/lib/sync/service";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const syncWorker = new Worker(
  "sync-queue",
  async (job) => {
    const { userId, providers } = job.data as {
      userId: string;
      providers: Array<"LEARNING_SUITE" | "CANVAS" | "GRADESCOPE" | "MAX">;
    };
    await runSync(userId, providers);
  },
  { connection: { url: REDIS_URL } }
);

const reminderWorker = new Worker(
  "reminder-queue",
  async (job) => {
    const { userId } = job.data as { userId: string };
    const dueSoon = await dueSoonAssignments(userId);

    for (const assignment of dueSoon) {
      await prisma.assignmentChangeLog.create({
        data: {
          assignmentId: assignment.id,
          field: "reminder",
          oldValue: null,
          newValue: `Queued reminder for due date ${assignment.dueAt.toISOString()}`
        }
      });
    }
  },
  { connection: { url: REDIS_URL } }
);

syncWorker.on("completed", (job) => {
  console.log(`sync job completed: ${job.id}`);
});

reminderWorker.on("completed", (job) => {
  console.log(`reminder job completed: ${job.id}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await syncWorker.close();
    await reminderWorker.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}
