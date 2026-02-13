import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  ButtonComponent,
  CardComponent,
  CheckboxComponent,
  ChipComponent,
  DialogComponent,
  DividerComponent,
  ElevationComponent,
  FabComponent,
  IconButtonComponent,
  InputComponent,
  ListComponent,
  ListItemComponent,
  ProgressComponent,
  RadioComponent,
  SelectComponent,
  SliderComponent,
  SwitchComponent,
  TabsComponent,
} from '@israel-ui/core';

@Component({
  selector: 'app-components-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    CheckboxComponent,
    ChipComponent,
    DialogComponent,
    DividerComponent,
    ElevationComponent,
    FabComponent,
    IconButtonComponent,
    InputComponent,
    ListComponent,
    ListItemComponent,
    ProgressComponent,
    RadioComponent,
    SelectComponent,
    SliderComponent,
    SwitchComponent,
    TabsComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="catalog">
      <h1>&#64;israel-ui/core — Component Catalog</h1>
      <p class="subtitle">All components rendered from the library</p>

      <iu-divider></iu-divider>

      <!-- ═══ BUTTONS ═══ -->
      <section>
        <h2 id="comp-buttons">Buttons</h2>

        <div class="group">
          <h3>Variants</h3>
          <div class="row">
            <iu-button variant="primary" label="Primary"></iu-button>
            <iu-button variant="secondary" label="Secondary"></iu-button>
            <iu-button variant="outlined" label="Outlined"></iu-button>
            <iu-button variant="elevated" label="Elevated"></iu-button>
            <iu-button variant="text" label="Text"></iu-button>
            <iu-button variant="danger" label="Danger"></iu-button>
          </div>
        </div>

        <div class="group">
          <h3>With Icons</h3>
          <div class="row">
            <iu-button variant="primary" label="Upload" icon="upload"></iu-button>
            <iu-button variant="outlined" label="Download" icon="download"></iu-button>
            <iu-button variant="text" label="Settings" icon="settings"></iu-button>
            <iu-button variant="primary" label="Send" icon="send" [trailingIcon]="true"></iu-button>
          </div>
        </div>

        <div class="group">
          <h3>Sizes</h3>
          <div class="row">
            <iu-button variant="primary" label="Small" size="sm"></iu-button>
            <iu-button variant="primary" label="Medium" size="md"></iu-button>
            <iu-button variant="primary" label="Large" size="lg"></iu-button>
          </div>
        </div>

        <div class="group">
          <h3>States</h3>
          <div class="row">
            <iu-button variant="primary" label="Disabled" [disabled]="true"></iu-button>
            <iu-button variant="primary" label="Soft Disabled" [softDisabled]="true"></iu-button>
            <iu-button variant="primary" label="Loading" [loading]="true"></iu-button>
            <iu-button variant="primary" label="Full Width" [fullWidth]="true"></iu-button>
          </div>
        </div>

        <div class="group">
          <h3 id="comp-icon-buttons">Icon Buttons</h3>
          <div class="row">
            <iu-icon-button icon="favorite" variant="standard"></iu-icon-button>
            <iu-icon-button icon="favorite" variant="filled"></iu-icon-button>
            <iu-icon-button icon="favorite" variant="tonal"></iu-icon-button>
            <iu-icon-button icon="favorite" variant="outlined"></iu-icon-button>
            <iu-icon-button icon="delete" variant="standard" [disabled]="true"></iu-icon-button>
          </div>
        </div>

        <div class="group">
          <h3 id="comp-fab">FAB</h3>
          <div class="row">
            <iu-fab icon="add" size="small"></iu-fab>
            <iu-fab icon="edit" size="medium"></iu-fab>
            <iu-fab icon="navigation" size="large"></iu-fab>
            <iu-fab icon="add" label="Create" size="medium"></iu-fab>
            <iu-fab icon="add" variant="primary"></iu-fab>
            <iu-fab icon="add" variant="secondary"></iu-fab>
            <iu-fab icon="add" variant="tertiary"></iu-fab>
          </div>
        </div>
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ SELECTION ═══ -->
      <section>
        <h2 id="comp-selection">Selection</h2>

        <div class="group">
          <h3 id="comp-checkbox">Checkbox</h3>
          <div class="row">
            <iu-checkbox label="Default"></iu-checkbox>
            <iu-checkbox label="Checked" [checked]="true"></iu-checkbox>
            <iu-checkbox label="Indeterminate" [indeterminate]="true"></iu-checkbox>
            <iu-checkbox label="Disabled" [disabled]="true"></iu-checkbox>
            <iu-checkbox label="Checked + Disabled" [checked]="true" [disabled]="true"></iu-checkbox>
          </div>
        </div>

        <div class="group">
          <h3 id="comp-radio">Radio</h3>
          <div class="row">
            <iu-radio label="Option A" name="demo-radio" value="a" [checked]="true"></iu-radio>
            <iu-radio label="Option B" name="demo-radio" value="b"></iu-radio>
            <iu-radio label="Option C" name="demo-radio" value="c"></iu-radio>
            <iu-radio label="Disabled" name="demo-radio2" value="d" [disabled]="true"></iu-radio>
          </div>
        </div>

        <div class="group">
          <h3 id="comp-switch">Switch</h3>
          <div class="row">
            <iu-switch label="Off"></iu-switch>
            <iu-switch label="On" [selected]="true"></iu-switch>
            <iu-switch label="With Icons" [icons]="true"></iu-switch>
            <iu-switch label="Disabled" [disabled]="true"></iu-switch>
            <iu-switch label="Disabled On" [selected]="true" [disabled]="true"></iu-switch>
          </div>
        </div>

        <div class="group">
          <h3 id="comp-slider">Slider</h3>
          <div class="row" style="flex-direction: column; max-width: 400px;">
            <iu-slider [value]="50" [labeled]="true"></iu-slider>
            <iu-slider [value]="30" [min]="0" [max]="100" [step]="10" [labeled]="true"></iu-slider>
            <iu-slider [value]="50" [disabled]="true"></iu-slider>
          </div>
        </div>
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ TEXT FIELDS ═══ -->
      <section>
        <h2 id="comp-text-fields">Text Fields</h2>

        <div class="group">
          <h3 id="comp-input-outlined">Input — Outlined</h3>
          <div class="row">
            <iu-input variant="outlined" label="Name" placeholder="Enter your name"></iu-input>
            <iu-input variant="outlined" label="Email" type="email" prefixIcon="mail" placeholder="email&#64;example.com"></iu-input>
            <iu-input variant="outlined" label="Password" type="password"></iu-input>
          </div>
        </div>

        <div class="group">
          <h3 id="comp-input-filled">Input — Filled</h3>
          <div class="row">
            <iu-input variant="filled" label="First Name"></iu-input>
            <iu-input variant="filled" label="Last Name" hint="As shown on ID"></iu-input>
          </div>
        </div>

        <div class="group">
          <h3>Input — States</h3>
          <div class="row">
            <iu-input variant="outlined" label="Error" errorMessage="This field is required"></iu-input>
            <iu-input variant="outlined" label="Disabled" [disabled]="true"></iu-input>
            <iu-input variant="outlined" label="Required" [required]="true"></iu-input>
          </div>
        </div>

        <div class="group">
          <h3 id="comp-select">Select — Outlined</h3>
          <div class="row">
            <iu-select variant="outlined" label="Country">
              <md-select-option value="pt"><div slot="headline">Portugal</div></md-select-option>
              <md-select-option value="es"><div slot="headline">Spain</div></md-select-option>
              <md-select-option value="fr"><div slot="headline">France</div></md-select-option>
            </iu-select>
            <iu-select variant="outlined" label="Disabled" [disabled]="true">
              <md-select-option value="x"><div slot="headline">Option</div></md-select-option>
            </iu-select>
          </div>
        </div>

        <div class="group">
          <h3>Select — Filled</h3>
          <div class="row">
            <iu-select variant="filled" label="Language">
              <md-select-option value="en"><div slot="headline">English</div></md-select-option>
              <md-select-option value="pt"><div slot="headline">Português</div></md-select-option>
              <md-select-option value="es"><div slot="headline">Español</div></md-select-option>
            </iu-select>
          </div>
        </div>
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ CARDS ═══ -->
      <section>
        <h2 id="comp-cards">Cards</h2>

        <div class="group">
          <div class="row">
            <iu-card variant="elevated" title="Elevated Card" subtitle="Default elevation">
              <p>Card content goes here. This is an elevated card variant.</p>
            </iu-card>
            <iu-card variant="filled" title="Filled Card" subtitle="Surface tint">
              <p>Card content goes here. This is a filled card variant.</p>
            </iu-card>
            <iu-card variant="outlined" title="Outlined Card" subtitle="Border style">
              <p>Card content goes here. This is an outlined card variant.</p>
            </iu-card>
          </div>
        </div>

        <div class="group">
          <h3>States</h3>
          <div class="row">
            <iu-card variant="elevated" title="Clickable" subtitle="Has hover effect" [clickable]="true">
              <p>Click me!</p>
            </iu-card>
            <iu-card variant="elevated" title="With Avatar" subtitle="Icon avatar" avatar="person">
              <p>Card with an avatar icon.</p>
            </iu-card>
            <iu-card variant="elevated" title="Disabled" subtitle="Cannot interact" [disabled]="true">
              <p>This card is disabled.</p>
            </iu-card>
          </div>
        </div>
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ NAVIGATION ═══ -->
      <section>
        <h2 id="comp-navigation">Navigation</h2>

        <div class="group">
          <h3 id="comp-tabs">Tabs</h3>
          <iu-tabs variant="primary">
            <md-primary-tab>Home</md-primary-tab>
            <md-primary-tab>Explore</md-primary-tab>
            <md-primary-tab>Library</md-primary-tab>
          </iu-tabs>

          <iu-tabs variant="secondary">
            <md-secondary-tab>All</md-secondary-tab>
            <md-secondary-tab>Music</md-secondary-tab>
            <md-secondary-tab>Podcasts</md-secondary-tab>
          </iu-tabs>
        </div>

        <div class="group">
          <h3 id="comp-list">List</h3>
          <div style="max-width: 360px;">
            <iu-list>
              <iu-list-item headline="Inbox" supportingText="5 new messages"></iu-list-item>
              <iu-list-item headline="Drafts" supportingText="2 drafts"></iu-list-item>
              <iu-list-item headline="Sent" supportingText="Last sent 2h ago"></iu-list-item>
              <iu-list-item headline="Disabled Item" [disabled]="true"></iu-list-item>
            </iu-list>
          </div>
        </div>
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ FEEDBACK ═══ -->
      <section>
        <h2 id="comp-feedback">Feedback</h2>

        <div class="group">
          <h3 id="comp-progress">Progress — Linear</h3>
          <div class="row" style="flex-direction: column; gap: 16px; max-width: 400px;">
            <iu-progress type="linear" [value]="0.4"></iu-progress>
            <iu-progress type="linear" [value]="0.7" [fourColor]="true"></iu-progress>
            <iu-progress type="linear" [indeterminate]="true"></iu-progress>
          </div>
        </div>

        <div class="group">
          <h3>Progress — Circular</h3>
          <div class="row">
            <iu-progress type="circular" [value]="0.3"></iu-progress>
            <iu-progress type="circular" [value]="0.7"></iu-progress>
            <iu-progress type="circular" [indeterminate]="true"></iu-progress>
            <iu-progress type="circular" [indeterminate]="true" [fourColor]="true"></iu-progress>
          </div>
        </div>

        <div class="group">
          <h3 id="comp-dialog">Dialog</h3>
          <div class="row">
            <iu-button variant="outlined" label="Open Dialog" (clicked)="showDialog = true"></iu-button>
            <iu-dialog [open]="showDialog" headline="Example Dialog" (closed)="showDialog = false">
              <p>This is a dialog with some content. You can put anything here.</p>
            </iu-dialog>
          </div>
        </div>
      </section>

      <iu-divider></iu-divider>

      <!-- ═══ LAYOUT ═══ -->
      <section>
        <h2 id="comp-layout">Layout</h2>

        <div class="group">
          <h3 id="comp-chips">Chips</h3>
          <div class="row">
            <iu-chip variant="assist" label="Assist"></iu-chip>
            <iu-chip variant="filter" label="Filter"></iu-chip>
            <iu-chip variant="filter" label="Selected" [selected]="true"></iu-chip>
            <iu-chip variant="input" label="Input" [removable]="true"></iu-chip>
            <iu-chip variant="suggestion" label="Suggestion"></iu-chip>
            <iu-chip variant="assist" label="Elevated" [elevated]="true"></iu-chip>
            <iu-chip variant="assist" label="Disabled" [disabled]="true"></iu-chip>
          </div>
        </div>

        <div class="group">
          <h3 id="comp-divider">Divider</h3>
          <iu-divider></iu-divider>
        </div>

        <div class="group">
          <h3 id="comp-elevation">Elevation</h3>
          <div class="row">
            <div class="elevation-box"><iu-elevation [level]="0"></iu-elevation><span>0</span></div>
            <div class="elevation-box"><iu-elevation [level]="1"></iu-elevation><span>1</span></div>
            <div class="elevation-box"><iu-elevation [level]="2"></iu-elevation><span>2</span></div>
            <div class="elevation-box"><iu-elevation [level]="3"></iu-elevation><span>3</span></div>
            <div class="elevation-box"><iu-elevation [level]="4"></iu-elevation><span>4</span></div>
            <div class="elevation-box"><iu-elevation [level]="5"></iu-elevation><span>5</span></div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      overflow-x: hidden;
    }
    .catalog {
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
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .group { margin-bottom: 24px; }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }
    .elevation-box {
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: 16px;
      background: var(--md-sys-color-surface, #fff);
      display: flex;
      align-items: center;
      justify-content: center;
      span {
        position: relative;
        z-index: 1;
        font-weight: 500;
      }
    }
    @media (max-width: 600px) {
      .catalog { padding: 16px; }
      h1 { font-size: 1.5rem; }
      h2 { font-size: 1.25rem; }
      .row { gap: 8px; }
    }
  `],
})
export class ComponentsPageComponent {
  showDialog = false;
}
