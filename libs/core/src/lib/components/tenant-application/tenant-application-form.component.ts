/**
 * @fileoverview TenantApplicationFormComponent — Sprint 035
 *
 * `iu-tenant-application-form` — Multi-section form for tenants to apply for a rental property.
 *
 * Steps: Personal Info → Employment & Income → References → Cover Letter → Review & Submit
 * Uses SIGNAL_FORM_V2 for field validation including NIF format check.
 *
 * Feature flag: TENANT_APPLICATION
 *
 * @example
 * ```html
 * <iu-tenant-application-form
 *   [tenantId]="'tenant-001'"
 *   [tenantName]="'Ana Ferreira'"
 *   [tenantEmail]="'ana@email.pt'"
 *   [propertyId]="'p1'"
 *   [propertyTitle]="'Apartamento T2 no Chiado'"
 *   [landlordId]="'landlord-001'"
 *   (submitted)="onApplicationSubmitted($event)" />
 * ```
 */
import { Component, input, output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TenantApplicationService,
  TenantApplication,
  EmploymentType,
  TenantReference,
} from '../../services/tenant-application.service';
import { createSignalForm, required, minLength, maxLength, pattern } from '../../utils/signal-form';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'personal' | 'employment' | 'references' | 'cover' | 'review';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `iu-tenant-application-form`
 *
 * Multi-step signal-based form for rental applications.
 * Steps: Personal → Employment → References → Cover Letter → Review
 *
 * Feature flag: TENANT_APPLICATION
 */
