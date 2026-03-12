import { Injectable, signal, computed } from '@angular/core';
import { ChatMessage, MessageThread } from './messaging.types';

/** Generates a simple unique id. */
function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Current mock user id. */
export const CURRENT_USER_ID = 'user-current';

/** Mock seed data for demonstration. */
const SEED_THREADS: MessageThread[] = [
  {
    id: 'thread-1',
    participantId: 'landlord-1',
    participantName: 'Carlos Mendes',
    participantAvatar: '',
    propertyTitle: 'T2 Bairro Alto, Lisboa',
    unreadCount: 2,
    lastMessageAt: '2026-03-12T00:45:00Z',
    messages: [
      {
        id: 'm1',
        senderId: 'landlord-1',
        senderName: 'Carlos Mendes',
        text: 'Olá! Obrigado pelo interesse no apartamento do Bairro Alto.',
        timestamp: '2026-03-11T09:00:00Z',
        read: true,
      },
      {
        id: 'm2',
        senderId: CURRENT_USER_ID,
        senderName: 'Eu',
        text: 'Boa tarde! Podia enviar mais fotos do quarto principal?',
        timestamp: '2026-03-11T10:30:00Z',
        read: true,
      },
      {
        id: 'm3',
        senderId: 'landlord-1',
        senderName: 'Carlos Mendes',
        text: 'Claro, envio ainda hoje. Também está disponível para visita esta semana.',
        timestamp: '2026-03-12T00:30:00Z',
        read: false,
      },
      {
        id: 'm4',
        senderId: 'landlord-1',
        senderName: 'Carlos Mendes',
        text: 'Que dia funciona melhor para si?',
        timestamp: '2026-03-12T00:45:00Z',
        read: false,
      },
    ],
  },
  {
    id: 'thread-2',
    participantId: 'landlord-2',
    participantName: 'Ana Ferreira',
    participantAvatar: '',
    propertyTitle: 'Estúdio Intendente, Lisboa',
    unreadCount: 0,
    lastMessageAt: '2026-03-10T14:20:00Z',
    messages: [
      {
        id: 'm5',
        senderId: CURRENT_USER_ID,
        senderName: 'Eu',
        text: 'Boa tarde, gostaria de saber se o estúdio ainda está disponível.',
        timestamp: '2026-03-10T13:00:00Z',
        read: true,
      },
      {
        id: 'm6',
        senderId: 'landlord-2',
        senderName: 'Ana Ferreira',
        text: 'Sim, está! Disponível a partir de 1 de Abril. O renda é 750€/mês tudo incluído.',
        timestamp: '2026-03-10T14:20:00Z',
        read: true,
      },
    ],
  },
];

/**
 * MessagingService — manages in-app message threads with Angular Signals.
 *
 * Provides reactive state for thread list, active thread, and unread counts.
 * In a real app this would connect to a backend (Firebase, REST, WebSocket).
 */
@Injectable({ providedIn: 'root' })
export class MessagingService {
  /** All threads, signals-powered. */
  private readonly _threads = signal<MessageThread[]>(SEED_THREADS);

  /** Id of the currently active (open) thread. */
  private readonly _activeThreadId = signal<string | null>(null);

  /** Public readonly view of all threads. */
  readonly threads = this._threads.asReadonly();

  /** Computed: total unread count across all threads. */
  readonly totalUnread = computed(() =>
    this._threads().reduce((sum, t) => sum + t.unreadCount, 0)
  );

  /** Computed: currently active thread (or null). */
  readonly activeThread = computed(() => {
    const id = this._activeThreadId();
    return id ? this._threads().find(t => t.id === id) ?? null : null;
  });

  /** Open a thread and mark its messages as read. */
  openThread(threadId: string): void {
    this._activeThreadId.set(threadId);
    this._threads.update(threads =>
      threads.map(t =>
        t.id === threadId
          ? {
              ...t,
              unreadCount: 0,
              messages: t.messages.map(m => ({ ...m, read: true })),
            }
          : t
      )
    );
  }

  /** Close the active thread view. */
  closeThread(): void {
    this._activeThreadId.set(null);
  }

  /**
   * Send a message in a thread.
   * @param threadId - Target thread id.
   * @param text - Message body.
   */
  sendMessage(threadId: string, text: string): void {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: uid(),
      senderId: CURRENT_USER_ID,
      senderName: 'Eu',
      text: text.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    };
    this._threads.update(threads =>
      threads.map(t =>
        t.id === threadId
          ? { ...t, messages: [...t.messages, msg], lastMessageAt: msg.timestamp }
          : t
      )
    );
  }
}
