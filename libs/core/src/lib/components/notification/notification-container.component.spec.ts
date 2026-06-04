import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationContainerComponent } from './notification-container.component';
import { NotificationService } from './notification.service';

describe('NotificationContainerComponent', () => {
  let fixture: ComponentFixture<NotificationContainerComponent>;
  let component: NotificationContainerComponent;
  let service: NotificationService;

  beforeEach(async () => {
    jest.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [NotificationContainerComponent],
      providers: [NotificationService],
    }).compileComponents();
    fixture = TestBed.createComponent(NotificationContainerComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(NotificationService);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders nothing when service.current() is null', () => {
    expect(service.current()).toBeNull();
    const root = fixture.nativeElement.querySelector('.iu-notification');
    expect(root).toBeNull();
  });

  it('icon() defaults to "info" when no notification is present', () => {
    expect(component.icon()).toBe('info');
  });

  it('hostClass() is empty string when no notification is present', () => {
    expect(component.hostClass()).toBe('');
  });

  it('renders .iu-notification with role="alert" and aria-live="polite" after show()', () => {
    service.show({ message: 'hello' });
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.iu-notification') as HTMLElement;
    expect(root).toBeTruthy();
    expect(root.getAttribute('role')).toBe('alert');
    expect(root.getAttribute('aria-live')).toBe('polite');
  });

  it('renders icon span with material-symbols-outlined class and correct icon for type', () => {
    service.show({ message: 'done', type: 'success' });
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector(
      '.iu-notification__icon',
    ) as HTMLElement;
    expect(icon).toBeTruthy();
    expect(icon.classList.contains('material-symbols-outlined')).toBe(true);
    expect(icon.textContent?.trim()).toBe('check_circle');
  });

  it('renders message text from the current notification', () => {
    service.show({ message: 'Item saved!' });
    fixture.detectChanges();
    const msg = fixture.nativeElement.querySelector(
      '.iu-notification__message',
    ) as HTMLElement;
    expect(msg).toBeTruthy();
    expect(msg.textContent?.trim()).toBe('Item saved!');
  });

  it('applies hostClass based on notification type (iu-notification--error)', () => {
    service.show({ message: 'oh no', type: 'error' });
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-notification--error');
    const root = fixture.nativeElement.querySelector('.iu-notification') as HTMLElement;
    expect(root.classList.contains('iu-notification--error')).toBe(true);
  });

  it('does not render action button when notif.action is empty', () => {
    service.show({ message: 'no action' });
    fixture.detectChanges();
    const actionBtn = fixture.nativeElement.querySelector('.iu-notification__action');
    expect(actionBtn).toBeNull();
  });

  it('renders action button with action text when notif.action is set', () => {
    service.show({ message: 'failed', action: 'Retry' });
    fixture.detectChanges();
    const actionBtn = fixture.nativeElement.querySelector(
      '.iu-notification__action',
    ) as HTMLButtonElement;
    expect(actionBtn).toBeTruthy();
    expect(actionBtn.textContent?.trim()).toBe('Retry');
  });

  it('clicking action button calls service.triggerAction()', () => {
    const spy = jest.spyOn(service, 'triggerAction');
    service.show({ message: 'failed', action: 'Retry' });
    fixture.detectChanges();
    const actionBtn = fixture.nativeElement.querySelector(
      '.iu-notification__action',
    ) as HTMLButtonElement;
    actionBtn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('always renders close button with aria-label="Dismiss" when notification is visible', () => {
    service.show({ message: 'hi' });
    fixture.detectChanges();
    const closeBtn = fixture.nativeElement.querySelector(
      '.iu-notification__close',
    ) as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.getAttribute('aria-label')).toBe('Dismiss');
  });

  it('clicking close button dismisses the notification', () => {
    const spy = jest.spyOn(service, 'dismiss');
    service.show({ message: 'bye' });
    fixture.detectChanges();
    const closeBtn = fixture.nativeElement.querySelector(
      '.iu-notification__close',
    ) as HTMLButtonElement;
    closeBtn.click();
    expect(spy).toHaveBeenCalledTimes(1);
    fixture.detectChanges();
    expect(service.current()).toBeNull();
    const root = fixture.nativeElement.querySelector('.iu-notification');
    expect(root).toBeNull();
  });

  it('icon() computed reflects each notification type', () => {
    service.show({ message: 'w', type: 'warning' });
    fixture.detectChanges();
    expect(component.icon()).toBe('warning');
    const iconEl = fixture.nativeElement.querySelector(
      '.iu-notification__icon',
    ) as HTMLElement;
    expect(iconEl.textContent?.trim()).toBe('warning');
  });

  it('close button contains a material-symbols-outlined "close" span', () => {
    service.show({ message: 'hi' });
    fixture.detectChanges();
    const closeBtn = fixture.nativeElement.querySelector(
      '.iu-notification__close',
    ) as HTMLButtonElement;
    const closeIcon = closeBtn.querySelector(
      'span.material-symbols-outlined',
    ) as HTMLElement;
    expect(closeIcon).toBeTruthy();
    expect(closeIcon.textContent?.trim()).toBe('close');
  });
});
