import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserProfileComponent, UserProfileStats } from './user-profile.component';
import { AuthUser } from '../../services/auth.service';

describe('UserProfileComponent', () => {
  let fixture: ComponentFixture<UserProfileComponent>;
  let component: UserProfileComponent;

  const tenantUser: AuthUser = {
    id: 'u-1',
    name: 'Israel Lucena',
    email: 'israel@example.com',
    role: 'tenant',
  };

  const landlordUser: AuthUser = {
    id: 'u-2',
    name: 'Maria Silva',
    email: 'maria@example.com',
    role: 'landlord',
    avatarUrl: 'https://cdn.example.com/avatar.png',
  };

  const adminUser: AuthUser = {
    id: 'u-3',
    name: 'Admin Root',
    email: 'admin@example.com',
    role: 'admin',
  };

  const sampleStats: UserProfileStats = {
    bookings: 5,
    favourites: 8,
  };

  const landlordStats: UserProfileStats = {
    bookings: 12,
    favourites: 3,
    listings: 4,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProfileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('user', tenantUser);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the user name and email', () => {
    const name = fixture.nativeElement.querySelector('.profile-name') as HTMLElement;
    const email = fixture.nativeElement.querySelector('.profile-email') as HTMLElement;
    expect(name.textContent?.trim()).toBe('Israel Lucena');
    expect(email.textContent?.trim()).toBe('israel@example.com');
  });

  it('renders avatar initials when no avatarUrl is provided', () => {
    const initials = fixture.nativeElement.querySelector('.avatar-initials') as HTMLElement;
    expect(initials).toBeTruthy();
    expect(initials.textContent?.trim()).toBe('IL');
    expect(fixture.nativeElement.querySelector('.avatar-img')).toBeNull();
  });

  it('renders avatar image when avatarUrl is provided', () => {
    fixture.componentRef.setInput('user', landlordUser);
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.avatar-img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://cdn.example.com/avatar.png');
    expect(img.getAttribute('alt')).toBe('Maria Silva');
    expect(fixture.nativeElement.querySelector('.avatar-initials')).toBeNull();
  });

  it('initials computed takes first letter of first two words, uppercase', () => {
    fixture.componentRef.setInput('user', { ...tenantUser, name: 'jane mary doe smith' });
    fixture.detectChanges();
    expect(component.initials()).toBe('JM');
  });

  it('initials handles single-word names', () => {
    fixture.componentRef.setInput('user', { ...tenantUser, name: 'Madonna' });
    fixture.detectChanges();
    expect(component.initials()).toBe('M');
  });

  it('initials handles empty/whitespace name', () => {
    fixture.componentRef.setInput('user', { ...tenantUser, name: '' });
    fixture.detectChanges();
    expect(component.initials()).toBe('');
  });

  it('initials filters out empty segments from extra whitespace', () => {
    fixture.componentRef.setInput('user', { ...tenantUser, name: 'Ana   Beatriz' });
    fixture.detectChanges();
    expect(component.initials()).toBe('AB');
  });

  it('roleLabel returns "Inquilino" for tenant', () => {
    expect(component.roleLabel()).toBe('Inquilino');
  });

  it('roleLabel returns "Proprietário" for landlord', () => {
    fixture.componentRef.setInput('user', landlordUser);
    fixture.detectChanges();
    expect(component.roleLabel()).toBe('Proprietário');
  });

  it('roleLabel returns "Administrador" for admin', () => {
    fixture.componentRef.setInput('user', adminUser);
    fixture.detectChanges();
    expect(component.roleLabel()).toBe('Administrador');
  });

  it('roleLabel falls back to "Utilizador" for unknown roles', () => {
    fixture.componentRef.setInput('user', { ...tenantUser, role: 'guest' as never });
    fixture.detectChanges();
    expect(component.roleLabel()).toBe('Utilizador');
  });

  it('roleIcon maps tenant -> person', () => {
    expect(component.roleIcon()).toBe('person');
  });

  it('roleIcon maps landlord -> home', () => {
    fixture.componentRef.setInput('user', landlordUser);
    fixture.detectChanges();
    expect(component.roleIcon()).toBe('home');
  });

  it('roleIcon maps admin -> admin_panel_settings', () => {
    fixture.componentRef.setInput('user', adminUser);
    fixture.detectChanges();
    expect(component.roleIcon()).toBe('admin_panel_settings');
  });

  it('roleIcon falls back to "person" for unknown roles', () => {
    fixture.componentRef.setInput('user', { ...tenantUser, role: 'guest' as never });
    fixture.detectChanges();
    expect(component.roleIcon()).toBe('person');
  });

  it('role badge has the role-<role> modifier class', () => {
    fixture.componentRef.setInput('user', landlordUser);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.role-badge') as HTMLElement;
    expect(badge.classList.contains('role-landlord')).toBe(true);
  });

  it('does not render the stats row when stats is null', () => {
    expect(fixture.nativeElement.querySelector('.profile-stats')).toBeNull();
  });

  it('renders bookings and favourites when stats is provided', () => {
    fixture.componentRef.setInput('stats', sampleStats);
    fixture.detectChanges();
    const stats = fixture.nativeElement.querySelectorAll('.stat');
    expect(stats.length).toBe(2);
    expect(stats[0].textContent).toContain('5');
    expect(stats[0].textContent).toContain('Reservas');
    expect(stats[1].textContent).toContain('8');
    expect(stats[1].textContent).toContain('Favoritos');
  });

  it('renders the listings stat when listings is defined', () => {
    fixture.componentRef.setInput('stats', landlordStats);
    fixture.detectChanges();
    const stats = fixture.nativeElement.querySelectorAll('.stat');
    expect(stats.length).toBe(3);
    expect(stats[2].textContent).toContain('4');
    expect(stats[2].textContent).toContain('Imóveis');
  });

  it('omits the listings stat when listings is undefined', () => {
    fixture.componentRef.setInput('stats', sampleStats);
    fixture.detectChanges();
    const stats = fixture.nativeElement.querySelectorAll('.stat');
    expect(stats.length).toBe(2);
    expect(fixture.nativeElement.textContent).not.toContain('Imóveis');
  });

  it('renders edit and logout buttons by default (editable=true)', () => {
    const actions = fixture.nativeElement.querySelector('.profile-actions');
    expect(actions).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.btn-filled')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.btn-text.danger')).toBeTruthy();
  });

  it('renders the avatar-edit button when editable=true', () => {
    const editBtn = fixture.nativeElement.querySelector('.avatar-edit-btn');
    expect(editBtn).toBeTruthy();
    expect(editBtn.getAttribute('aria-label')).toBe('Alterar foto de perfil');
  });

  it('hides actions and avatar-edit button when editable=false', () => {
    fixture.componentRef.setInput('editable', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.profile-actions')).toBeNull();
    expect(fixture.nativeElement.querySelector('.avatar-edit-btn')).toBeNull();
  });

  it('emits editProfile when "Editar Perfil" button is clicked', () => {
    const emitSpy = jest.fn();
    component.editProfile.subscribe(emitSpy);
    const btn = fixture.nativeElement.querySelector('.btn-filled') as HTMLButtonElement;
    btn.click();
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('emits logout when "Sair" button is clicked', () => {
    const emitSpy = jest.fn();
    component.logout.subscribe(emitSpy);
    const btn = fixture.nativeElement.querySelector('.btn-text.danger') as HTMLButtonElement;
    btn.click();
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('emits editAvatar when the avatar camera button is clicked', () => {
    const emitSpy = jest.fn();
    component.editAvatar.subscribe(emitSpy);
    const btn = fixture.nativeElement.querySelector('.avatar-edit-btn') as HTMLButtonElement;
    btn.click();
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('applies the compact class to the root when compact=true', () => {
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.iu-user-profile') as HTMLElement;
    expect(root.classList.contains('compact')).toBe(true);
  });

  it('does not apply the compact class by default', () => {
    const root = fixture.nativeElement.querySelector('.iu-user-profile') as HTMLElement;
    expect(root.classList.contains('compact')).toBe(false);
  });

  it('avatar initials element has aria-label set to the user name', () => {
    const initials = fixture.nativeElement.querySelector('.avatar-initials') as HTMLElement;
    expect(initials.getAttribute('aria-label')).toBe('Israel Lucena');
  });

  it('renders the role icon span inside the role badge', () => {
    fixture.componentRef.setInput('user', adminUser);
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('.role-badge .role-icon') as HTMLElement;
    expect(icon.textContent?.trim()).toBe('admin_panel_settings');
  });

  it('shows zero stat values without omitting them', () => {
    fixture.componentRef.setInput('stats', { bookings: 0, favourites: 0, listings: 0 });
    fixture.detectChanges();
    const values = fixture.nativeElement.querySelectorAll('.stat-value');
    expect(values.length).toBe(3);
    expect(values[0].textContent?.trim()).toBe('0');
    expect(values[1].textContent?.trim()).toBe('0');
    expect(values[2].textContent?.trim()).toBe('0');
  });
});
