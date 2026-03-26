import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { Task, TaskStatus } from '../../models/task.model';

@Component({
  selector: 'app-task-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-item.html',
  styleUrl: './task-item.scss',
})
export class TaskItemComponent {
  readonly task = input.required<Task>();

  readonly statusChange = output<TaskStatus>();
  readonly remove = output<void>();

  // --- Derived state via computed() ---

  readonly statusLabel = computed<string>(() => {
    const map: Record<TaskStatus, string> = {
      todo: 'To Do',
      'in-progress': 'In Progress',
      done: 'Done',
    };
    return map[this.task().status];
  });

  /**
   * Dynamic Tailwind classes must use COMPLETE strings (not string interpolation)
   * so Tailwind v4 can statically scan and include them in the output bundle.
   */
  readonly cardClasses = computed<string>(() => {
    const statusClasses: Record<TaskStatus, string> = {
      todo: 'border-gray-200 bg-white',
      'in-progress': 'border-amber-400 bg-amber-50',
      done: 'border-emerald-400 bg-emerald-50 opacity-75',
    };
    return statusClasses[this.task().status];
  });

  readonly titleClasses = computed<string>(() =>
    this.task().status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'
  );

  readonly badgeClasses = computed<string>(() => {
    const map: Record<TaskStatus, string> = {
      todo: 'bg-gray-100 text-gray-600',
      'in-progress': 'bg-amber-100 text-amber-800',
      done: 'bg-emerald-100 text-emerald-800',
    };
    return map[this.task().status];
  });

  onStatusChange(status: TaskStatus): void {
    this.statusChange.emit(status);
  }

  onRemove(): void {
    this.remove.emit();
  }
}
