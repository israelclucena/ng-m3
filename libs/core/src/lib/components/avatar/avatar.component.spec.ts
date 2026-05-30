import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarComponent, AvatarGroupComponent } from './avatar.component';

describe('AvatarComponent', () => {
  let fixture: ComponentFixture<AvatarComponent>;
  let component: AvatarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AvatarComponent] }).compileComponents();
    fixture = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute initials from single name (Israel -> I)', () => {
    fixture.componentRef.setInput('name', 'Israel');
    fixture.detectChanges();
    expect(component.initials()).toBe('I');
  });

  it('should compute initials from multi-word name (Israel Lucena -> IL)', () => {
    fixture.componentRef.setInput('name', 'Israel Lucena');
    fixture.detectChanges();
    expect(component.initials()).toBe('IL');
  });

  it('should render <img> when src is set', () => {
    fixture.componentRef.setInput('src', 'https://example.com/me.jpg');
    fixture.componentRef.setInput('name', 'Israel');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img.iu-avatar__img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/me.jpg');
  });

  it('should fall back to initials span when no src and name is set', () => {
    fixture.componentRef.setInput('src', '');
    fixture.componentRef.setInput('name', 'Israel Lucena');
    fixture.detectChanges();
    const initials = fixture.nativeElement.querySelector('.iu-avatar__initials');
    expect(initials).toBeTruthy();
    expect(initials.textContent.trim()).toBe('IL');
    expect(fixture.nativeElement.querySelector('img.iu-avatar__img')).toBeFalsy();
  });

  it('should fall back to icon span when no src and no name', () => {
    fixture.componentRef.setInput('src', '');
    fixture.componentRef.setInput('name', '');
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('.iu-avatar__icon');
    expect(icon).toBeTruthy();
    expect(icon.textContent.trim()).toBe('person');
  });

  it('should set imgError signal via onImgError() and hide <img> in favor of fallback', () => {
    fixture.componentRef.setInput('src', 'https://example.com/broken.jpg');
    fixture.componentRef.setInput('name', 'Israel Lucena');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img.iu-avatar__img')).toBeTruthy();

    component.onImgError();
    fixture.detectChanges();

    expect(component.imgError()).toBe(true);
    expect(fixture.nativeElement.querySelector('img.iu-avatar__img')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.iu-avatar__initials')?.textContent.trim()).toBe('IL');
  });

  it('should compute avatarClasses reflecting size and shape inputs', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.componentRef.setInput('shape', 'rounded');
    fixture.detectChanges();
    expect(component.avatarClasses()).toBe('iu-avatar--lg iu-avatar--rounded');
    const root = fixture.nativeElement.querySelector('.iu-avatar');
    expect(root.classList.contains('iu-avatar--lg')).toBe(true);
    expect(root.classList.contains('iu-avatar--rounded')).toBe(true);
  });

  it('should set aria-label equal to name', () => {
    fixture.componentRef.setInput('name', 'Israel Lucena');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[role="img"]');
    expect(root.getAttribute('aria-label')).toBe('Israel Lucena');
  });
});

describe('AvatarGroupComponent', () => {
  let fixture: ComponentFixture<AvatarGroupComponent>;
  let component: AvatarGroupComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AvatarGroupComponent] }).compileComponents();
    fixture = TestBed.createComponent(AvatarGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should respect max input and compute overflow (6 avatars, max=4 -> overflow 2)', () => {
    const avatars = [
      { name: 'A One' }, { name: 'B Two' }, { name: 'C Three' },
      { name: 'D Four' }, { name: 'E Five' }, { name: 'F Six' },
    ];
    fixture.componentRef.setInput('avatars', avatars);
    fixture.componentRef.setInput('max', 4);
    fixture.detectChanges();

    expect(component.visibleAvatars().length).toBe(4);
    expect(component.overflow()).toBe(2);

    const overflowEl = fixture.nativeElement.querySelector('.iu-avatar-group__overflow');
    expect(overflowEl).toBeTruthy();
    expect(overflowEl.textContent.trim()).toBe('+2');
  });

  it('should pluralize groupLabel (1 member vs 3 members)', () => {
    fixture.componentRef.setInput('avatars', [{ name: 'Solo' }]);
    fixture.detectChanges();
    expect(component.groupLabel()).toBe('1 member');

    fixture.componentRef.setInput('avatars', [
      { name: 'A One' }, { name: 'B Two' }, { name: 'C Three' },
    ]);
    fixture.detectChanges();
    expect(component.groupLabel()).toBe('3 members');
  });
});
