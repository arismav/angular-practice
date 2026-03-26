import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectHeaderComponent } from './components/project-header/project-header';
import { ProjectStatsComponent } from './components/project-stats/project-stats';
import { TaskBoardComponent } from './components/task-board/task-board';
import { TaskFiltersComponent } from './components/task-filters/task-filters';
import { WsChatComponent } from './components/ws-chat/ws-chat';
import { WsNotificationsComponent } from './components/ws-notifications/ws-notifications';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ProjectHeaderComponent,
    ProjectStatsComponent,
    TaskFiltersComponent,
    TaskBoardComponent,
    WsChatComponent,
    WsNotificationsComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
