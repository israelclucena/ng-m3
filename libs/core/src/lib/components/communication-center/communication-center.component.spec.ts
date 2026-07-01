import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommunicationCenterComponent } from './communication-center.component';
import { CommunicationCenterStateService } from '../../services/communication-center-state.service';
import { LandlordCommunicationTemplatesService } from '../../services/landlord-communication-templates.service';

/** Template with the fewest placeholders — handy for "fully filled" flows. */
const VISIT_TPL = 'confirmacao_visita'; // 4 placeholders, no signature
const DENUNCIA_TPL = 'denuncia_contrato_arrendamento'; // 5 placeholders, signature

describe('CommunicationCenterStateService', () => {
  let state: CommunicationCenterStateService;
  let templates: LandlordCommunicationTemplatesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    state = TestBed.inject(CommunicationCenterStateService);
    templates = TestBed.inject(LandlordCommunicationTemplatesService);
  });

  // ── selection ───────────────────────────────────────────────────────────────

  it('starts with nothing selected and an empty draft/history', () => {
    expect(state.selectedTemplateId()).toBeNull();
    expect(state.currentTemplate()).toBeUndefined();
    expect(state.filledResult()).toBeUndefined();
    expect(state.filledBody()).toBe('');
    expect(state.missingPlaceholders()).toEqual([]);
    expect(state.canSend()).toBe(false);
    expect(state.historyEntries()).toEqual([]);
  });

  it('selectTemplate resolves the current template and lists its missing placeholders', () => {
    state.selectTemplate(VISIT_TPL);
    const tpl = templates.getTemplate(VISIT_TPL)!;
    expect(state.currentTemplate()).toBe(tpl);
    // nothing typed yet → every placeholder is missing
    expect([...state.missingPlaceholders()].sort()).toEqual([...tpl.placeholders].sort());
    expect(state.canSend()).toBe(false);
  });

  it('selectTemplate resets any previously-typed placeholder values', () => {
    state.selectTemplate(VISIT_TPL);
    state.setPlaceholder('morada', 'Rua X');
    expect(state.placeholderValues()['morada']).toBe('Rua X');

    state.selectTemplate(DENUNCIA_TPL);
    expect(state.placeholderValues()).toEqual({});
  });

  it('selectTemplate(null) clears the selection', () => {
    state.selectTemplate(VISIT_TPL);
    state.selectTemplate(null);
    expect(state.selectedTemplateId()).toBeNull();
    expect(state.currentTemplate()).toBeUndefined();
    expect(state.filledBody()).toBe('');
  });

  // ── placeholder substitution ──────────────────────────────────────────────────

  it('substitutes filled placeholders into the body and drops them from missing', () => {
    state.selectTemplate(VISIT_TPL);
    state.setPlaceholder('nomeVisitante', 'Ana');
    expect(state.filledBody()).toContain('Ana');
    expect(state.filledBody()).not.toContain('{{nomeVisitante}}');
    expect(state.missingPlaceholders()).not.toContain('nomeVisitante');
    // still missing the other three
    expect(state.missingPlaceholders().length).toBe(3);
  });

  it('leaves unfilled placeholders literally in the preview body', () => {
    state.selectTemplate(VISIT_TPL);
    expect(state.filledBody()).toContain('{{morada}}');
  });

  it('canSend becomes true once every placeholder is filled', () => {
    state.selectTemplate(VISIT_TPL);
    const tpl = templates.getTemplate(VISIT_TPL)!;
    for (const ph of tpl.placeholders) state.setPlaceholder(ph, `v-${ph}`);
    expect(state.missingPlaceholders()).toEqual([]);
    expect(state.canSend()).toBe(true);
  });

  // ── history ────────────────────────────────────────────────────────────────────

  function fillAll(id: string): void {
    state.selectTemplate(id);
    for (const ph of templates.getTemplate(id)!.placeholders) {
      state.setPlaceholder(ph, `v-${ph}`);
    }
  }

  it('send() is a no-op while placeholders are missing', () => {
    state.selectTemplate(VISIT_TPL);
    expect(state.send()).toBeUndefined();
    expect(state.historyEntries().length).toBe(0);
  });

  it('send() appends a "sent" entry carrying the filled body and template meta', () => {
    fillAll(VISIT_TPL);
    const entry = state.send();
    expect(entry).toBeDefined();
    expect(entry!.mode).toBe('sent');
    expect(entry!.templateId).toBe(VISIT_TPL);
    expect(entry!.templateTitle).toBe(templates.getTemplate(VISIT_TPL)!.titulo);
    expect(entry!.body).toBe(state.filledBody());
    expect(entry!.sentAt).toBeInstanceOf(Date);
    expect(state.historyEntries()[0]).toBe(entry);
  });

  it('copyToClipboard() appends a "copied" entry', () => {
    fillAll(VISIT_TPL);
    const entry = state.copyToClipboard();
    expect(entry!.mode).toBe('copied');
    expect(state.historyEntries().length).toBe(1);
  });

  it('history is most-recent-first and entries have unique ids', () => {
    fillAll(VISIT_TPL);
    state.send();
    state.copyToClipboard();
    const hist = state.historyEntries();
    expect(hist.length).toBe(2);
    expect(hist[0].mode).toBe('copied'); // last action first
    expect(hist[1].mode).toBe('sent');
    expect(hist[0].id).not.toBe(hist[1].id);
  });

  it('clearHistory empties the log without touching the current draft', () => {
    fillAll(VISIT_TPL);
    state.send();
    state.clearHistory();
    expect(state.historyEntries()).toEqual([]);
    // draft survives
    expect(state.canSend()).toBe(true);
  });
});

