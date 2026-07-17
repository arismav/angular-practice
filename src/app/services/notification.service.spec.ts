/**
 * NotificationService — unit tests
 *
 * Strategy: mock WebSocketService (Dependency Inversion → easy to isolate).
 * A Subject<> simulates the WS stream so we push messages synchronously
 * without needing a real WebSocket connection.
 *
 * Signal assertions are synchronous — no fakeAsync/tick needed because
 * Angular signals propagate changes eagerly within the same microtask.
 */
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY, Observable, Subject } from 'rxjs';
import { NotificationPayload, WsMessage, WsMessageType } from '../models/ws-message.model';
import { ConnectionStatus, WebSocketService } from './web-socket.service';
import { NotificationService } from './notification.service';

// ── Test factory ─────────────────────────────────────────────────────────────

function makeNotification(
  id: string,
  severity: NotificationPayload['severity'] = 'info',
): WsMessage<NotificationPayload> {
  return {
    type: 'notification',
    payload: { id, title: `Title ${id}`, message: `Message ${id}`, severity },
    timestamp: new Date().toISOString(),
  };
}

// ── Suite ────────────────────────────────────────────────────────────────────

describe('NotificationService', () => {
  let service: NotificationService;

  // Controlled message stream — push values from tests to simulate server push
  let notif$: Subject<WsMessage<NotificationPayload>>;

  // Minimal mock — only what NotificationService actually calls (ISP)
  let mockWs: Partial<WebSocketService>;

  beforeEach(() => {
    notif$ = new Subject<WsMessage<NotificationPayload>>();

    mockWs = {
      status: signal<ConnectionStatus>('disconnected').asReadonly(),
      isConnected: signal(false).asReadonly(),
      connect: vi.fn(),
      // messagesOfType is generic — return notif$ for 'notification', EMPTY for others
      messagesOfType<T>(type: WsMessageType): Observable<WsMessage<T>> {
        const stream = type === 'notification' ? notif$.asObservable() : EMPTY;
        return stream as Observable<WsMessage<T>>;
      },
    };

    TestBed.configureTestingModule({
      providers: [NotificationService, { provide: WebSocketService, useValue: mockWs }],
    });

    // TestBed provides the injection context required by takeUntilDestroyed()
    service = TestBed.inject(NotificationService);
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('has empty all() and visible()', () => {
      expect(service.all()).toEqual([]);
      expect(service.visible()).toEqual([]);
    });

    it('unreadCount is 0', () => {
      expect(service.unreadCount()).toBe(0);
    });

    it('hasUnread is false', () => {
      expect(service.hasUnread()).toBe(false);
    });
  });

  // ── Receiving notifications ────────────────────────────────────────────────

  describe('receiving notifications from WS stream', () => {
    it('updates visible() when a notification arrives', () => {
      notif$.next(makeNotification('n1'));

      expect(service.visible().length).toBe(1);
      expect(service.visible()[0].payload.id).toBe('n1');
    });

    it('increments unreadCount and sets hasUnread = true', () => {
      notif$.next(makeNotification('n1'));

      expect(service.unreadCount()).toBe(1);
      expect(service.hasUnread()).toBe(true);
    });

    it('accumulates multiple notifications in order', () => {
      notif$.next(makeNotification('n1'));
      notif$.next(makeNotification('n2'));
      notif$.next(makeNotification('n3'));

      expect(service.unreadCount()).toBe(3);
      expect(service.visible().map((n) => n.payload.id)).toEqual(['n1', 'n2', 'n3']);
    });

    it('enforces MAX_HISTORY sliding window of 20', () => {
      for (let i = 1; i <= 25; i++) {
        notif$.next(makeNotification(`n${i}`));
      }

      // Only the last 20 are kept
      expect(service.all().length).toBe(20);
      expect(service.all()[0].payload.id).toBe('n6'); // first kept
      expect(service.all()[19].payload.id).toBe('n25'); // last received
    });
  });

  // ── dismiss() ─────────────────────────────────────────────────────────────

  describe('dismiss(id)', () => {
    it('removes the notification from visible()', () => {
      notif$.next(makeNotification('n1'));
      notif$.next(makeNotification('n2'));

      service.dismiss('n1');

      expect(service.visible().length).toBe(1);
      expect(service.visible()[0].payload.id).toBe('n2');
    });

    it('keeps the notification in all() (history preserved)', () => {
      notif$.next(makeNotification('n1'));

      service.dismiss('n1');

      expect(service.all().length).toBe(1);
      expect(service.visible().length).toBe(0);
    });

    it('decrements unreadCount', () => {
      notif$.next(makeNotification('n1'));
      notif$.next(makeNotification('n2'));

      service.dismiss('n1');

      expect(service.unreadCount()).toBe(1);
    });

    it('sets hasUnread = false when last notification is dismissed', () => {
      notif$.next(makeNotification('n1'));
      service.dismiss('n1');

      expect(service.hasUnread()).toBe(false);
    });

    it('is idempotent — dismissing the same id twice has no side effect', () => {
      notif$.next(makeNotification('n1'));
      service.dismiss('n1');
      service.dismiss('n1');

      expect(service.visible().length).toBe(0);
    });
  });

  // ── dismissAll() ───────────────────────────────────────────────────────────

  describe('dismissAll()', () => {
    it('clears all visible notifications', () => {
      notif$.next(makeNotification('n1'));
      notif$.next(makeNotification('n2'));
      notif$.next(makeNotification('n3'));

      service.dismissAll();

      expect(service.visible()).toEqual([]);
      expect(service.unreadCount()).toBe(0);
      expect(service.hasUnread()).toBe(false);
    });

    it('preserves all() history after dismiss', () => {
      notif$.next(makeNotification('n1'));
      notif$.next(makeNotification('n2'));

      service.dismissAll();

      expect(service.all().length).toBe(2);
    });

    it('new notifications after dismissAll() are visible again', () => {
      notif$.next(makeNotification('n1'));
      service.dismissAll();

      notif$.next(makeNotification('n2'));

      expect(service.visible().length).toBe(1);
      expect(service.visible()[0].payload.id).toBe('n2');
    });
  });

  // ── connect() ─────────────────────────────────────────────────────────────

  describe('connect()', () => {
    it('delegates to WebSocketService.connect() with the correct URL', () => {
      service.connect();

      const expectedProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const expectedUrl = `${expectedProtocol}//${window.location.host}/ws`;

      expect(mockWs.connect).toHaveBeenCalledOnce();
      expect(mockWs.connect).toHaveBeenCalledWith(expectedUrl);
    });
  });
});
