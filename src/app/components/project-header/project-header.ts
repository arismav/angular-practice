import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { Member } from '../../models/project.model';

@Component({
  selector: 'app-project-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-header.html',
  styleUrl: './project-header.scss',
})
export class ProjectHeaderComponent {
  private readonly projectService = inject(ProjectService);

  // Subscribes only to the activeProject selector — not the full state.
  // Re-renders ONLY when the active project object changes.
  readonly project = this.projectService.activeProject;

  // Subscribes to the members selector — separate slice for independent tracking.
  readonly members = this.projectService.members;

  /** Returns the full Tailwind class string for an avatar.
   *  All individual class tokens appear as string literals so Tailwind v4 scans them. */
  avatarClasses(member: Member): string {
    // Fixed classes: 'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white'
    return `${member.avatarColor} w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white`;
  }
}
