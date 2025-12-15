export enum TaskStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
  REMINDED = "REMINDED", // Time arrived but user hasn't started
}

export enum Priority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.NOT_STARTED]: "待处理",
  [TaskStatus.IN_PROGRESS]: "执行中",
  [TaskStatus.COMPLETED]: "已完成",
  [TaskStatus.CANCELED]: "已终止",
  [TaskStatus.REMINDED]: "已提醒",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.HIGH]: "高优先级",
  [Priority.MEDIUM]: "普通",
  [Priority.LOW]: "低优先级",
};

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  estimatedDuration?: number; // Minutes
}

export interface Task {
  id: string;
  title: string;
  type: string; // Customizable type
  priority: Priority;
  status: TaskStatus;
  subtasks: Subtask[];
  createdAt: string; // ISO Date
  startTime: string; // ISO Date
  endTime: string; // ISO Date
  estimatedDuration: number; // Minutes
  actualDuration?: number; // Minutes
  notes?: string;
}

export interface Settings {
  idleReminderInterval: number; // Hours (user customizable)
  notificationsEnabled: boolean;
}

export interface FilterState {
  status: TaskStatus | "ALL";
  type: string;
  priority: Priority | "ALL";
  search: string;
}
