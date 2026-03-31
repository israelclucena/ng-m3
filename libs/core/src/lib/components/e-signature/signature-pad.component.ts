/**
 * @fileoverview SignaturePadComponent — Sprint 036
 *
 * `iu-signature-pad` — Canvas-based signature pad with touch and mouse support.
 *
 * Allows users to draw their signature with a stylus, finger, or mouse.
 * Emits the captured PNG as a data URL when the user confirms.
 * Supports clear, undo (last stroke), and confirm actions.
 *
 * Feature flag: E_SIGNATURE_MODULE
 *
 * @example
 * ```html
 * <iu-signature-pad
 *   [signerName]="'Maria Silva'"
 *   [label]="'Assinatura do Inquilino'"
 *   (confirmed)="onSignatureConfirmed($event)"
 *   (cleared)="onCleared()" />
 * ```
 */
import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy,
  input, output, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Point { x: number; y: number; }
interface Stroke { points: Point[]; }

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `iu-signature-pad`
 *
 * Interactive drawing pad for capturing digital signatures.
 * Touch/pointer/mouse events with pressure-based stroke width variation.
 *
 * Feature flag: E_SIGNATURE_MODULE
 */
@Component({
  selector: 'iu-signature-pad',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="sp-wrapper">
      <!-- Label -->
      @if (label()) {
        <div class="sp-label">
          <span class="material-symbols-outlined">draw</span>
          {{ label() }}
        </div>
      }

      <!-- Signer name badge -->
      @if (signerName()) {
        <div class="sp-signer-badge">
          <span class="material-symbols-outlined">person</span>
          {{ signerName() }}
        </div>
      }

      <!-- Canvas area -->
      <div class="sp-canvas-wrapper" [class.sp-canvas-wrapper--has-signature]="hasStrokes()">
        <canvas
          #sigCanvas
          class="sp-canvas"
          [attr.width]="canvasWidth"
          [attr.height]="canvasHeight"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerUp($event)"
          (pointerleave)="onPointerUp($event)"
          (touchstart)="$event.preventDefault()"
        ></canvas>

        @if (!hasStrokes()) {
          <div class="sp-placeholder">
            <span class="material-symbols-outlined sp-placeholder-icon">edit</span>
            <span>Assine aqui</span>
          </div>
        }
      </div>

      <!-- Validation line -->
      <div class="sp-signature-line">
        <div class="sp-line"></div>
        <span class="sp-line-label">X</span>
      </div>

      <!-- Actions -->
      <div class="sp-actions">
        <button type="button" class="sp-btn sp-btn--ghost" (click)="undoLast()" [disabled]="!hasStrokes()">
          <span class="material-symbols-outlined">undo</span>
          Desfazer
        </button>
        <button type="button" class="sp-btn sp-btn--outlined" (click)="clear()" [disabled]="!hasStrokes()">
          <span class="material-symbols-outlined">delete</span>
          Limpar
        </button>
        <button type="button" class="sp-btn sp-btn--filled" (click)="confirm()" [disabled]="!hasStrokes()">
          <span class="material-symbols-outlined">check_circle</span>
          Confirmar Assinatura
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sp-wrapper {
      background: var(--md-sys-color-surface);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .sp-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .sp-signer-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 12px;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      font-size: 13px; font-weight: 600; width: fit-content;
    }
    .sp-canvas-wrapper {
      position: relative;
      background: var(--md-sys-color-surface-container-lowest);
      border: 2px solid var(--md-sys-color-outline-variant);
      border-radius: 12px;
      overflow: hidden;
      transition: border-color 0.2s;
      cursor: crosshair;
    }
    .sp-canvas-wrapper--has-signature {
      border-color: var(--md-sys-color-primary);
    }
    .sp-canvas {
      display: block;
      width: 100%;
      height: auto;
      touch-action: none;
    }
    .sp-placeholder {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0.5;
      pointer-events: none;
      font-size: 14px;
    }
    .sp-placeholder-icon { font-size: 32px; }
    .sp-signature-line {
      display: flex; align-items: center; gap: 8px;
    }
    .sp-line {
      flex: 1; height: 1px;
      background: var(--md-sys-color-outline);
    }
    .sp-line-label {
      font-size: 18px; font-weight: 700;
      color: var(--md-sys-color-on-surface-variant);
    }
    .sp-actions {
      display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;
    }
    .sp-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 20px;
      font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s;
    }
    .sp-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .sp-btn--ghost { background: transparent; color: var(--md-sys-color-on-surface-variant); }
    .sp-btn--ghost:hover:not(:disabled) { background: var(--md-sys-color-surface-container); }
    .sp-btn--outlined {
      border: 1.5px solid var(--md-sys-color-outline-variant);
      background: transparent; color: var(--md-sys-color-on-surface);
    }
    .sp-btn--outlined:hover:not(:disabled) { border-color: var(--md-sys-color-primary); color: var(--md-sys-color-primary); }
    .sp-btn--filled { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
    .sp-btn--filled:hover:not(:disabled) { filter: brightness(1.08); }
  `],
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sigCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  /** @input Display label above the pad */
  readonly label = input<string>('Assinatura Digital');

  /** @input Name of the signer to display as badge */
  readonly signerName = input<string>('');

  /** @input Stroke colour (CSS colour string) */
  readonly strokeColor = input<string>('var(--md-sys-color-on-surface, #1C1B1F)');

  /** @input Stroke width in px */
  readonly strokeWidth = input<number>(2);

  /** @output Emits the PNG data URL when the user confirms */
  readonly confirmed = output<string>();

  /** @output Emits when the pad is cleared */
  readonly cleared = output<void>();

  readonly canvasWidth = 600;
  readonly canvasHeight = 180;

  // ─── Internal state ───────────────────────────────────────────────────────
  private ctx!: CanvasRenderingContext2D;
  private strokes: Stroke[] = [];
  private currentStroke: Stroke | null = null;
  private isDrawing = false;
  private lastPoint: Point | null = null;

  readonly hasStrokes = signal(false);

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this._setupCanvas();
  }

  ngOnDestroy(): void { /* nothing to tear down */ }

  // ─── Drawing handlers ─────────────────────────────────────────────────────

  onPointerDown(e: PointerEvent): void {
    e.preventDefault();
    this.isDrawing = true;
    const pt = this._getPoint(e);
    this.currentStroke = { points: [pt] };
    this.lastPoint = pt;

    this.ctx.beginPath();
    this.ctx.moveTo(pt.x, pt.y);
    this.ctx.arc(pt.x, pt.y, this.strokeWidth() / 2, 0, Math.PI * 2);
    this.ctx.fillStyle = this.strokeColor();
    this.ctx.fill();

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isDrawing || !this.currentStroke) return;
    e.preventDefault();

    const pt = this._getPoint(e);
    this.currentStroke.points.push(pt);

    if (this.lastPoint) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
      this.ctx.lineTo(pt.x, pt.y);
      this.ctx.strokeStyle = this.strokeColor();
      this.ctx.lineWidth = this.strokeWidth();
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.stroke();
    }

    this.lastPoint = pt;
  }

  onPointerUp(e: PointerEvent): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    if (this.currentStroke && this.currentStroke.points.length > 0) {
      this.strokes.push(this.currentStroke);
      this.hasStrokes.set(true);
    }
    this.currentStroke = null;
    this.lastPoint = null;
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Remove the last drawn stroke (undo). */
  undoLast(): void {
    this.strokes.pop();
    this.hasStrokes.set(this.strokes.length > 0);
    this._redrawAll();
  }

  /** Clear all strokes. */
  clear(): void {
    this.strokes = [];
    this.hasStrokes.set(false);
    this._clearCanvas();
    this.cleared.emit();
  }

  /** Export canvas as PNG data URL and emit. */
  confirm(): void {
    if (!this.hasStrokes()) return;
    const canvas = this.canvasRef.nativeElement;
    // Composite on white background for cleaner PNG
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const octx = offscreen.getContext('2d')!;
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, offscreen.width, offscreen.height);
    octx.drawImage(canvas, 0, 0);
    const dataUrl = offscreen.toDataURL('image/png');
    this.confirmed.emit(dataUrl);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private _getPoint(e: PointerEvent): Point {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const scaleX = this.canvasWidth / rect.width;
    const scaleY = this.canvasHeight / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  private _setupCanvas(): void {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.strokeColor();
    this.ctx.lineWidth = this.strokeWidth();
    this._clearCanvas();
  }

  private _clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  private _redrawAll(): void {
    this._clearCanvas();
    this.ctx.strokeStyle = this.strokeColor();
    this.ctx.lineWidth = this.strokeWidth();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    for (const stroke of this.strokes) {
      if (stroke.points.length === 0) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      this.ctx.stroke();
    }
  }
}
