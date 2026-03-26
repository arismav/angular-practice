import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-stats.html',
  styleUrl: './task-stats.scss',
})
export class TaskStatsComponent {
  private readonly taskService = inject(TaskService);

  // Expose the computed signal directly to the template
  readonly stats = this.taskService.stats;
}
