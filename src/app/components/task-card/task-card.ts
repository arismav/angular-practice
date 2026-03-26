import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { Member, Task, TaskPriority, TaskStatus } from '../../models/project.model';

@Component({
  selector: 'app-task-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
})
export class TaskCardComponent {
  // ── Inputs — data flows DOWN from TaskBoardComponent ───────────────────────
  readonly task    = input.required<Task>();
  readonly members = input.required<Member[]>();

  // ── Outputs — events flow UP to TaskBoardComponent ─────────────────────────
  readonly statusChange = output<TaskStatus>();
  readonly remove       = output<void>();

  // ── Computed — derived state from input signals ────────────────────────────
  // These recalculate only when the relevant input() signal changes.

  /** Resolves the assignee Member object from the flat members array */
  readonly assignee = computed(() => {
    const { assigneeId } = this.task();
    return assigneeId != null
      ? (this.members().find(m => m.id === assigneeId) ?? null)
      : null;
  });

  /**
   * Priority badge label + classes.
   * Full class strings must be complete literals for Tailwind v4 static scanning.
   */
  readonly priorityBadge = computed(() => {
    const map: Record<TaskPriority, { label: string; classes: string }> = {
      high:   { label: '↑ High',   classes: 'bg-red-100 text-red-700 border-red-200'     },
      medium: { label: '→ Medium', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
      low:    { label: '↓ Low',    classes: 'bg-gray-100 text-gray-500 border-gray-200'   },
    };
    return map[this.task().priority];
  });

  /** Card border accent derived from current task status */
  readonly cardAccent = computed(() => {
    const map: Record<TaskStatus, string> = {
      'todo':        'border-l-gray-200',
      'in-progress': 'border-l-amber-400',
      'done':        'border-l-emerald-400',
    };
    return map[this.task().status];
  });

  /** Title style — strikethrough when done */
  readonly titleClasses = computed(() =>
    this.task().status === 'done'
      ? 'line-through text-gray-400'
      : 'text-gray-800 font-semibold'
  );

  /** Due-date label style — highlights overdue tasks in red */
  readonly dueDateClasses = computed(() => {
    const { dueDate, status } = this.task();
    if (!dueDate || status === 'done') return 'text-gray-400';
    return new Date(dueDate) < new Date() ? 'text-red-500 font-medium' : 'text-gray-400';
  });

  onStatusChange(event: Event): void {
    const status = (event.target as HTMLSelectElement).value as TaskStatus;
    this.statusChange.emit(status);
  }

  onRemove(): void {
    this.remove.emit();
  }
}
