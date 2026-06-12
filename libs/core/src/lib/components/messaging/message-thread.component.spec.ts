import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageThreadComponent } from './message-thread.component';
import { CURRENT_USER_ID } from './messaging.service';
import type { ChatMessage, MessageThread } from './messaging.types';

describe('MessageThreadComponent', () => {
  let fixture: ComponentFixture<MessageThreadComponent>;
  let component: MessageThreadComponent;

  const ownMessage: ChatMessage = {
    id: 'm-own',
    senderId: CURRENT_USER_ID,
    senderName: 'Eu',
    text: 'Olá, tenho interesse no apartamento.',
    timestamp: '2026-03-11T10:30:00Z',
    read: true,
  };

  const otherMessage: ChatMessage = {
    id: 'm-other',
    senderId: 'landlord-1',
    senderName: 'Carlos Mendes',
    text: 'Claro, disponível para visita esta semana.',
    timestamp: '2026-03-11T09:00:00Z',
    read: false,
  };

  function makeThread(overrides: Partial<MessageThread> = {}): MessageThread {
    return {
      id: 'thread-1',
      participantId: 'landlord-1',
      participantName: 'Carlos Mendes',
      participantAvatar: '',
      propertyTitle: 'T2 Bairro Alto, Lisboa',
      unreadCount: 0,
      lastMessageAt: '2026-03-11T10:30:00Z',
      messages: [otherMessage, ownMessage],
      ...overrides,
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageThreadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MessageThreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the thread container', () => {
    expect(fixture.nativeElement.querySelector('.iu-message-thread')).toBeTruthy();
  });

  it('renders empty state when thread is null', () => {
    // default input is null
    const empty = fixture.nativeElement.querySelector('.iu-message-thread__empty');
    expect(empty).toBeTruthy();
    expect((empty as HTMLElement).textContent).toContain('Ainda não há mensagens');
  });

  it('renders empty state when thread has no messages', () => {
    fixture.componentRef.setInput('thread', makeThread({ messages: [] }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-message-thread__empty')).toBeTruthy();
  });

  it('does not render empty state when thread has messages', () => {
    fixture.componentRef.setInput('thread', makeThread());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-message-thread__empty')).toBeFalsy();
  });

  it('renders no message bubbles when thread is null', () => {
    const bubbles = fixture.nativeElement.querySelectorAll('.iu-message-bubble');
    expect(bubbles.length).toBe(0);
  });

  it('renders one .iu-message-bubble per message', () => {
    fixture.componentRef.setInput('thread', makeThread());
    fixture.detectChanges();
    const bubbles = fixture.nativeElement.querySelectorAll('.iu-message-bubble');
    expect(bubbles.length).toBe(2);
  });

  it('renders the message text inside each bubble', () => {
    fixture.componentRef.setInput('thread', makeThread());
    fixture.detectChanges();
    const texts = Array.from(
      fixture.nativeElement.querySelectorAll('.iu-message-bubble__text')
    ).map((el) => (el as HTMLElement).textContent?.trim());
    expect(texts).toContain('Claro, disponível para visita esta semana.');
    expect(texts).toContain('Olá, tenho interesse no apartamento.');
  });

  it('gives the --mine class to a bubble whose senderId === CURRENT_USER_ID', () => {
    fixture.componentRef.setInput('thread', makeThread({ messages: [ownMessage] }));
    fixture.detectChanges();
    const bubble = fixture.nativeElement.querySelector('.iu-message-bubble') as HTMLElement;
    expect(bubble.classList.contains('iu-message-bubble--mine')).toBe(true);
    expect(bubble.classList.contains('iu-message-bubble--theirs')).toBe(false);
  });

  it('gives the --theirs class to a bubble from another sender', () => {
    fixture.componentRef.setInput('thread', makeThread({ messages: [otherMessage] }));
    fixture.detectChanges();
    const bubble = fixture.nativeElement.querySelector('.iu-message-bubble') as HTMLElement;
    expect(bubble.classList.contains('iu-message-bubble--theirs')).toBe(true);
    expect(bubble.classList.contains('iu-message-bubble--mine')).toBe(false);
  });

  it('isOwn() returns true for own message and false for other', () => {
    expect(component.isOwn(ownMessage)).toBe(true);
    expect(component.isOwn(otherMessage)).toBe(false);
  });

  it('renders an avatar inside bubble only for other-sender messages', () => {
    fixture.componentRef.setInput('thread', makeThread());
    fixture.detectChanges();
    const bubbles = fixture.nativeElement.querySelectorAll('.iu-message-bubble');
    // order matches messages array: [otherMessage, ownMessage]
    const theirsBubble = bubbles[0] as HTMLElement;
    const mineBubble = bubbles[1] as HTMLElement;
    expect(theirsBubble.querySelector('.iu-message-bubble__avatar')).toBeTruthy();
    expect(mineBubble.querySelector('.iu-message-bubble__avatar')).toBeFalsy();
  });

  it('renders the participant name in the header', () => {
    fixture.componentRef.setInput('thread', makeThread());
    fixture.detectChanges();
    const name = fixture.nativeElement.querySelector(
      '.iu-message-thread__participant-name'
    ) as HTMLElement;
    expect(name.textContent).toContain('Carlos Mendes');
  });

  it('renders the propertyTitle when present', () => {
    fixture.componentRef.setInput('thread', makeThread());
    fixture.detectChanges();
    const property = fixture.nativeElement.querySelector('.iu-message-thread__property');
    expect(property).toBeTruthy();
    expect((property as HTMLElement).textContent).toContain('T2 Bairro Alto, Lisboa');
  });

  it('omits the propertyTitle element when not present', () => {
    fixture.componentRef.setInput('thread', makeThread({ propertyTitle: undefined }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-message-thread__property')).toBeFalsy();
  });

  it('renders the avatar image when participantAvatar is set', () => {
    fixture.componentRef.setInput(
      'thread',
      makeThread({ participantAvatar: 'https://example.com/a.png' })
    );
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.iu-message-thread__avatar img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/a.png');
  });

  it('renders initials in the header avatar when no participantAvatar', () => {
    fixture.componentRef.setInput('thread', makeThread({ participantAvatar: '' }));
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.iu-message-thread__avatar span') as HTMLElement;
    expect(span).toBeTruthy();
    expect(span.textContent?.trim()).toBe('CM');
  });

  it('initials() computes up to two uppercase initials from participantName', () => {
    fixture.componentRef.setInput('thread', makeThread({ participantName: 'Ana Beatriz Ferreira' }));
    fixture.detectChanges();
    expect(component.initials()).toBe('AB');
  });

  it('initials() is empty string when thread is null', () => {
    expect(component.initials()).toBe('');
  });

  it('does not render the close button when showClose is false (default)', () => {
    fixture.componentRef.setInput('thread', makeThread());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('md-icon-button')).toBeFalsy();
  });

  it('renders the close button when showClose is true', () => {
    fixture.componentRef.setInput('thread', makeThread());
    fixture.componentRef.setInput('showClose', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('md-icon-button')).toBeTruthy();
  });

  it('clicking the close button emits closed', () => {
    fixture.componentRef.setInput('thread', makeThread());
    fixture.componentRef.setInput('showClose', true);
    fixture.detectChanges();
    const emit = jest.fn();
    component.closed.subscribe(emit);
    const btn = fixture.nativeElement.querySelector('md-icon-button') as HTMLElement;
    btn.click();
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('formatTime() returns an HH:MM string', () => {
    const out = component.formatTime('2026-03-11T10:30:00Z');
    expect(out).toMatch(/^\d{2}:\d{2}$/);
  });

  it('submit() emits messageSent with trimmed draft and clears the draft', () => {
    const emit = jest.fn();
    component.messageSent.subscribe(emit);
    component.draft.set('  Olá mundo  ');
    component.submit();
    expect(emit).toHaveBeenCalledWith('Olá mundo');
    expect(component.draft()).toBe('');
  });

  it('submit() does nothing when draft is empty', () => {
    const emit = jest.fn();
    component.messageSent.subscribe(emit);
    component.draft.set('');
    component.submit();
    expect(emit).not.toHaveBeenCalled();
  });

  it('submit() does nothing when draft is whitespace only', () => {
    const emit = jest.fn();
    component.messageSent.subscribe(emit);
    component.draft.set('    ');
    component.submit();
    expect(emit).not.toHaveBeenCalled();
    expect(component.draft()).toBe('    ');
  });

  it('the Enviar button is disabled when draft is empty', () => {
    const btn = fixture.nativeElement.querySelector('md-filled-button') as HTMLElement & {
      disabled?: boolean;
    };
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
  });

  it('the Enviar button is enabled when draft has content', () => {
    component.draft.set('hi');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('md-filled-button') as HTMLElement & {
      disabled?: boolean;
    };
    expect(btn.disabled).toBe(false);
  });

  it('updates the input value binding from the draft signal', () => {
    component.draft.set('rascunho');
    fixture.detectChanges();
    const field = fixture.nativeElement.querySelector(
      '.iu-message-thread__input'
    ) as HTMLElement & { value?: string };
    expect(field.value).toBe('rascunho');
  });

  it('updates rendered bubbles when the thread input changes', () => {
    fixture.componentRef.setInput('thread', makeThread({ messages: [ownMessage] }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.iu-message-bubble').length).toBe(1);

    fixture.componentRef.setInput('thread', makeThread({ messages: [ownMessage, otherMessage] }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.iu-message-bubble').length).toBe(2);
  });
});
