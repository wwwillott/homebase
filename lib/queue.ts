import { Queue } from "bullmq";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export const syncQueue = new Queue("sync-queue", {
  connection: { url: REDIS_URL }
});

export const reminderQueue = new Queue("reminder-queue", {
  connection: { url: REDIS_URL }
});

export const calendarQueue = new Queue("calendar-queue", {
  connection: { url: REDIS_URL }
});
