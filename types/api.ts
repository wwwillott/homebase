import { LmsProvider } from "@/types/lms";

export interface ApiError {
  error: string;
}

export interface SyncRunRequest {
  userId: string;
  providers?: LmsProvider[];
}

export interface AssignmentQuery {
  userId: string;
  view?: "daily" | "weekly" | "monthly" | "list";
  start?: string;
  end?: string;
  classId?: string;
  assignmentType?: "HOMEWORK" | "QUIZ" | "EXAM" | "PROJECT" | "READING" | "DISCUSSION" | "OTHER";
  completion?: "all" | "incomplete" | "complete";
  status?: "OPEN" | "COMPLETED" | "OVERDUE";
}
