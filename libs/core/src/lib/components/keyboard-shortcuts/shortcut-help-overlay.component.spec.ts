import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShortcutHelpOverlayComponent } from './shortcut-help-overlay.component';
import { KeyboardShortcutService } from './keyboard-shortcut.service';

describe('ShortcutHelpOverlayComponent', () => {
  let fixture: ComponentFixture<ShortcutHelpOverlayComponent>;
  let component: ShortcutHelpOverlayComponent;
  let service: KeyboardShortcutService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ShortcutHelpOverlayComponent] }).compileComponents();
    fixture = TestBed.createComponent(ShortcutHelpOverlayComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(KeyboardShortcutService);
    // Ensure clean state — each test starts with help hidden and no bindings
    service.helpVisible.set(false);
    fixture.detectChanges();
  });

  afterEach(() => {
    // Reset overlay visibility between tests
    service.helpVisible.set(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the injected KeyboardShortcutService', () => {
    expect(component.service).toBe(service);
  });

  it('does not render the overlay when helpVisible is false', () => {
    expect(component.service.helpVisible()).toBe(false);
    expect(fixture.nativeElement.querySelector('.iu-shortcut-overlay')).toBeNull();
  });

  it('renders the overlay when helpVisible is true', () => {
    service.helpVisible.set(true);
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('.iu-shortcut-overlay') as HTMLElement;
    expect(overlay).toBeTruthy();
    const title = fixture.nativeElement.querySelector('.iu-shortcut-overlay__title') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Keyboard Shortcuts');
  });

  it('clicking the overlay backdrop closes the help overlay', () => {
    service.helpVisible.set(true);
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('.iu-shortcut-overlay') as HTMLElement;
    overlay.click();
    fixture.detectChanges();
    expect(service.helpVisible()).toBe(false);
    expect(fixture.nativeElement.querySelector('.iu-shortcut-overlay')).toBeNull();
  });

  it('clicking the panel does not close the overlay (stopPropagation)', () => {
    service.helpVisible.set(true);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.iu-shortcut-overlay__panel') as HTMLElement;
    panel.click();
    fixture.detectChanges();
    expect(service.helpVisible()).toBe(true);
  });

  it('clicking the close button hides the overlay', () => {
    service.helpVisible.set(true);
    fixture.detectChanges();
    const close = fixture.nativeElement.querySelector('.iu-shortcut-overlay__close') as HTMLButtonElement;
    expect(close).toBeTruthy();
    close.click();
    fixture.detectChanges();
    expect(service.helpVisible()).toBe(false);
  });

  it('categoryEntries() returns an empty array when no shortcuts are registered', () => {
    expect(component.categoryEntries()).toEqual([]);
  });

  it('categoryEntries() groups registered shortcuts by category', () => {
    service.register({
      id: 'search',
      keys: 'ctrl+k',
      description: 'Open search',
      category: 'Navigation',
      handler: () => undefined,
    });
    service.register({
      id: 'save',
      keys: 'ctrl+s',
      description: 'Save document',
      category: 'Editing',
      handler: () => undefined,
    });
    const entries = component.categoryEntries();
    expect(entries.length).toBe(2);
    const navEntry = entries.find(([cat]) => cat === 'Navigation');
    const editEntry = entries.find(([cat]) => cat === 'Editing');
    expect(navEntry).toBeTruthy();
    expect(editEntry).toBeTruthy();
    expect(navEntry![1][0].id).toBe('search');
    expect(editEntry![1][0].id).toBe('save');

    // cleanup
    service.unregister('search');
    service.unregister('save');
  });

  it('renders registered shortcuts grouped by category in the DOM', () => {
    service.register({
      id: 'search',
      keys: 'ctrl+k',
      description: 'Open search',
      category: 'Navigation',
      handler: () => undefined,
    });
    service.helpVisible.set(true);
    fixture.detectChanges();

    const categoryTitles = fixture.nativeElement.querySelectorAll(
      '.iu-shortcut-overlay__category-title',
    ) as NodeListOf<HTMLElement>;
    const titles = Array.from(categoryTitles).map(el => el.textContent?.trim());
    expect(titles).toContain('Navigation');
    expect(titles).toContain('Help');

    const descs = fixture.nativeElement.querySelectorAll(
      '.iu-shortcut-overlay__desc',
    ) as NodeListOf<HTMLElement>;
    const descTexts = Array.from(descs).map(el => el.textContent?.trim());
    expect(descTexts).toContain('Open search');

    service.unregister('search');
  });

  it('always renders the built-in Help category with ? and Esc rows', () => {
    service.helpVisible.set(true);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll(
      '.iu-shortcut-overlay__item',
    ) as NodeListOf<HTMLElement>;
    const texts = Array.from(items).map(el => el.textContent?.replace(/\s+/g, ' ').trim());
    expect(texts.some(t => t?.includes('Show this overlay') && t.includes('?'))).toBe(true);
    expect(texts.some(t => t?.includes('Close overlay') && t.includes('Esc'))).toBe(true);
  });

  it('formatKeys() capitalizes modifier names and rewrites escape to Esc', () => {
    expect(component.formatKeys('ctrl+k')).toBe('Ctrl + K');
    expect(component.formatKeys('shift+alt+a')).toBe('Shift + Alt + A');
    expect(component.formatKeys('escape')).toBe('Esc');
  });

  it('formatKeys() uppercases plain keys', () => {
    expect(component.formatKeys('a')).toBe('A');
    expect(component.formatKeys('?')).toBe('?');
  });

  it('renders the formatted key combo inside a <kbd> element for each registered shortcut', () => {
    service.register({
      id: 'search',
      keys: 'ctrl+k',
      description: 'Open search',
      category: 'Navigation',
      handler: () => undefined,
    });
    service.helpVisible.set(true);
    fixture.detectChanges();

    const kbds = fixture.nativeElement.querySelectorAll(
      '.iu-shortcut-overlay__kbd',
    ) as NodeListOf<HTMLElement>;
    const texts = Array.from(kbds).map(el => el.textContent?.trim());
    expect(texts).toContain('Ctrl + K');

    service.unregister('search');
  });

  it('falls back to "General" category for shortcuts registered without a category', () => {
    service.register({
      id: 'misc',
      keys: 'ctrl+m',
      description: 'Miscellaneous',
      handler: () => undefined,
    });
    const entries = component.categoryEntries();
    const general = entries.find(([cat]) => cat === 'General');
    expect(general).toBeTruthy();
    expect(general![1][0].id).toBe('misc');

    service.unregister('misc');
  });
});
