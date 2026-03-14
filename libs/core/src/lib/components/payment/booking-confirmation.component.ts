import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingConfirmationData, BookingStatus } from './payment.types';

/**
 * `iu-booking-confirmation` — Post-payment confirmation screen.
 *
 * Shows booking status (confirmed / pending / failed), reference number,
 * property summary, and next steps.
 *
 * Feature flag: `PAYMENT_MODULE`
 *
 * @example
 * ```html
 * <iu-booking-confirmation
 *   [data]="confirmationData"
 *   (backToSearch)="goHome()"
 *   (contactLandlord)="openMessaging()"
 * />
 * ```
 */
@Component({
  selector: 'iu-booking-confirmation',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="iu-booking-conf" [class]="'iu-booking-conf--' + data().status">

      <!-- ── Status Header ── -->
      <div class="iu-booking-conf__header">
        <div class="iu-booking-conf__status-icon">
          <span class="material-symbols-outlined">{{ statusIcon() }}</span>
        </div>
        <h2 class="iu-booking-conf__title">{{ statusTitle() }}</h2>
        <p class="iu-booking-conf__subtitle">{{ statusSubtitle() }}</p>
      </div>

      <!-- ── Booking Reference ── -->
      @if (data().status !== 'failed') {
        <div class="iu-booking-conf__ref-box">
          <span class="iu-booking-conf__ref-label">Referência da reserva</span>
          <span class="iu-booking-conf__ref-code">{{ data().bookingRef }}</span>
        </div>
      }

      <!-- ── Property Summary ── -->
      @if (data().status !== 'failed') {
        <div class="iu-booking-conf__property">
          <div class="iu-booking-conf__property-row">
            <span class="material-symbols-outlined" aria-hidden="true">apartment</span>
            <div>
              <strong>{{ data().propertyTitle }}</strong>
              <p class="iu-booking-conf__property-address">{{ data().propertyAddress }}</p>
            </div>
          </div>
          <div class="iu-booking-conf__property-row">
            <span class="material-symbols-outlined" aria-hidden="true">calendar_today</span>
            <div>
              <strong>Entrada prevista</strong>
              <p>{{ data().checkIn | date:'EEEE, d MMMM yyyy' }}</p>
            </div>
          </div>
          <div class="iu-booking-conf__property-row">
            <span class="material-symbols-outlined" aria-hidden="true">person</span>
            <div>
              <strong>Senhorio</strong>
              <p>{{ data().landlordName }}</p>
              @if (data().landlordPhone) {
                <p class="iu-booking-conf__phone">{{ data().landlordPhone }}</p>
              }
            </div>
          </div>
          <div class="iu-booking-conf__total-row">
            <span>Total pago</span>
            <span class="iu-booking-conf__total-amount">
              {{ data().total | currency:data().currency:'symbol':'1.0-0' }}
            </span>
          </div>
        </div>
      }

      <!-- ── Message ── -->
      @if (data().message) {
        <div class="iu-booking-conf__message">
          <span class="material-symbols-outlined" aria-hidden="true">info</span>
          <p>{{ data().message }}</p>
        </div>
      }

      <!-- ── Next Steps ── -->
      @if (data().status === 'confirmed' || data().status === 'pending') {
        <div class="iu-booking-conf__steps">
          <h4 class="iu-booking-conf__steps-title">Próximos passos</h4>
          <ol class="iu-booking-conf__step-list">
            @if (data().status === 'confirmed') {
              <li>Receberá um email de confirmação em breve.</li>
              <li>O senhorio irá entrar em contacto para coordenar a entrada.</li>
              <li>Certifique-se de ter os documentos necessários (BI/passaporte, NIF).</li>
            } @else {
              <li>A reserva está a aguardar confirmação do pagamento.</li>
              <li>Será notificado assim que a transferência for recebida (1–2 dias úteis).</li>
              <li>Em caso de dúvida, contacte o suporte LisboaRent.</li>
            }
          </ol>
        </div>
      }

      <!-- ── Actions ── -->
      <div class="iu-booking-conf__actions">
        @if (data().status === 'confirmed' || data().status === 'pending') {
          <button class="iu-booking-conf__btn iu-booking-conf__btn--primary" (click)="contactLandlord.emit()">
            <span class="material-symbols-outlined">chat</span>
            Contactar Senhorio
          </button>
        }
        @if (data().status === 'failed') {
          <button class="iu-booking-conf__btn iu-booking-conf__btn--primary" (click)="retryPayment.emit()">
            <span class="material-symbols-outlined">refresh</span>
            Tentar novamente
          </button>
        }
        <button class="iu-booking-conf__btn iu-booking-conf__btn--secondary" (click)="backToSearch.emit()">
          <span class="material-symbols-outlined">search</span>
          Ver mais imóveis
        </button>
      </div>

    </div>
  `,
  styles: [`
    .iu-booking-conf {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 32px 24px;
      border-radius: 20px;
      max-width: 480px;
      background: var(--md-sys-color-surface-container-low);
      font-family: var(--md-sys-typescale-body-medium-font, inherit);
    }

    /* ── Header ── */
    .iu-booking-conf__header { text-align: center; }
    .iu-booking-conf__status-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      margin-bottom: 16px;
    }
    .iu-booking-conf__status-icon .material-symbols-outlined { font-size: 40px; }
    .iu-booking-conf--confirmed .iu-booking-conf__status-icon {
      background: var(--md-sys-color-tertiary-container, #d4edda);
      color: var(--md-sys-color-tertiary, #2d8a50);
    }
    .iu-booking-conf--pending .iu-booking-conf__status-icon {
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-secondary);
    }
    .iu-booking-conf--failed .iu-booking-conf__status-icon {
      background: var(--md-sys-color-error-container);
      color: var(--md-sys-color-error);
    }
    .iu-booking-conf--cancelled .iu-booking-conf__status-icon {
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-booking-conf__title {
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface);
    }
    .iu-booking-conf__subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
    }

    /* ── Ref box ── */
    .iu-booking-conf__ref-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 14px;
      background: var(--md-sys-color-primary-container);
      border-radius: 12px;
    }
    .iu-booking-conf__ref-label { font-size: 11px; color: var(--md-sys-color-on-primary-container); text-transform: uppercase; letter-spacing: 0.08em; }
    .iu-booking-conf__ref-code { font-size: 20px; font-weight: 700; color: var(--md-sys-color-primary); letter-spacing: 0.04em; }

    /* ── Property ── */
    .iu-booking-conf__property {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: var(--md-sys-color-surface-container);
      border-radius: 12px;
    }
    .iu-booking-conf__property-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      font-size: 14px;
      color: var(--md-sys-color-on-surface);
    }
    .iu-booking-conf__property-row .material-symbols-outlined {
      font-size: 20px;
      color: var(--md-sys-color-on-surface-variant);
      margin-top: 1px;
      flex-shrink: 0;
    }
    .iu-booking-conf__property-row strong { display: block; font-weight: 600; }
    .iu-booking-conf__property-row p { margin: 2px 0 0; color: var(--md-sys-color-on-surface-variant); font-size: 13px; }
    .iu-booking-conf__phone { color: var(--md-sys-color-primary) !important; }
    .iu-booking-conf__property-address { font-size: 12px; color: var(--md-sys-color-on-surface-variant); }
    .iu-booking-conf__total-row {
      display: flex;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
      font-weight: 600;
      font-size: 15px;
    }
    .iu-booking-conf__total-amount { color: var(--md-sys-color-primary); }

    /* ── Message ── */
    .iu-booking-conf__message {
      display: flex;
      gap: 8px;
      padding: 12px 14px;
      background: var(--md-sys-color-secondary-container);
      border-radius: 8px;
      font-size: 13px;
      color: var(--md-sys-color-on-secondary-container);
    }
    .iu-booking-conf__message .material-symbols-outlined { font-size: 18px; flex-shrink: 0; margin-top: 1px; }

    /* ── Steps ── */
    .iu-booking-conf__steps { }
    .iu-booking-conf__steps-title {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-booking-conf__step-list {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface);
      line-height: 1.6;
    }
    .iu-booking-conf__step-list li { margin-bottom: 4px; }

    /* ── Actions ── */
    .iu-booking-conf__actions { display: flex; flex-direction: column; gap: 10px; }
    .iu-booking-conf__btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 100px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: opacity 0.18s, transform 0.1s;
    }
    .iu-booking-conf__btn:hover { opacity: 0.88; }
    .iu-booking-conf__btn:active { transform: scale(0.98); }
    .iu-booking-conf__btn .material-symbols-outlined { font-size: 18px; }
    .iu-booking-conf__btn--primary {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    }
    .iu-booking-conf__btn--secondary {
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface-variant);
    }
  `],
})
export class BookingConfirmationComponent {

  /** Confirmation data to display. */
  readonly data = input.required<BookingConfirmationData>();

  /** Emitted when the user wants to contact the landlord. */
  readonly contactLandlord = output<void>();

  /** Emitted when the user clicks "back to search". */
  readonly backToSearch = output<void>();

  /** Emitted when the user retries a failed payment. */
  readonly retryPayment = output<void>();

  /** Computed icon for the current status. */
  readonly statusIcon = computed(() => {
    const icons: Record<BookingStatus, string> = {
      confirmed: 'check_circle',
      pending: 'hourglass_top',
      failed: 'cancel',
      cancelled: 'block',
    };
    return icons[this.data().status];
  });

  /** Computed title for the current status. */
  readonly statusTitle = computed(() => {
    const titles: Record<BookingStatus, string> = {
      confirmed: 'Reserva Confirmada! 🎉',
      pending: 'Reserva em Processamento',
      failed: 'Pagamento Falhado',
      cancelled: 'Reserva Cancelada',
    };
    return titles[this.data().status];
  });

  /** Computed subtitle for the current status. */
  readonly statusSubtitle = computed(() => {
    const subtitles: Record<BookingStatus, string> = {
      confirmed: 'O seu pagamento foi processado com sucesso.',
      pending: 'Aguardamos a confirmação do seu pagamento.',
      failed: 'Não foi possível processar o pagamento. Por favor, tente novamente.',
      cancelled: 'Esta reserva foi cancelada.',
    };
    return subtitles[this.data().status];
  });
}
