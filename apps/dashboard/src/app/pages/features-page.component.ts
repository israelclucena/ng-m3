import { Component, signal, inject, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DataTableComponent,
  DataTableColumn,
  SearchComponent,
  SearchResult,
  EmptyStateComponent,
  LineChartComponent,
  LineChartSeries,
  BarChartComponent,
  BarChartDataPoint,
  DonutChartComponent,
  DonutChartSegment,
  NotificationService,
  ThemeService,
  KeyboardShortcutService,
  ShortcutHelpOverlayComponent,
  DividerComponent,
  ButtonComponent,
  ExportToolbarComponent,
  VoiceWidgetComponent,
  FormBuilderComponent,
  FormField,
  FormSubmitEvent,
  // Sprint 007
  AvatarComponent,
  AvatarGroupComponent,
  TagInputComponent,
  StepperComponent,
  StepperStep,
  StepChangeEvent,
  TimelineComponent,
  TimelineItem,
  DatePickerComponent,
  ColorPickerComponent,
  // Sprint 008
  DataTableV2Component,
  DataTableV2Column,
  DataTableV2BulkAction,
  WidgetContainerComponent,
  WidgetGridComponent,
  // Sprint 010
  PropertyCardComponent,
  PropertyData,
  // Sprint 011
  PropertyDetailComponent,
  PropertyResourceService,
  // Sprint 012
  PropertyFilterComponent,
  PropertyFilterState,
  FavouritesService,
  // Sprint 013
  PropertyMapComponent,
  PropertyMapMarker,
  MOCK_MAP_MARKERS,
  PropertyComparisonComponent,
  PaginatorComponent,
  PaginatorPageEvent,
  // Sprint 014
  PropertyBookingComponent,
  BookingSubmitEvent,
  // Sprint 015
  AuthLoginComponent,
  AuthRegisterComponent,
  AuthService,
  AuthUser,
  // Sprint 016
  UserProfileComponent,
  UserProfileStats,
  MyBookingsComponent,
  BookingRecord,
  MyFavouritesComponent,
  // Sprint 017
  AddPropertyComponent,
  NewPropertyForm,
  ManageListingsComponent,
  LandlordListing,
  // Sprint 018
  MessageListComponent,
  MessageThreadComponent,
  MessagingService,
  MessageThread,
  NotificationBellComponent,
  NotificationBellService,
  // Sprint 019
  GlobalSearchComponent,
  GlobalSearchSelectEvent,
  GlobalSearchSubmitEvent,
  PropertySearchService,
  PropertyReviewsComponent,
  PropertyReview,
  RatingDisplayComponent,
} from '@israel-ui/core';
import { FeatureFlags } from '../feature-flags';

// ─── Sample Data ───────────────────────────────────────────────────
interface User {
  id: number;
  name: string;
  role: string;
  status: string;
  joined: string;
}

const SAMPLE_USERS: User[] = [
  { id: 1, name: 'Israel Lucena', role: 'Frontend Dev', status: 'Active', joined: '2024-01' },
  { id: 2, name: 'Luana Silva', role: 'Designer', status: 'Active', joined: '2024-02' },
  { id: 3, name: 'Samuel Lucena', role: 'Backend Dev', status: 'Inactive', joined: '2023-11' },
  { id: 4, name: 'Davi Costa', role: 'Product Manager', status: 'Active', joined: '2024-03' },
  { id: 5, name: 'Eduardo Lucena', role: 'DevOps', status: 'Active', joined: '2023-08' },
  { id: 6, name: 'Wilma Santos', role: 'QA Engineer', status: 'Inactive', joined: '2023-06' },
  { id: 7, name: 'Ana Pereira', role: 'Frontend Dev', status: 'Active', joined: '2024-01' },
  { id: 8, name: 'Carlos Mendes', role: 'Backend Dev', status: 'Active', joined: '2023-12' },
];

const USER_COLUMNS: DataTableColumn<User>[] = [
  { key: 'id', label: '#', width: '60px', align: 'center' },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'joined', label: 'Joined', sortable: true },
];

const SEARCH_DATA: SearchResult[] = [
  { id: '1', label: 'Israel Lucena', subtitle: 'Frontend Developer', icon: 'person' },
  { id: '2', label: 'Angular 19', subtitle: 'Framework', icon: 'code' },
  { id: '3', label: 'Material Design 3', subtitle: 'Design System', icon: 'palette' },
  { id: '4', label: 'TypeScript', subtitle: 'Language', icon: 'terminal' },
  { id: '5', label: 'Dashboard', subtitle: 'Page', icon: 'dashboard' },
  { id: '6', label: 'Settings', subtitle: 'Page', icon: 'settings' },
];

