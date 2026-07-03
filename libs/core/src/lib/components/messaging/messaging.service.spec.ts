import { TestBed } from '@angular/core/testing';
import { MessagingService, CURRENT_USER_ID } from './messaging.service';

describe('MessagingService', () => {
  let service: MessagingService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MessagingService] });
    service = TestBed.inject(MessagingService);
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it('should be created with seeded threads', () => {
    expect(service).toBeTruthy();
    expect(service.threads().length).toBe(2);
  });

  it('exposes CURRENT_USER_ID constant', () => {
    expect(CURRENT_USER_ID).toBe('user-current');
  });

  it('totalUnread() sums unreadCount across all threads', () => {
    // thread-1 has 2 unread, thread-2 has 0 → total 2
    expect(service.totalUnread()).toBe(2);
  });

  it('activeThread() is null before any thread is opened', () => {
    expect(service.activeThread()).toBeNull();
  });

  // ── openThread ─────────────────────────────────────────────────────────────

  it('openThread() sets the active thread', () => {
    service.openThread('thread-1');
    expect(service.activeThread()?.id).toBe('thread-1');
  });

  it('openThread() marks the thread unreadCount to 0', () => {
    service.openThread('thread-1');
    const t = service.threads().find(t => t.id === 'thread-1');
    expect(t?.unreadCount).toBe(0);
  });

  it('openThread() marks every message in the thread as read', () => {
    service.openThread('thread-1');
    const t = service.threads().find(t => t.id === 'thread-1');
    expect(t?.messages.every(m => m.read)).toBe(true);
  });

  it('openThread() reduces totalUnread to 0 after opening the unread thread', () => {
    expect(service.totalUnread()).toBe(2);
    service.openThread('thread-1');
    expect(service.totalUnread()).toBe(0);
  });

  it('openThread() with an unknown id sets active to null (no matching thread)', () => {
    service.openThread('does-not-exist');
    expect(service.activeThread()).toBeNull();
  });

  it('openThread() leaves other threads untouched', () => {
    service.openThread('thread-1');
    const other = service.threads().find(t => t.id === 'thread-2');
    expect(other?.unreadCount).toBe(0);
    expect(other?.messages.length).toBe(2);
  });

  // ── closeThread ────────────────────────────────────────────────────────────

  it('closeThread() clears the active thread', () => {
    service.openThread('thread-1');
    expect(service.activeThread()).not.toBeNull();
    service.closeThread();
    expect(service.activeThread()).toBeNull();
  });

  // ── sendMessage ────────────────────────────────────────────────────────────

  it('sendMessage() appends a message from the current user', () => {
    const before = service.threads().find(t => t.id === 'thread-2')!.messages.length;
    service.sendMessage('thread-2', 'Olá, quando posso visitar?');
    const after = service.threads().find(t => t.id === 'thread-2')!;
    expect(after.messages.length).toBe(before + 1);
    const last = after.messages[after.messages.length - 1];
    expect(last.senderId).toBe(CURRENT_USER_ID);
    expect(last.text).toBe('Olá, quando posso visitar?');
    expect(last.read).toBe(true);
  });

  it('sendMessage() trims whitespace from the text', () => {
    service.sendMessage('thread-2', '   espaços   ');
    const t = service.threads().find(t => t.id === 'thread-2')!;
    expect(t.messages[t.messages.length - 1].text).toBe('espaços');
  });

  it('sendMessage() updates lastMessageAt to the new message timestamp', () => {
    service.sendMessage('thread-2', 'nova mensagem');
    const t = service.threads().find(t => t.id === 'thread-2')!;
    const last = t.messages[t.messages.length - 1];
    expect(t.lastMessageAt).toBe(last.timestamp);
  });

  it('sendMessage() ignores an empty / whitespace-only message', () => {
    const before = service.threads().find(t => t.id === 'thread-1')!.messages.length;
    service.sendMessage('thread-1', '   ');
    const after = service.threads().find(t => t.id === 'thread-1')!.messages.length;
    expect(after).toBe(before);
  });

  it('sendMessage() to an unknown thread does not throw and adds nothing', () => {
    const totalBefore = service.threads().reduce((s, t) => s + t.messages.length, 0);
    expect(() => service.sendMessage('ghost', 'hi')).not.toThrow();
    const totalAfter = service.threads().reduce((s, t) => s + t.messages.length, 0);
    expect(totalAfter).toBe(totalBefore);
  });

  it('sent messages get a unique id', () => {
    service.sendMessage('thread-2', 'primeira');
    service.sendMessage('thread-2', 'segunda');
    const t = service.threads().find(t => t.id === 'thread-2')!;
    const ids = t.messages.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
