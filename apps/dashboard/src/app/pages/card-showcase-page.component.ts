import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  signal,
} from '@angular/core';
import { ButtonComponent, CardComponent, DividerComponent } from '@israel-ui/core';
import type { CardKind, CardVariant } from '@israel-ui/core';

/**
 * Card — Onda 9 showcase (NG-03, milestone proof surface).
 *
 * A single dedicated page that renders the *one* `<iu-card>` component across
 * its 4 semantic kinds × 3 variants and every real state (loading, error,
 * empty, selectable, media + broken-image fallback, density). This is the
 * "algo que o Israel mostra a outra pessoa": the whole point of the deep-module
 * conversion — one component, four kinds, real behaviour — visible on one screen.
 *
 * Additive and self-contained: a new lazy route (`/card-showcase`) that touches
 * no existing page. Wiring it into the nav + the `CARD_V2` flag flip + the
 * README/portfolio link + screenshots land with the app migration (NG-03 (a)/(c)).
 */
@Component({
  selector: 'app-card-showcase-page',
  standalone: true,
  imports: [CardComponent, ButtonComponent, DividerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="showcase" data-testid="card-showcase">
      <header>
        <h1>Card — one component, four kinds</h1>
        <p class="subtitle">
          The same <code>&lt;iu-card&gt;</code> covers every kind and variant, and
          carries real behaviour — no sibling components. Onda 9 deep-module proof.
        </p>
      </header>

      <iu-divider></iu-divider>

      <!-- ═══ KINDS × VARIANTS MATRIX ═══ -->
      <section aria-labelledby="sc-matrix">
        <h2 id="sc-matrix">Kinds × variants</h2>
        @for (kind of kinds; track kind) {
          <div class="group" [attr.data-testid]="'kind-' + kind">
            <h3>{{ kind }}</h3>
            <div class="row">
              @for (variant of variants; track variant) {
                <iu-card
                  [kind]="kind"
                  [variant]="variant"
                  [avatar]="kind === 'profile' ? 'person' : ''"
                  [title]="titleFor(kind)"
                  [subtitle]="subtitleFor(kind, variant)"
                  class="cell"
                  [attr.data-testid]="'card-' + kind + '-' + variant"
                >
                  @switch (kind) {
                    @case ('stat') {
                      <span class="stat-value">{{ statValueFor(variant) }}</span>
                    }
                    @case ('action') {
                      <p>Confirma a renovação do contrato antes do prazo.</p>
                      <div slot="footer">
                        <iu-button variant="text" label="Adiar"></iu-button>
                        <iu-button variant="filled" label="Renovar"></iu-button>
                      </div>
                    }
                    @default {
                      <p>Conteúdo do card {{ kind }} ({{ variant }}).</p>
                    }
                  }
                </iu-card>
              }
            </div>
          </div>
        }
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ STATES GALLERY ═══ -->
      <section aria-labelledby="sc-states">
        <h2 id="sc-states">Real states</h2>

        <div class="group" data-testid="state-loading">
          <h3>Loading — skeleton + aria-busy</h3>
          <div class="row">
            <iu-card variant="elevated" title="A carregar" [loading]="true" class="cell">…</iu-card>
          </div>
        </div>

        <div class="group" data-testid="state-error">
          <h3>Error — retry (role=alert)</h3>
          <div class="row">
            <iu-card
              variant="outlined"
              title="Falha ao carregar"
              [error]="true"
              class="cell"
              (retry)="onRetry()"
            >
              <div slot="error">Não foi possível carregar os dados.</div>
            </iu-card>
            <span class="hint">Retries: {{ retries() }}</span>
          </div>
        </div>

        <div class="group" data-testid="state-empty">
          <h3>Empty — [slot=empty]</h3>
          <div class="row">
            <iu-card variant="filled" title="Sem imóveis" [empty]="true" class="cell">
              <div slot="empty">Ainda não há imóveis nesta carteira.</div>
            </iu-card>
          </div>
        </div>

        <div class="group" data-testid="state-selectable">
          <h3>Selectable — aria-pressed, Enter/Space</h3>
          <div class="row">
            @for (opt of options; track opt) {
              <iu-card
                variant="outlined"
                [selectable]="true"
                [selected]="selected() === opt"
                (selectedChange)="select(opt)"
                [title]="opt"
                subtitle="Clica ou usa o teclado"
                class="cell"
                [attr.data-testid]="'selectable-' + opt"
              >
                <p>{{ selected() === opt ? 'Selecionado' : 'Por selecionar' }}</p>
              </iu-card>
            }
          </div>
        </div>

        <div class="group" data-testid="state-media">
          <h3>Media — aspect-ratio + broken-image fallback</h3>
          <div class="row">
            <iu-card
              variant="filled"
              title="Media ok"
              mediaSrc="https://picsum.photos/seed/lisboa/440/248"
              mediaAlt="Fachada em Lisboa"
              class="cell"
            >
              <p>Imagem com <code>aspect-ratio</code>.</p>
            </iu-card>
            <iu-card
              variant="filled"
              title="Imagem partida"
              mediaSrc="https://invalid.example/broken.png"
              mediaAlt="Fonte inválida"
              class="cell"
            >
              <p>Fallback <code>broken_image</code> quando a fonte falha.</p>
            </iu-card>
          </div>
        </div>

        <div class="group" data-testid="state-density">
          <h3>Density — compact | default | comfortable</h3>
          <div class="row">
            @for (d of densities; track d) {
              <iu-card
                variant="elevated"
                [density]="d"
                [title]="d"
                subtitle="Só ritmo de padding"
                class="cell"
                [attr.data-testid]="'density-' + d"
              >
                <p>Densidade {{ d }}.</p>
              </iu-card>
            }
          </div>
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; overflow-x: hidden; }
    .showcase {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      overflow-x: hidden;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .subtitle {
      font-size: 1rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-bottom: 24px;
      max-width: 60ch;
    }
    code {
      font-family: 'Roboto Mono', ui-monospace, monospace;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 4px;
      padding: 0 4px;
    }
    section { margin: 32px 0; }
    h2 {
      font-size: 1.5rem;
      font-weight: 500;
      margin-bottom: 16px;
      color: var(--md-sys-color-on-surface, #1d1b20);
    }
    h3 {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 12px;
      text-transform: capitalize;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .group { margin-bottom: 28px; }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: stretch;
      gap: 16px;
    }
    .cell { width: 240px; }
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .hint {
      align-self: center;
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    @media (max-width: 600px) {
      .showcase { padding: 16px; }
      h1 { font-size: 1.5rem; }
      h2 { font-size: 1.25rem; }
      .row { gap: 12px; }
      .cell { width: 100%; }
    }
  `],
})
export class CardShowcasePageComponent {
  protected readonly kinds: readonly CardKind[] = ['plain', 'action', 'profile', 'stat'];
  protected readonly variants: readonly CardVariant[] = ['elevated', 'filled', 'outlined'];
  protected readonly densities = ['compact', 'default', 'comfortable'] as const;
  protected readonly options = ['Lisboa', 'Porto', 'Faro'] as const;

  /** Selected option in the selectable demo. */
  protected readonly selected = signal<string>('Porto');
  /** How many times the error card's retry has fired — proves the output wiring. */
  protected readonly retries = signal(0);

  protected titleFor(kind: CardKind): string {
    return { plain: 'Card', action: 'Renovação', profile: 'Israel Lucena', stat: 'Yield bruto' }[kind];
  }

  protected subtitleFor(kind: CardKind, variant: CardVariant): string {
    return kind === 'profile' ? 'Senhorio · 12 imóveis' : variant;
  }

  protected statValueFor(variant: CardVariant): string {
    return { elevated: '6,4%', filled: '4,1%', outlined: '8,9%' }[variant];
  }

  protected select(opt: string): void {
    this.selected.set(opt);
  }

  protected onRetry(): void {
    this.retries.update(n => n + 1);
  }
}
