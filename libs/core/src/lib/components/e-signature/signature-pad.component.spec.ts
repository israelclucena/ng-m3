import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignaturePadComponent } from './signature-pad.component';

/**
 * jsdom has no real 2D canvas. Stub `getContext`/`toDataURL` with no-op
 * implementations so the component can boot and exercise its drawing logic.
 */
function fakeCtx(): CanvasRenderingContext2D {
  return {
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    drawImage: jest.fn(),
    lineCap: 'butt',
    lineJoin: 'miter',
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;
}

/** Build a minimal PointerEvent-like object for the drawing handlers. */
function pointer(x: number, y: number, target: HTMLElement): PointerEvent {
  return {
    clientX: x,
    clientY: y,
    pointerId: 1,
    target,
    preventDefault: jest.fn(),
  } as unknown as PointerEvent;
}

describe('SignaturePadComponent', () => {
  let fixture: ComponentFixture<SignaturePadComponent>;
  let component: SignaturePadComponent;
  let canvas: HTMLCanvasElement;

  beforeEach(async () => {
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => fakeCtx());
    jest
      .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockReturnValue('data:image/png;base64,STUB');
    // jsdom lacks pointer capture on elements
    if (!Element.prototype.setPointerCapture) {
      Element.prototype.setPointerCapture = jest.fn();
    }

    await TestBed.configureTestingModule({
      imports: [SignaturePadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SignaturePadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngAfterViewInit + canvas setup

    canvas = fixture.nativeElement.querySelector('.sp-canvas');
    // Give the canvas a real-sized box so coordinate scaling is finite
    jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 600, height: 180,
      right: 600, bottom: 180, x: 0, y: 0, toJSON: () => ({}),
    } as DOMRect);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const draw = (): void => {
    component.onPointerDown(pointer(10, 10, canvas));
    component.onPointerMove(pointer(20, 20, canvas));
    component.onPointerUp(pointer(20, 20, canvas));
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the default label and the placeholder hint', () => {
    const label = fixture.nativeElement.querySelector('.sp-label');
    const placeholder = fixture.nativeElement.querySelector('.sp-placeholder');
    expect(label.textContent).toContain('Assinatura Digital');
    expect(placeholder).toBeTruthy();
    expect(placeholder.textContent).toContain('Assine aqui');
  });

  it('should render a signer badge when signerName is provided', () => {
    fixture.componentRef.setInput('signerName', 'Maria Silva');
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.sp-signer-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Maria Silva');
  });

  it('should start with all action buttons disabled (no strokes)', () => {
    const btns = fixture.nativeElement.querySelectorAll('.sp-btn');
    expect(btns.length).toBe(3);
    btns.forEach((b: HTMLButtonElement) => expect(b.disabled).toBe(true));
    expect(component.hasStrokes()).toBe(false);
  });

  // ── Drawing ──────────────────────────────────────────────────────────────────

  it('should register a stroke after a pointer down/move/up sequence', () => {
    draw();
    expect(component.hasStrokes()).toBe(true);
  });

  it('should hide the placeholder and enable buttons once a stroke exists', () => {
    draw();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sp-placeholder')).toBeNull();
    const btns = fixture.nativeElement.querySelectorAll('.sp-btn');
    btns.forEach((b: HTMLButtonElement) => expect(b.disabled).toBe(false));
  });

  it('should ignore pointer move when no drawing is in progress', () => {
    component.onPointerMove(pointer(30, 30, canvas));
    expect(component.hasStrokes()).toBe(false);
  });

  // ── Undo ─────────────────────────────────────────────────────────────────────

  it('should remove the last stroke on undoLast()', () => {
    draw();
    expect(component.hasStrokes()).toBe(true);
    component.undoLast();
    expect(component.hasStrokes()).toBe(false);
  });

  it('should keep hasStrokes true when undoing one of several strokes', () => {
    draw();
    draw();
    component.undoLast();
    expect(component.hasStrokes()).toBe(true);
  });

  // ── Clear ────────────────────────────────────────────────────────────────────

  it('should reset state and emit cleared on clear()', () => {
    const spy = jest.fn();
    component.cleared.subscribe(spy);
    draw();
    component.clear();
    expect(component.hasStrokes()).toBe(false);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // ── Confirm ──────────────────────────────────────────────────────────────────

  it('should not emit confirmed when there are no strokes', () => {
    const spy = jest.fn();
    component.confirmed.subscribe(spy);
    component.confirm();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit the PNG data URL on confirm() when a stroke exists', () => {
    const spy = jest.fn();
    component.confirmed.subscribe(spy);
    draw();
    component.confirm();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('data:image/png;base64,STUB');
  });
});
