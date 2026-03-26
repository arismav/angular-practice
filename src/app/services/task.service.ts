import { Injectable, computed, signal } from '@angular/core';
import { Task, TaskStatus } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  // Private writable signal — single source of truth
  private readonly _tasks = signal<Task[]>([
    { id: 1, title: 'Learn Angular Signals', status: 'done' },
    { id: 2, title: 'Build a Signal-based Store', status: 'in-progress' },
    { id: 3, title: 'Master computed() for derived state', status: 'todo' },
    { id: 4, title: 'Use input() & output() functions', status: 'todo' },
  ]);

  // Public read-only projection — components cannot mutate state directly
  readonly tasks = this._tasks.asReadonly();

  // Derived state — recalculates only when _tasks changes
  readonly stats = computed(() => {
    const tasks = this._tasks();
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    };
  });

  private nextId = 5;

  addTask(title: string): void {
    this._tasks.update(tasks => [
      ...tasks,
      { id: this.nextId++, title: title.trim(), status: 'todo' },
    ]);
  }

  updateStatus(id: number, status: TaskStatus): void {
    this._tasks.update(tasks =>
      tasks.map(t => (t.id === id ? { ...t, status } : t))
    );
  }

  removeTask(id: number): void {
    this._tasks.update(tasks => tasks.filter(t => t.id !== id));
  }
}