// ─── Component ─────────────────────────────────────────────────────
@Component({
  selector: 'app-features-page',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    SearchComponent,
    EmptyStateComponent,
    LineChartComponent,
    BarChartComponent,
    DonutChartComponent,
    ShortcutHelpOverlayComponent,
    DividerComponent,
    ButtonComponent,
    ExportToolbarComponent,
    VoiceWidgetComponent,
    FormBuilderComponent,
    // Sprint 007
    AvatarComponent,
    AvatarGroupComponent,
    TagInputComponent,
    StepperComponent,
    TimelineComponent,
    DatePickerComponent,
    ColorPickerComponent,
    // Sprint 008
    DataTableV2Component,
    WidgetContainerComponent,
    WidgetGridComponent,
    // Sprint 010
    PropertyCardComponent,
    // Sprint 011
    PropertyDetailComponent,
    // Sprint 012
    PropertyFilterComponent,
    // Sprint 013
    PropertyMapComponent,
    PropertyComparisonComponent,
    PaginatorComponent,
    // Sprint 014
    PropertyBookingComponent,
    // Sprint 015
    AuthLoginComponent,
    AuthRegisterComponent,
    // Sprint 016
    UserProfileComponent,
    MyBookingsComponent,
    MyFavouritesComponent,
    // Sprint 017
    AddPropertyComponent,
    ManageListingsComponent,
    // Sprint 018
    MessageListComponent,
    MessageThreadComponent,
    NotificationBellComponent,
    // Sprint 019
    GlobalSearchComponent,
    PropertyReviewsComponent,
    RatingDisplayComponent,
  ],
  template: `
    <div class="features-catalog">

      <h1>Feature Showcase</h1>
      <p class="subtitle">Todos os novos componentes — clica no menu lateral para navegar</p>

      <iu-divider></iu-divider>

      <!-- ═══ DATA TABLE ═══ -->
      <section id="feat-data-table">
        <h2>Data Table</h2>
        <p class="desc">Sorting tri-state por coluna, filtro full-text e paginação com Signals.</p>
        <div class="demo-block">
          <iu-data-table
            [columns]="userColumns"
            [data]="users"
            [pageSize]="5"
            [filterable]="true"
          ></iu-data-table>
        </div>
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ SEARCH ═══ -->
      <section id="feat-search">
        <h2>Search — Autocomplete</h2>
        <p class="desc">Debounce 300ms, navegação com teclado ↑↓ Enter Esc, highlight nos resultados.</p>
        <div class="demo-block" style="max-width: 480px;">
          <iu-search
            placeholder="Pesquisa componentes, páginas..."
            [results]="searchResults()"
            [loading]="searchLoading()"
            (search)="onSearch($event)"
            (select)="onSearchSelect($event)"
          ></iu-search>
          @if (lastSelected()) {
            <p style="margin-top: 12px; color: var(--md-sys-color-primary)">
              ✅ Seleccionado: <strong>{{ lastSelected() }}</strong>
            </p>
          }
        </div>
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ CHARTS ═══ -->
      <section id="feat-charts">
        <h2>Charts — SVG puro</h2>
        <p class="desc">Line, Bar e Donut charts sem dependências externas. Tooltips, hover e legendas.</p>

        <div class="charts-grid">
          <div class="chart-card">
            <h3>Line Chart</h3>
            <iu-line-chart
              [series]="lineSeries"
              [height]="200"
            ></iu-line-chart>
          </div>
          <div class="chart-card">
            <h3>Bar Chart</h3>
            <iu-bar-chart
              [data]="barData"
              [height]="200"
            ></iu-bar-chart>
          </div>
          <div class="chart-card">
            <h3>Donut Chart</h3>
            <iu-donut-chart
              [segments]="donutData"
              [size]="200"
            ></iu-donut-chart>
          </div>
        </div>
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ EMPTY STATES ═══ -->
      <section id="feat-empty-states">
        <h2>Empty States</h2>
        <p class="desc">Componente reutilizável com 3 tamanhos, ícone, título, descrição e CTA.</p>

        <div class="empty-grid">
          <iu-empty-state
            icon="inbox"
            title="Inbox vazio"
            description="Sem mensagens por agora. Começa uma conversa!"
            actionLabel="Escrever"
            size="small"
          ></iu-empty-state>

          <iu-empty-state
            icon="search_off"
            title="Sem resultados"
            description="Tenta alterar os filtros de pesquisa."
            actionLabel="Limpar filtros"
            size="medium"
          ></iu-empty-state>

          <iu-empty-state
            icon="cloud_off"
            title="Sem ligação"
            description="Verifica a tua ligação à internet e tenta de novo."
            actionLabel="Tentar de novo"
            size="large"
          ></iu-empty-state>
        </div>
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ NOTIFICATIONS ═══ -->
      <section id="feat-notifications">
        <h2>Notification System</h2>
        <p class="desc">Toast/snackbar com queue management, 4 tipos e duração configurável.</p>

        <div class="demo-block">
          <div class="row">
            <iu-button variant="primary" label="Info" icon="info" (clicked)="notify('info')"></iu-button>
            <iu-button variant="secondary" label="Success" icon="check_circle" (clicked)="notify('success')"></iu-button>
            <iu-button variant="outlined" label="Warning" icon="warning" (clicked)="notify('warning')"></iu-button>
            <iu-button variant="danger" label="Error" icon="error" (clicked)="notify('error')"></iu-button>
          </div>
        </div>
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ KEYBOARD SHORTCUTS ═══ -->
      <section id="feat-keyboard">
        <h2>Keyboard Shortcuts</h2>
        <p class="desc">Sistema global de atalhos com overlay de ajuda. Pressiona <kbd>?</kbd> para ver todos.</p>

        <div class="demo-block">
          <div class="shortcuts-list">
            <div class="shortcut-row"><kbd>?</kbd> <span>Mostrar ajuda</span></div>
            <div class="shortcut-row"><kbd>G</kbd> + <kbd>D</kbd> <span>Ir para Dashboard</span></div>
            <div class="shortcut-row"><kbd>G</kbd> + <kbd>C</kbd> <span>Ir para Components</span></div>
            <div class="shortcut-row"><kbd>G</kbd> + <kbd>S</kbd> <span>Ir para Settings</span></div>
            <div class="shortcut-row"><kbd>Ctrl</kbd> + <kbd>K</kbd> <span>Abrir pesquisa</span></div>
          </div>
          <iu-button variant="outlined" label="Abrir overlay de atalhos" icon="keyboard" (clicked)="openShortcuts()"></iu-button>
        </div>
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ THEME SWITCHER ═══ -->
      <section id="feat-theme">
        <h2>Theme Switcher</h2>
        <p class="desc">Troca dinâmica entre light/dark/custom com ThemeService e persistência via localStorage.</p>

        <div class="demo-block">
          <div class="row">
            <iu-button variant="outlined" label="Light" icon="light_mode" (clicked)="setTheme('light')"></iu-button>
            <iu-button variant="outlined" label="Dark" icon="dark_mode" (clicked)="setTheme('dark')"></iu-button>
            <iu-button variant="outlined" label="Purple" icon="palette" (clicked)="setTheme('purple')"></iu-button>
            <iu-button variant="outlined" label="Ocean" icon="water" (clicked)="setTheme('ocean')"></iu-button>
          </div>
          <p style="margin-top: 12px; color: var(--md-sys-color-on-surface-variant)">
            Tema activo: <strong>{{ currentTheme() }}</strong>
          </p>
        </div>
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ EXPORT SYSTEM ═══ -->
      <section id="feat-export">
        <h2>Export System</h2>
        <p class="desc">Exporta o dashboard em PDF, PNG, JSON ou CSV — sem dependências externas, apenas APIs nativas do browser.</p>
        <div class="demo-block">
          <iu-export-toolbar filename="israel-ui-dashboard"></iu-export-toolbar>
        </div>
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ VOICE COMMANDS ═══ -->
      <section id="feat-voice">
        <h2>Voice Commands</h2>
        <p class="desc">Controlo por voz via Web Speech API. Funciona em Chrome e Edge. Clica no microfone e fala.</p>
        <div class="demo-block">
          <iu-voice-widget></iu-voice-widget>
        </div>
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ FORM BUILDER ═══ -->
      <section id="feat-form-builder">
        <h2>Form Builder</h2>
        <p class="desc">Schema-driven form builder com validação reactiva, Signals, e M3 design tokens. Suporta text, email, password, textarea, select, radio, checkbox e toggle.</p>
        <div class="demo-block" style="max-width: 560px">
          @if (formResult()) {
            <div class="form-result">
              <span class="material-symbols-outlined" style="color: var(--md-sys-color-primary)">check_circle</span>
              <div>
                <strong>Formulário submetido!</strong>
                <p style="font-size:0.85rem; margin:4px 0 0; color: var(--md-sys-color-on-surface-variant)">
                  Dados: {{ formResult() | json }}
                </p>
              </div>
            </div>
          }
          <iu-form-builder
            [fields]="demoFormFields"
            submitLabel="Criar Conta"
            [showReset]="true"
            (submitted)="onFormSubmit($event)"
          ></iu-form-builder>
        </div>
      </section>

      <!-- Shortcut overlay (global, visível em toda a app) -->
      <iu-shortcut-help-overlay></iu-shortcut-help-overlay>

      <iu-divider></iu-divider>

      <!-- ═══ SPRINT 007 ═══ -->
      @if (flags.AVATAR) {
        <section id="feat-avatar">
          <h2>Avatar</h2>
          <p class="desc">Iniciais, fallback de ícone, estados online/offline e group stack.</p>
          <div class="demo-block">
            <div class="row" style="margin-bottom:24px;">
              <iu-avatar name="Israel Lucena" size="xs"></iu-avatar>
              <iu-avatar name="Luana Silva" size="sm"></iu-avatar>
              <iu-avatar name="Samuel Lucena" size="md"></iu-avatar>
              <iu-avatar name="Davi Costa" size="lg" [online]="true"></iu-avatar>
              <iu-avatar name="Eduardo Lucena" size="xl" [online]="false"></iu-avatar>
            </div>
            <iu-avatar-group [avatars]="avatarGroupItems" [max]="4" size="md"></iu-avatar-group>
          </div>
        </section>
        <iu-divider></iu-divider>
      }

      @if (flags.TAG_INPUT) {
        <section id="feat-tag-input">
          <h2>Tag Input</h2>
          <p class="desc">Chip-style input com autocomplete, backspace para remover, separadores configuráveis.</p>
          <div class="demo-block" style="max-width:480px;">
            <iu-tag-input
              placeholder="Adicionar skill..."
              [suggestions]="techSuggestions"
              helperText="Pressiona Enter ou vírgula para adicionar."
            ></iu-tag-input>
          </div>
        </section>
        <iu-divider></iu-divider>
      }

      @if (flags.STEPPER) {
        <section id="feat-stepper">
          <h2>Stepper</h2>
          <p class="desc">Linear e não-linear, horizontal e vertical, com ícones e passos opcionais.</p>
          <div class="demo-block">
            <iu-stepper
              [steps]="stepperSteps"
              [activeStep]="currentStep()"
              orientation="horizontal"
              mode="linear"
              [showControls]="true"
              (stepChange)="onStepChange($event)"
              (finished)="onStepFinish()"
            ></iu-stepper>
          </div>
        </section>
        <iu-divider></iu-divider>
      }

      @if (flags.TIMELINE) {
        <section id="feat-timeline">
          <h2>Timeline</h2>
          <p class="desc">Vertical e horizontal com ícones, cores, conectores e cards ativos.</p>
          <div class="demo-block">
            <iu-timeline [items]="timelineItems" orientation="vertical" align="start"></iu-timeline>
          </div>
        </section>
        <iu-divider></iu-divider>
      }

      @if (flags.DATE_PICKER) {
        <section id="feat-date-picker">
          <h2>Date Picker</h2>
          <p class="desc">Calendário M3 com seleção simples e range. Navegação por teclado, min/max.</p>
          <div class="demo-block" style="display:flex; gap:32px; flex-wrap:wrap;">
            <div style="min-width:260px;">
              <p style="font-size:12px;font-weight:600;margin-bottom:8px;color:var(--md-sys-color-on-surface-variant)">SINGLE DATE</p>
              <iu-date-picker label="Check-in" mode="single"></iu-date-picker>
            </div>
            <div style="min-width:260px;">
              <p style="font-size:12px;font-weight:600;margin-bottom:8px;color:var(--md-sys-color-on-surface-variant)">DATE RANGE</p>
              <iu-date-picker label="Travel dates" mode="range"></iu-date-picker>
            </div>
          </div>
        </section>
        <iu-divider></iu-divider>
      }

      @if (flags.COLOR_PICKER) {
        <section id="feat-color-picker">
          <h2>Color Picker</h2>
          <p class="desc">Paleta M3, inputs hex/rgb, slider de opacidade e confirmação.</p>
          <div class="demo-block" style="display:flex; gap:32px; flex-wrap:wrap;">
            <iu-color-picker label="Brand color" value="#6750a4" [showOpacity]="true"></iu-color-picker>
            <iu-color-picker label="Accent color" value="#7d5260" [showOpacity]="false"></iu-color-picker>
          </div>
        </section>
      }

      <!-- ═══ DATA TABLE V2 ═══ -->
      @if (flags.DATA_TABLE_V2) {
        <iu-divider></iu-divider>
        <section id="feat-data-table-v2">
          <h2>Data Table v2</h2>
          <p class="desc">Multi-select com checkboxes, bulk actions toolbar, linhas expansíveis, tri-state sort e paginação completa.</p>
          <div class="demo-block">
            <iu-data-table-v2
              [columns]="dtv2Columns"
              [data]="users"
              selectionMode="multi"
              [bulkActions]="dtv2BulkActions"
              [expandable]="true"
              [filterable]="true"
              [pageSize]="5"
            ></iu-data-table-v2>
          </div>
        </section>
      }

      <!-- ═══ WIDGET SYSTEM ═══ -->
      @if (flags.WIDGET_SYSTEM) {
        <iu-divider></iu-divider>
        <section id="feat-widget-system">
          <h2>Widget System</h2>
          <p class="desc">Containers configuráveis com resize, collapse, refresh e close. Compose com iu-widget-grid para layouts responsivos.</p>
          <div class="demo-block">
            <iu-widget-grid [minColWidth]="280" [gap]="16">
              <iu-widget-container widgetId="w-revenue" title="Revenue" subtitle="Last 30 days" icon="payments" [resizable]="true" [collapsible]="true" [refreshable]="true" [elevated]="true">
                <div style="padding:8px 0">
                  <div style="font-size:32px;font-weight:700;color:var(--md-sys-color-primary)">€ 24,980</div>
                  <div style="font-size:13px;color:var(--md-sys-color-on-surface-variant);margin-top:6px">↑ 12.4% vs previous period</div>
                </div>
              </iu-widget-container>
              <iu-widget-container widgetId="w-users" title="Active Users" icon="people" [resizable]="false" [collapsible]="true" [closable]="true" [elevated]="true">
                <div style="padding:8px 0">
                  <div style="font-size:32px;font-weight:700;color:var(--md-sys-color-tertiary)">1,204</div>
                  <div style="font-size:13px;color:var(--md-sys-color-on-surface-variant);margin-top:6px">↑ 3.1% this week</div>
                </div>
              </iu-widget-container>
              <iu-widget-container widgetId="w-listings" title="Listings" icon="home" [resizable]="false" [refreshable]="true" [elevated]="true">
                <div style="padding:8px 0">
                  <div style="font-size:32px;font-weight:700;color:var(--md-sys-color-secondary)">384</div>
                  <div style="font-size:13px;color:var(--md-sys-color-on-surface-variant);margin-top:6px">42 new this month</div>
                </div>
              </iu-widget-container>
            </iu-widget-grid>
          </div>
        </section>
      }

      <!-- ═══ SPRINT 010+011 — PROPERTY LISTING + DETAIL ═══ -->
      @if (flags.PROPERTY_LISTING) {
        <section id="feat-property-listing">
          <h2>🏠 LisboaRent — Property System</h2>
          <p class="desc">
            PropertyCard + PropertyDetail + PropertyResourceService + PropertyFilter + FavouritesService.
            Clica num cartão para abrir a vista de detalhe completa. Usa os filtros para afinar a pesquisa.
            @if (flags.PROPERTY_RESOURCE) {
              <span style="color: var(--md-sys-color-primary); font-weight: 500;">
                &nbsp;— Dados carregados via <code>resource()</code> (Signal-based, httpResource-ready).
              </span>
            }
            @if (flags.FAVOURITES_SERVICE && favourites.hasAny()) {
              <span style="color: var(--md-sys-color-error); font-weight: 500; display:block; margin-top:6px;">
                ❤️ {{ favourites.count() }} favorito{{ favourites.count() === 1 ? '' : 's' }} guardado{{ favourites.count() === 1 ? '' : 's' }} em localStorage
              </span>
            }
          </p>

          @if (selectedProperty()) {
            <!-- ── Detail View ── -->
            <div class="demo-block" style="padding: 0; border-radius: 24px; overflow: hidden;">
              <iu-property-detail
                [property]="selectedProperty()!"
                (closed)="clearSelectedProperty()"
                (contactClick)="onPropertyDetailContact($event)"
                (scheduleClick)="onPropertyDetailSchedule($event)"
                (favouriteToggle)="onPropertyFav($event)"
              />
            </div>
          } @else {
            <!-- ── Filter + Grid Layout ── -->
            <div class="property-layout">

              <!-- Filter Sidebar (Sprint 012) -->
              @if (flags.PROPERTY_FILTER_SIDEBAR) {
                <iu-property-filter
                  [resultCount]="filteredProperties().length"
                  (filterChange)="onFilterChange($event)"
                  (filterReset)="onFilterReset()"
                />
              }

              <!-- Listing Grid -->
              <div class="property-grid-wrap">
                @if (flags.PROPERTY_RESOURCE && propertyResource.properties.isLoading()) {
                  <div class="demo-block" style="text-align: center; padding: 40px; color: var(--md-sys-color-on-surface-variant)">
                    <span class="material-symbols-outlined" style="font-size: 36px; display: block; margin-bottom: 8px; animation: spin 1s linear infinite">autorenew</span>
                    A carregar propriedades...
                  </div>
                } @else if (flags.PROPERTY_RESOURCE && propertyResource.properties.error()) {
                  <div class="demo-block" style="text-align: center; color: var(--md-sys-color-error)">
                    Erro ao carregar propriedades.
                  </div>
                } @else {
                  @if (filteredProperties().length === 0) {
                    <div class="demo-block" style="text-align: center; padding: 48px; color: var(--md-sys-color-on-surface-variant)">
                      <span class="material-symbols-outlined" style="font-size: 48px; display: block; margin-bottom: 12px; opacity: 0.4">search_off</span>
                      <p style="margin: 0; font-size: 15px; font-weight: 500;">Nenhum imóvel corresponde aos filtros</p>
                      <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.7;">Tenta ajustar os critérios de pesquisa</p>
                    </div>
                  } @else {
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px">
                      @for (prop of filteredProperties(); track prop.id) {
                        <iu-property-card
                          [property]="prop"
                          (cardClick)="onPropertyClick($event)"
                          (favouriteToggle)="onPropertyFav($event)"
                        />
                      }
                    </div>
                  }
                }
              </div>
            </div>
          }
        </section>
      }

      <!-- ═══ SPRINT 013 — PROPERTY MAP ═══ -->
      @if (flags.PROPERTY_MAP) {
        <section id="feat-property-map">
          <h2>🗺️ Property Map</h2>
          <p class="desc">
            Interactive Leaflet map showing LisboaRent properties across Lisboa.
            Click a pin to see a preview popup. Uses OpenStreetMap — no API key needed.
            <span style="color: var(--md-sys-color-primary); font-weight: 500;">
              Feature flag: PROPERTY_MAP
            </span>
          </p>
          <div class="demo-block" style="padding: 0; overflow: hidden; border-radius: 16px;">
            <iu-property-map
              [markers]="mapMarkers()"
              [center]="{ lat: 38.72, lng: -9.18, zoom: 11 }"
              [fitBounds]="true"
              (markerClick)="onMapMarkerClick($event)"
            />
          </div>
          @if (lastMapClick()) {
            <p style="margin-top: 10px; font-size: 13px; color: var(--md-sys-color-primary); padding: 8px 16px; background: var(--md-sys-color-primary-container); border-radius: 8px;">
              🏠 Seleccionado: <strong>{{ lastMapClick()!.title }}</strong> — €{{ lastMapClick()!.priceMonthly }}/mês
            </p>
          }
        </section>
      }

      <!-- ═══ SPRINT 013 — PROPERTY COMPARISON ═══ -->
      @if (flags.PROPERTY_COMPARISON) {
        <section id="feat-property-comparison">
          <h2>🔍 Property Comparison</h2>
          <p class="desc">
            Side-by-side comparison of favourited properties. Best value in each row is highlighted.
            @if (flags.FAVOURITES_SERVICE) {
              <span style="color: var(--md-sys-color-primary); font-weight: 500;">
                — Ligado ao FavouritesService ({{ favourites.count() }} guardado{{ favourites.count() === 1 ? '' : 's' }}).
              </span>
            }
            <span style="color: var(--md-sys-color-primary); font-weight: 500;">
              Feature flag: PROPERTY_COMPARISON
            </span>
          </p>
          @if (comparisonProperties().length < 2) {
            <p style="font-size: 13px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 12px;">
              ℹ️ Nenhum favorito suficiente — a mostrar demo com dados de exemplo (primeiros 3 imóveis).
            </p>
          }
          <iu-property-comparison
            [properties]="comparisonProperties()"
            [showRemove]="true"
            (removeProperty)="onRemoveFromComparison($event)"
          />
        </section>
      }

      <!-- ═══ SPRINT 013 — PAGINATOR ═══ -->
      @if (flags.PAGINATOR) {
        <section id="feat-paginator">
          <h2>📄 Paginator</h2>
          <p class="desc">
            M3 page navigation bar with ellipsis and page-size selector.
            Below is a live demo paginating the 6 mock properties (3 per page).
            <span style="color: var(--md-sys-color-primary); font-weight: 500;">
              Feature flag: PAGINATOR
            </span>
          </p>
          <div class="demo-block">
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-bottom: 16px;">
              @for (prop of pagedProperties(); track prop.id) {
                <iu-property-card
                  [property]="prop"
                  (cardClick)="onPropertyClick($event)"
                  (favouriteToggle)="onPropertyFav($event)"
                />
              }
            </div>
            <iu-paginator
              [length]="allProperties().length"
              [pageSize]="paginatorPageSize()"
              [(pageIndex)]="paginatorPage"
              [pageSizeOptions]="[3, 6]"
              (page)="onPaginatorChange($event)"
            />
          </div>
        </section>
      }

      <!-- ── Sprint 014 — Property Booking ──────────────────────── -->
      @if (flags.PROPERTY_BOOKING) {
        <section id="feat-property-booking">
          <h2>📅 Property Booking</h2>
          <p class="desc">
            Modal panel for scheduling visits or sending inquiries. Tabs between
            "Agendar Visita" and "Enviar Mensagem". Shows success confirmation after submit.
            <span style="color: var(--md-sys-color-primary); font-weight: 500;">
              Feature flag: PROPERTY_BOOKING
            </span>
          </p>
          <div class="demo-block" style="display: flex; gap: 12px; flex-wrap: wrap;">
            @for (prop of allProperties().slice(0, 3); track prop.id) {
              <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px;">
                <iu-property-card
                  [property]="prop"
                  (cardClick)="openBooking($event)"
                  (favouriteToggle)="onPropertyFav($event)"
                />
                <button
                  style="width: 100%; padding: 8px 16px; border-radius: 100px; border: 1px solid var(--md-sys-color-primary, #6750a4); background: transparent; color: var(--md-sys-color-primary, #6750a4); font-weight: 600; cursor: pointer; font-size: 0.875rem;"
                  (click)="openBooking(prop)"
                >
                  📅 Abrir Formulário de Reserva
                </button>
              </div>
            }
          </div>
          <p style="margin-top: 8px; font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant);">
            Clica em qualquer card ou botão para abrir o painel de reserva.
          </p>
        </section>
      }

      <!-- Booking modal overlay -->
      @if (flags.PROPERTY_BOOKING && bookingProperty()) {
        <iu-property-booking
          [property]="bookingProperty()!"
          (bookingSubmitted)="onBookingSubmit($event)"
          (closed)="closeBooking()"
        />
      }

      <!-- ── Sprint 015 — Auth Module ─────────────────────────────── -->
      @if (flags.AUTH_MODULE) {
        <section id="feat-auth">
          <h2>🔐 Auth Module</h2>
          <p class="desc">
            Signal-based authentication — Login form with validation &amp; loading state,
            Registration form with role selector (Inquilino / Proprietário) and password strength indicator.
            <span style="color: var(--md-sys-color-primary); font-weight: 500;">
              Feature flags: AUTH_MODULE, AUTH_GUARDS
            </span>
          </p>
          <div class="demo-block" style="display: flex; gap: 16px; flex-wrap: wrap;">
            <button
              style="padding: 12px 24px; border-radius: 100px; border: none; background: var(--md-sys-color-primary, #6750a4); color: #fff; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.9rem;"
              (click)="openAuthLogin()"
            >
              <span class="material-symbols-outlined" style="font-size: 20px;">login</span>
              Abrir Login
            </button>
            <button
              style="padding: 12px 24px; border-radius: 100px; border: 1px solid var(--md-sys-color-primary, #6750a4); background: transparent; color: var(--md-sys-color-primary, #6750a4); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.9rem;"
              (click)="openAuthRegister()"
            >
              <span class="material-symbols-outlined" style="font-size: 20px;">person_add</span>
              Abrir Registo
            </button>
          </div>
        </section>
      }

      <!-- ── Sprint 016 — User Profile ──────────────────────────── -->
      @if (flags.USER_PROFILE) {
        <iu-divider></iu-divider>
        <section id="feat-user-profile">
          <h2>👤 User Profile</h2>
          <p class="desc">
            M3 profile card with avatar initials, role badge, stats row, and edit/logout actions.
            Integrates with AuthService — mock user pre-loaded.
            <span style="color: var(--md-sys-color-primary); font-weight: 500;">
              Feature flags: USER_PROFILE
            </span>
          </p>
          <div class="demo-block" style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 320px;">
              <p style="font-size: 12px; font-weight: 600; margin-bottom: 8px; color: var(--md-sys-color-on-surface-variant)">INQUILINO</p>
              <iu-user-profile
                [user]="mockTenant()"
                [stats]="tenantStats()"
                [editable]="true"
                (editProfile)="onEditProfile()"
                (logout)="onProfileLogout()"
              />
            </div>
            <div style="flex: 1; min-width: 320px;">
              <p style="font-size: 12px; font-weight: 600; margin-bottom: 8px; color: var(--md-sys-color-on-surface-variant)">PROPRIETÁRIO</p>
              <iu-user-profile
                [user]="mockLandlord()"
                [stats]="landlordStats()"
                [editable]="false"
              />
            </div>
          </div>
        </section>
      }

      <!-- ── Sprint 016 — My Bookings ────────────────────────────── -->
      @if (flags.MY_BOOKINGS) {
        <iu-divider></iu-divider>
        <section id="feat-my-bookings">
          <h2>📅 As Minhas Reservas</h2>
          <p class="desc">
            Booking history for a logged-in user. Filterable by type (Visitas / Mensagens / Concluídos).
            Status chips with cancel and view actions.
            <span style="color: var(--md-sys-color-primary); font-weight: 500;">
              Feature flag: MY_BOOKINGS
            </span>
          </p>
          <div class="demo-block">
            <iu-my-bookings
              [bookings]="mockBookings"
              (cancel)="onCancelBooking($event)"
              (view)="onViewBooking($event)"
            />
          </div>
        </section>
      }

      <!-- ── Sprint 016 — My Favourites ──────────────────────────── -->
      @if (flags.MY_FAVOURITES) {
        <iu-divider></iu-divider>
        <section id="feat-my-favourites">
          <h2>❤️ Os Meus Favoritos</h2>
          <p class="desc">
            Saved properties gallery with sort control, remove action, and empty state.
            Displays the current FavouritesService selection.
            <span style="color: var(--md-sys-color-primary); font-weight: 500;">
              Feature flag: MY_FAVOURITES
            </span>
          </p>
          <div class="demo-block">
            <iu-my-favourites
              [properties]="sampleProperties"
              (remove)="onRemoveFav($event)"
              (viewDetail)="onPropertyClick($event)"
            />
          </div>
        </section>
      }

      <!-- ── Sprint 017 — Manage Listings ────────────────────────── -->
      @if (flags.MANAGE_LISTINGS) {
        <iu-divider></iu-divider>
        <section id="feat-manage-listings">
          <h2>🏠 Gerir Imóveis (Proprietário)</h2>
          <p class="desc">
            Landlord dashboard — filterable table with status chips, inquiry/visit counters,
            revenue summary, and inline edit/pause/delete actions.
            <span style="color: var(--md-sys-color-primary); font-weight: 500;">
              Feature flags: LANDLORD_MODULE, MANAGE_LISTINGS
            </span>
          </p>
          <div class="demo-block">
            <iu-manage-listings
              [listings]="mockListings"
              (edit)="onEditListing($event)"
              (pause)="onPauseListing($event)"
              (activate)="onActivateListing($event)"
              (delete)="onDeleteListing($event)"
              (addNew)="showAddProperty.set(true)"
            />
          </div>
        </section>
      }

      <!-- ── Sprint 017 — Add Property ───────────────────────────── -->
      @if (flags.ADD_PROPERTY) {
        <iu-divider></iu-divider>
        <section id="feat-add-property">
          <h2>➕ Adicionar Imóvel</h2>
          <p class="desc">
            4-step multi-step form for landlords: Basic Info → Details → Description & Media → Review & Publish.
            Angular Signals throughout, M3 tokens, no external form library.
            <span style="color: var(--md-sys-color-primary); font-weight: 500;">
              Feature flags: ADD_PROPERTY, LANDLORD_MODULE
            </span>
          </p>
          @if (!showAddProperty()) {
            <div class="demo-block" style="text-align: center; padding: 32px;">
              <button
                style="padding: 12px 28px; border-radius: 100px; border: none; background: var(--md-sys-color-primary, #6750a4); color: #fff; font-weight: 700; font-size: 1rem; cursor: pointer; display: inline-flex; align-items: center; gap: 10px;"
                (click)="showAddProperty.set(true)"
              >
                <span class="material-symbols-outlined">add_home</span>
                Abrir Formulário
              </button>
            </div>
          } @else {
            <iu-add-property
              (submitted)="onPropertyFormSubmit($event)"
              (cancelled)="showAddProperty.set(false)"
            />
          }
        </section>
      }

      <!-- Auth modal overlay -->
      @if (flags.AUTH_MODULE && authView() === 'login') {
        <div class="iu-auth-overlay" (click)="closeAuth()">
          <div class="iu-auth-panel" (click)="$event.stopPropagation()">
            <iu-auth-login
              (loginSuccess)="onLoginSuccess()"
              (registerRequested)="authView.set('register')"
            />
          </div>
        </div>
      }

      @if (flags.AUTH_MODULE && authView() === 'register') {
        <div class="iu-auth-overlay" (click)="closeAuth()">
          <div class="iu-auth-panel" (click)="$event.stopPropagation()">
            <iu-auth-register
              (registerSuccess)="onRegisterSuccess()"
              (loginRequested)="authView.set('login')"
            />
          </div>
        </div>
      }

      <!-- ── Sprint 018 — Messaging Module ────────────────────────── -->
      @if (flags.MESSAGING_MODULE) {
        <iu-divider></iu-divider>
        <section id="feat-messaging">
          <h2>💬 Mensagens</h2>
          <p class="desc">
            In-app messaging between tenants and landlords. Thread list with unread badges,
            M3 chat bubbles, send/reply with Angular Signals. No RxJS.
            <span style="color: var(--md-sys-color-primary); font-weight: 500;">
              Feature flag: MESSAGING_MODULE
            </span>
          </p>
          <div class="demo-block" style="display: grid; grid-template-columns: 340px 1fr; gap: 16px; align-items: start;">
            <iu-message-list
              [threads]="messagingService.threads()"
              (threadSelected)="onThreadSelect($event)"
            />
            @if (activeThread()) {
              <iu-message-thread
                [thread]="activeThread()"
                [showClose]="true"
                (messageSent)="onMessageSend($event)"
                (closed)="messagingService.closeThread()"
              />
            } @else {
              <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;color:var(--md-sys-color-on-surface-variant);gap:12px;">
                <span class="material-symbols-outlined" style="font-size:48px;">forum</span>
                <p style="margin:0;font-size:14px;">Selecione uma conversa para começar</p>
              </div>
            }
          </div>
        </section>
      }

      <!-- ── Sprint 018 — Notification Bell ───────────────────────── -->
      @if (flags.NOTIFICATION_BELL) {
        <iu-divider></iu-divider>
        <section id="feat-notification-bell">
          <h2>🔔 Notification Bell</h2>
          <p class="desc">
            Header notification bell with animated badge, categorised dropdown panel,
            mark-as-read, dismiss, and mark-all-read. Fully Signals-based.
            <span style="color: var(--md-sys-color-primary); font-weight: 500;">
              Feature flag: NOTIFICATION_BELL
            </span>
          </p>
          <div class="demo-block" style="display:flex;align-items:center;gap:32px;padding:24px;background:var(--md-sys-color-surface-container);border-radius:12px;">
            <span style="font-size:14px;color:var(--md-sys-color-on-surface-variant);">Clique no sino →</span>
            <iu-notification-bell (notificationClicked)="onNotificationClicked($event)" />
            <span style="font-size:13px;color:var(--md-sys-color-on-surface-variant);">
              Não lidas: {{ notificationService.unreadCount() }}
            </span>
          </div>
        </section>
      }

      <!-- ── Sprint 019 — Global Search ────────────────────────────── -->
      @if (flags.GLOBAL_SEARCH) {
        <iu-divider></iu-divider>
        <section id="feat-global-search">
          <h2>🔍 Global Search</h2>
          <p class="desc">
            AppBar-integrated property search powered by <code>PropertySearchService</code>
            (Angular Signals, no RxJS). Live suggestions dropdown, keyboard navigation
            (↑↓ Enter Escape), property type icons, price and location in each result.
            <span style="color: var(--md-sys-color-primary); font-weight: 500;">
              Feature flag: GLOBAL_SEARCH
            </span>
          </p>
          <!-- Simulated AppBar context -->
          <div style="
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 8px 20px;
            background: var(--md-sys-color-surface);
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,.12);
            margin-bottom: 16px;
          ">
            <span class="material-symbols-outlined" style="font-size:28px;color:var(--md-sys-color-primary);">location_city</span>
            <span style="font-weight:600;font-size:18px;color:var(--md-sys-color-on-surface);flex:1;">LisboaRent</span>
            <iu-global-search
              placeholder="Pesquisar propriedades…"
              (select)="onGlobalSearchSelect($event)"
              (search)="onGlobalSearchSubmit($event)"
            />
            <span class="material-symbols-outlined" style="font-size:24px;color:var(--md-sys-color-on-surface-variant);">account_circle</span>
          </div>
          <div style="
            padding:12px 16px;
            background:var(--md-sys-color-surface-container);
            border-radius:8px;
            font-size:13px;
            color:var(--md-sys-color-on-surface-variant);
          ">
            <strong>Últimos resultados:</strong> {{ globalSearchLog() }}
            <br>Resultados actuais: {{ searchService.totalCount() }} propriedades
          </div>
        </section>
      }

      <!-- ── Sprint 019 — Reviews Module ───────────────────────────── -->
      @if (flags.REVIEWS_MODULE) {
        <iu-divider></iu-divider>
        <section id="feat-reviews">
          <h2>⭐ Reviews Module</h2>
          <p class="desc">
            Full property reviews section: rating summary with animated breakdown bars,
            sort controls, ReviewCards with expand/collapse, landlord reply, verified badge.
            RatingDisplay widget available standalone (sm/md/lg sizes).
            <span style="color: var(--md-sys-color-primary); font-weight: 500;">
              Feature flag: REVIEWS_MODULE
            </span>
          </p>

          <!-- RatingDisplay standalone demo -->
          <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap;margin-bottom:24px;padding:16px;background:var(--md-sys-color-surface-container-low);border-radius:12px;">
            <iu-rating-display [rating]="4.5" [count]="128" size="lg" />
            <iu-rating-display [rating]="3.7" [count]="42" size="md" />
            <iu-rating-display [rating]="2" [count]="7" size="sm" />
            <iu-rating-display [rating]="5" [showLabel]="false" size="md" />
          </div>

          <!-- Full property reviews -->
          <iu-property-reviews
            [reviews]="sampleReviews"
            propertyTitle="Apartamento T2 no Chiado"
            [pageSize]="4"
          />
        </section>
      }

    </div>
  `,
  styles: [`
    :host { display: block; }
    .features-catalog {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .subtitle {
      color: var(--md-sys-color-on-surface-variant);
      margin-bottom: 24px;
    }
    .desc {
      color: var(--md-sys-color-on-surface-variant);
      margin-bottom: 16px;
      font-size: 0.95rem;
    }
    section { margin: 32px 0; }
    h2 {
      font-size: 1.5rem;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--md-sys-color-on-surface);
    }
    h3 {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .demo-block {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 16px;
      padding: 24px;
    }
    /* Sprint 015 — Auth overlay */
    .iu-auth-overlay {
      position: fixed;
      inset: 0;
      z-index: 1100;
      background: rgba(0,0,0,.48);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .iu-auth-panel {
      background: var(--md-sys-color-surface, #fffbfe);
      border-radius: 28px;
      max-width: 520px;
      width: 100%;
      max-height: 92vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0,0,0,.24);
    }
    .form-result {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      margin-bottom: 20px;
      background: var(--md-sys-color-primary-container);
      border-radius: 12px;
      .material-symbols-outlined { font-size: 22px; flex-shrink: 0; margin-top: 1px; }
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }
    .chart-card {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 16px;
      padding: 20px;
    }
    .empty-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .shortcuts-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    .shortcut-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
    }
    kbd {
      background: var(--md-sys-color-surface-container, #ece6f0);
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 6px;
      padding: 2px 8px;
      font-family: monospace;
      font-size: 0.85rem;
      color: var(--md-sys-color-on-surface);
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    code {
      font-family: monospace;
      background: var(--md-sys-color-surface-container, #ece6f0);
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.85em;
    }

    /* Sprint 012 — Filter + Grid layout */
    .property-layout {
      display: flex;
      gap: 24px;
      align-items: flex-start;
    }
    .property-grid-wrap { flex: 1; min-width: 0; }
    @media (max-width: 768px) {
      .property-layout { flex-direction: column; }
      .property-layout iu-property-filter { max-width: 100%; }
    }
  `],
})
export class FeaturesPageComponent implements OnInit, OnDestroy {
  private notif = inject(NotificationService);
  private themeService = inject(ThemeService);
  private shortcuts = inject(KeyboardShortcutService);

