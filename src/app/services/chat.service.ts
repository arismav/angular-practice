/**
 * ChatService — Single Responsibility: owns chat domain logic only.
 *
 * Dependency Inversion: depends on WebSocketService (the abstraction),
 * not on the raw WebSocket API.
 *
 * Key pattern — bridging RxJS → Signals:
 *   merge() combines multiple typed Observable streams.
 *   takeUntilDestroyed() auto-unsubscribes when the injection context is destroyed.
 *   signal.update() accumulates messages into the reactive store.
 *
 * Components never touch WebSocketService directly — they talk to ChatService.
 * This isolates the WS concern behind a domain boundary.
 */
import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { ChatPayload, SystemPayload, WsMessage } from '../models/ws-message.model';
import { WebSocketService } from './web-socket.service';

const WS_URL      = buildWebSocketUrl();
const MAX_HISTORY = 100; // sliding window — prevents unbounded memory growth

function buildWebSocketUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:4201/ws';

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly ws = inject(WebSocketService);

  // ── State ──────────────────────────────────────────────────────────────────
  // Accumulated message history — ChatService owns this, not WebSocketService.
  private readonly _messages = signal<WsMessage[]>([]);

  // Session identity — generated once per browser session
  private readonly _author = signal<string>(
    'User_' + Math.floor(Math.random() * 9000 + 1000),
  );

  // ── Selectors ──────────────────────────────────────────────────────────────
  readonly messages     = this._messages.asReadonly();
  readonly author       = this._author.asReadonly();
  readonly messageCount = computed(() => this._messages().length);

  // Proxy status/connected from WebSocketService — components need not inject two services.
  readonly status      = this.ws.status;
  readonly isConnected = this.ws.isConnected;

  constructor() {
    // Bridge: RxJS typed streams → Angular signal
    // merge() subscribes to both streams and fans messages into a single pipe.
    // takeUntilDestroyed() ties cleanup to the DI scope — no manual unsubscribe.
    merge(
      this.ws.messagesOfType<ChatPayload>('chat'),
      this.ws.messagesOfType<SystemPayload>('system'),
    )
      .pipe(takeUntilDestroyed())
      .subscribe(msg =>
        this._messages.update(msgs =>
          [...msgs, msg].slice(-MAX_HISTORY), // sliding window
        ),
      );
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  connect(): void {
    this.ws.connect(WS_URL);
  }

  disconnect(): void {
    this.ws.disconnect();
    // Append a local system note without going through the server
    this._messages.update(msgs => [
      ...msgs,
      {
        type:      'system',
        payload:   { text: 'You disconnected.' } satisfies SystemPayload,
        timestamp: new Date().toISOString(),
      } as WsMessage<SystemPayload>,
    ]);
  }

  sendMessage(text: string): void {
    this.ws.send<ChatPayload>({
      type:      'chat',
      payload:   { author: this._author(), text: text.trim() },
      timestamp: new Date().toISOString(),
    });
  }

  setAuthor(name: string): void {
    const trimmed = name.trim();
    if (trimmed) this._author.set(trimmed);
  }
}
