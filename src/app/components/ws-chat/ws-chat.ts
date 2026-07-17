/**
 * WsChatComponent — Smart component.
 * Depends on ChatService only (Dependency Inversion).
 * Zero direct WS knowledge — WS concerns are fully encapsulated in the services.
 *
 * Angular 21 patterns used:
 *  • inject() instead of constructor injection
 *  • input() / output() functions (n/a here — no parent, but noted)
 *  • signal() for local UI state (showAuthorForm)
 *  • computed() for derived display values (reversedMessages, authorInitial)
 *  • Reactive form (not template-driven)
 *  • ChangeDetectionStrategy.OnPush — re-renders only on signal changes
 *  • @for / @if control flow
 *
 * UX trick — flex-col-reverse:
 *  The messages list uses CSS flex-direction: column-reverse.
 *  We render messages newest-first in the DOM; flex-col-reverse flips them
 *  visually so newest appears at the bottom — auto-scrolled without JS.
 */
import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChatPayload, SystemPayload, WsMessage } from '../../models/ws-message.model';
import { ChatService } from '../../services/chat.service';
import { WsStatusComponent } from '../ws-status/ws-status';

@Component({
  selector: 'app-ws-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, WsStatusComponent, SlicePipe],
  templateUrl: './ws-chat.html',
  styleUrl: './ws-chat.scss',
})
export class WsChatComponent {
  private readonly chatService = inject(ChatService);
  private readonly fb = inject(FormBuilder);

  // ── Selectors from ChatService ─────────────────────────────────────────────
  readonly messages = this.chatService.messages;
  readonly author = this.chatService.author;
  readonly isConnected = this.chatService.isConnected;
  readonly messageCount = this.chatService.messageCount;

  // ── Computed ──────────────────────────────────────────────────────────────

  /** Reversed for flex-col-reverse rendering — memoised, recomputes only when messages change */
  readonly reversedMessages = computed(() => this.chatService.messages().slice().reverse());

  /** First letter of the author name for the avatar bubble */
  readonly authorInitial = computed(() => this.author().charAt(0).toUpperCase());

  // ── Local UI state ────────────────────────────────────────────────────────
  readonly showAuthorForm = signal(false);

  // ── Forms ─────────────────────────────────────────────────────────────────
  readonly sendForm = this.fb.group({
    message: ['', [Validators.required, Validators.minLength(1)]],
  });

  readonly authorForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(24)]],
  });

  // ── Type guards — let the template stay clean ─────────────────────────────
  isChatMsg(msg: WsMessage): msg is WsMessage<ChatPayload> {
    return msg.type === 'chat';
  }

  isSystemMsg(msg: WsMessage): msg is WsMessage<SystemPayload> {
    return msg.type === 'system';
  }

  isOwnMessage(msg: WsMessage<ChatPayload>): boolean {
    return msg.payload.author === this.author();
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  onConnect(): void {
    this.chatService.connect();
  }
  onDisconnect(): void {
    this.chatService.disconnect();
  }

  onSend(): void {
    if (this.sendForm.invalid || !this.isConnected()) return;
    this.chatService.sendMessage(this.sendForm.controls.message.value!);
    this.sendForm.reset();
  }

  onSetAuthor(): void {
    if (this.authorForm.invalid) return;
    this.chatService.setAuthor(this.authorForm.controls.name.value!);
    this.authorForm.reset();
    this.showAuthorForm.set(false);
  }

  toggleAuthorForm(): void {
    this.showAuthorForm.update((v) => !v);
  }
}