  // ── Sprint 011 — PropertyResource ─────────────────────────────
  readonly propertyResource = inject(PropertyResourceService);
  /** Currently selected property for detail view (null = list view) */
  readonly selectedProperty = signal<PropertyData | null>(null);

  // ── Sprint 012 — Favourites + Filter ──────────────────────────
  readonly favourites = inject(FavouritesService);
  readonly activeFilter = signal<PropertyFilterState | null>(null);

  // ── Sprint 013 — Map ───────────────────────────────────────────
  readonly mapMarkers = signal<PropertyMapMarker[]>(MOCK_MAP_MARKERS);
  readonly lastMapClick = signal<PropertyData | null>(null);

  // ── Sprint 013 — Comparison ────────────────────────────────────
  readonly removedFromComparison = signal<Set<string | number>>(new Set());

  readonly comparisonProperties = computed(() => {
    // Prefer favourited properties; fall back to first 3 mock items
    const favIds = new Set(this.favourites.ids());
    const all = MOCK_MAP_MARKERS.map(m => m.property);
    const removed = this.removedFromComparison();
    const favoured = all.filter(p => favIds.has(String(p.id)) && !removed.has(p.id));
    if (favoured.length >= 2) return favoured.slice(0, 3);
    return all.filter(p => !removed.has(p.id)).slice(0, 3);
  });

