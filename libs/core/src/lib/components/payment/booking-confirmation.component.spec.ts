import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingConfirmationComponent } from './booking-confirmation.component';
import type { BookingConfirmationData, BookingStatus } from './payment.types';

describe('BookingConfirmationComponent', () => {
  let fixture: ComponentFixture<BookingConfirmationComponent>;
  let component: BookingConfirmationComponent;

  const confirmedData: BookingConfirmationData = {
    bookingRef: 'LR-2026-0042',
    status: 'confirmed',
    propertyTitle: 'T2 com varanda em Alvalade',
    propertyAddress: 'Av. de Roma 14, Lisboa',
    checkIn: '2026-07-01',
    landlordName: 'Maria Santos',
    landlordPhone: '+351 912 345 678',
    total: 1450,
    currency: 'EUR',
    message: 'Obrigado por reservar connosco.',
  };

  const pendingData: BookingConfirmationData = {
    bookingRef: 'LR-2026-0043',
    status: 'pending',
    propertyTitle: 'Estúdio no Chiado',
    propertyAddress: 'R. Garrett 88, Lisboa',
    checkIn: '2026-08-15',
    landlordName: 'João Pereira',
    total: 980,
    currency: 'EUR',
  };

  const failedData: BookingConfirmationData = {
    bookingRef: 'LR-2026-0044',
    status: 'failed',
    propertyTitle: 'T1 em Benfica',
    propertyAddress: 'Estr. de Benfica 200, Lisboa',
    checkIn: '2026-09-01',
    landlordName: 'Ana Costa',
    landlordPhone: '+351 933 222 111',
    total: 850,
    currency: 'EUR',
    message: 'O cartão foi recusado pelo banco.',
  };

  const cancelledData: BookingConfirmationData = {
    bookingRef: 'LR-2026-0045',
    status: 'cancelled',
    propertyTitle: 'T3 em Cascais',
    propertyAddress: 'Av. Marginal 5, Cascais',
    checkIn: '2026-10-10',
    landlordName: 'Pedro Lima',
    total: 2100,
    currency: 'EUR',
  };

  /** Helper: build the component with the given data input set BEFORE first CD. */
  async function setup(data: BookingConfirmationData): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [BookingConfirmationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingConfirmationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup(confirmedData);
    expect(component).toBeTruthy();
  });

  // ── Host class ──────────────────────────────────────────────────────────────

  it('host root carries iu-booking-conf--confirmed class for confirmed status', async () => {
    await setup(confirmedData);
    const root = fixture.nativeElement.querySelector('.iu-booking-conf') as HTMLElement;
    expect(root.classList.contains('iu-booking-conf--confirmed')).toBe(true);
  });

  it('host root carries iu-booking-conf--pending class for pending status', async () => {
    await setup(pendingData);
    const root = fixture.nativeElement.querySelector('.iu-booking-conf') as HTMLElement;
    expect(root.classList.contains('iu-booking-conf--pending')).toBe(true);
  });

  it('host root carries iu-booking-conf--failed class for failed status', async () => {
    await setup(failedData);
    const root = fixture.nativeElement.querySelector('.iu-booking-conf') as HTMLElement;
    expect(root.classList.contains('iu-booking-conf--failed')).toBe(true);
  });

  it('host root carries iu-booking-conf--cancelled class for cancelled status', async () => {
    await setup(cancelledData);
    const root = fixture.nativeElement.querySelector('.iu-booking-conf') as HTMLElement;
    expect(root.classList.contains('iu-booking-conf--cancelled')).toBe(true);
  });

  // ── Computeds: statusIcon / statusTitle / statusSubtitle ──────────────────────

  const statusCases: ReadonlyArray<{
    status: BookingStatus;
    data: BookingConfirmationData;
    icon: string;
    title: string;
    subtitle: string;
  }> = [
    {
      status: 'confirmed',
      data: confirmedData,
      icon: 'check_circle',
      title: 'Reserva Confirmada! 🎉',
      subtitle: 'O seu pagamento foi processado com sucesso.',
    },
    {
      status: 'pending',
      data: pendingData,
      icon: 'hourglass_top',
      title: 'Reserva em Processamento',
      subtitle: 'Aguardamos a confirmação do seu pagamento.',
    },
    {
      status: 'failed',
      data: failedData,
      icon: 'cancel',
      title: 'Pagamento Falhado',
      subtitle: 'Não foi possível processar o pagamento. Por favor, tente novamente.',
    },
    {
      status: 'cancelled',
      data: cancelledData,
      icon: 'block',
      title: 'Reserva Cancelada',
      subtitle: 'Esta reserva foi cancelada.',
    },
  ];

  for (const tc of statusCases) {
    it(`statusIcon/Title/Subtitle computeds are correct for ${tc.status}`, async () => {
      await setup(tc.data);
      expect(component.statusIcon()).toBe(tc.icon);
      expect(component.statusTitle()).toBe(tc.title);
      expect(component.statusSubtitle()).toBe(tc.subtitle);
    });

    it(`header renders icon/title/subtitle text for ${tc.status}`, async () => {
      await setup(tc.data);
      const icon = fixture.nativeElement.querySelector(
        '.iu-booking-conf__status-icon .material-symbols-outlined',
      ) as HTMLElement;
      const title = fixture.nativeElement.querySelector('.iu-booking-conf__title') as HTMLElement;
      const subtitle = fixture.nativeElement.querySelector('.iu-booking-conf__subtitle') as HTMLElement;
      expect(icon.textContent).toContain(tc.icon);
      expect(title.textContent).toContain(tc.title);
      expect(subtitle.textContent).toContain(tc.subtitle);
    });
  }

  // ── Ref box + property summary + total: present unless failed ─────────────────

  it('renders ref-box, property summary and total when status is confirmed', async () => {
    await setup(confirmedData);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.iu-booking-conf__ref-box')).toBeTruthy();
    expect(el.querySelector('.iu-booking-conf__property')).toBeTruthy();
    expect(el.querySelector('.iu-booking-conf__total-row')).toBeTruthy();
    expect((el.querySelector('.iu-booking-conf__ref-code') as HTMLElement).textContent).toContain(
      'LR-2026-0042',
    );
  });

  it('renders ref-box, property summary and total when status is pending', async () => {
    await setup(pendingData);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.iu-booking-conf__ref-box')).toBeTruthy();
    expect(el.querySelector('.iu-booking-conf__property')).toBeTruthy();
    expect(el.querySelector('.iu-booking-conf__total-row')).toBeTruthy();
  });

  it('renders ref-box, property summary and total when status is cancelled', async () => {
    await setup(cancelledData);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.iu-booking-conf__ref-box')).toBeTruthy();
    expect(el.querySelector('.iu-booking-conf__property')).toBeTruthy();
    expect(el.querySelector('.iu-booking-conf__total-row')).toBeTruthy();
  });

  it('omits ref-box, property summary and total when status is failed', async () => {
    await setup(failedData);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.iu-booking-conf__ref-box')).toBeNull();
    expect(el.querySelector('.iu-booking-conf__property')).toBeNull();
    expect(el.querySelector('.iu-booking-conf__total-row')).toBeNull();
  });

  // ── Message block: only when data.message present ─────────────────────────────

  it('renders the message block when data.message is present', async () => {
    await setup(confirmedData);
    const msg = fixture.nativeElement.querySelector('.iu-booking-conf__message') as HTMLElement;
    expect(msg).toBeTruthy();
    expect(msg.textContent).toContain('Obrigado por reservar connosco.');
  });

  it('omits the message block when data.message is absent', async () => {
    await setup(pendingData);
    expect(fixture.nativeElement.querySelector('.iu-booking-conf__message')).toBeNull();
  });

  // ── landlordPhone conditional ─────────────────────────────────────────────────

  it('renders landlord phone when landlordPhone is present', async () => {
    await setup(confirmedData);
    const phone = fixture.nativeElement.querySelector('.iu-booking-conf__phone') as HTMLElement;
    expect(phone).toBeTruthy();
    expect(phone.textContent).toContain('+351 912 345 678');
  });

  it('omits landlord phone when landlordPhone is absent', async () => {
    await setup(pendingData);
    expect(fixture.nativeElement.querySelector('.iu-booking-conf__phone')).toBeNull();
  });

  // ── Next steps block ──────────────────────────────────────────────────────────

  it('renders next-steps block with confirmed-specific first step for confirmed', async () => {
    await setup(confirmedData);
    const steps = fixture.nativeElement.querySelector('.iu-booking-conf__steps') as HTMLElement;
    expect(steps).toBeTruthy();
    const firstLi = steps.querySelector('.iu-booking-conf__step-list li') as HTMLElement;
    expect(firstLi.textContent).toContain('Receberá um email de confirmação em breve.');
  });

  it('renders next-steps block with pending-specific first step for pending', async () => {
    await setup(pendingData);
    const steps = fixture.nativeElement.querySelector('.iu-booking-conf__steps') as HTMLElement;
    expect(steps).toBeTruthy();
    const firstLi = steps.querySelector('.iu-booking-conf__step-list li') as HTMLElement;
    expect(firstLi.textContent).toContain('A reserva está a aguardar confirmação do pagamento.');
  });

  it('omits next-steps block for failed status', async () => {
    await setup(failedData);
    expect(fixture.nativeElement.querySelector('.iu-booking-conf__steps')).toBeNull();
  });

  it('omits next-steps block for cancelled status', async () => {
    await setup(cancelledData);
    expect(fixture.nativeElement.querySelector('.iu-booking-conf__steps')).toBeNull();
  });

  // ── Actions: Contactar Senhorio (contactLandlord) ─────────────────────────────

  it('shows "Contactar Senhorio" primary button for confirmed and emits contactLandlord', async () => {
    await setup(confirmedData);
    const btn = fixture.nativeElement.querySelector(
      '.iu-booking-conf__btn--primary',
    ) as HTMLButtonElement;
    expect(btn.textContent).toContain('Contactar Senhorio');
    const spy = jest.fn();
    component.contactLandlord.subscribe(spy);
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('shows "Contactar Senhorio" primary button for pending and emits contactLandlord', async () => {
    await setup(pendingData);
    const btn = fixture.nativeElement.querySelector(
      '.iu-booking-conf__btn--primary',
    ) as HTMLButtonElement;
    expect(btn.textContent).toContain('Contactar Senhorio');
    const spy = jest.fn();
    component.contactLandlord.subscribe(spy);
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // ── Actions: Tentar novamente (retryPayment) ──────────────────────────────────

  it('shows "Tentar novamente" primary button for failed and emits retryPayment', async () => {
    await setup(failedData);
    const btn = fixture.nativeElement.querySelector(
      '.iu-booking-conf__btn--primary',
    ) as HTMLButtonElement;
    expect(btn.textContent).toContain('Tentar novamente');
    const spy = jest.fn();
    component.retryPayment.subscribe(spy);
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not render a primary button for cancelled status', async () => {
    await setup(cancelledData);
    expect(fixture.nativeElement.querySelector('.iu-booking-conf__btn--primary')).toBeNull();
  });

  // ── Actions: Ver mais imóveis (backToSearch) ──────────────────────────────────

  it('always renders "Ver mais imóveis" secondary button and emits backToSearch (confirmed)', async () => {
    await setup(confirmedData);
    const btn = fixture.nativeElement.querySelector(
      '.iu-booking-conf__btn--secondary',
    ) as HTMLButtonElement;
    expect(btn.textContent).toContain('Ver mais imóveis');
    const spy = jest.fn();
    component.backToSearch.subscribe(spy);
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('renders the secondary "Ver mais imóveis" button for failed status too', async () => {
    await setup(failedData);
    const btn = fixture.nativeElement.querySelector(
      '.iu-booking-conf__btn--secondary',
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Ver mais imóveis');
  });

  it('renders the secondary "Ver mais imóveis" button for cancelled status', async () => {
    await setup(cancelledData);
    const btn = fixture.nativeElement.querySelector(
      '.iu-booking-conf__btn--secondary',
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Ver mais imóveis');
  });
});
