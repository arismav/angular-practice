/**
 * WsStatusComponent — Single Responsibility: display connection status ONLY.
 * Injects WebSocketService directly (not ChatService) to demonstrate that
 * multiple components can independently subscribe to different service slices.
 */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ConnectionStatus, WebSocketService } from '../../services/web-socket.service';

interface StatusConfig {
  label: string;
  dotClass: string;
  textClass: string;
}

@Component({
  selector: 'app-ws-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ws-status.html',
})
export class WsStatusComponent {
  // Direct injection of WebSocketService — independent of ChatService.
  // This component re-renders ONLY when the status signal changes.
  private readonly ws = inject(WebSocketService);
  readonly status = this.ws.status;

  /**
   * Computed config — all Tailwind class strings are complete literals
   * so Tailwind v4 static scanning picks them up.
   */
  readonly config = computed<StatusConfig>(() => {
    const map: Record<ConnectionStatus, StatusConfig> = {
      connected: {
        label: 'Live',
        dotClass: 'bg-emerald-400 animate-pulse',
        textClass: 'text-emerald-600',
      },
      connecting: {
        label: 'Connecting…',
        dotClass: 'bg-amber-400 animate-pulse',
        textClass: 'text-amber-600',
      },
      disconnected: { label: 'Offline', dotClass: 'bg-gray-300', textClass: 'text-gray-500' },
      error: { label: 'Error', dotClass: 'bg-red-400', textClass: 'text-red-500' },
    };
    return map[this.status()];
  });
}