  // ── Sprint 013 — Paginator ─────────────────────────────────────
  readonly allProperties = signal<PropertyData[]>(MOCK_MAP_MARKERS.map(m => m.property));
  readonly paginatorPage = signal<number>(0);
  readonly paginatorPageSize = signal<number>(3);

  readonly pagedProperties = computed(() => {
    const start = this.paginatorPage() * this.paginatorPageSize();
    return this.allProperties().slice(start, start + this.paginatorPageSize());
  });

  readonly filteredProperties = computed(() => {
    const f = this.activeFilter();
    const all = this.sampleProperties;
    if (!f) return all;
    return all.filter(p => {
      if (f.types.length > 0 && !f.types.includes(p.type)) return false;
      if (f.priceMin !== null && p.priceMonthly < f.priceMin) return false;
      if (f.priceMax !== null && p.priceMonthly > f.priceMax) return false;
      if (f.bedroomsMin !== null && p.bedrooms < f.bedroomsMin) return false;
      if (f.areaMin !== null && p.areaSqm < f.areaMin) return false;
      if (f.areaMax !== null && p.areaSqm > f.areaMax) return false;
      if (f.availableOnly && !p.badges?.includes('available')) return false;
      if (f.verifiedOnly && !p.badges?.includes('verified')) return false;
      return true;
    });
  });

