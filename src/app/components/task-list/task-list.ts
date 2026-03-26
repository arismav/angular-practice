import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TaskStatus } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { TaskItemComponent } from '../task-item/task-item';

@Component({
  selector: 'app-task-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TaskItemComponent],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskListComponent {
  private readonly taskService = inject(TaskService);

  // Reading directly from the service signal
  readonly tasks = this.taskService.tasks;

  onStatusChange(id: number, status: TaskStatus): void {
    this.taskService.updateStatus(id, status);
  }

  onRemove(id: number): void {
    this.taskService.removeTask(id);
  }
}
