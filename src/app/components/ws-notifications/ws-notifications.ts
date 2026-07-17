/**
 * WsNotificationsComponent — Smart component, receive-only.
 *
 * Depends on NotificationService only (Dependency Inversion).
 * Uses computed() to derive severity-based Tailwind classes — same
 * pattern as TaskCardComponent's priorityBadge.
 */
import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  NotificationPayload,
  NotificationSeverity,
  NotificationType,
  WsMessage,
} from '../../models/ws-message.model';
import { NotificationService } from '../../services/notification.service';
import { WsStatusComponent } from '../ws-status/ws-status';

/** Visual config per severity — all class strings are complete literals for Tailwind scanning */
const SEVERITY_CONFIG: Record<
  NotificationSeverity,
  { icon: string; border: string; bg: string; title: string; badge: string }
> = {
  info: {
    icon: 'ℹ',
    border: 'border-sky-200',
    bg: 'bg-sky-50',
    title: 'text-sky-800',
    badge: 'bg-sky-100 text-sky-700',
  },
  success: {
    icon: '✓',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    title: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  warning: {
    icon: '⚠',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    title: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
  },
  error: {
    icon: '✕',
    border: 'border-red-200',
    bg: 'bg-red-50',
    title: 'text-red-800',
    badge: 'bg-red-100 text-red-700',
  },
};

@Component({
  selector: 'app-ws-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WsStatusComponent, SlicePipe],
  templateUrl: './ws-notifications.html',
  styleUrl: './ws-notifications.scss',
})
export class WsNotificationsComponent {
  private readonly notificationService = inject(NotificationService);

  // ── Selectors from NotificationService ────────────────────────────────────
  readonly visible = this.notificationService.visible;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly hasUnread = this.notificationService.hasUnread;
  readonly isConnected = this.notificationService.isConnected;

  // ── Computed ──────────────────────────────────────────────────────────────

  /** Panel title changes based on unread count */
  readonly panelTitle = computed(() =>
    this.unreadCount() > 0 ? `Notifications (${this.unreadCount()})` : 'Notifications',
  );

  /** Per-notification config — called from template, memoisation happens at signal level */
  configFor(n: WsMessage<NotificationPayload>) {
    return SEVERITY_CONFIG[n.payload.severity];
  }

  checkBg(n: WsMessage<NotificationPayload>): {
    icon: string;
    border: string;
    bg: string;
    title: string;
    badge: string;
  } {
    if (n.payload.severity === NotificationType.error) {
      return {
        icon: '✕',
        border: 'border-red-200',
        bg: 'bg-red-50',
        title: 'text-red-800',
        badge: 'bg-red-100 text-red-700',
      };
    }

    if (n.payload.severity === NotificationType.info) {
      return {
        icon: 'ℹ',
        border: 'border-sky-200',
        bg: 'bg-sky-50',
        title: 'text-sky-800',
        badge: 'bg-sky-100 text-sky-700',
      };
    }

    if (n.payload.severity === NotificationType.success) {
      return {
        icon: '✓',
        border: 'border-emerald-200',
        bg: 'bg-emerald-50',
        title: 'text-emerald-800',
        badge: 'bg-emerald-100 text-emerald-700',
      };
    }

    if (n.payload.severity === NotificationType.warning) {
      return {
        icon: '⚠',
        border: 'border-amber-200',
        bg: 'bg-amber-50',
        title: 'text-amber-800',
        badge: 'bg-amber-100 text-amber-700',
      };
    }

    return {
      icon: '✕',
      border: 'border-red-200',
      bg: 'bg-red-50',
      title: 'text-red-800',
      badge: 'bg-red-100 text-red-700',
    };
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  onConnect(): void {
    this.notificationService.connect();
  }
  onDisconnect(): void {
    this.notificationService.disconnect();
  }
  onDismiss(id: string): void {
    this.notificationService.dismiss(id);
  }
  onDismissAll(): void {
    this.notificationService.dismissAll();
  }
}