  // Data Table
  userColumns = USER_COLUMNS;
  users = SAMPLE_USERS;

  // Search
  searchResults = signal<SearchResult[]>([]);
  searchLoading = signal(false);
  lastSelected = signal('');
  private allResults = SEARCH_DATA;

  // Theme
  currentTheme = signal('dark');

  // Charts
  lineSeries: LineChartSeries[] = [
    {
      name: 'Sprint A', color: '#6750A4',
      data: [
        { label: 'Seg', value: 3 }, { label: 'Ter', value: 7 },
        { label: 'Qua', value: 5 }, { label: 'Qui', value: 9 },
        { label: 'Sex', value: 6 }, { label: 'Sáb', value: 8 },
        { label: 'Dom', value: 10 },
      ],
    },
    {
      name: 'Sprint B', color: '#7D5260',
      data: [
        { label: 'Seg', value: 1 }, { label: 'Ter', value: 4 },
        { label: 'Qua', value: 6 }, { label: 'Qui', value: 3 },
        { label: 'Sex', value: 8 }, { label: 'Sáb', value: 5 },
        { label: 'Dom', value: 7 },
      ],
    },
  ];

  barData: BarChartDataPoint[] = [
    { label: 'Jan', value: 65 }, { label: 'Fev', value: 40 },
    { label: 'Mar', value: 85 }, { label: 'Abr', value: 50 },
    { label: 'Mai', value: 70 }, { label: 'Jun', value: 90 },
    { label: 'Jul', value: 45 },
  ];

