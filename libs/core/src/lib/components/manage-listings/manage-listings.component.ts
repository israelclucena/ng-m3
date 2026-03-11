import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyData } from '../property-card/property-card.component';

// ─── Models ──────────────────────────────────────────────────────────────────

/**
 * A landlord's listing with status management.
 * Feature flag: `MANAGE_LISTINGS`
 */
export interface LandlordListing extends PropertyData {
  /** Publication status */
  status: 'active' | 'paused' | 'rented' | 'draft';
  /** Total inquiries received */
  inquiries: number;
  /** Total scheduled visits */
  visits: number;
  /** Date listed (display string) */
  listedDate: string;
}

/**
 * Bulk action identifier.
 */
export type ListingBulkAction = 'pause' | 'activate' | 'delete';

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `iu-manage-listings` — landlord property management dashboard.
 *
 * Shows a filterable table of the landlord's listings with status chips,
 * inquiry/visit counters, and inline CRUD actions.
 *
 * Feature flag: `MANAGE_LISTINGS`
 *
 * @example
 * ```html
 * <iu-manage-listings
 *   [listings]="myListings()"
 *   (edit)="openEditForm($event)"
 *   (delete)="deleteListing($event)"
 *   (addNew)="openAddForm()"
 * />
 * ```
 */
@Component({
  selector: 'iu-manage-listings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-manage-listings">

      <!-- ── Header ── -->
      <div class="ml-header">
        <div class="header-left">
          <span class="material-symbols-outlined header-icon">home_work</span>
          <div>
            <h2 class="header-title">Os Meus Imóveis</h2>
            <p class="header-sub">{{ listings().length }} anúncio{{ listings().length === 1 ? '' : 's' }} no total · {{ activeCount() }} activo{{ activeCount() === 1 ? '' : 's' }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="addNew.emit()">
            <span class="material-symbols-outlined">add_home</span>
            Novo Imóvel
          </button>
        </div>
      </div>

      <!-- ── Status tabs ── -->
      <div class="status-tabs" role="tablist">
        @for (tab of statusTabs; track tab.key) {
          <button
            class="status-tab"
            [class.active]="activeStatus() === tab.key"
            (click)="activeStatus.set(tab.key)"
            role="tab"
          >
            <span class="material-symbols-outlined tab-icon">{{ tab.icon }}</span>
            {{ tab.label }}
            <span class="tab-badge">{{ countForStatus(tab.key) }}</span>
          </button>
        }
      </div>

      <!-- ── Stats row ── -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-num primary">{{ totalInquiries() }}</span>
          <span class="stat-label">Mensagens</span>
        </div>
        <div class="stat-card">
          <span class="stat-num secondary">{{ totalVisits() }}</span>
          <span class="stat-label">Visitas agendadas</span>
        </div>
        <div class="stat-card">
          <span class="stat-num tertiary">€{{ totalRevenue() | number:'1.0-0' }}</span>
          <span class="stat-label">Renda/mês (activos)</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ occupancyRate() }}%</span>
          <span class="stat-label">Taxa de ocupação</span>
        </div>
      </div>

      <!-- ── Table or empty ── -->
      @if (filtered().length === 0) {
        <div class="ml-empty">
          <span class="material-symbols-outlined empty-icon">home_work</span>
          <p class="empty-title">
            @if (listings().length === 0) {
              Ainda não tem imóveis listados
            } @else {
              Sem imóveis nesta categoria
            }
          </p>
          @if (listings().length === 0) {
            <button class="btn-primary" (click)="addNew.emit()">
              <span class="material-symbols-outlined">add</span>
              Adicionar primeiro imóvel
            </button>
          }
        </div>
      } @else {
        <div class="ml-table-wrap">
          <table class="ml-table">
            <thead>
              <tr>
                <th>Imóvel</th>
                <th>Renda/mês</th>
                <th>Stats</th>
                <th>Estado</th>
                <th>Listado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (listing of filtered(); track listing.id) {
                <tr class="listing-row" [class]="'row-' + listing.status">
                  <!-- Property info -->
                  <td class="td-property">
                    <div class="prop-cell">
                      <div class="prop-thumb">
                        @if (listing.imageUrl) {
                          <img [src]="listing.imageUrl" [alt]="listing.title" />
                        } @else {
                          <span class="material-symbols-outlined">apartment</span>
                        }
                      </div>
                      <div class="prop-info">
                        <p class="prop-title">{{ listing.title }}</p>
                        <p class="prop-loc">
                          <span class="material-symbols-outlined">location_on</span>
                          {{ listing.location }}
                        </p>
                        <p class="prop-meta">
                          {{ listing.bedrooms === 0 ? 'Studio' : listing.bedrooms + ' qtos' }} ·
                          {{ listing.areaSqm }} m²
                        </p>
                      </div>
                    </div>
                  </td>

                  <!-- Price -->
                  <td class="td-price">
                    <span class="price-val">€{{ listing.priceMonthly | number:'1.0-0' }}</span>
                    <span class="price-unit">/mês</span>
                  </td>

                  <!-- Stats -->
                  <td class="td-stats">
                    <div class="mini-stats">
                      <span class="mini-stat" title="Mensagens">
                        <span class="material-symbols-outlined">mail</span>
                        {{ listing.inquiries }}
                      </span>
                      <span class="mini-stat" title="Visitas agendadas">
                        <span class="material-symbols-outlined">calendar_today</span>
                        {{ listing.visits }}
                      </span>
                    </div>
                  </td>

                  <!-- Status -->
                  <td class="td-status">
                    <span class="status-chip" [class]="'chip-' + listing.status">
                      <span class="status-dot"></span>
                      {{ statusLabel(listing.status) }}
                    </span>
                  </td>

                  <!-- Date -->
                  <td class="td-date">{{ listing.listedDate }}</td>

                  <!-- Actions -->
                  <td class="td-actions">
                    <div class="action-group">
                      <button class="action-btn edit" (click)="edit.emit(listing)" title="Editar">
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                      @if (listing.status === 'active') {
                        <button class="action-btn pause" (click)="pause.emit(listing)" title="Pausar">
                          <span class="material-symbols-outlined">pause_circle</span>
                        </button>
                      }
                      @if (listing.status === 'paused' || listing.status === 'draft') {
                        <button class="action-btn activate" (click)="activate.emit(listing)" title="Activar">
                          <span class="material-symbols-outlined">play_circle</span>
                        </button>
                      }
                      <button class="action-btn del" (click)="delete.emit(listing)" title="Remover">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; }

    .iu-manage-listings {
      font-family: 'Roboto', sans-serif;
    }

    /* ── Header ── */
    .ml-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      font-size: 32px;
      color: var(--md-sys-color-tertiary, #7d5260);
    }

    .header-title {
      margin: 0 0 2px;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .header-sub {
      margin: 0;
      font-size: 0.85rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* ── Buttons ── */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      border-radius: 100px;
      border: none;
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-primary:hover { opacity: 0.9; }
    .btn-primary .material-symbols-outlined { font-size: 18px; }

    /* ── Status tabs ── */
    .status-tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      padding-bottom: 0;
    }

    .status-tab {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px 8px 0 0;
      border: none;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: -1px;
    }

    .status-tab:hover { background: var(--md-sys-color-surface-container-low, #f7f2fa); }

    .status-tab.active {
      border-bottom-color: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-primary, #6750a4);
      font-weight: 700;
      background: var(--md-sys-color-surface-container-lowest, #fffbfe);
    }

    .tab-icon { font-size: 16px; }

    .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      border-radius: 100px;
      background: var(--md-sys-color-surface-container, #ece6f0);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 0.72rem;
      font-weight: 700;
    }

    .status-tab.active .tab-badge {
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }

    /* ── Stats row ── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-num {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .stat-num.primary { color: var(--md-sys-color-primary, #6750a4); }
    .stat-num.secondary { color: var(--md-sys-color-secondary, #625b71); }
    .stat-num.tertiary { color: var(--md-sys-color-tertiary, #7d5260); }

    .stat-label {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* ── Empty ── */
    .ml-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 56px;
    }

    .empty-icon { font-size: 48px; opacity: 0.3; color: var(--md-sys-color-on-surface-variant, #49454f); }

    .empty-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* ── Table ── */
    .ml-table-wrap { overflow-x: auto; border-radius: 16px; border: 1px solid var(--md-sys-color-outline-variant, #cac4d0); }

    .ml-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .ml-table thead tr {
      background: var(--md-sys-color-surface-container, #ece6f0);
    }

    .ml-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .listing-row {
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      transition: background 0.15s;
    }

    .listing-row:hover { background: var(--md-sys-color-surface-container-lowest, #fffbfe); }

    .listing-row.row-paused { opacity: 0.65; }
    .listing-row.row-rented { background: #f3faf3; }

    .ml-table td { padding: 14px 16px; vertical-align: middle; }

    /* Property cell */
    .prop-cell { display: flex; align-items: center; gap: 12px; }

    .prop-thumb {
      width: 56px;
      height: 56px;
      border-radius: 10px;
      background: var(--md-sys-color-surface-container, #ece6f0);
      overflow: hidden;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .prop-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .prop-thumb .material-symbols-outlined { font-size: 22px; opacity: 0.4; }

    .prop-title {
      margin: 0 0 3px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .prop-loc {
      display: flex;
      align-items: center;
      gap: 2px;
      margin: 0 0 2px;
      font-size: 0.78rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .prop-loc .material-symbols-outlined { font-size: 12px; }

    .prop-meta { margin: 0; font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant, #49454f); }

    /* Price */
    .price-val { font-weight: 700; color: var(--md-sys-color-primary, #6750a4); font-size: 1rem; }
    .price-unit { font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant, #49454f); }

    /* Mini stats */
    .mini-stats { display: flex; flex-direction: column; gap: 4px; }

    .mini-stat {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .mini-stat .material-symbols-outlined { font-size: 14px; }

    /* Status chips */
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 100px;
      font-size: 0.78rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .status-dot { width: 7px; height: 7px; border-radius: 50%; }

    .chip-active { background: #e8f5e9; color: #2e7d32; }
    .chip-active .status-dot { background: #43a047; }

    .chip-paused { background: #fff8e1; color: #795548; }
    .chip-paused .status-dot { background: #ff8f00; }

    .chip-rented { background: var(--md-sys-color-secondary-container, #e8def8); color: var(--md-sys-color-on-secondary-container, #1d192b); }
    .chip-rented .status-dot { background: var(--md-sys-color-secondary, #625b71); }

    .chip-draft { background: var(--md-sys-color-surface-container, #ece6f0); color: var(--md-sys-color-on-surface-variant, #49454f); }
    .chip-draft .status-dot { background: var(--md-sys-color-outline, #79747e); }

    /* Date */
    .td-date { font-size: 0.8rem; color: var(--md-sys-color-on-surface-variant, #49454f); white-space: nowrap; }

    /* Action buttons */
    .action-group { display: flex; gap: 4px; }

    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }

    .action-btn .material-symbols-outlined { font-size: 17px; }

    .action-btn.edit { color: var(--md-sys-color-primary, #6750a4); }
    .action-btn.edit:hover { background: var(--md-sys-color-primary-container, #eaddff); }

    .action-btn.pause { color: #ef6c00; }
    .action-btn.pause:hover { background: #fff3e0; }

    .action-btn.activate { color: #2e7d32; }
    .action-btn.activate:hover { background: #e8f5e9; }

    .action-btn.del { color: var(--md-sys-color-error, #b3261e); }
    .action-btn.del:hover { background: var(--md-sys-color-error-container, #f9dedc); }
  `],
})
export class ManageListingsComponent {
  /** Listings to display. */
  readonly listings = input<LandlordListing[]>([]);

  /** Emits listing to edit. */
  readonly edit = output<LandlordListing>();

  /** Emits listing to pause. */
  readonly pause = output<LandlordListing>();

  /** Emits listing to re-activate. */
  readonly activate = output<LandlordListing>();

  /** Emits listing to delete. */
  readonly delete = output<LandlordListing>();

  /** Emits when user clicks "Novo Imóvel". */
  readonly addNew = output<void>();

  readonly activeStatus = signal<'all' | 'active' | 'paused' | 'rented' | 'draft'>('all');

  readonly statusTabs = [
    { key: 'all' as const,    label: 'Todos',     icon: 'apps' },
    { key: 'active' as const, label: 'Activos',   icon: 'visibility' },
    { key: 'paused' as const, label: 'Pausados',  icon: 'pause_circle' },
    { key: 'rented' as const, label: 'Arrendados',icon: 'key' },
    { key: 'draft' as const,  label: 'Rascunho',  icon: 'draft' },
  ];

  readonly filtered = computed(() => {
    const status = this.activeStatus();
    if (status === 'all') return this.listings();
    return this.listings().filter(l => l.status === status);
  });

  readonly activeCount = computed(() => this.listings().filter(l => l.status === 'active').length);

  readonly totalInquiries = computed(() => this.listings().reduce((sum, l) => sum + l.inquiries, 0));

  readonly totalVisits = computed(() => this.listings().reduce((sum, l) => sum + l.visits, 0));

  readonly totalRevenue = computed(() =>
    this.listings()
      .filter(l => l.status === 'active' || l.status === 'rented')
      .reduce((sum, l) => sum + l.priceMonthly, 0)
  );

  readonly occupancyRate = computed(() => {
    const total = this.listings().length;
    if (!total) return 0;
    const rented = this.listings().filter(l => l.status === 'rented').length;
    return Math.round((rented / total) * 100);
  });

  countForStatus(key: string): number {
    if (key === 'all') return this.listings().length;
    return this.listings().filter(l => l.status === key).length;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      active: 'Activo', paused: 'Pausado', rented: 'Arrendado', draft: 'Rascunho',
    };
    return map[status] ?? status;
  }
}