@Component({
  selector: 'iu-tenant-application-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="taf-container">
      <!-- Progress header -->
      <div class="taf-progress">
        @for (step of steps; track step.id; let i = $index) {
          <div class="taf-step" [class.active]="currentStep() === step.id" [class.done]="isStepDone(step.id)">
            <div class="taf-step-circle">
              @if (isStepDone(step.id)) {
                <span class="material-symbols-outlined">check</span>
              } @else {
                {{ i + 1 }}
              }
            </div>
            <span class="taf-step-label">{{ step.label }}</span>
          </div>
          @if (i < steps.length - 1) {
            <div class="taf-step-line" [class.done]="isStepDone(step.id)"></div>
          }
        }
      </div>

      <!-- Submitted state -->
      @if (submittedSuccess()) {
        <div class="taf-success">
          <span class="material-symbols-outlined taf-success-icon">task_alt</span>
          <h3>Candidatura Enviada!</h3>
          <p>A sua candidatura para <strong>{{ propertyTitle() }}</strong> foi submetida. O senhorio receberá uma notificação e responderá em breve.</p>
        </div>
      } @else {

        <!-- Step: Personal -->
        @if (currentStep() === 'personal') {
          <div class="taf-step-content">
            <h3 class="taf-step-title">
              <span class="material-symbols-outlined">person</span>
              Informação Pessoal
            </h3>
            <div class="taf-row">
              <div class="taf-field">
                <label class="taf-label">Telefone</label>
                <input class="taf-input" [class.error]="form.fields.phone.showError()"
                  type="tel" placeholder="+351 9XX XXX XXX"
                  [value]="form.fields.phone.value()"
                  (input)="form.fields.phone.setValue($any($event.target).value)"
                  (blur)="form.fields.phone.touch()" />
                @if (form.fields.phone.showError()) {
                  <span class="taf-error">{{ form.fields.phone.firstError() }}</span>
                }
              </div>
              <div class="taf-field">
                <label class="taf-label">NIF</label>
                <input class="taf-input" [class.error]="form.fields.nif.showError()"
                  type="text" placeholder="123456789" maxlength="9"
                  [value]="form.fields.nif.value()"
                  (input)="form.fields.nif.setValue($any($event.target).value)"
                  (blur)="form.fields.nif.touch()" />
                @if (form.fields.nif.showError()) {
                  <span class="taf-error">{{ form.fields.nif.firstError() }}</span>
                }
              </div>
            </div>
            <div class="taf-row">
              <div class="taf-field">
                <label class="taf-label">Nacionalidade</label>
                <input class="taf-input" [class.error]="form.fields.nationality.showError()"
                  type="text" placeholder="Portuguesa"
                  [value]="form.fields.nationality.value()"
                  (input)="form.fields.nationality.setValue($any($event.target).value)"
                  (blur)="form.fields.nationality.touch()" />
                @if (form.fields.nationality.showError()) {
                  <span class="taf-error">{{ form.fields.nationality.firstError() }}</span>
                }
              </div>
              <div class="taf-field">
                <label class="taf-label">Nº de Ocupantes</label>
                <input class="taf-input"
                  type="number" min="1" max="10" placeholder="1"
                  [value]="form.fields.numOccupants.value()"
                  (input)="form.fields.numOccupants.setValue($any($event.target).value)"
                  (blur)="form.fields.numOccupants.touch()" />
              </div>
            </div>
            <div class="taf-field">
              <label class="taf-label">Animais de Estimação?</label>
              <div class="taf-segment">
                <button type="button" class="taf-seg-btn" [class.active]="form.fields.hasPets.value() === 'false'"
                  (click)="form.fields.hasPets.setValue('false')">
                  <span class="material-symbols-outlined">pets</span> Não
                </button>
                <button type="button" class="taf-seg-btn" [class.active]="form.fields.hasPets.value() === 'true'"
                  (click)="form.fields.hasPets.setValue('true')">
                  <span class="material-symbols-outlined">pets</span> Sim
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Step: Employment -->
        @if (currentStep() === 'employment') {
          <div class="taf-step-content">
            <h3 class="taf-step-title">
              <span class="material-symbols-outlined">work</span>
              Emprego e Rendimento
            </h3>
            <div class="taf-field">
              <label class="taf-label">Situação Profissional</label>
              <div class="taf-segment taf-segment--wrap">
                @for (opt of employmentOptions; track opt.value) {
                  <button type="button" class="taf-seg-btn"
                    [class.active]="form.fields.employmentType.value() === opt.value"
                    (click)="form.fields.employmentType.setValue(opt.value)">
                    {{ opt.label }}
                  </button>
                }
              </div>
            </div>
            <div class="taf-row">
              <div class="taf-field">
                <label class="taf-label">Rendimento Mensal Líquido (€)</label>
                <input class="taf-input" [class.error]="form.fields.monthlyIncome.showError()"
                  type="number" min="0" placeholder="ex: 2000"
                  [value]="form.fields.monthlyIncome.value()"
                  (input)="form.fields.monthlyIncome.setValue($any($event.target).value)"
                  (blur)="form.fields.monthlyIncome.touch()" />
                @if (form.fields.monthlyIncome.showError()) {
                  <span class="taf-error">{{ form.fields.monthlyIncome.firstError() }}</span>
                }
              </div>
              <div class="taf-field">
                <label class="taf-label">Profissão / Cargo</label>
                <input class="taf-input" [class.error]="form.fields.occupation.showError()"
                  type="text" placeholder="ex: Engenheiro de Software"
                  [value]="form.fields.occupation.value()"
                  (input)="form.fields.occupation.setValue($any($event.target).value)"
                  (blur)="form.fields.occupation.touch()" />
                @if (form.fields.occupation.showError()) {
                  <span class="taf-error">{{ form.fields.occupation.firstError() }}</span>
                }
              </div>
            </div>
            @if (form.fields.employmentType.value() === 'employed' || form.fields.employmentType.value() === 'self-employed') {
              <div class="taf-field">
                <label class="taf-label">Entidade Empregadora</label>
                <input class="taf-input"
                  type="text" placeholder="Nome da empresa"
                  [value]="form.fields.employer.value()"
                  (input)="form.fields.employer.setValue($any($event.target).value)" />
              </div>
            }
          </div>
        }

        <!-- Step: References -->
        @if (currentStep() === 'references') {
          <div class="taf-step-content">
            <h3 class="taf-step-title">
              <span class="material-symbols-outlined">supervisor_account</span>
              Referências <span class="taf-optional">(opcional)</span>
            </h3>
            <p class="taf-hint">Adicione referências de senhorios anteriores ou empregadores para aumentar a sua credibilidade.</p>
            @for (ref of refs(); track ref.id; let i = $index) {
              <div class="taf-ref-card">
                <div class="taf-ref-header">
                  <span class="taf-ref-num">Referência {{ i + 1 }}</span>
                  <button type="button" class="taf-icon-btn" (click)="removeRef(ref.id)">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
                <div class="taf-row">
                  <div class="taf-field">
                    <label class="taf-label">Nome</label>
                    <input class="taf-input" type="text" [value]="ref.name"
                      (input)="updateRef(ref.id, 'name', $any($event.target).value)" />
                  </div>
                  <div class="taf-field">
                    <label class="taf-label">Relação</label>
                    <select class="taf-input" [value]="ref.relationship"
                      (change)="updateRef(ref.id, 'relationship', $any($event.target).value)">
                      <option value="landlord">Senhorio anterior</option>
                      <option value="employer">Empregador</option>
                      <option value="personal">Pessoal</option>
                    </select>
                  </div>
                </div>
                <div class="taf-row">
                  <div class="taf-field">
                    <label class="taf-label">Telefone</label>
                    <input class="taf-input" type="tel" [value]="ref.phone ?? ''"
                      (input)="updateRef(ref.id, 'phone', $any($event.target).value)" />
                  </div>
                  <div class="taf-field">
                    <label class="taf-label">Email</label>
                    <input class="taf-input" type="email" [value]="ref.email ?? ''"
                      (input)="updateRef(ref.id, 'email', $any($event.target).value)" />
                  </div>
                </div>
              </div>
            }
            @if (refs().length < 3) {
              <button type="button" class="taf-add-ref-btn" (click)="addRef()">
                <span class="material-symbols-outlined">add</span>
                Adicionar Referência
              </button>
            }
          </div>
        }

        <!-- Step: Cover Letter -->
        @if (currentStep() === 'cover') {
          <div class="taf-step-content">
            <h3 class="taf-step-title">
              <span class="material-symbols-outlined">edit_note</span>
              Carta de Apresentação
            </h3>
            <p class="taf-hint">Apresente-se ao senhorio. Porque é que é o inquilino ideal? O que o torna diferente?</p>
            <div class="taf-field">
              <label class="taf-label">A sua mensagem</label>
              <textarea class="taf-textarea"
                [class.error]="form.fields.coverLetter.showError()"
                rows="8"
                placeholder="Ex: Somos um casal profissional e responsável..."
                [value]="form.fields.coverLetter.value()"
                (input)="form.fields.coverLetter.setValue($any($event.target).value)"
                (blur)="form.fields.coverLetter.touch()"></textarea>
              <div class="taf-char-count" [class.warn]="form.fields.coverLetter.value().length > 900">
                {{ form.fields.coverLetter.value().length }}/1000
              </div>
              @if (form.fields.coverLetter.showError()) {
                <span class="taf-error">{{ form.fields.coverLetter.firstError() }}</span>
              }
            </div>
          </div>
        }

        <!-- Step: Review -->
        @if (currentStep() === 'review') {
          <div class="taf-step-content">
            <h3 class="taf-step-title">
              <span class="material-symbols-outlined">fact_check</span>
              Revisão Final
            </h3>
            <div class="taf-review-grid">
              <div class="taf-review-item">
                <span class="taf-review-label">Imóvel</span>
                <span class="taf-review-value">{{ propertyTitle() }}</span>
              </div>
              <div class="taf-review-item">
                <span class="taf-review-label">Inquilino</span>
                <span class="taf-review-value">{{ tenantName() }}</span>
              </div>
              <div class="taf-review-item">
                <span class="taf-review-label">NIF</span>
                <span class="taf-review-value">{{ form.fields.nif.value() }}</span>
              </div>
              <div class="taf-review-item">
                <span class="taf-review-label">Situação Profissional</span>
                <span class="taf-review-value">{{ employmentLabel(form.fields.employmentType.value()) }}</span>
              </div>
              <div class="taf-review-item">
                <span class="taf-review-label">Rendimento Mensal</span>
                <span class="taf-review-value primary">{{ form.fields.monthlyIncome.value() }}€</span>
              </div>
              <div class="taf-review-item">
                <span class="taf-review-label">Nº Ocupantes</span>
                <span class="taf-review-value">{{ form.fields.numOccupants.value() }}</span>
              </div>
              <div class="taf-review-item">
                <span class="taf-review-label">Referências</span>
                <span class="taf-review-value">{{ refs().length }}</span>
              </div>
              <div class="taf-review-item">
                <span class="taf-review-label">Carta</span>
                <span class="taf-review-value">{{ form.fields.coverLetter.value().length }} caracteres</span>
              </div>
            </div>
            <p class="taf-review-legal">
              Ao submeter, declara que toda a informação fornecida é verdadeira e que autoriza o senhorio a verificar as referências fornecidas.
            </p>
          </div>
        }

        <!-- Navigation -->
        <div class="taf-nav">
          @if (currentStepIndex() > 0) {
            <button type="button" class="taf-btn taf-btn--text" (click)="prevStep()">
              <span class="material-symbols-outlined">arrow_back</span> Anterior
            </button>
          } @else {
            <div></div>
          }
          @if (currentStepIndex() < steps.length - 1) {
            <button type="button" class="taf-btn taf-btn--filled" (click)="nextStep()">
              Seguinte <span class="material-symbols-outlined">arrow_forward</span>
            </button>
          } @else {
            <button type="button" class="taf-btn taf-btn--filled taf-btn--submit"
              [disabled]="saving()" (click)="onSubmit()">
              @if (saving()) {
                <span class="taf-spinner"></span> A enviar...
              } @else {
                <span class="material-symbols-outlined">send</span> Enviar Candidatura
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .taf-container {
      background: var(--md-sys-color-surface);
      border-radius: 16px;
      padding: 24px;
      max-width: 640px;
    }
    /* Progress */
    .taf-progress {
      display: flex;
      align-items: center;
      margin-bottom: 28px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .taf-step { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 60px; }
    .taf-step-circle {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700;
      background: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-on-surface-variant);
      transition: all 0.2s;
    }
    .taf-step-circle .material-symbols-outlined { font-size: 16px; }
    .taf-step.active .taf-step-circle { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
    .taf-step.done .taf-step-circle { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }
    .taf-step-label { font-size: 10px; text-align: center; color: var(--md-sys-color-on-surface-variant); white-space: nowrap; }
    .taf-step.active .taf-step-label { color: var(--md-sys-color-primary); font-weight: 600; }
    .taf-step-line { flex: 1; height: 2px; background: var(--md-sys-color-outline-variant); min-width: 20px; }
    .taf-step-line.done { background: var(--md-sys-color-primary-container); }
    /* Content */
    .taf-step-content { min-height: 280px; }
    .taf-step-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 18px; font-weight: 700; color: var(--md-sys-color-on-surface);
      margin: 0 0 20px;
    }
    .taf-optional { font-size: 13px; font-weight: 400; color: var(--md-sys-color-on-surface-variant); }
    .taf-hint { font-size: 13px; color: var(--md-sys-color-on-surface-variant); margin: -12px 0 16px; line-height: 1.5; }
    .taf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
    .taf-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .taf-label { font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--md-sys-color-on-surface-variant); }
    .taf-input, .taf-textarea {
      padding: 11px 13px;
      border-radius: 8px;
      border: 1.5px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-container-lowest);
      color: var(--md-sys-color-on-surface);
      font-size: 14px;
      width: 100%;
      box-sizing: border-box;
      font-family: inherit;
      transition: border-color 0.15s;
    }
    .taf-input:focus, .taf-textarea:focus { outline: none; border-color: var(--md-sys-color-primary); }
    .taf-input.error, .taf-textarea.error { border-color: var(--md-sys-color-error); }
    .taf-textarea { resize: vertical; min-height: 120px; }
    .taf-error { font-size: 12px; color: var(--md-sys-color-error); }
    .taf-char-count { font-size: 11px; color: var(--md-sys-color-on-surface-variant); text-align: right; }
    .taf-char-count.warn { color: var(--md-sys-color-error); }
    .taf-segment { display: flex; gap: 8px; }
    .taf-segment--wrap { flex-wrap: wrap; }
    .taf-seg-btn {
      padding: 8px 14px; border-radius: 20px; border: 1.5px solid var(--md-sys-color-outline-variant);
      background: transparent; color: var(--md-sys-color-on-surface-variant);
      cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 4px; transition: all 0.15s;
    }
    .taf-seg-btn.active {
      border-color: var(--md-sys-color-primary);
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      font-weight: 600;
    }
    /* References */
    .taf-ref-card {
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 12px; padding: 16px; margin-bottom: 12px;
      background: var(--md-sys-color-surface-container-low);
    }
    .taf-ref-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .taf-ref-num { font-weight: 600; font-size: 14px; color: var(--md-sys-color-on-surface); }
    .taf-icon-btn {
      background: none; border: none; cursor: pointer;
      color: var(--md-sys-color-error); padding: 4px;
      display: flex; align-items: center;
    }
    .taf-add-ref-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 16px; border-radius: 20px;
      border: 1.5px dashed var(--md-sys-color-primary);
      background: transparent; color: var(--md-sys-color-primary);
      cursor: pointer; font-size: 14px; font-weight: 600; width: 100%;
      justify-content: center; transition: all 0.15s;
    }
    .taf-add-ref-btn:hover { background: var(--md-sys-color-primary-container); }
    /* Review */
    .taf-review-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;
    }
    .taf-review-item {
      padding: 10px 14px; border-radius: 8px;
      background: var(--md-sys-color-surface-container-low);
      display: flex; flex-direction: column; gap: 3px;
    }
    .taf-review-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--md-sys-color-on-surface-variant); }
    .taf-review-value { font-size: 14px; font-weight: 600; color: var(--md-sys-color-on-surface); }
    .taf-review-value.primary { color: var(--md-sys-color-primary); }
    .taf-review-legal { font-size: 12px; color: var(--md-sys-color-on-surface-variant); line-height: 1.5; }
    /* Navigation */
    .taf-nav {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 20px; padding-top: 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
    }
    .taf-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 20px; border-radius: 20px;
      font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s;
    }
    .taf-btn--text { background: transparent; color: var(--md-sys-color-primary); }
    .taf-btn--filled { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
    .taf-btn--filled:disabled { opacity: 0.5; cursor: not-allowed; }
    .taf-btn--submit { font-size: 15px; }
    .taf-spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      animation: taf-spin 0.6s linear infinite; display: inline-block;
    }
    @keyframes taf-spin { to { transform: rotate(360deg); } }
    /* Success */
    .taf-success {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 40px; text-align: center;
    }
    .taf-success-icon { font-size: 56px; color: var(--md-sys-color-primary); }
    .taf-success h3 { margin: 0; font-size: 20px; color: var(--md-sys-color-on-surface); }
    .taf-success p { margin: 0; color: var(--md-sys-color-on-surface-variant); line-height: 1.6; }
  `],
})
export class TenantApplicationFormComponent {
  private readonly svc = inject(TenantApplicationService);

  /** @input Tenant ID */
  readonly tenantId = input.required<string>();
  /** @input Tenant display name */
  readonly tenantName = input.required<string>();
  /** @input Tenant email */
  readonly tenantEmail = input.required<string>();
  /** @input Property ID */
  readonly propertyId = input.required<string>();
  /** @input Property title */
  readonly propertyTitle = input.required<string>();
  /** @input Landlord ID */
  readonly landlordId = input.required<string>();

  /** @output Emits the submitted TenantApplication */
  readonly submitted = output<TenantApplication>();
  /** @output Emits when user cancels */
  readonly cancelled = output<void>();

  readonly saving = signal(false);
  readonly submittedSuccess = signal(false);

  readonly steps: { id: Step; label: string }[] = [
    { id: 'personal',    label: 'Pessoal' },
    { id: 'employment',  label: 'Emprego' },
    { id: 'references',  label: 'Referências' },
    { id: 'cover',       label: 'Carta' },
    { id: 'review',      label: 'Revisão' },
  ];

  readonly currentStepIndex = signal(0);
  readonly currentStep = computed(() => this.steps[this.currentStepIndex()].id);

  readonly employmentOptions: { value: EmploymentType; label: string }[] = [
    { value: 'employed',      label: 'Trabalhador(a)' },
    { value: 'self-employed', label: 'Independente' },
    { value: 'student',       label: 'Estudante' },
    { value: 'retired',       label: 'Reformado(a)' },
    { value: 'unemployed',    label: 'Desempregado(a)' },
  ];

  readonly refs = signal<TenantReference[]>([]);

  readonly form = createSignalForm({
    phone:          { value: '', validators: [required('Telefone obrigatório.'), minLength(9, 'Número inválido.')] },
    nif:            { value: '', validators: [required('NIF obrigatório.'), pattern(/^\d{9}$/, 'NIF deve ter 9 dígitos.')] },
    nationality:    { value: '', validators: [required('Nacionalidade obrigatória.')] },
    numOccupants:   { value: '1' },
    hasPets:        { value: 'false' },
    employmentType: { value: 'employed', validators: [required()] },
    monthlyIncome:  { value: '', validators: [required('Rendimento obrigatório.')] },
    occupation:     { value: '', validators: [required('Profissão obrigatória.')] },
    employer:       { value: '' },
    coverLetter:    { value: '', validators: [required('A carta é obrigatória.'), minLength(30, 'Escreva pelo menos 30 caracteres.'), maxLength(1000, 'Máximo 1000 caracteres.')] },
  });

  isStepDone(stepId: Step): boolean {
    const idx = this.steps.findIndex(s => s.id === stepId);
    return idx < this.currentStepIndex();
  }

  nextStep(): void {
    if (this.currentStepIndex() < this.steps.length - 1) {
      this.currentStepIndex.update(i => i + 1);
    }
  }

  prevStep(): void {
    if (this.currentStepIndex() > 0) {
      this.currentStepIndex.update(i => i - 1);
    }
  }

  addRef(): void {
    if (this.refs().length >= 3) return;
    const newRef: TenantReference = {
      id: Math.random().toString(36).slice(2),
      name: '',
      relationship: 'landlord',
    };
    this.refs.update(list => [...list, newRef]);
  }

  removeRef(id: string): void {
    this.refs.update(list => list.filter(r => r.id !== id));
  }

  updateRef(id: string, field: keyof TenantReference, value: string): void {
    this.refs.update(list =>
      list.map(r => r.id === id ? { ...r, [field]: value } : r)
    );
  }

  employmentLabel(type: string): string {
    return this.employmentOptions.find(o => o.value === type)?.label ?? type;
  }

  onSubmit(): void {
    this.saving.set(true);
    const v = this.form.value();

    setTimeout(() => {
      const app = this.svc.submit({
        tenantId:       this.tenantId(),
        tenantName:     this.tenantName(),
        tenantEmail:    this.tenantEmail(),
        tenantPhone:    v['phone'] as string,
        landlordId:     this.landlordId(),
        propertyId:     this.propertyId(),
        propertyTitle:  this.propertyTitle(),
        employmentType: v['employmentType'] as EmploymentType,
        monthlyIncome:  Number(v['monthlyIncome']),
        employer:       v['employer'] as string || undefined,
        nif:            v['nif'] as string,
        nationality:    v['nationality'] as string,
        occupation:     v['occupation'] as string,
        numOccupants:   Number(v['numOccupants']),
        hasPets:        v['hasPets'] === 'true',
        coverLetter:    v['coverLetter'] as string,
        references:     this.refs().map(({ id: _id, ...rest }) => rest),
      });
      this.saving.set(false);
      this.submittedSuccess.set(true);
      this.submitted.emit(app);
    }, 600);
  }
}
