import { Injectable, computed, signal } from '@angular/core';
import {
  AppState,
  Task,
  TaskFilter,
  TaskPriority,
  TaskStatus,
} from '../models/project.model';

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL_STATE: AppState = {
  activeProjectId: 1,
  filter: 'all',
  projects: [
    {
      id: 1,
      name: 'Angular 21 — Signals Deep Dive',
      description:
        'A production-grade example showcasing signal-based state, computed selectors, and reactive component patterns.',
      tags: ['Angular 21', 'Signals', 'TypeScript', 'Tailwind'],
      members: [
        { id: 1, name: 'Alice Johnson', initials: 'AJ', avatarColor: 'bg-violet-500', role: 'owner'  },
        { id: 2, name: 'Bob Smith',     initials: 'BS', avatarColor: 'bg-sky-500',    role: 'member' },
        { id: 3, name: 'Carol White',   initials: 'CW', avatarColor: 'bg-rose-500',   role: 'member' },
      ],
      tasks: [
        { id: 1, title: 'Setup workspace',            description: 'Initialize Angular 21 with Tailwind v4',             status: 'done',        priority: 'high',   assigneeId: 1, dueDate: '2026-03-15' },
        { id: 2, title: 'Define AppState model',      description: 'Create complex nested interfaces for the store',     status: 'done',        priority: 'high',   assigneeId: 1, dueDate: '2026-03-16' },
        { id: 3, title: 'Build signal store service', description: 'Implement ProjectService with computed selectors',   status: 'in-progress', priority: 'high',   assigneeId: 2, dueDate: '2026-03-22' },
        { id: 4, title: 'Design kanban board UI',     description: 'Task board with three status columns and filtering', status: 'in-progress', priority: 'medium', assigneeId: 3, dueDate: '2026-03-23' },
        { id: 5, title: 'Add member assignment',      description: 'Link tasks to team members via assigneeId',         status: 'todo',        priority: 'medium', assigneeId: null, dueDate: '2026-03-28' },
        { id: 6, title: 'Write component tests',      description: 'Unit tests for signal-based services and components', status: 'todo',      priority: 'low',    assigneeId: 2, dueDate: '2026-03-30' },
      ],
    },
  ],
};

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ProjectService {
  // ── Single source of truth ────────────────────────────────────────────────
  // One private writable signal holds the entire AppState tree.
  // Components NEVER mutate it directly — they call action methods below.
  private readonly _state = signal<AppState>(INITIAL_STATE);

  // ── Selectors — computed() slices of the state tree ───────────────────────
  // Each selector is a fine-grained, memoised projection.
  // A component subscribes ONLY to the slice it needs, keeping OnPush
  // change detection minimal — re-renders happen only when that slice changes.

  /** The full active-project object */
  readonly activeProject = computed(() => {
    const { projects, activeProjectId } = this._state();
    return projects.find(p => p.id === activeProjectId) ?? null;
  });

  /** Member list — consumed by ProjectHeaderComponent and TaskBoardComponent */
  readonly members = computed(() => this.activeProject()?.members ?? []);

  /** Current filter value — consumed by TaskFiltersComponent */
  readonly filter = computed(() => this._state().filter);

  /** Tasks grouped by status column, pre-filtered — consumed by TaskBoardComponent */
  readonly tasksByStatus = computed(() => {
    const tasks  = this.activeProject()?.tasks ?? [];
    const filter = this._state().filter;
    const visible = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
    return {
      todo:       visible.filter(t => t.status === 'todo'),
      inProgress: visible.filter(t => t.status === 'in-progress'),
      done:       visible.filter(t => t.status === 'done'),
    };
  });

  /** Aggregate counters + completion % — consumed by ProjectStatsComponent */
  readonly stats = computed(() => {
    const tasks = this.activeProject()?.tasks ?? [];
    const done  = tasks.filter(t => t.status === 'done').length;
    return {
      total:      tasks.length,
      todo:       tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      done,
      completion: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  // Every mutation goes through .update() with a spread — never .mutate().
  // This keeps state immutable and change detection reliable.

  setFilter(filter: TaskFilter): void {
    this._state.update(s => ({ ...s, filter }));
  }

  addTask(title: string, priority: TaskPriority = 'medium'): void {
    const task: Task = {
      id:          Date.now(),
      title:       title.trim(),
      description: '',
      status:      'todo',
      priority,
      assigneeId:  null,
      dueDate:     null,
    };
    this._state.update(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id === s.activeProjectId ? { ...p, tasks: [...p.tasks, task] } : p
      ),
    }));
  }

  updateTaskStatus(taskId: number, status: TaskStatus): void {
    this._state.update(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id === s.activeProjectId
          ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, status } : t) }
          : p
      ),
    }));
  }

  removeTask(taskId: number): void {
    this._state.update(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id === s.activeProjectId
          ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) }
          : p
      ),
    }));
  }
}