  donutData: DonutChartSegment[] = [
    { label: 'Ready', value: 28, color: '#6750A4' },
    { label: 'WIP', value: 6, color: '#7D5260' },
    { label: 'Missing', value: 4, color: '#B3261E' },
  ];

  // Form Builder
  formResult = signal<Record<string, unknown> | null>(null);

  demoFormFields: FormField[] = [
    {
      key: 'name',
      type: 'text',
      label: 'Nome completo',
      placeholder: 'Ex: Israel Lucena',
      prefixIcon: 'person',
      validation: { required: true, minLength: 3 },
    },
    {
      key: 'email',
      type: 'email',
      label: 'Email',
      placeholder: 'email@exemplo.com',
      prefixIcon: 'mail',
      validation: { required: true, email: true },
    },
    {
      key: 'password',
      type: 'password',
      label: 'Palavra-passe',
      placeholder: 'Mínimo 8 caracteres',
      prefixIcon: 'lock',
      hint: 'Use letras, números e símbolos.',
      validation: { required: true, minLength: 8 },
    },
    {
      key: 'role',
      type: 'select',
      label: 'Função',
      placeholder: 'Escolhe a tua função',
      options: [
        { label: 'Frontend Developer', value: 'frontend' },
        { label: 'Backend Developer', value: 'backend' },
        { label: 'Designer', value: 'design' },
        { label: 'Product Manager', value: 'pm' },
      ],
      validation: { required: true },
    },
    {
      key: 'notifications',
      type: 'toggle',
      label: 'Receber notificações por email',
      defaultValue: true,
    },
    {
      key: 'terms',
      type: 'checkbox',
      label: 'Aceito os termos e condições',
      validation: { required: true },
    },
  ];

  onFormSubmit(event: FormSubmitEvent): void {
    if (event.isValid) {
      this.formResult.set(event.values);
      this.notif.show({ message: 'Conta criada com sucesso!', type: 'success', duration: 4000 });
    }
  }

  // ── Sprint 007 & 008 ──────────────────────────────────────────────────
  readonly flags = FeatureFlags;

  // ── Sprint 008 — DataTableV2 ──
  readonly dtv2Columns: DataTableV2Column<User>[] = [
    { key: 'id',     label: '#',      width: '60px', align: 'center' },
    { key: 'name',   label: 'Name',   sortable: true },
    { key: 'role',   label: 'Role',   sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'joined', label: 'Joined', sortable: true },
  ];

  readonly dtv2BulkActions: DataTableV2BulkAction[] = [
    { id: 'export',  label: 'Export',  icon: 'download' },
    { id: 'archive', label: 'Archive', icon: 'archive'  },
    { id: 'delete',  label: 'Delete',  icon: 'delete',  variant: 'danger' },
  ];

  avatarGroupItems = [
    { name: 'Israel Lucena', online: true },
    { name: 'Luana Silva', online: true },
    { name: 'Samuel Lucena', online: false },
    { name: 'Davi Costa' },
    { name: 'Eduardo Lucena' },
  ];

  techSuggestions = [
    'Angular', 'TypeScript', 'JavaScript', 'RxJS', 'Node.js',
    'NestJS', 'GraphQL', 'SCSS', 'Firebase', 'PostgreSQL',
  ];

