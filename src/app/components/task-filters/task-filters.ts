import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TaskFilter } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';

interface FilterOption {
  value: TaskFilter;
  label: string;
}

@Component({
  selector: 'app-task-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-filters.html',
  styleUrl: './task-filters.scss',
})
export class TaskFiltersComponent {
  private readonly projectService = inject(ProjectService);

  // Subscribes ONLY to the filter slice — not tasks, not stats.
  readonly activeFilter = this.projectService.filter;

  readonly filters: FilterOption[] = [
    { value: 'all',         label: 'All'         },
    { value: 'todo',        label: 'To Do'        },
    { value: 'in-progress', label: 'In Progress'  },
    { value: 'done',        label: 'Done'         },
  ];

  setFilter(value: TaskFilter): void {
    this.projectService.setFilter(value);
  }
}
