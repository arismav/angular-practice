import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskStatus } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';
import { TaskCardComponent } from '../task-card/task-card';

interface Column {
  id:     TaskStatus;
  label:  string;
  /** Tailwind classes for column header accent */
  accent: string;
  /** Tailwind classes for empty-state text */
  empty:  string;
}

@Component({
  selector: 'app-task-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TaskCardComponent, ReactiveFormsModule],
  templateUrl: './task-board.html',
  styleUrl: './task-board.scss',
})
export class TaskBoardComponent {
  private readonly projectService = inject(ProjectService);
  private readonly fb             = inject(FormBuilder);

  // ── Selectors — each one is an independent computed() slice ───────────────
  // This component only subscribes to the two slices it needs.
  readonly tasksByStatus = this.projectService.tasksByStatus;
  readonly members       = this.projectService.members;

  // ── Local UI state (not in the global store) ───────────────────────────────
  readonly showAddForm = signal(false);

  readonly addForm = this.fb.group({
    title:    ['', [Validators.required, Validators.minLength(3)]],
    priority: ['medium' as 'low' | 'medium' | 'high'],
  });

  // ── Column config — pure metadata, no signal dependency ───────────────────
  readonly columns: Column[] = [
    { id: 'todo',        label: 'To Do',       accent: 'bg-gray-400',   empty: 'text-gray-400'   },
    { id: 'in-progress', label: 'In Progress',  accent: 'bg-amber-400',  empty: 'text-amber-300'  },
    { id: 'done',        label: 'Done',         accent: 'bg-emerald-400',empty: 'text-emerald-400'},
  ];

  /** Returns the task list for a given column from the tasksByStatus selector */
  tasksForColumn(columnId: TaskStatus) {
    const { todo, inProgress, done } = this.tasksByStatus();
    const map = { 'todo': todo, 'in-progress': inProgress, 'done': done };
    return map[columnId];
  }

  onStatusChange(taskId: number, status: TaskStatus): void {
    this.projectService.updateTaskStatus(taskId, status);
  }

  onRemove(taskId: number): void {
    this.projectService.removeTask(taskId);
  }

  onAddTask(): void {
    if (this.addForm.invalid) return;
    const { title, priority } = this.addForm.getRawValue();
    this.projectService.addTask(title!, priority!);
    this.addForm.reset({ title: '', priority: 'medium' });
    this.showAddForm.set(false);
  }

  toggleAddForm(): void {
    this.showAddForm.update(v => !v);
  }
}
