// Central registration for the Material Web custom elements used by @israel-ui/core.
// All md-* elements must be registered here for Storybook, tests and app consumers.
//
// IMPORTANT — do not turn these back into bare `import '.../foo.js'` statements.
// @material/web registers each element via a legacy decorator assignment
// (`MdFoo = __decorate([customElement('md-foo')], MdFoo)`). When the module is
// imported only for its side effect (bare import) and the exported binding is
// never referenced, the production esbuild optimizer tree-shakes that
// reassignment — so `customElements.define()` never runs and every <md-*>
// silently renders un-upgraded (buttons as raw text, etc.) app-wide.
// Referencing each class from the retained `REGISTERED_ELEMENTS` array below
// forces the registration side effect to survive optimization.

// ── Button ──
import { MdElevatedButton } from '@material/web/button/elevated-button.js';
import { MdFilledButton } from '@material/web/button/filled-button.js';
import { MdFilledTonalButton } from '@material/web/button/filled-tonal-button.js';
import { MdOutlinedButton } from '@material/web/button/outlined-button.js';
import { MdTextButton } from '@material/web/button/text-button.js';

// ── Icon Button ──
import { MdIconButton } from '@material/web/iconbutton/icon-button.js';
import { MdFilledIconButton } from '@material/web/iconbutton/filled-icon-button.js';
import { MdFilledTonalIconButton } from '@material/web/iconbutton/filled-tonal-icon-button.js';
import { MdOutlinedIconButton } from '@material/web/iconbutton/outlined-icon-button.js';

// ── FAB ──
import { MdFab } from '@material/web/fab/fab.js';
import { MdBrandedFab } from '@material/web/fab/branded-fab.js';

// ── Checkbox ──
import { MdCheckbox } from '@material/web/checkbox/checkbox.js';

// ── Radio ──
import { MdRadio } from '@material/web/radio/radio.js';

// ── Switch ──
import { MdSwitch } from '@material/web/switch/switch.js';

// ── Chips ──
import { MdChipSet } from '@material/web/chips/chip-set.js';
import { MdAssistChip } from '@material/web/chips/assist-chip.js';
import { MdFilterChip } from '@material/web/chips/filter-chip.js';
import { MdInputChip } from '@material/web/chips/input-chip.js';
import { MdSuggestionChip } from '@material/web/chips/suggestion-chip.js';

// ── Dialog ──
import { MdDialog } from '@material/web/dialog/dialog.js';

// ── Divider ──
import { MdDivider } from '@material/web/divider/divider.js';

// ── Select ──
import { MdOutlinedSelect } from '@material/web/select/outlined-select.js';
import { MdFilledSelect } from '@material/web/select/filled-select.js';
import { MdSelectOption } from '@material/web/select/select-option.js';

// ── Menu ──
import { MdMenu } from '@material/web/menu/menu.js';
import { MdMenuItem } from '@material/web/menu/menu-item.js';
import { MdSubMenu } from '@material/web/menu/sub-menu.js';

// ── List ──
import { MdList } from '@material/web/list/list.js';
import { MdListItem } from '@material/web/list/list-item.js';

// ── Tabs ──
import { MdTabs } from '@material/web/tabs/tabs.js';
import { MdPrimaryTab } from '@material/web/tabs/primary-tab.js';
import { MdSecondaryTab } from '@material/web/tabs/secondary-tab.js';

// ── Slider ──
import { MdSlider } from '@material/web/slider/slider.js';

// ── Progress ──
import { MdLinearProgress } from '@material/web/progress/linear-progress.js';
import { MdCircularProgress } from '@material/web/progress/circular-progress.js';

// ── TextField ──
import { MdOutlinedTextField } from '@material/web/textfield/outlined-text-field.js';
import { MdFilledTextField } from '@material/web/textfield/filled-text-field.js';

// ── Utilities ──
import { MdElevation } from '@material/web/elevation/elevation.js';
import { MdRipple } from '@material/web/ripple/ripple.js';
import { MdFocusRing } from '@material/web/focus/md-focus-ring.js';

// ── Icon ──
import { MdIcon } from '@material/web/icon/icon.js';

/**
 * Every Material Web element class referenced by the library. Referencing the
 * classes here (rather than bare side-effect imports) is what keeps their
 * `customElements.define()` registrations from being tree-shaken in production.
 */
export const REGISTERED_ELEMENTS = [
  MdElevatedButton, MdFilledButton, MdFilledTonalButton, MdOutlinedButton, MdTextButton,
  MdIconButton, MdFilledIconButton, MdFilledTonalIconButton, MdOutlinedIconButton,
  MdFab, MdBrandedFab,
  MdCheckbox, MdRadio, MdSwitch,
  MdChipSet, MdAssistChip, MdFilterChip, MdInputChip, MdSuggestionChip,
  MdDialog, MdDivider,
  MdOutlinedSelect, MdFilledSelect, MdSelectOption,
  MdMenu, MdMenuItem, MdSubMenu,
  MdList, MdListItem,
  MdTabs, MdPrimaryTab, MdSecondaryTab,
  MdSlider,
  MdLinearProgress, MdCircularProgress,
  MdOutlinedTextField, MdFilledTextField,
  MdElevation, MdRipple, MdFocusRing,
  MdIcon,
] as const;

// Anchor the array to an observable side effect (a write to globalThis) so the
// production optimizer cannot prove it dead and drop it — which would take the
// class references, and their registrations, with it. Reading `.length` forces
// the whole array (and every class) to be evaluated.
(globalThis as Record<string, unknown>)['__iuMaterialWebRegistered'] =
  REGISTERED_ELEMENTS.length;
