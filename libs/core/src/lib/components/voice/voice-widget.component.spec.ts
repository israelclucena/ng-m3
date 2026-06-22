import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VoiceWidgetComponent } from './voice-widget.component';
import { VoiceCommandService, VoiceStatus } from './voice-command.service';

describe('VoiceWidgetComponent', () => {
  let fixture: ComponentFixture<VoiceWidgetComponent>;
  let component: VoiceWidgetComponent;
  let svc: VoiceCommandService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoiceWidgetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VoiceWidgetComponent);
    component = fixture.componentInstance;
    svc = TestBed.inject(VoiceCommandService);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('exposes a default set of six demo commands', () => {
    expect(component.commands.length).toBe(6);
    expect(component.commands.every((c) => c.phrases.length > 0 && !!c.description)).toBe(true);
  });

  // ── ngOnInit ────────────────────────────────────────────────────────────────────

  it('registers every demo command on init', () => {
    const spy = jest.spyOn(svc, 'register');
    fixture.detectChanges(); // triggers ngOnInit
    expect(spy).toHaveBeenCalledTimes(6);
  });

  it('forwards each command phrase set and description to the service', () => {
    const spy = jest.spyOn(svc, 'register');
    fixture.detectChanges();
    const first = component.commands[0];
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ phrases: first.phrases, description: first.description }),
    );
  });

  // ── ngOnDestroy ──────────────────────────────────────────────────────────────────

  it('stops listening and clears commands on destroy', () => {
    const stop = jest.spyOn(svc, 'stop');
    const unregister = jest.spyOn(svc, 'unregisterAll');
    fixture.detectChanges();
    fixture.destroy();
    expect(stop).toHaveBeenCalled();
    expect(unregister).toHaveBeenCalled();
  });

  // ── statusLabel ──────────────────────────────────────────────────────────────────

  describe('statusLabel', () => {
    const cases: Array<[VoiceStatus, string]> = [
      ['idle', 'Clica no microfone para começar'],
      ['listening', 'A ouvir...'],
      ['processing', 'A processar...'],
      ['error', 'Erro — verifica permissões do microfone'],
      ['unsupported', 'Não suportado'],
    ];

    for (const [status, label] of cases) {
      it(`maps "${status}" to its human-readable label`, () => {
        svc.status.set(status);
        expect(component.statusLabel()).toBe(label);
      });
    }

    it('returns an empty string for an unknown status', () => {
      svc.status.set('weird' as VoiceStatus);
      expect(component.statusLabel()).toBe('');
    });
  });
});