describe('CommunicationCenterComponent', () => {
  let fixture: ComponentFixture<CommunicationCenterComponent>;
  let component: CommunicationCenterComponent;
  let state: CommunicationCenterStateService;
  let templates: LandlordCommunicationTemplatesService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunicationCenterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommunicationCenterComponent);
    component = fixture.componentInstance;
    state = TestBed.inject(CommunicationCenterStateService);
    templates = TestBed.inject(LandlordCommunicationTemplatesService);
    // isolate history between component and service specs
    state.selectTemplate(null);
    state.clearHistory();
    fixture.detectChanges();
  });

  it('renders the template count in the subtitle', () => {
    const subtitle: HTMLElement = fixture.nativeElement.querySelector('.cc-subtitle');
    expect(subtitle.textContent).toContain(`${templates.templates().length} modelos`);
  });

  it('shows the empty-state hint until a template is picked', () => {
    expect(fixture.nativeElement.querySelector('.cc-empty')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cc-editor')).toBeNull();
  });

  it('renders one sidebar button per template', () => {
    const btns = fixture.nativeElement.querySelectorAll('.cc-tpl-btn');
    expect(btns.length).toBe(templates.templates().length);
  });

  it('clicking a sidebar button selects the template and reveals the editor', () => {
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.cc-tpl-btn');
    btn.click();
    fixture.detectChanges();
    expect(state.selectedTemplateId()).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cc-editor')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cc-empty')).toBeNull();
  });

  it('isMissing reflects the service missing list', () => {
    state.selectTemplate(VISIT_TPL);
    fixture.detectChanges();
    expect(component['isMissing']('morada')).toBe(true);
    state.setPlaceholder('morada', 'Rua X');
    fixture.detectChanges();
    expect(component['isMissing']('morada')).toBe(false);
  });

  it('typing in a field updates the preview via onPlaceholder', () => {
    state.selectTemplate(VISIT_TPL);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.cc-input');
    input.value = 'Ana Preview';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const preview: HTMLElement = fixture.nativeElement.querySelector('.cc-preview-body');
    expect(preview.textContent).toContain('Ana Preview');
  });

  it('send/copy actions are disabled until every placeholder is filled', () => {
    state.selectTemplate(VISIT_TPL);
    fixture.detectChanges();
    const send: HTMLButtonElement = fixture.nativeElement.querySelector('.cc-action--primary');
    expect(send.disabled).toBe(true);

    for (const ph of templates.getTemplate(VISIT_TPL)!.placeholders) {
      state.setPlaceholder(ph, `v-${ph}`);
    }
    fixture.detectChanges();
    expect(send.disabled).toBe(false);
  });

  it('copy() appends a copied entry and renders the history list', () => {
    state.selectTemplate(VISIT_TPL);
    for (const ph of templates.getTemplate(VISIT_TPL)!.placeholders) {
      state.setPlaceholder(ph, `v-${ph}`);
    }
    fixture.detectChanges();
    component['copy']();
    fixture.detectChanges();
    expect(state.historyEntries().length).toBe(1);
    expect(fixture.nativeElement.querySelector('.cc-history')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cc-history-item')).not.toBeNull();
  });

  it('shows the clear-history control only once history exists', () => {
    expect(fixture.nativeElement.querySelector('.cc-clear')).toBeNull();
    state.selectTemplate(VISIT_TPL);
    for (const ph of templates.getTemplate(VISIT_TPL)!.placeholders) {
      state.setPlaceholder(ph, `v-${ph}`);
    }
    state.send();
    fixture.detectChanges();
    const clear: HTMLButtonElement = fixture.nativeElement.querySelector('.cc-clear');
    expect(clear).not.toBeNull();
    clear.click();
    fixture.detectChanges();
    expect(state.historyEntries()).toEqual([]);
  });
});