  stepperSteps: StepperStep[] = [
    { label: 'Cart', icon: 'shopping_cart' },
    { label: 'Shipping', icon: 'local_shipping' },
    { label: 'Payment', icon: 'payment' },
    { label: 'Confirm', icon: 'check_circle' },
  ];
  currentStep = signal(0);

  onStepChange(e: StepChangeEvent): void { this.currentStep.set(e.currentIndex); }
  onStepFinish(): void {
    this.notif.show({ message: '🎉 Order placed!', type: 'success', duration: 3000 });
    this.currentStep.set(0);
  }

  timelineItems: TimelineItem[] = [
    { title: 'Sprint 007 launched', description: 'Avatar, Tag Input, Stepper, Timeline, Date Picker, Color Picker.', date: 'Mar 4, 2026', icon: 'rocket_launch', color: 'primary', active: true },
    { title: 'Sprint 006 — Form Builder', description: 'Schema-driven forms with validation.', date: 'Feb 25, 2026', icon: 'dynamic_form', color: 'success' },
    { title: 'Sprint 005 — Charts', description: 'SVG charts, Export toolbar, Voice widget.', date: 'Feb 18, 2026', icon: 'bar_chart' },
    { title: 'Sprint 001 — Foundation', description: 'Button, Input, Card, Dialog, Chip.', date: 'Jan 2026', icon: 'flag' },
  ];

  ngOnInit(): void {
    this.shortcuts.register({ id: 'help', keys: '?', description: 'Mostrar ajuda', category: 'Geral', handler: () => this.shortcuts.toggleHelp() });
    this.shortcuts.register({ id: 'go-dashboard', keys: 'g+d', description: 'Ir para Dashboard', category: 'Navegação', handler: () => {} });
    this.shortcuts.register({ id: 'go-components', keys: 'g+c', description: 'Ir para Components', category: 'Navegação', handler: () => {} });
    this.shortcuts.register({ id: 'go-settings', keys: 'g+s', description: 'Ir para Settings', category: 'Navegação', handler: () => {} });
    this.shortcuts.register({ id: 'open-search', keys: 'ctrl+k', description: 'Abrir pesquisa', category: 'Geral', handler: () => {} });
  }

  ngOnDestroy(): void {
    // shortcuts clean themselves up when component destroys
  }

  onSearch(query: string): void {
    this.searchLoading.set(true);
    setTimeout(() => {
      this.searchResults.set(
        query.length > 0
          ? this.allResults.filter(r =>
              r.label.toLowerCase().includes(query.toLowerCase())
            )
          : []
      );
      this.searchLoading.set(false);
    }, 300);
  }

  onSearchSelect(result: SearchResult): void {
    this.lastSelected.set(result.label);
    this.searchResults.set([]);
  }

  notify(type: 'info' | 'success' | 'warning' | 'error'): void {
    const messages = {
      info: 'Isto é uma notificação informativa!',
      success: 'Operação concluída com sucesso! ✅',
      warning: 'Atenção: verifica os dados antes de continuar.',
      error: 'Ocorreu um erro. Tenta de novo.',
    };
    this.notif.show({ message: messages[type], type, duration: 3000 });
  }

  setTheme(theme: string): void {
    if (theme === 'light') this.themeService.setMode('light');
    else if (theme === 'dark') this.themeService.setMode('dark');
    else this.themeService.setPalette(theme);
    this.currentTheme.set(theme);
  }

  openShortcuts(): void {
    this.shortcuts.toggleHelp();
  }

  // ── Sprint 010 — Property Card ─────────────────────────────────
  readonly sampleProperties: PropertyData[] = [
    {
      id: 's1',
      title: 'Apartamento T2 renovado em Príncipe Real',
      location: 'Príncipe Real, Lisboa',
      priceMonthly: 1450,
      bedrooms: 2,
      bathrooms: 1,
      areaSqm: 78,
      type: 'apartment',
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop',
      badges: ['available', 'verified'],
      availableFrom: '1 Abr 2026',
    },
    {
      id: 's2',
      title: 'Penthouse com Terraço — Vista Tejo',
      location: 'Mouraria, Lisboa',
      priceMonthly: 3200,
      bedrooms: 3,
      bathrooms: 2,
      areaSqm: 142,
      type: 'penthouse',
      imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop',
      badges: ['featured', 'new'],
      availableFrom: '15 Mar 2026',
    },
    {
      id: 's3',
      title: 'Estúdio moderno — Metro Intendente',
      location: 'Intendente, Lisboa',
      priceMonthly: 750,
      bedrooms: 0,
      bathrooms: 1,
      areaSqm: 35,
      type: 'studio',
      badges: ['new'],
      availableFrom: '1 Mar 2026',
    },
  ];

  onPropertyClick(property: PropertyData): void {
    if (FeatureFlags.PROPERTY_DETAIL_VIEW) {
      this.selectedProperty.set(property);
      this.propertyResource.select(property.id);
    } else {
      this.notif.show({
        message: `🏠 ${property.title} — ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.priceMonthly)}/mês`,
        type: 'info',
        duration: 3000,
      });
    }
  }

  clearSelectedProperty(): void {
    this.selectedProperty.set(null);
    this.propertyResource.select(null);
  }

  onPropertyDetailContact(property: PropertyData): void {
    this.notif.show({
      message: `📩 Mensagem enviada para proprietário de "${property.title}"`,
      type: 'success',
      duration: 3000,
    });
  }

  onPropertyDetailSchedule(property: PropertyData): void {
    this.notif.show({
      message: `📅 Pedido de visita enviado para "${property.title}"`,
      type: 'info',
      duration: 3000,
    });
  }

  onPropertyFav(event: { property: PropertyData; isFavourited: boolean }): void {
    // Sync with FavouritesService
    if (event.isFavourited) {
      this.favourites.add(event.property.id);
    } else {
      this.favourites.remove(event.property.id);
    }
    this.notif.show({
      message: event.isFavourited
        ? `❤️ "${event.property.title}" adicionado aos favoritos`
        : `🤍 "${event.property.title}" removido dos favoritos`,
      type: 'success',
      duration: 2500,
    });
  }

  onFilterChange(filter: PropertyFilterState): void {
    this.activeFilter.set(filter);
  }

  onFilterReset(): void {
    this.activeFilter.set(null);
    this.notif.show({ message: 'Filtros limpos', type: 'info', duration: 1500 });
  }

  isFavourited(id: string | number): boolean {
    return this.favourites.isFavourited(id);
  }

  // ── Sprint 013 handlers ─────────────────────────────────────────

  onMapMarkerClick(property: PropertyData): void {
    this.lastMapClick.set(property);
  }

  onRemoveFromComparison(id: string | number): void {
    const set = new Set(this.removedFromComparison());
    set.add(id);
    this.removedFromComparison.set(set);
    this.notif.show({ message: 'Removido da comparação', type: 'info', duration: 1500 });
  }

  onPaginatorChange(event: PaginatorPageEvent): void {
    this.paginatorPageSize.set(event.pageSize);
  }

  // ── Sprint 014 — Property Booking ──────────────────────────────

  readonly bookingProperty = signal<PropertyData | null>(null);

  openBooking(property: PropertyData): void {
    this.bookingProperty.set(property);
  }

  closeBooking(): void {
    this.bookingProperty.set(null);
  }

  onBookingSubmit(event: BookingSubmitEvent): void {
    this.notif.show({
      message: `✅ ${event.form.bookingType === 'visit' ? 'Visita agendada' : 'Mensagem enviada'} para "${event.property.title}"`,
      type: 'success',
      duration: 4000,
    });
  }

  // ── Sprint 016 — User Profile ──────────────────────────────────

  readonly mockTenant = signal<AuthUser>({
    id: 'u1',
    name: 'Israel Lucena',
    email: 'israel@lisboarent.pt',
    role: 'tenant',
  });

  readonly mockLandlord = signal<AuthUser>({
    id: 'u2',
    name: 'Luana Silva',
    email: 'luana@lisboarent.pt',
    role: 'landlord',
  });

  readonly tenantStats = signal<UserProfileStats>({ bookings: 5, favourites: 12 });
  readonly landlordStats = signal<UserProfileStats>({ bookings: 2, favourites: 4, listings: 8 });

  onEditProfile(): void {
    this.notif.show({ message: '✏️ Editar perfil — em breve!', type: 'info', duration: 2000 });
  }

  onProfileLogout(): void {
    this.notif.show({ message: '👋 Sessão terminada.', type: 'success', duration: 2000 });
  }

  // ── Sprint 016 — My Bookings ───────────────────────────────────

