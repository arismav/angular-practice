// ─── Primitive types ──────────────────────────────────────────────────────────
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskFilter = 'all' | TaskStatus;

// ─── Domain entities ──────────────────────────────────────────────────────────

export interface Member {
  id: number;
  name: string;
  initials: string;
  /** Full Tailwind class, e.g. 'bg-violet-500' — defined as literals so Tailwind scans them */
  avatarColor: string;
  role: 'owner' | 'member';
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: number | null;
  dueDate: string | null; // ISO date string, e.g. '2026-03-22'
}

export interface Project {
  id: number;
  name: string;
  description: string;
  tags: string[];
  members: Member[];
  tasks: Task[];
}

// ─── Root state ───────────────────────────────────────────────────────────────
// One signal holds the entire tree; selectors (computed) project slices of it.

export interface AppState {
  projects: Project[];
  activeProjectId: number;
  filter: TaskFilter;
}
