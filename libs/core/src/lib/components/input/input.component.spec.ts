import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputComponent } from './input.component';

describe('InputComponent', () => {
  let fixture: ComponentFixture<InputComponent>;
  let component: InputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render label when provided', () => {
    fixture.componentRef.setInput('label', 'Nome');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.iu-input__label');
    expect(label?.textContent?.trim()).toContain('Nome');
  });

  it('should toggle password visibility', () => {
    fixture.componentRef.setInput('type', 'password');
    fixture.detectChanges();
    expect(component.showPassword()).toBe(false);
    component.togglePassword();
    expect(component.showPassword()).toBe(true);
  });

  it('should show error message', () => {
    fixture.componentRef.setInput('errorMessage', 'Campo obrigatório');
    fixture.detectChanges();
    const msg = fixture.nativeElement.querySelector('.iu-input__message--error');
    expect(msg?.textContent?.trim()).toContain('Campo obrigatório');
  });

  it('should apply disabled state', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.iu-input__field');
    expect(input?.disabled).toBe(true);
  });
});
