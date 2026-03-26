import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-project-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-stats.html',
  styleUrl: './project-stats.scss',
})
export class ProjectStatsComponent {
  private readonly projectService = inject(ProjectService);

  // Subscribes only to the stats selector — an aggregated derived slice.
  // This component has zero knowledge of the Task[] array or Project shape.
  readonly stats = this.projectService.stats;
}
