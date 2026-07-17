/**
 * WsNotificationsComponent — unit tests
 *
 * Strategy: mock NotificationService AND WebSocketService.
 *  • NotificationService mock uses writable signals so each test
 *    controls state independently.
 *  • WebSocketService mock is needed because WsStatusComponent
 *    (a child) injects it directly.
 *
 * Pattern:
 *  1. Set mock signal values
 *  2. fixture.detectChanges() — triggers Angular's change detection
 *  3. Query DOM — assert rendered output
 *  4. Simulate user events — assert component method calls
 */
import { signal, computed } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationPayload, WsMessage } from '../../models/ws-message.model';
import { NotificationService } from '../../services/notification.service';
import { ConnectionStatus, WebSocketService } from '../../services/web-socket.service';
import { WsNotificationsComponent } from './ws-notifications';

// ── Test factory ──────────────────────────────────────────────────────────────

function makeNotification(
  id: string,
  severity: NotificationPayload['severity'] = 'info',
): WsMessage<NotificationPayload> {
  return {
    type: 'notification',
    payload: { id, title: `Title ${id}`, message: `Message ${id}`, severity },
    timestamp: '2026-03-22T10:00:00.000Z',
    serverTimestamp: '2026-03-22T10:00:00.000Z',
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('WsNotificationsComponent', () => {
  let fixture: ComponentFixture<WsNotificationsComponent>;
  let component: WsNotificationsComponent;

  // Writable signals — mutate these in each test to drive component state
  const visible$ = signal<WsMessage<NotificationPayload>[]>([]);
  const isConnected$ = signal<boolean>(false);

  // Derived signals mirror what the real service exposes
  const unreadCount$ = computed(() => visible$().length);
  const hasUnread$ = computed(() => visible$().length > 0);

  const mockNotificationService: Partial<NotificationService> = {
    visible: visible$,
    unreadCount: unreadCount$,
    hasUnread: hasUnread$,
    isConnected: isConnected$.asReadonly(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    dismiss: vi.fn(),
    dismissAll: vi.fn(),
  };

  // WsStatusComponent (child) injects WebSocketService — provide a minimal stub
  const mockWsService: Partial<WebSocketService> = {
    status: signal<ConnectionStatus>('disconnected').asReadonly(),
    isConnected: isConnected$.asReadonly(),
  };

  beforeEach(async () => {
    // Reset shared state and mocks before each test
    visible$.set([]);
    isConnected$.set(false);
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [WsNotificationsComponent],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: WebSocketService, useValue: mockWsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WsNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Panel title ────────────────────────────────────────────────────────────

  describe('panelTitle', () => {
    it('shows "Notifications" when unreadCount is 0', () => {
      const h2 = fixture.nativeElement.querySelector('h2') as HTMLElement;
      expect(h2.textContent?.trim()).toBe('Notifications');
    });

    it('shows "Notifications (N)" when there are unread notifications', () => {
      visible$.set([makeNotification('1'), makeNotification('2')]);
      fixture.detectChanges();

      const h2 = fixture.nativeElement.querySelector('h2') as HTMLElement;
      expect(h2.textContent?.trim()).toBe('Notifications (2)');
    });
  });

  // ── Connect button ─────────────────────────────────────────────────────────

  describe('connect button', () => {
    it('is rendered when disconnected', () => {
      isConnected$.set(false);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('button.bg-slate-800') as HTMLElement;
      expect(btn).toBeTruthy();
      expect(btn.textContent?.trim()).toBe('Connect');
    });

    it('renders as Disconnect when connected', () => {
      isConnected$.set(true);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('button.bg-slate-800') as HTMLElement;
      expect(btn).toBeTruthy();
      expect(btn.textContent?.trim()).toBe('Disconnect');
    });

    it('calls onConnect() on click', () => {
      const spy = vi.spyOn(component, 'onConnect');
      isConnected$.set(false);
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('button.bg-slate-800') as HTMLElement).click();

      expect(spy).toHaveBeenCalledOnce();
    });

    it('calls onDisconnect() on click when connected', () => {
      const spy = vi.spyOn(component, 'onDisconnect');
      isConnected$.set(true);
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('button.bg-slate-800') as HTMLElement).click();

      expect(spy).toHaveBeenCalledOnce();
    });
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('shows "Connect to receive notifications" when disconnected and empty', () => {
      const list = fixture.nativeElement.querySelector('[role="list"]') as HTMLElement;
      expect(list.textContent).toContain('Connect to receive notifications');
    });

    it('shows "No new notifications" when connected but empty', () => {
      isConnected$.set(true);
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('[role="list"]') as HTMLElement;
      expect(list.textContent).toContain('No new notifications');
    });
  });

  // ── Notification list ──────────────────────────────────────────────────────

  describe('notification list', () => {
    it('renders one listitem per visible notification', () => {
      visible$.set([makeNotification('1'), makeNotification('2'), makeNotification('3')]);
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('[role="listitem"]');
      expect(items.length).toBe(3);
    });

    it('displays the notification title', () => {
      visible$.set([makeNotification('abc')]);
      fixture.detectChanges();

      const item = fixture.nativeElement.querySelector('[role="listitem"]') as HTMLElement;
      expect(item.textContent).toContain('Title abc');
    });

    it('displays the notification message', () => {
      visible$.set([makeNotification('abc')]);
      fixture.detectChanges();

      const item = fixture.nativeElement.querySelector('[role="listitem"]') as HTMLElement;
      expect(item.textContent).toContain('Message abc');
    });

    it('renders no listitems when visible() is empty', () => {
      visible$.set([]);
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('[role="listitem"]');
      expect(items.length).toBe(0);
    });
  });

  // ── Clear all button ───────────────────────────────────────────────────────

  describe('"Clear all" button', () => {
    it('is rendered when hasUnread is true', () => {
      visible$.set([makeNotification('1')]);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('[aria-label="Dismiss all notifications"]');
      expect(btn).toBeTruthy();
    });

    it('is not rendered when hasUnread is false', () => {
      visible$.set([]);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('[aria-label="Dismiss all notifications"]');
      expect(btn).toBeNull();
    });

    it('calls onDismissAll() on click', () => {
      const spy = vi.spyOn(component, 'onDismissAll');
      visible$.set([makeNotification('1')]);
      fixture.detectChanges();

      (
        fixture.nativeElement.querySelector(
          '[aria-label="Dismiss all notifications"]',
        ) as HTMLElement
      ).click();

      expect(spy).toHaveBeenCalledOnce();
    });
  });

  // ── Dismiss single ─────────────────────────────────────────────────────────

  describe('dismiss single notification', () => {
    it('calls onDismiss() with the correct id on × click', () => {
      const spy = vi.spyOn(component, 'onDismiss');
      visible$.set([makeNotification('xyz')]);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector(
        '[aria-label="Dismiss notification: Title xyz"]',
      ) as HTMLElement;
      btn.click();

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith('xyz');
    });

    it('renders a separate dismiss button for each notification', () => {
      visible$.set([makeNotification('a'), makeNotification('b')]);
      fixture.detectChanges();

      const dismissBtns = fixture.nativeElement.querySelectorAll(
        '[aria-label^="Dismiss notification:"]',
      );
      expect(dismissBtns.length).toBe(2);
    });
  });
});
