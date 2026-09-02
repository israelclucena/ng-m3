/**
 * @fileoverview TenantApplicationSignalFormComponent — the multi-step tenant
 * rental application rebuilt on Angular 22's **official** Signal Forms API
 * (`@angular/forms/signals`).
 *
 * This is the *second* migration of a real product form off the bespoke
 * `createSignalForm` util onto the official `form()` API, after
 * {@link AuthRegisterSignalFormComponent} (#060) graduated the pattern from the
 * four synthetic PoCs (#056–059). It is a faithful, additive, side-by-side twin
 * of {@link TenantApplicationFormComponent}: identical 5-step flow, markup,
 * styles, outputs and `TenantApplicationService` wiring — the **only** difference
 * is the form engine.
 *
 * Why this form next: it exercises surfaces the auth twin never touched —
 * a `pattern()` validator (Portuguese NIF, 9 digits), **native number parse** on
 * `monthlyIncome` / `numOccupants` (`[formField]` on `<input type="number">`,
 * replacing the bespoke's manual `Number(value)` coercion), and **imperative
 * field writes** (`f.field().value.set()`) for the segmented employment/pets
 * choosers that have no text `<input>` to two-way-bind.
 *
 * Migration map (bespoke `createSignalForm` → official `form()`):
 * | bespoke (TenantApplicationFormComponent)                | official (this)                                  |
 * | ------------------------------------------------------- | ------------------------------------------------ |
 * | `createSignalForm({ nif: { validators: [pattern(…)] }})`| `form(model, (p) => { pattern(p.nif, /^\d{9}$/) })`|
 * | `form.fields.phone.value()`                             | `f.phone().value()`                              |
 * | `[value]` + `(input)="…setValue()"` + `(blur)="touch()"`| `[formField]="f.phone"` (two-way + auto-touch)   |
 * | `Number(value)` on submit                               | native number parse via `[formField]` (`number`) |
 * | `form.fields.hasPets.setValue('true')` (segmented)      | `f.hasPets().value.set('true')`                  |
 * | `form.fields.phone.showError()` / `.firstError()`       | `showError(f.phone)` / `firstError(f.phone)`     |
 * | `form.valid()`                                          | `f().valid()`                                    |
 *
 * References stay a plain `signal<TenantReference[]>` in **both** twins — they
 * never lived inside the bespoke `createSignalForm` either (dynamic arrays were
 * de-risked separately in #058 via `applyEach`). Keeping them identical is what
 * makes the parity assertion meaningful.
 *
 * The bespoke `TenantApplicationFormComponent` remains the shipped default; this
 * twin sits behind `TENANT_APPLICATION_SIGNAL_FORM` and replaces nothing. A parity
 * spec asserts both emit the same `TenantApplication` for the same inputs.
 *
 * Feature flag: `TENANT_APPLICATION_SIGNAL_FORM`
 *
 * @see libs/core/src/lib/components/tenant-application/tenant-application-form.component.ts — the bespoke twin
 * @see libs/core/src/lib/components/auth-register-signal-form/auth-register-signal-form.component.ts — migration #1
 * @see libs/core/src/lib/components/signal-forms-listing/signal-forms-listing.component.ts — number/enum PoC
 *
 * Night Shift 2026-08-22 — Signal Forms migration #2 (real product form).
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FieldTree,
  FormField,
  form,
  maxLength,
  minLength,
  pattern,
  required,
} from '@angular/forms/signals';
import {
  TenantApplicationService,
  TenantApplication,
  EmploymentType,
  TenantReference,
} from '../../services/tenant-application.service';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'personal' | 'employment' | 'references' | 'cover' | 'review';

/**
 * The application form's single source of truth. Numeric fields are modelled as
 * `number` (not the bespoke's coerce-on-submit strings) so `[formField]` on a
 * `<input type="number">` parses natively — the concrete win this migration
 * proves. `hasPets` stays a `'true' | 'false'` string because it is driven by a
 * segmented button pair, not a checkbox.
 */
