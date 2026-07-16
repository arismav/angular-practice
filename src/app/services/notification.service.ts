/**
 * NotificationService — Single Responsibility: owns notification domain logic only.
 *
 * Mirrors ChatService intentionally — same architectural pattern:
 *  • Depends on WebSocketService (Dependency Inversion).
 *  • Bridges one typed RxJS stream → Angular signal via takeUntilDestroyed().
 *  • Components talk to THIS service, never to WebSocketService directly.
 *
 * Receive-only — no send() needed for notifications.
 * This simplicity is itself a demonstration of Interface Segregation:
 * NotificationService exposes only what notification consumers need.
 */
import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationPayload, WsMessage } from '../models/ws-message.model';
import { WebSocketService } from './web-socket.service';

const WS_URL      = buildWebSocketUrl();
const MAX_HISTORY = 20; // keep the last 20 notifications

function buildWebSocketUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:4201/ws';

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly ws = inject(WebSocketService);

  // ── State ──────────────────────────────────────────────────────────────────
  private readonly _notifications = signal<WsMessage<NotificationPayload>[]>([]);
  private readonly _dismissedIds  = signal<Set<string>>(new Set());

  // ── Selectors ──────────────────────────────────────────────────────────────

  /** All received notifications (including dismissed) */
  readonly all = this._notifications.asReadonly();

  /** Only the visible (not-yet-dismissed) ones */
  readonly visible = computed(() =>
    this._notifications().filter(n => !this._dismissedIds().has(n.payload.id)),
  );

  /** Count of unread (visible) notifications — useful for a badge */
  readonly unreadCount = computed(() => this.visible().length);

  /** True when there is at least one visible notification */
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  // Proxy connection state — component injects one service, not two
  readonly status      = this.ws.status;
  readonly isConnected = this.ws.isConnected;

  constructor() {
    // Bridge: filtered RxJS stream → signal
    // Only 'notification' messages reach this service — ISP in action.
    this.ws
      .messagesOfType<NotificationPayload>('notification')
      .pipe(takeUntilDestroyed())
      .subscribe(msg =>
        this._notifications.update(list =>
          [...list, msg].slice(-MAX_HISTORY),
        ),
      );
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  connect(): void {
    this.ws.connect(WS_URL);
  }

  disconnect():void {
    this.ws.disconnect();
  }

  /** Remove a single notification from the visible list */
  dismiss(id: string): void {
    this._dismissedIds.update(ids => new Set([...ids, id]));
  }

  /** Clear all visible notifications at once */
  dismissAll(): void {
    const allIds = this._notifications().map(n => n.payload.id);
    this._dismissedIds.update(ids => new Set([...ids, ...allIds]));
  }
}
