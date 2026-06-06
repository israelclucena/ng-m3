import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NotFoundPageComponent } from './not-found-page.component';

describe('NotFoundPageComponent', () => {
  let fixture: ComponentFixture<NotFoundPageComponent>;
  let component: NotFoundPageComponent;
  let routerMock: { navigate: jest.Mock };

  beforeEach(async () => {
    routerMock = { navigate: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [NotFoundPageComponent],
      providers: [{ provide: Router, useValue: routerMock }],
    }).compileComponents();
    fixture = TestBed.createComponent(NotFoundPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the error code 404', () => {
    const code = fixture.nativeElement.querySelector('.error-page__code') as HTMLElement;
    expect(code).toBeTruthy();
    expect(code.textContent?.trim()).toBe('404');
  });

  it('renders the page-not-found title', () => {
    const title = fixture.nativeElement.querySelector('.error-page__title') as HTMLElement;
    expect(title).toBeTruthy();
    expect(title.textContent?.trim()).toBe('Page not found');
  });

  it('renders an explanatory message', () => {
    const msg = fixture.nativeElement.querySelector('.error-page__message') as HTMLElement;
    expect(msg).toBeTruthy();
    expect(msg.textContent?.trim()).toContain("doesn't exist");
  });

  it('renders a decorative icon marked aria-hidden', () => {
    const icon = fixture.nativeElement.querySelector('.error-page__icon') as HTMLElement;
    expect(icon).toBeTruthy();
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders both primary and secondary action buttons', () => {
    const primary = fixture.nativeElement.querySelector(
      '.error-page__btn--primary',
    ) as HTMLButtonElement;
    const secondary = fixture.nativeElement.querySelector(
      '.error-page__btn--secondary',
    ) as HTMLButtonElement;
    expect(primary).toBeTruthy();
    expect(secondary).toBeTruthy();
    expect(primary.textContent?.trim()).toBe('Go to Dashboard');
    expect(secondary.textContent?.trim()).toBe('Go Back');
    expect(primary.getAttribute('type')).toBe('button');
    expect(secondary.getAttribute('type')).toBe('button');
  });

  it('goHome() navigates to /dashboard via Router', () => {
    component.goHome();
    expect(routerMock.navigate).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('clicking the primary button calls goHome and navigates to /dashboard', () => {
    const spy = jest.spyOn(component, 'goHome');
    const btn = fixture.nativeElement.querySelector(
      '.error-page__btn--primary',
    ) as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('goBack() invokes history.back()', () => {
    const spy = jest.spyOn(history, 'back').mockImplementation(() => undefined);
    component.goBack();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('clicking the secondary button calls goBack', () => {
    const backSpy = jest.spyOn(history, 'back').mockImplementation(() => undefined);
    const methodSpy = jest.spyOn(component, 'goBack');
    const btn = fixture.nativeElement.querySelector(
      '.error-page__btn--secondary',
    ) as HTMLButtonElement;
    btn.click();
    expect(methodSpy).toHaveBeenCalledTimes(1);
    expect(backSpy).toHaveBeenCalledTimes(1);
    backSpy.mockRestore();
  });

  it('renders the actions container with both buttons inside', () => {
    const actions = fixture.nativeElement.querySelector('.error-page__actions') as HTMLElement;
    expect(actions).toBeTruthy();
    const buttons = actions.querySelectorAll('button.error-page__btn');
    expect(buttons.length).toBe(2);
  });

  it('does not invoke Router.navigate on initial render', () => {
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('renders the root .error-page container', () => {
    const root = fixture.nativeElement.querySelector('.error-page') as HTMLElement;
    expect(root).toBeTruthy();
  });
});