  readonly mockBookings: BookingRecord[] = [
    {
      id: 'b1',
      propertyTitle: 'Apartamento T2 renovado em Príncipe Real',
      propertyLocation: 'Príncipe Real, Lisboa',
      propertyImageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&auto=format&fit=crop',
      date: '15 Mar 2026',
      time: '14:30',
      status: 'confirmed',
      type: 'visit',
      priceMonthly: 1450,
    },
    {
      id: 'b2',
      propertyTitle: 'Penthouse com Terraço — Vista Tejo',
      propertyLocation: 'Mouraria, Lisboa',
      date: '18 Mar 2026',
      status: 'pending',
      type: 'inquiry',
      priceMonthly: 3200,
    },
    {
      id: 'b3',
      propertyTitle: 'Estúdio moderno — Metro Intendente',
      propertyLocation: 'Intendente, Lisboa',
      date: '5 Mar 2026',
      time: '10:00',
      status: 'completed',
      type: 'visit',
      priceMonthly: 750,
    },
    {
      id: 'b4',
      propertyTitle: 'Moradia T3 com jardim — Cascais',
      propertyLocation: 'Cascais, Lisboa',
      date: '1 Mar 2026',
      status: 'cancelled',
      type: 'inquiry',
      priceMonthly: 2800,
    },
  ];

  onCancelBooking(booking: BookingRecord): void {
    this.notif.show({ message: `❌ Reserva cancelada: "${booking.propertyTitle}"`, type: 'warning', duration: 3000 });
  }

  onViewBooking(booking: BookingRecord): void {
    this.notif.show({ message: `📋 Ver detalhes: "${booking.propertyTitle}"`, type: 'info', duration: 2000 });
  }

  onRemoveFav(prop: PropertyData): void {
    this.favourites.remove(prop.id);
    this.notif.show({ message: `🤍 Removido dos favoritos: "${prop.title}"`, type: 'info', duration: 2000 });
  }

  // ── Sprint 017 — Manage Listings ───────────────────────────────

  readonly showAddProperty = signal(false);

  readonly mockListings: LandlordListing[] = [
    {
      id: 'l1',
      title: 'Apartamento T2 renovado em Príncipe Real',
      location: 'Príncipe Real, Lisboa',
      priceMonthly: 1450,
      bedrooms: 2,
      bathrooms: 1,
      areaSqm: 78,
      type: 'apartment',
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&auto=format&fit=crop',
      badges: ['available'],
      availableFrom: '1 Abr 2026',
      status: 'active',
      inquiries: 7,
      visits: 3,
      listedDate: '15 Fev 2026',
    },
    {
      id: 'l2',
      title: 'Penthouse com Terraço — Vista Tejo',
      location: 'Mouraria, Lisboa',
      priceMonthly: 3200,
      bedrooms: 3,
      bathrooms: 2,
      areaSqm: 142,
      type: 'penthouse',
      imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&auto=format&fit=crop',
      badges: ['featured'],
      availableFrom: '1 Mar 2026',
      status: 'rented',
      inquiries: 24,
      visits: 9,
      listedDate: '1 Jan 2026',
    },
    {
      id: 'l3',
      title: 'Estúdio moderno — Metro Intendente',
      location: 'Intendente, Lisboa',
      priceMonthly: 750,
      bedrooms: 0,
      bathrooms: 1,
      areaSqm: 35,
      type: 'studio',
      badges: [],
      availableFrom: '1 Mar 2026',
      status: 'paused',
      inquiries: 2,
      visits: 1,
      listedDate: '20 Fev 2026',
    },
  ];

  onEditListing(listing: LandlordListing): void {
    this.notif.show({ message: `✏️ Editar: "${listing.title}"`, type: 'info', duration: 2000 });
  }

  onPauseListing(listing: LandlordListing): void {
    this.notif.show({ message: `⏸️ Pausado: "${listing.title}"`, type: 'warning', duration: 2500 });
  }

  onActivateListing(listing: LandlordListing): void {
    this.notif.show({ message: `▶️ Reactivado: "${listing.title}"`, type: 'success', duration: 2500 });
  }

  onDeleteListing(listing: LandlordListing): void {
    this.notif.show({ message: `🗑️ Removido: "${listing.title}"`, type: 'error', duration: 2500 });
  }

  onPropertyFormSubmit(form: NewPropertyForm): void {
    this.showAddProperty.set(false);
    this.notif.show({ message: `🏠 Imóvel "${form.title}" publicado com sucesso!`, type: 'success', duration: 4000 });
  }

  // ── Sprint 015 — Auth ───────────────────────────────────────────

  readonly authView = signal<'login' | 'register' | null>(null);

  openAuthLogin(): void { this.authView.set('login'); }
  openAuthRegister(): void { this.authView.set('register'); }
  closeAuth(): void { this.authView.set(null); }

  onLoginSuccess(): void {
    this.closeAuth();
    this.notif.show({ message: '👋 Login realizado com sucesso!', type: 'success', duration: 3000 });
  }

  onRegisterSuccess(): void {
    this.notif.show({ message: '🎉 Conta criada com sucesso!', type: 'success', duration: 3000 });
  }

  // ── Sprint 018 — Messaging & Notifications ──────────────────────

  readonly messagingService = inject(MessagingService);
  readonly notificationService = inject(NotificationBellService);

  readonly activeThread = computed(() => this.messagingService.activeThread());

  onThreadSelect(thread: MessageThread): void {
    this.messagingService.openThread(thread.id);
  }

  onMessageSend(text: string): void {
    const thread = this.activeThread();
    if (!thread) return;
    this.messagingService.sendMessage(thread.id, text);
  }

  onNotificationClicked(notif: import('@israel-ui/core').AppNotification): void {
    this.notif.show({ message: `🔔 ${notif.title}`, type: 'info', duration: 3000 });
  }

  // ── Sprint 019 — Global Search ──────────────────────────────────────────────
  readonly searchService = inject(PropertySearchService);
  readonly globalSearchLog = signal('— sem pesquisa ainda —');

  // ── Sprint 019 — Reviews Module ─────────────────────────────────────────────
  readonly sampleReviews: PropertyReview[] = [
    {
      id: 'r1', authorName: 'Maria João Ferreira', rating: 5,
      body: 'Apartamento fantástico no coração do Chiado. A localização é perfeita — a pé de tudo. O senhorio é muito atencioso e respondeu sempre rapidamente. Recomendo vivamente!',
      date: '2026-02-14', verified: true,
      landlordReply: 'Obrigado, Maria João! Foi um prazer tê-la como inquilina. Espero que volte a Lisboa em breve!',
    },
    {
      id: 'r2', authorName: 'Pedro Alves', rating: 4,
      body: 'Muito bom apartamento. Espaçoso, luminoso e com boas vistas. O único ponto negativo foi um pequeno problema com a canalização que demorou uns dias a resolver.',
      date: '2026-01-28', verified: true,
    },
    {
      id: 'r3', authorName: 'Sophie Martin', rating: 5,
      body: 'Incrível! Fiquei 3 meses e não queria sair. O bairro é tranquilo mas animado, transporte público excelente.',
      date: '2025-12-10', verified: false,
    },
    {
      id: 'r4', authorName: 'Carlos Mendes', rating: 3,
      body: 'Razoável. A localização é boa mas o apartamento precisa de algumas renovações. A cozinha é pequena e os electrodomésticos são antigos.',
      date: '2025-11-05', verified: true,
    },
    {
      id: 'r5', authorName: 'Ana Ribeiro', rating: 5,
      body: 'Adorei! Tudo conforme descrito. Muito limpo, bem equipado e o senhorio foi super simpático.',
      date: '2025-10-20', verified: true,
    },
    {
      id: 'r6', authorName: 'João Costa', rating: 2,
      body: 'Infelizmente não correspondeu às expectativas. Havia humidade numa das paredes e o aquecimento central não funcionava bem no Inverno.',
      date: '2025-09-15', verified: false,
      landlordReply: 'Pedimos desculpa pelos inconvenientes. O problema foi resolvido com obras realizadas em Outubro.',
    },
  ];

  onGlobalSearchSelect(event: GlobalSearchSelectEvent): void {
    this.globalSearchLog.set(`Seleccionado: ${event.suggestion.title} (€${event.suggestion.priceMonthly}/mês)`);
    this.notif.show({ message: `🏠 ${event.suggestion.title}`, type: 'success', duration: 3000 });
  }

  onGlobalSearchSubmit(event: GlobalSearchSubmitEvent): void {
    this.globalSearchLog.set(`Pesquisa: "${event.query}" → ${event.count} resultado(s)`);
    this.notif.show({ message: `🔍 ${event.count} resultado(s) para "${event.query}"`, type: 'info', duration: 3000 });
  }
}
