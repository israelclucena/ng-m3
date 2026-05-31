import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TagInputComponent, type TagInputChange, type TagInputTag } from './tag-input.component';

describe('TagInputComponent', () => {
  let fixture: ComponentFixture<TagInputComponent>;
  let component: TagInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TagInputComponent] }).compileComponents();
    fixture = TestBed.createComponent(TagInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    const root = fixture.nativeElement.querySelector('.iu-tag-input');
    expect(root).toBeTruthy();
  });

  it('should sync tags from value input via effect', () => {
    const value: TagInputTag[] = [{ value: 'angular' }, { value: 'ts', label: 'TypeScript' }];
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();

    expect(component.tags()).toEqual(value);
    const tagEls = fixture.nativeElement.querySelectorAll('.iu-tag-input__tag');
    expect(tagEls.length).toBe(2);
    const labels = fixture.nativeElement.querySelectorAll('.iu-tag-input__tag-label');
    expect(labels[0].textContent.trim()).toBe('angular');
    expect(labels[1].textContent.trim()).toBe('TypeScript');
  });

  it('should render helper text and error message, with error taking precedence', () => {
    fixture.componentRef.setInput('helperText', 'Type and press Enter');
    fixture.detectChanges();
    let helper = fixture.nativeElement.querySelector('.iu-tag-input__helper');
    expect(helper?.textContent?.trim()).toBe('Type and press Enter');

    fixture.componentRef.setInput('errorMessage', 'Too many tags');
    fixture.detectChanges();
    helper = fixture.nativeElement.querySelector('.iu-tag-input__helper');
    const error = fixture.nativeElement.querySelector('.iu-tag-input__error');
    expect(helper).toBeNull();
    expect(error?.textContent?.trim()).toContain('Too many tags');
    expect(fixture.nativeElement.querySelector('.iu-tag-input--error')).toBeTruthy();
  });

  it('should compute maxReached and hide input + show count when maxTags reached', () => {
    fixture.componentRef.setInput('maxTags', 2);
    fixture.componentRef.setInput('value', [{ value: 'a' }, { value: 'b' }]);
    fixture.detectChanges();

    expect(component.maxReached()).toBe(true);
    expect(fixture.nativeElement.querySelector('.iu-tag-input__input')).toBeNull();
    const count = fixture.nativeElement.querySelector('.iu-tag-input__count');
    expect(count?.textContent?.trim()).toBe('2/2');
  });

  it('should filter suggestions by input value and exclude existing tags', () => {
    fixture.componentRef.setInput('suggestions', ['Angular', 'AngularJS', 'React', 'Vue']);
    fixture.componentRef.setInput('value', [{ value: 'React' }]);
    fixture.detectChanges();

    component.inputValue.set('ang');
    expect(component.filteredSuggestions()).toEqual(['Angular', 'AngularJS']);

    component.inputValue.set('');
    expect(component.filteredSuggestions()).toEqual(['Angular', 'AngularJS', 'Vue']);
  });

  it('should emit tagsChange with added tag on Enter and clear input', () => {
    const spy = jest.fn<void, [TagInputChange]>();
    component.tagsChange.subscribe(spy);
    component.inputValue.set('typescript');

    component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = spy.mock.calls[0][0];
    expect(payload.added).toEqual({ value: 'typescript' });
    expect(payload.tags).toEqual([{ value: 'typescript' }]);
    expect(component.inputValue()).toBe('');
  });

  it('should not add duplicate tags (case-insensitive) and not emit', () => {
    fixture.componentRef.setInput('value', [{ value: 'Angular' }]);
    fixture.detectChanges();
    const spy = jest.fn();
    component.tagsChange.subscribe(spy);

    component.inputValue.set('angular');
    component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(spy).not.toHaveBeenCalled();
    expect(component.tags().length).toBe(1);
  });

  it('should remove last tag on Backspace when input is empty', () => {
    fixture.componentRef.setInput('value', [{ value: 'one' }, { value: 'two' }]);
    fixture.detectChanges();
    const spy = jest.fn<void, [TagInputChange]>();
    component.tagsChange.subscribe(spy);

    component.onKeydown(new KeyboardEvent('keydown', { key: 'Backspace' }));

    expect(component.tags()).toEqual([{ value: 'one' }]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].removed).toEqual({ value: 'two' });
  });

  it('should navigate suggestions with ArrowDown/ArrowUp and clamp', () => {
    fixture.componentRef.setInput('suggestions', ['a', 'b', 'c']);
    fixture.detectChanges();
    component.inputValue.set('');

    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.activeIndex()).toBe(0);
    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.activeIndex()).toBe(2);

    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(component.activeIndex()).toBe(1);
    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(component.activeIndex()).toBe(-1);
  });

  it('should commit active suggestion on Enter when activeIndex >= 0', () => {
    fixture.componentRef.setInput('suggestions', ['Angular', 'React']);
    fixture.detectChanges();
    const spy = jest.fn<void, [TagInputChange]>();
    component.tagsChange.subscribe(spy);

    component.inputValue.set('');
    component.activeIndex.set(1);
    component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].added).toEqual({ value: 'React' });
  });

  it('should commit tag on separator char via onInput and clear value', () => {
    const spy = jest.fn<void, [TagInputChange]>();
    component.tagsChange.subscribe(spy);
    const inputEl = document.createElement('input');
    inputEl.value = 'foo,';
    const evt = { target: inputEl } as unknown as Event;

    component.onInput(evt);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].added).toEqual({ value: 'foo' });
    expect(component.inputValue()).toBe('');
    expect(inputEl.value).toBe('');
  });

  it('should toggle focused state and hide suggestions on blur after 150ms', () => {
    jest.useFakeTimers();
    try {
      component.onFocus();
      expect(component.focused()).toBe(true);
      expect(component.showSuggestions()).toBe(true);

      component.inputValue.set('lingering');
      const spy = jest.fn<void, [TagInputChange]>();
      component.tagsChange.subscribe(spy);

      component.onBlur();
      expect(component.focused()).toBe(false);
      expect(component.showSuggestions()).toBe(true);

      jest.advanceTimersByTime(150);

      expect(component.showSuggestions()).toBe(false);
      expect(component.activeIndex()).toBe(-1);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].added).toEqual({ value: 'lingering' });
    } finally {
      jest.useRealTimers();
    }
  });

  it('should close suggestions on Escape', () => {
    component.showSuggestions.set(true);
    component.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.showSuggestions()).toBe(false);
  });

  it('should hide remove buttons when disabled', () => {
    fixture.componentRef.setInput('value', [{ value: 'one' }]);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.iu-tag-input--disabled')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iu-tag-input__tag-remove')).toBeNull();
  });

  it('should render dropdown with active suggestion class when showSuggestions and filtered exist', () => {
    fixture.componentRef.setInput('suggestions', ['Alpha', 'Beta']);
    fixture.detectChanges();
    component.showSuggestions.set(true);
    component.activeIndex.set(1);
    fixture.detectChanges();

    const dropdown = fixture.nativeElement.querySelector('.iu-tag-input__dropdown');
    expect(dropdown).toBeTruthy();
    const items = fixture.nativeElement.querySelectorAll('.iu-tag-input__suggestion');
    expect(items.length).toBe(2);
    expect(items[1].classList.contains('iu-tag-input__suggestion--active')).toBe(true);
  });
});
