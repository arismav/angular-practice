/**
 * WebSocketService — Single Responsibility: owns ONLY the WS connection lifecycle.
 *
 * SOLID breakdown:
 *  S — Manages connect / disconnect / send / stream. Zero domain knowledge.
 *  O — New message types are handled by consumers via messagesOfType<T>().
 *      This service never changes when new message types are added.
 *  I — messagesOfType<T>() lets each consumer subscribe to only the slice it needs.
 *  D — Domain services (ChatService…) depend on THIS abstraction, not on the
 *      raw WebSocket API.
 *
 * Signals vs RxJS split:
 *  • Connection STATUS  → signal<ConnectionStatus>   (scalar, reactive UI value)
 *  • Incoming STREAM    → Observable (hot, shared)   (continuous data flow)
 *  Bridging happens per-consumer via takeUntilDestroyed() + signal.update().
 */
import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { Subject, filter, share, takeUntil } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { WsMessage, WsMessageType } from '../models/ws-message.model';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  // ── Lifecycle teardown ────────────────────────────────────────────────────
  private readonly destroy$ = new Subject<void>();

  // Raw socket — null when not connected (closed or not yet opened)
  private socket$: WebSocketSubject<WsMessage> | null = null;

  // ── Connection state (signal) ─────────────────────────────────────────────
  // Scalar reactive value → signal is the right primitive here.
  private readonly _status = signal<ConnectionStatus>('disconnected');
  readonly status = this._status.asReadonly();
  readonly isConnected = computed(() => this._status() === 'connected');

  // ── Message stream (RxJS) ─────────────────────────────────────────────────
  // A Subject acts as the single entry point for incoming frames.
  // share() makes it a HOT multicast — many consumers, one subscription.
  // Using an Observable instead of a signal here because this is a
  // continuous stream of events, not a "current value" to hold.
  private readonly _incoming$ = new Subject<WsMessage>();
  readonly messages$ = this._incoming$.asObservable().pipe(share());

  // ── Public API ────────────────────────────────────────────────────────────

  connect(url: string): void {
    if (this.socket$) return; // idempotent guard

    this._status.set('connecting');

    // webSocket() from rxjs/webSocket wraps the native WS API.
    // openObserver / closeObserver fire synchronously on socket events
    // and update the status signal — no manual subscription needed.
    this.socket$ = webSocket<WsMessage>({
      url,
      openObserver: {
        next: () => this._status.set('connected'),
      },
      closeObserver: {
        next: () => {
          this.socket$ = null;
          this._status.set('disconnected');
        },
      },
    });

    // One subscription fans out to all consumers via the shared Subject.
    this.socket$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (msg) => this._incoming$.next(msg),
      error: () => this._status.set('error'),
    });
  }

  /**
   * Type-safe filtered stream — Interface Segregation.
   * ChatService calls messagesOfType<ChatPayload>('chat').
   * A future ActivityService would call messagesOfType<ActivityPayload>('activity').
   * Neither service sees the other's messages.
   */
  messagesOfType<T>(type: WsMessageType) {
    return this.messages$.pipe(filter((msg): msg is WsMessage<T> => msg.type === type));
  }

  send<T>(message: WsMessage<T>): void {
    if (!this.socket$ || !this.isConnected()) return;
    this.socket$.next(message as WsMessage);
  }

  disconnect(): void {
    this.socket$?.complete(); // triggers closeObserver → status = 'disconnected'
    this.socket$ = null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