export interface TenantApplicationModel {
  phone: string;
  nif: string;
  nationality: string;
  numOccupants: number;
  hasPets: 'true' | 'false';
  employmentType: EmploymentType;
  monthlyIncome: number | null;
  occupation: string;
  employer: string;
  coverLetter: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `iu-tenant-application-signal-form`
 *
 * Multi-step rental application built on Angular 22's official Signal Forms API.
 * Feature-parity with {@link TenantApplicationFormComponent}: Personal →
 * Employment → References → Cover Letter → Review, NIF pattern validation, capped
 * references, and the same `submitted` / `cancelled` outputs driving the same
 * `TenantApplicationService`.
 *
 * Feature flag: `TENANT_APPLICATION_SIGNAL_FORM`
 *
 * @example
 * ```html
 * <iu-tenant-application-signal-form
 *   [tenantId]="'tenant-001'"
 *   [tenantName]="'Ana Ferreira'"
 *   [tenantEmail]="'ana@email.pt'"
 *   [propertyId]="'p1'"
 *   [propertyTitle]="'Apartamento T2 no Chiado'"
 *   [landlordId]="'landlord-001'"
 *   (submitted)="onApplicationSubmitted($event)" />
 * ```
 */
@Component({
  selector: 'iu-tenant-application-signal-form',
  standalone: true,
  imports: [CommonModule, FormField],
  template: `
    <div class="taf-container">
      <!-- Engine badge — distinguishes this official-form() twin from the bespoke -->
      <div class="taf-badge-row">
        <span class="taf-badge">form()</span>
      </div>

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
                <label class="taf-label" for="tafs-phone">Telefone</label>
                <input class="taf-input" id="tafs-phone" [class.error]="showError(f.phone)"
                  type="tel" placeholder="+351 9XX XXX XXX"
                  [formField]="f.phone" />
                @if (showError(f.phone)) {
                  <span class="taf-error">{{ firstError(f.phone) }}</span>
                }
              </div>
              <div class="taf-field">
                <label class="taf-label" for="tafs-nif">NIF</label>
                <input class="taf-input" id="tafs-nif" [class.error]="showError(f.nif)"
                  type="text" placeholder="123456789" inputmode="numeric"
                  [formField]="f.nif" />
                @if (showError(f.nif)) {
                  <span class="taf-error">{{ firstError(f.nif) }}</span>
                }
              </div>
            </div>
            <div class="taf-row">
              <div class="taf-field">
                <label class="taf-label" for="tafs-nationality">Nacionalidade</label>
                <input class="taf-input" id="tafs-nationality" [class.error]="showError(f.nationality)"
                  type="text" placeholder="Portuguesa"
                  [formField]="f.nationality" />
                @if (showError(f.nationality)) {
                  <span class="taf-error">{{ firstError(f.nationality) }}</span>
                }
              </div>
              <div class="taf-field">
                <label class="taf-label" for="tafs-occupants">Nº de Ocupantes</label>
                <input class="taf-input" id="tafs-occupants"
                  type="number" placeholder="1"
                  [formField]="f.numOccupants" />
              </div>
            </div>
            <div class="taf-field">
              <span class="taf-label" id="tafs-pets-label">Animais de Estimação?</span>
              <div class="taf-segment" role="group" aria-labelledby="tafs-pets-label">
                <button type="button" class="taf-seg-btn" [class.active]="f.hasPets().value() === 'false'"
                  (click)="f.hasPets().value.set('false')">
                  <span class="material-symbols-outlined">pets</span> Não
                </button>
                <button type="button" class="taf-seg-btn" [class.active]="f.hasPets().value() === 'true'"
                  (click)="f.hasPets().value.set('true')">
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
              <span class="taf-label" id="tafs-employment-label">Situação Profissional</span>
              <div class="taf-segment taf-segment--wrap" role="group" aria-labelledby="tafs-employment-label">
                @for (opt of employmentOptions; track opt.value) {
                  <button type="button" class="taf-seg-btn"
                    [class.active]="f.employmentType().value() === opt.value"
                    (click)="f.employmentType().value.set(opt.value)">
                    {{ opt.label }}
                  </button>
                }
              </div>
            </div>
            <div class="taf-row">
              <div class="taf-field">
                <label class="taf-label" for="tafs-income">Rendimento Mensal Líquido (€)</label>
                <input class="taf-input" id="tafs-income" [class.error]="showError(f.monthlyIncome)"
                  type="number" placeholder="ex: 2000"
                  [formField]="f.monthlyIncome" />
                @if (showError(f.monthlyIncome)) {
                  <span class="taf-error">{{ firstError(f.monthlyIncome) }}</span>
                }
              </div>
              <div class="taf-field">
                <label class="taf-label" for="tafs-occupation">Profissão / Cargo</label>
                <input class="taf-input" id="tafs-occupation" [class.error]="showError(f.occupation)"
                  type="text" placeholder="ex: Engenheiro de Software"
                  [formField]="f.occupation" />
                @if (showError(f.occupation)) {
                  <span class="taf-error">{{ firstError(f.occupation) }}</span>
                }
              </div>
            </div>
            @if (f.employmentType().value() === 'employed' || f.employmentType().value() === 'self-employed') {
              <div class="taf-field">
                <label class="taf-label" for="tafs-employer">Entidade Empregadora</label>
                <input class="taf-input" id="tafs-employer"
                  type="text" placeholder="Nome da empresa"
                  [formField]="f.employer" />
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
                    <label class="taf-label" for="tafs-ref-name-{{ ref.id }}">Nome</label>
                    <input class="taf-input" id="tafs-ref-name-{{ ref.id }}" type="text" [value]="ref.name"
                      (input)="updateRef(ref.id, 'name', $any($event.target).value)" />
                  </div>
                  <div class="taf-field">
                    <label class="taf-label" for="tafs-ref-rel-{{ ref.id }}">Relação</label>
                    <select class="taf-input" id="tafs-ref-rel-{{ ref.id }}" [value]="ref.relationship"
                      (change)="updateRef(ref.id, 'relationship', $any($event.target).value)">
                      <option value="landlord">Senhorio anterior</option>
                      <option value="employer">Empregador</option>
                      <option value="personal">Pessoal</option>
                    </select>
                  </div>
                </div>
                <div class="taf-row">
                  <div class="taf-field">
                    <label class="taf-label" for="tafs-ref-phone-{{ ref.id }}">Telefone</label>
                    <input class="taf-input" id="tafs-ref-phone-{{ ref.id }}" type="tel" [value]="ref.phone ?? ''"
                      (input)="updateRef(ref.id, 'phone', $any($event.target).value)" />
                  </div>
                  <div class="taf-field">
                    <label class="taf-label" for="tafs-ref-email-{{ ref.id }}">Email</label>
                    <input class="taf-input" id="tafs-ref-email-{{ ref.id }}" type="email" [value]="ref.email ?? ''"
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
              <label class="taf-label" for="tafs-cover">A sua mensagem</label>
              <textarea class="taf-textarea" id="tafs-cover"
                [class.error]="showError(f.coverLetter)"
                rows="8"
                placeholder="Ex: Somos um casal profissional e responsável..."
                [formField]="f.coverLetter"></textarea>
              <div class="taf-char-count" [class.warn]="f.coverLetter().value().length > 900">
                {{ f.coverLetter().value().length }}/1000
              </div>
              @if (showError(f.coverLetter)) {
                <span class="taf-error">{{ firstError(f.coverLetter) }}</span>
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
                <span class="taf-review-value">{{ f.nif().value() }}</span>
              </div>
              <div class="taf-review-item">
                <span class="taf-review-label">Situação Profissional</span>
                <span class="taf-review-value">{{ employmentLabel(f.employmentType().value()) }}</span>
              </div>
              <div class="taf-review-item">
                <span class="taf-review-label">Rendimento Mensal</span>
                <span class="taf-review-value primary">{{ f.monthlyIncome().value() }}€</span>
              </div>
              <div class="taf-review-item">
                <span class="taf-review-label">Nº Ocupantes</span>
                <span class="taf-review-value">{{ f.numOccupants().value() }}</span>
              </div>
              <div class="taf-review-item">
                <span class="taf-review-label">Referências</span>
                <span class="taf-review-value">{{ refs().length }}</span>
              </div>
              <div class="taf-review-item">
                <span class="taf-review-label">Carta</span>
                <span class="taf-review-value">{{ f.coverLetter().value().length }} caracteres</span>
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .taf-container {
      background: var(--md-sys-color-surface);
      border-radius: 16px;
      padding: 24px;
      max-width: 640px;
    }
    /* Engine badge */
    .taf-badge-row { display: flex; justify-content: flex-end; margin-bottom: 8px; }
    .taf-badge {
      padding: 2px 8px;
      border-radius: 999px;
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: 11px;
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
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
export class TenantApplicationSignalFormComponent {
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

  /** True once a submit has been attempted — drives error visibility on submit. */
  private readonly attempted = signal(false);

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

  /** References live outside the form — as in the bespoke twin (never in createSignalForm). */
  readonly refs = signal<TenantReference[]>([]);

  // ── Official Signal Form ───────────────────────────────────────────────────

  /**
   * Single source of truth. `form()` wraps this signal directly and mutates it in
   * place through `[formField]` — reading `model()` reflects live input.
   */
  private readonly model = signal<TenantApplicationModel>({
    phone: '',
    nif: '',
    nationality: '',
    numOccupants: 1,
    hasPets: 'false',
    employmentType: 'employed',
    monthlyIncome: null,
    occupation: '',
    employer: '',
    coverLetter: '',
  });

  /**
   * The official field tree. Every rule is declared inline in the schema — the
   * same validators the bespoke passed as arrays, now as declarative calls. The
   * NIF `pattern()` rule is the surface migration #1 never exercised.
   */
  protected readonly f = form(this.model, (p) => {
    required(p.phone, { message: 'Telefone obrigatório.' });
    minLength(p.phone, 9, { message: 'Número inválido.' });

    required(p.nif, { message: 'NIF obrigatório.' });
    pattern(p.nif, /^\d{9}$/, { message: 'NIF deve ter 9 dígitos.' });

    required(p.nationality, { message: 'Nacionalidade obrigatória.' });

    required(p.employmentType);
    required(p.monthlyIncome, { message: 'Rendimento obrigatório.' });
    required(p.occupation, { message: 'Profissão obrigatória.' });

    required(p.coverLetter, { message: 'A carta é obrigatória.' });
    minLength(p.coverLetter, 30, { message: 'Escreva pelo menos 30 caracteres.' });
    maxLength(p.coverLetter, 1000, { message: 'Máximo 1000 caracteres.' });
  });

  // ── Error-display helpers (mirror the bespoke showError/firstError) ─────────

  /** Whether a field should surface its error — touched (or a submit attempted) AND invalid. */
  protected showError<T>(field: FieldTree<T>): boolean {
    const state = field();
    return (state.touched() || this.attempted()) && state.invalid();
  }

  /** First human-readable error message for a field, or empty string. */
  protected firstError<T>(field: FieldTree<T>): string {
    return field().errors()[0]?.message ?? '';
  }

  // ── Steps ──────────────────────────────────────────────────────────────────

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

  // ── References ───────────────────────────────────────────────────────────────

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

  // ── Submit ───────────────────────────────────────────────────────────────────

  onSubmit(): void {
    this.attempted.set(true);
    this.saving.set(true);
    const v = this.model();

    setTimeout(() => {
      const app = this.svc.submit({
        tenantId:       this.tenantId(),
        tenantName:     this.tenantName(),
        tenantEmail:    this.tenantEmail(),
        tenantPhone:    v.phone,
        landlordId:     this.landlordId(),
        propertyId:     this.propertyId(),
        propertyTitle:  this.propertyTitle(),
        employmentType: v.employmentType,
        monthlyIncome:  Number(v.monthlyIncome),
        employer:       v.employer || undefined,
        nif:            v.nif,
        nationality:    v.nationality,
        occupation:     v.occupation,
        numOccupants:   Number(v.numOccupants),
        hasPets:        v.hasPets === 'true',
        coverLetter:    v.coverLetter,
        references:     this.refs().map(({ id: _id, ...rest }) => rest),
      });
      this.saving.set(false);
      this.submittedSuccess.set(true);
      this.submitted.emit(app);
    }, 600);
  }
}
