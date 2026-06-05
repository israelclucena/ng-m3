import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileCardComponent } from './profile-card.component';

describe('ProfileCardComponent', () => {
  let fixture: ComponentFixture<ProfileCardComponent>;
  let component: ProfileCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProfileCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(ProfileCardComponent);
    component = fixture.componentInstance;
    // name is required — set before first detectChanges
    fixture.componentRef.setInput('name', 'Israel');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has expected input defaults', () => {
    expect(component.name()).toBe('Israel');
    expect(component.role()).toBe('');
    expect(component.avatarIcon()).toBe('person');
    expect(component.avatarUrl()).toBe('');
    expect(component.stats()).toEqual([]);
    expect(component.cardVariant()).toBe('elevated');
  });

  it('renders inner iu-card wrapping .iu-profile-card content', () => {
    const card = fixture.nativeElement.querySelector('iu-card') as HTMLElement;
    expect(card).toBeTruthy();
    const inner = card.querySelector('.iu-profile-card') as HTMLElement;
    expect(inner).toBeTruthy();
  });

  it('renders the name text inside h3.iu-profile-card__name', () => {
    const name = fixture.nativeElement.querySelector('h3.iu-profile-card__name') as HTMLElement;
    expect(name).toBeTruthy();
    expect(name.textContent?.trim()).toBe('Israel');
  });

  it('renders fallback avatar icon span when avatarUrl() is empty', () => {
    const iconSpan = fixture.nativeElement.querySelector(
      '.iu-profile-card__avatar .material-symbols-outlined',
    ) as HTMLElement;
    expect(iconSpan).toBeTruthy();
    expect(iconSpan.textContent?.trim()).toBe('person');
    const img = fixture.nativeElement.querySelector('.iu-profile-card__avatar-img');
    expect(img).toBeNull();
  });

  it('renders avatar img when avatarUrl() is non-empty (and hides icon fallback)', () => {
    fixture.componentRef.setInput('avatarUrl', 'https://example.com/avatar.png');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector(
      'img.iu-profile-card__avatar-img',
    ) as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.png');
    expect(img.getAttribute('alt')).toBe('Israel');
    const iconSpan = fixture.nativeElement.querySelector(
      '.iu-profile-card__avatar .material-symbols-outlined',
    );
    expect(iconSpan).toBeNull();
  });

  it('uses custom avatarIcon() when provided and no avatarUrl', () => {
    fixture.componentRef.setInput('avatarIcon', 'account_circle');
    fixture.detectChanges();
    const iconSpan = fixture.nativeElement.querySelector(
      '.iu-profile-card__avatar .material-symbols-outlined',
    ) as HTMLElement;
    expect(iconSpan).toBeTruthy();
    expect(iconSpan.textContent?.trim()).toBe('account_circle');
  });

  it('does not render role paragraph when role() is empty', () => {
    const role = fixture.nativeElement.querySelector('.iu-profile-card__role');
    expect(role).toBeNull();
  });

  it('renders role paragraph when role() is non-empty', () => {
    fixture.componentRef.setInput('role', 'Developer');
    fixture.detectChanges();
    const role = fixture.nativeElement.querySelector('.iu-profile-card__role') as HTMLElement;
    expect(role).toBeTruthy();
    expect(role.textContent?.trim()).toBe('Developer');
  });

  it('does not render stats section when stats() is empty', () => {
    const stats = fixture.nativeElement.querySelector('.iu-profile-card__stats');
    expect(stats).toBeNull();
  });

  it('renders stats section with one entry per stat when stats() is non-empty', () => {
    fixture.componentRef.setInput('stats', [
      { label: 'Projects', value: '12' },
      { label: 'Commits', value: '847' },
    ]);
    fixture.detectChanges();
    const stats = fixture.nativeElement.querySelector('.iu-profile-card__stats') as HTMLElement;
    expect(stats).toBeTruthy();
    const entries = fixture.nativeElement.querySelectorAll('.iu-profile-card__stat');
    expect(entries.length).toBe(2);
    const values = fixture.nativeElement.querySelectorAll('.iu-profile-card__stat-value');
    const labels = fixture.nativeElement.querySelectorAll('.iu-profile-card__stat-label');
    expect((values[0] as HTMLElement).textContent?.trim()).toBe('12');
    expect((labels[0] as HTMLElement).textContent?.trim()).toBe('Projects');
    expect((values[1] as HTMLElement).textContent?.trim()).toBe('847');
    expect((labels[1] as HTMLElement).textContent?.trim()).toBe('Commits');
  });

  it('propagates cardVariant() to inner iu-card variant input', () => {
    fixture.componentRef.setInput('cardVariant', 'filled');
    fixture.detectChanges();
    const article = fixture.nativeElement.querySelector('iu-card article') as HTMLElement;
    expect(article.className).toContain('iu-card--filled');
  });

  it('renders inner iu-card as full-width', () => {
    const article = fixture.nativeElement.querySelector('iu-card article') as HTMLElement;
    expect(article.className).toContain('iu-card--full-width');
  });

  it('updates name text reactively when name input changes', () => {
    fixture.componentRef.setInput('name', 'Updated Name');
    fixture.detectChanges();
    const name = fixture.nativeElement.querySelector('h3.iu-profile-card__name') as HTMLElement;
    expect(name.textContent?.trim()).toBe('Updated Name');
  });
});
