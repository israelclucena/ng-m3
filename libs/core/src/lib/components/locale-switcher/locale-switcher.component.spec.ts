import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { LocaleSwitcherComponent } from './locale-switcher.component';
import { I18nService, SupportedLocale } from '../../services/i18n.service';

describe('LocaleSwitcherComponent', () => {
  let fixture: ComponentFixture<LocaleSwitcherComponent>;
  let component: LocaleSwitcherComponent;
  let localeSig: WritableSignal<SupportedLocale>;
  let setLocaleSpy: jest.Mock;

  beforeEach(async () => {
    localeSig = signal<SupportedLocale>('pt-PT');
    setLocaleSpy = jest.fn((code: SupportedLocale) => localeSig.set(code));

    await TestBed.configureTestingModule({
      imports: [LocaleSwitcherComponent],
      providers: [
        {
          provide: I18nService,
          useValue: {
            locale: localeSig,
            setLocale: setLocaleSpy,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LocaleSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('exposes pt-PT and en-GB in the locales list', () => {
    const codes = component.locales.map((l) => l.code);
    expect(codes).toEqual(['pt-PT', 'en-GB']);
  });

  it('renders one button per supported locale', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button.locale-btn');
    expect(buttons.length).toBe(2);
  });

  it('renders the group container with aria-label', () => {
    const group = fixture.nativeElement.querySelector('.locale-switcher');
    expect(group?.getAttribute('role')).toBe('group');
    expect(group?.getAttribute('aria-label')).toBe('Language selector');
  });

  it('marks the active locale button with active class and aria-pressed=true', () => {
    const buttons = fixture.nativeElement.querySelectorAll<HTMLButtonElement>('button.locale-btn');
    const ptBtn = buttons[0];
    const enBtn = buttons[1];
    expect(ptBtn.classList.contains('locale-btn--active')).toBe(true);
    expect(ptBtn.getAttribute('aria-pressed')).toBe('true');
    expect(enBtn.classList.contains('locale-btn--active')).toBe(false);
    expect(enBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('updates active button when locale signal changes', () => {
    localeSig.set('en-GB');
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll<HTMLButtonElement>('button.locale-btn');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].classList.contains('locale-btn--active')).toBe(true);
  });

  it('switch() calls i18n.setLocale with the given code', () => {
    component.switch('en-GB');
    expect(setLocaleSpy).toHaveBeenCalledWith('en-GB');
  });

  it('click on a locale button triggers setLocale with that locale code', () => {
    const buttons = fixture.nativeElement.querySelectorAll<HTMLButtonElement>('button.locale-btn');
    buttons[1].click();
    expect(setLocaleSpy).toHaveBeenCalledWith('en-GB');
  });

  it('exposes lang attribute on each button', () => {
    const buttons = fixture.nativeElement.querySelectorAll<HTMLButtonElement>('button.locale-btn');
    expect(buttons[0].getAttribute('lang')).toBe('pt');
    expect(buttons[1].getAttribute('lang')).toBe('en');
  });

  it('exposes title attribute with the full locale label', () => {
    const buttons = fixture.nativeElement.querySelectorAll<HTMLButtonElement>('button.locale-btn');
    expect(buttons[0].getAttribute('title')).toBe('Português (Portugal)');
    expect(buttons[1].getAttribute('title')).toBe('English (UK)');
  });

  it('renders flag and short code text inside each button', () => {
    const buttons = fixture.nativeElement.querySelectorAll<HTMLButtonElement>('button.locale-btn');
    expect(buttons[0].querySelector('.flag')?.textContent).toContain('🇵🇹');
    expect(buttons[0].querySelector('.code')?.textContent).toContain('PT');
    expect(buttons[1].querySelector('.flag')?.textContent).toContain('🇬🇧');
    expect(buttons[1].querySelector('.code')?.textContent).toContain('EN');
  });
});
