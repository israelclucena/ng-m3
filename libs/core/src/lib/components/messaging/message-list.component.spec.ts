import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageListComponent } from './message-list.component';
import { MessageThread } from './messaging.types';

/** Build a thread with sensible defaults, overridable per test. */
function thread(over: Partial<MessageThread> = {}): MessageThread {
  return {
    id: 't1',
    participantId: 'p1',
    participantName: 'Maria Silva',
    propertyTitle: 'T2 no Chiado',
    messages: [
      { id: 'm1', senderId: 'p1', senderName: 'Maria Silva', text: 'Olá', timestamp: '2026-03-01T10:00:00Z', read: true },
    ],
    unreadCount: 0,
    lastMessageAt: '2026-03-01T10:00:00Z',
    ...over,
  };
}

describe('MessageListComponent', () => {
  let fixture: ComponentFixture<MessageListComponent>;
  let component: MessageListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MessageListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to an empty thread list', () => {
    expect(component.threads()).toEqual([]);
    expect(component.totalUnread()).toBe(0);
    expect(component.sortedThreads()).toEqual([]);
  });

  // ── totalUnread ──────────────────────────────────────────────────────────────

  it('should sum unread counts across all threads', () => {
    fixture.componentRef.setInput('threads', [
      thread({ id: 'a', unreadCount: 2 }),
      thread({ id: 'b', unreadCount: 3 }),
      thread({ id: 'c', unreadCount: 0 }),
    ]);
    expect(component.totalUnread()).toBe(5);
  });

  // ── sortedThreads ────────────────────────────────────────────────────────────

  it('should sort unread threads ahead of read ones', () => {
    fixture.componentRef.setInput('threads', [
      thread({ id: 'read', unreadCount: 0, lastMessageAt: '2026-03-05T10:00:00Z' }),
      thread({ id: 'unread', unreadCount: 1, lastMessageAt: '2026-03-01T10:00:00Z' }),
    ]);
    const order = component.sortedThreads().map((t) => t.id);
    expect(order).toEqual(['unread', 'read']);
  });

  it('should sort by most recent message when unread counts tie', () => {
    fixture.componentRef.setInput('threads', [
      thread({ id: 'older', unreadCount: 0, lastMessageAt: '2026-03-01T10:00:00Z' }),
      thread({ id: 'newer', unreadCount: 0, lastMessageAt: '2026-03-10T10:00:00Z' }),
    ]);
    const order = component.sortedThreads().map((t) => t.id);
    expect(order).toEqual(['newer', 'older']);
  });

  it('should not mutate the original threads input while sorting', () => {
    const input = [
      thread({ id: 'a', unreadCount: 0 }),
      thread({ id: 'b', unreadCount: 5 }),
    ];
    fixture.componentRef.setInput('threads', input);
    component.sortedThreads();
    expect(input.map((t) => t.id)).toEqual(['a', 'b']);
  });

  // ── getInitials ──────────────────────────────────────────────────────────────

  it('should derive up to two uppercase initials', () => {
    expect(component.getInitials('Maria Silva')).toBe('MS');
    expect(component.getInitials('ana')).toBe('A');
    expect(component.getInitials('João Pedro Santos')).toBe('JP');
  });

  // ── getLastMessage ───────────────────────────────────────────────────────────

  it('should return the last message text untouched when short', () => {
    const t = thread({
      messages: [
        { id: 'm1', senderId: 'p1', senderName: 'M', text: 'Primeira', timestamp: '2026-03-01T09:00:00Z', read: true },
        { id: 'm2', senderId: 'p1', senderName: 'M', text: 'Última', timestamp: '2026-03-01T10:00:00Z', read: true },
      ],
    });
    expect(component.getLastMessage(t)).toBe('Última');
  });

  it('should truncate long last messages to 47 chars plus ellipsis', () => {
    const long = 'x'.repeat(80);
    const t = thread({
      messages: [{ id: 'm1', senderId: 'p1', senderName: 'M', text: long, timestamp: '2026-03-01T10:00:00Z', read: true }],
    });
    const result = component.getLastMessage(t);
    expect(result.length).toBe(48);
    expect(result.endsWith('…')).toBe(true);
  });

  it('should return an empty string when a thread has no messages', () => {
    expect(component.getLastMessage(thread({ messages: [] }))).toBe('');
  });

  // ── formatDate ───────────────────────────────────────────────────────────────

  it('should render a time-of-day string for messages under 24h old', () => {
    const recent = new Date(Date.now() - 2 * 3_600_000).toISOString();
    expect(component.formatDate(recent)).toContain(':');
  });

  it('should label messages between 24h and 48h old as "Ontem"', () => {
    const yesterday = new Date(Date.now() - 30 * 3_600_000).toISOString();
    expect(component.formatDate(yesterday)).toBe('Ontem');
  });

  it('should render a calendar date for messages older than 48h', () => {
    const old = new Date(Date.now() - 96 * 3_600_000).toISOString();
    const result = component.formatDate(old);
    expect(result).not.toBe('Ontem');
    expect(result).not.toContain(':');
  });

  // ── threadSelected output ────────────────────────────────────────────────────

  it('should emit the selected thread', () => {
    const t = thread({ id: 'pick-me' });
    let emitted: MessageThread | undefined;
    component.threadSelected.subscribe((th) => (emitted = th));
    component.threadSelected.emit(t);
    expect(emitted).toBe(t);
  });
});
