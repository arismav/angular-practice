// ─── Message type discriminant ────────────────────────────────────────────────
// Adding a new type here (e.g. 'activity') does NOT require modifying any service.
// Consumers call messagesOfType<T>('activity') — Open/Closed Principle.
export type WsMessageType = 'chat' | 'system' | 'notification';

// ─── Generic message envelope ─────────────────────────────────────────────────
// A single shape travels over the wire. The generic T narrows the payload type
// per consumer — Interface Segregation Principle.
export interface WsMessage<T = unknown> {
  type:             WsMessageType;
  payload:          T;
  timestamp:        string; // ISO string sent by the client
  serverTimestamp?: string; // ISO string stamped by the server on broadcast
  clientCount?:     number; // how many clients are connected (added by server)
}

// ─── Typed payloads ───────────────────────────────────────────────────────────

export interface ChatPayload {
  author: string;
  text:   string;
}

export interface SystemPayload {
  text:         string;
  clientCount?: number;
}

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export enum NotificationType {
  info = 'info',
  success = 'success',
  warning = 'warning',
  error = 'error'
}

export interface NotificationPayload {
  id:       string; // unique per notification, used for dismiss
  title:    string;
  message:  string;
  severity: NotificationSeverity;
}
