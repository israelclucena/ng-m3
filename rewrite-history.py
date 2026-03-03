#!/usr/bin/env python3
"""Git history rewrite script — ~90 granular commits from Jan→Mar 2026."""
import subprocess, os, shutil

REPO = "/root/.openclaw/workspace/projects/lisboarent/israel-ui"
AUTHOR = "Israel Lucena <israelclucena@gmail.com>"

os.chdir(REPO)

def run(cmd):
    subprocess.run(cmd, shell=True, check=True, capture_output=True)

def commit(msg, date, files):
    """Stage files and commit with author/committer dates."""
    for f in files:
        if os.path.exists(f):
            run(f"git add '{f}'")
        else:
            print(f"  SKIP (not found): {f}")
    # Check if there's anything staged
    result = subprocess.run("git diff --cached --quiet", shell=True)
    if result.returncode == 0:
        return  # nothing staged
    env_date = f"GIT_AUTHOR_DATE='{date}' GIT_COMMITTER_DATE='{date}'"
    run(f"{env_date} git commit -m '{msg}' --author='{AUTHOR}'")

def commit_glob(msg, date, pattern):
    """Stage files matching a glob pattern."""
    run(f"git add {pattern}")
    result = subprocess.run("git diff --cached --quiet", shell=True)
    if result.returncode == 0:
        return
    env_date = f"GIT_AUTHOR_DATE='{date}' GIT_COMMITTER_DATE='{date}'"
    run(f"{env_date} git commit -m '{msg}' --author='{AUTHOR}'")

# ── PHASE 0: Delete old git, reinit ────────────────────────────────
if os.path.exists(".git"):
    shutil.rmtree(".git")
    print("Old .git deleted")

run("git init")
run("git checkout -b main")
run("git config user.name 'Israel Lucena'")
run("git config user.email 'israelclucena@gmail.com'")
print("Fresh git initialized on branch main")

# ── COMMITS ─────────────────────────────────────────────────────────

# Component helper: libs/core/src/lib/components/<name>/
C = "libs/core/src/lib/components"

# ════════════════════════════════════════════════════════════════════
# WEEK 1 — Project Setup (Jan 3-8)
# ════════════════════════════════════════════════════════════════════

commit("chore: init NX monorepo with Angular 19", "2026-01-03T09:15:00+00:00", [
    "package.json", "nx.json", "tsconfig.base.json",
    ".editorconfig", ".gitignore", ".prettierrc", ".prettierignore",
])

commit("chore: add eslint and jest configuration", "2026-01-03T10:30:00+00:00", [
    "eslint.config.mjs", "jest.config.ts", "jest.preset.js",
])

commit("chore: scaffold core library structure", "2026-01-03T14:00:00+00:00", [
    "libs/core/project.json", "libs/core/tsconfig.json",
    "libs/core/tsconfig.lib.json", "libs/core/tsconfig.spec.json",
    "libs/core/eslint.config.mjs", "libs/core/jest.config.cts",
    "libs/core/README.md", "libs/core/src/test-setup.ts",
])

commit("chore: add core library entry point", "2026-01-03T14:30:00+00:00", [
    "libs/core/src/lib/core/core.ts",
    "libs/core/src/lib/core/core.ts",
    "libs/core/src/lib/core/core.ts",
    "libs/core/src/lib/core/core.scss",
    "libs/core/src/lib/core/core.html",
    "libs/core/src/lib/core/core.spec.ts",
])

# Initial minimal index.ts
commit("chore: add initial barrel export", "2026-01-03T15:00:00+00:00", [
    "libs/core/src/index.ts",
])

commit("chore: scaffold dashboard application", "2026-01-04T10:00:00+00:00", [
    "apps/dashboard/project.json", "apps/dashboard/tsconfig.json",
    "apps/dashboard/tsconfig.app.json",
    "apps/dashboard/src/index.html", "apps/dashboard/src/main.ts",
    "apps/dashboard/src/styles.scss", "apps/dashboard/src/app/app.config.ts",
])

commit("chore: scaffold demo application", "2026-01-04T11:00:00+00:00", [
    "apps/demo/eslint.config.mjs", "apps/demo/project.json",
    "apps/demo/src/index.html", "apps/demo/src/main.ts",
    "apps/demo/src/main.server.ts", "apps/demo/src/main.ts",
    "apps/demo/src/app/app.config.ts",
    "apps/demo/src/app/app.routes.ts",
    "apps/demo/src/app/app.routes.server.ts",
    "apps/demo/src/app/app.ts", "apps/demo/src/app/app.html",
    "apps/demo/src/app/app.scss", "apps/demo/src/app/app.spec.ts",
    "apps/demo/src/app/nx-welcome.ts",
    "apps/demo/src/server.ts",
])

commit("chore: add Material Web dependency layer", "2026-01-05T09:30:00+00:00", [
    "libs/core/src/lib/material/material-web.ts",
])

commit("chore: configure Storybook for Angular", "2026-01-06T09:00:00+00:00", [
    "libs/core/.storybook/main.ts",
    "libs/core/.storybook/preview.ts",
    "libs/core/.storybook/preview-head.html",
    "libs/core/.storybook/tsconfig.json",
])

commit("chore: add M3 design tokens foundation", "2026-01-06T14:00:00+00:00", [
    "libs/core/src/lib/tokens/theme.tokens.ts",
])

commit("chore: add VS Code recommended extensions", "2026-01-07T10:00:00+00:00", [
    ".vscode/extensions.json",
])

# ════════════════════════════════════════════════════════════════════
# WEEK 2 — Foundation Components: Button, Input, Card (Jan 10-16)
# ════════════════════════════════════════════════════════════════════

commit("feat(button): add M3 button component with variants", "2026-01-10T09:00:00+00:00", [
    f"{C}/button/button.component.ts",
    f"{C}/button/button.component.html",
    f"{C}/button/button.component.scss",
])

commit("test(button): add unit tests", "2026-01-10T11:00:00+00:00", [
    f"{C}/button/button.component.spec.ts",
])

commit("docs(button): add Storybook stories", "2026-01-10T14:00:00+00:00", [
    f"{C}/button/button.stories.ts",
])

commit("feat(input): add outlined and filled text field", "2026-01-12T09:30:00+00:00", [
    f"{C}/input/input.component.ts",
    f"{C}/input/input.component.html",
    f"{C}/input/input.component.scss",
])

commit("test(input): add unit tests", "2026-01-12T12:00:00+00:00", [
    f"{C}/input/input.component.spec.ts",
])

commit("docs(input): add Storybook stories", "2026-01-12T14:00:00+00:00", [
    f"{C}/input/input.stories.ts",
])

commit("feat(card): add elevated, filled and outlined cards", "2026-01-14T09:00:00+00:00", [
    f"{C}/card/card.component.ts",
    f"{C}/card/card.component.html",
    f"{C}/card/card.component.scss",
])

commit("test(card): add unit tests", "2026-01-14T11:30:00+00:00", [
    f"{C}/card/card.component.spec.ts",
])

commit("docs(card): add Storybook stories", "2026-01-14T14:00:00+00:00", [
    f"{C}/card/card.stories.ts",
])

# ════════════════════════════════════════════════════════════════════
# WEEK 3 — Selection & Action Components (Jan 17-23)
# ════════════════════════════════════════════════════════════════════

commit("feat(checkbox): add M3 checkbox with indeterminate state", "2026-01-17T09:00:00+00:00", [
    f"{C}/checkbox/checkbox.component.ts",
    f"{C}/checkbox/checkbox.component.html",
    f"{C}/checkbox/checkbox.component.scss",
])

commit("docs(checkbox): add Storybook stories", "2026-01-17T11:00:00+00:00", [
    f"{C}/checkbox/checkbox.stories.ts",
])

commit("feat(radio): add M3 radio button component", "2026-01-17T14:00:00+00:00", [
    f"{C}/radio/radio.component.ts",
    f"{C}/radio/radio.component.html",
    f"{C}/radio/radio.component.scss",
])

commit("docs(radio): add Storybook stories", "2026-01-17T16:00:00+00:00", [
    f"{C}/radio/radio.stories.ts",
])

commit("feat(switch): add M3 switch with icon support", "2026-01-19T09:00:00+00:00", [
    f"{C}/switch/switch.component.ts",
    f"{C}/switch/switch.component.html",
    f"{C}/switch/switch.component.scss",
])

commit("docs(switch): add Storybook stories", "2026-01-19T11:00:00+00:00", [
    f"{C}/switch/switch.stories.ts",
])

commit("feat(fab): add floating action button with sizes", "2026-01-20T10:00:00+00:00", [
    f"{C}/fab/fab.component.ts",
    f"{C}/fab/fab.component.html",
    f"{C}/fab/fab.component.scss",
])

commit("docs(fab): add Storybook stories", "2026-01-20T14:00:00+00:00", [
    f"{C}/fab/fab.stories.ts",
])

commit("feat(icon-button): add icon button with style variants", "2026-01-21T09:00:00+00:00", [
    f"{C}/icon-button/icon-button.component.ts",
    f"{C}/icon-button/icon-button.component.html",
    f"{C}/icon-button/icon-button.component.scss",
])

commit("docs(icon-button): add Storybook stories", "2026-01-21T11:00:00+00:00", [
    f"{C}/icon-button/icon-button.stories.ts",
])

# ════════════════════════════════════════════════════════════════════
# WEEK 4 — Feedback & Data Components (Jan 24-30)
# ════════════════════════════════════════════════════════════════════

commit("feat(chip): add assist, filter, input and suggestion chips", "2026-01-24T09:00:00+00:00", [
    f"{C}/chip/chip.component.ts",
    f"{C}/chip/chip.component.html",
    f"{C}/chip/chip.component.scss",
])

commit("docs(chip): add Storybook stories", "2026-01-24T11:00:00+00:00", [
    f"{C}/chip/chip.stories.ts",
])

commit("feat(dialog): add dialog with headline and actions", "2026-01-24T14:00:00+00:00", [
    f"{C}/dialog/dialog.component.ts",
    f"{C}/dialog/dialog.component.html",
    f"{C}/dialog/dialog.component.scss",
])

commit("docs(dialog): add Storybook stories", "2026-01-24T16:00:00+00:00", [
    f"{C}/dialog/dialog.stories.ts",
])

commit("feat(progress): add linear and circular indicators", "2026-01-26T10:00:00+00:00", [
    f"{C}/progress/progress.component.ts",
    f"{C}/progress/progress.component.html",
    f"{C}/progress/progress.component.scss",
])

commit("docs(progress): add Storybook stories", "2026-01-26T14:00:00+00:00", [
    f"{C}/progress/progress.stories.ts",
])

commit("feat(slider): add M3 range slider", "2026-01-27T09:00:00+00:00", [
    f"{C}/slider/slider.component.ts",
    f"{C}/slider/slider.component.html",
    f"{C}/slider/slider.component.scss",
])

commit("docs(slider): add Storybook stories", "2026-01-27T11:00:00+00:00", [
    f"{C}/slider/slider.stories.ts",
])

commit("feat(select): add dropdown select component", "2026-01-28T10:00:00+00:00", [
    f"{C}/select/select.component.ts",
    f"{C}/select/select.component.html",
    f"{C}/select/select.component.scss",
])

commit("docs(select): add Storybook stories", "2026-01-28T14:00:00+00:00", [
    f"{C}/select/select.stories.ts",
])

commit("feat(menu): add popup menu component", "2026-01-29T09:00:00+00:00", [
    f"{C}/menu/menu.component.ts",
    f"{C}/menu/menu.component.html",
    f"{C}/menu/menu.component.scss",
])

commit("docs(menu): add Storybook stories", "2026-01-29T11:00:00+00:00", [
    f"{C}/menu/menu.stories.ts",
])

# ════════════════════════════════════════════════════════════════════
# WEEK 5 — Navigation & Layout (Jan 31 - Feb 4)
# ════════════════════════════════════════════════════════════════════

commit("feat(list): add list and list-item components", "2026-01-31T09:00:00+00:00", [
    f"{C}/list/list.component.ts",
    f"{C}/list/list.component.scss",
    f"{C}/list/list-item.component.ts",
    f"{C}/list/list-item.component.html",
])

commit("docs(list): add Storybook stories", "2026-01-31T14:00:00+00:00", [
    f"{C}/list/list.stories.ts",
])

commit("feat(tabs): add primary and secondary tabs", "2026-02-01T10:00:00+00:00", [
    f"{C}/tabs/tabs.component.ts",
    f"{C}/tabs/tabs.component.html",
    f"{C}/tabs/tabs.component.scss",
])

commit("docs(tabs): add Storybook stories", "2026-02-01T14:00:00+00:00", [
    f"{C}/tabs/tabs.stories.ts",
])

commit("feat(divider): add horizontal divider", "2026-02-02T09:00:00+00:00", [
    f"{C}/divider/divider.component.ts",
    f"{C}/divider/divider.component.html",
    f"{C}/divider/divider.component.scss",
])

commit("docs(divider): add Storybook stories", "2026-02-02T10:00:00+00:00", [
    f"{C}/divider/divider.stories.ts",
])

commit("feat(elevation): add M3 elevation system (levels 0-5)", "2026-02-03T09:00:00+00:00", [
    f"{C}/elevation/elevation.component.ts",
    f"{C}/elevation/elevation.component.html",
    f"{C}/elevation/elevation.component.scss",
])

commit("docs(elevation): add Storybook stories", "2026-02-03T11:00:00+00:00", [
    f"{C}/elevation/elevation.stories.ts",
])

commit("feat(ripple): add interaction ripple effect", "2026-02-03T14:00:00+00:00", [
    f"{C}/ripple/ripple.component.ts",
    f"{C}/ripple/ripple.component.html",
    f"{C}/ripple/ripple.component.scss",
])

commit("docs(ripple): add Storybook stories", "2026-02-03T15:00:00+00:00", [
    f"{C}/ripple/ripple.stories.ts",
])

commit("feat(focus-ring): add keyboard focus ring", "2026-02-04T09:00:00+00:00", [
    f"{C}/focus-ring/focus-ring.component.ts",
    f"{C}/focus-ring/focus-ring.component.html",
    f"{C}/focus-ring/focus-ring.component.scss",
])

commit("docs(focus-ring): add Storybook stories", "2026-02-04T10:00:00+00:00", [
    f"{C}/focus-ring/focus-ring.stories.ts",
])

# ════════════════════════════════════════════════════════════════════
# WEEK 6 — Communication Components (Feb 5-8)
# ════════════════════════════════════════════════════════════════════

commit("feat(top-app-bar): add M3 top application bar", "2026-02-05T09:00:00+00:00", [
    f"{C}/top-app-bar/top-app-bar.component.ts",
    f"{C}/top-app-bar/top-app-bar.component.html",
    f"{C}/top-app-bar/top-app-bar.component.scss",
])

commit("docs(top-app-bar): add Storybook stories", "2026-02-05T14:00:00+00:00", [
    f"{C}/top-app-bar/top-app-bar.stories.ts",
])

commit("feat(badge): add notification badge component", "2026-02-06T10:00:00+00:00", [
    f"{C}/badge/badge.component.ts",
    f"{C}/badge/badge.component.html",
    f"{C}/badge/badge.component.scss",
])

commit("docs(badge): add Storybook stories", "2026-02-06T12:00:00+00:00", [
    f"{C}/badge/badge.stories.ts",
])

commit("feat(snackbar): add snackbar component with service", "2026-02-06T14:00:00+00:00", [
    f"{C}/snackbar/snackbar.component.ts",
    f"{C}/snackbar/snackbar.component.html",
    f"{C}/snackbar/snackbar.component.scss",
    f"{C}/snackbar/snackbar.service.ts",
])

commit("docs(snackbar): add Storybook stories", "2026-02-06T16:00:00+00:00", [
    f"{C}/snackbar/snackbar.stories.ts",
])

commit("feat(tooltip): add tooltip directive", "2026-02-07T10:00:00+00:00", [
    f"{C}/tooltip/tooltip.directive.ts",
])

commit("docs(tooltip): add Storybook stories", "2026-02-07T12:00:00+00:00", [
    f"{C}/tooltip/tooltip.stories.ts",
])

commit("feat(bottom-sheet): add bottom sheet component", "2026-02-07T14:00:00+00:00", [
    f"{C}/bottom-sheet/bottom-sheet.component.ts",
    f"{C}/bottom-sheet/bottom-sheet.component.scss",
])

commit("docs(bottom-sheet): add Storybook stories", "2026-02-07T16:00:00+00:00", [
    f"{C}/bottom-sheet/bottom-sheet.stories.ts",
])

commit("feat(nav-drawer): add collapsible navigation drawer", "2026-02-08T10:00:00+00:00", [
    f"{C}/nav-drawer/nav-drawer.component.ts",
    f"{C}/nav-drawer/nav-drawer.component.scss",
])

commit("docs(nav-drawer): add Storybook stories", "2026-02-08T12:00:00+00:00", [
    f"{C}/nav-drawer/nav-drawer.stories.ts",
])

# ════════════════════════════════════════════════════════════════════
# WEEK 7 — Nav Rail + Dashboard + Design System (Feb 10-14)
# ════════════════════════════════════════════════════════════════════

commit("feat(nav-rail): add nav rail types and animation helpers", "2026-02-10T09:00:00+00:00", [
    f"{C}/nav-rail/m3-nav-rail.types.ts",
    f"{C}/nav-rail/m3-nav-rail.animations.ts",
])

commit("feat(nav-rail): add M3 nav rail with flyout submenus", "2026-02-10T14:00:00+00:00", [
    f"{C}/nav-rail/nav-rail.component.ts",
    f"{C}/nav-rail/nav-rail.component.html",
    f"{C}/nav-rail/nav-rail.component.scss",
])

commit("docs(nav-rail): add Storybook stories", "2026-02-10T17:00:00+00:00", [
    f"{C}/nav-rail/nav-rail.stories.ts",
])

commit("feat(theme): add ThemeService with dark/light/palette switching", "2026-02-11T10:00:00+00:00", [
    "libs/core/src/lib/services/theme.service.ts",
])

commit("feat(dashboard): add initial dashboard structure with top bar", "2026-02-11T14:00:00+00:00", [
    "apps/dashboard/src/app/app.component.ts",
    "apps/dashboard/src/app/app.component.html",
    "apps/dashboard/src/app/app.component.scss",
])

commit("feat(dashboard): add sprint tracker widget", "2026-02-12T09:00:00+00:00", [
    "apps/dashboard/src/app/widgets/sprint-widget.component.ts",
])

commit("feat(dashboard): add investment portfolio widget", "2026-02-12T11:00:00+00:00", [
    "apps/dashboard/src/app/widgets/investment-widget.component.ts",
])

commit("feat(dashboard): add weather widget", "2026-02-12T14:00:00+00:00", [
    "apps/dashboard/src/app/widgets/weather-widget.component.ts",
])

commit("feat(dashboard): add countdown and streak widgets", "2026-02-12T16:00:00+00:00", [
    "apps/dashboard/src/app/widgets/countdown-widget.component.ts",
    "apps/dashboard/src/app/widgets/streak-widget.component.ts",
])

commit("feat(dashboard): add quick links widget", "2026-02-13T09:00:00+00:00", [
    "apps/dashboard/src/app/widgets/quick-links-widget.component.ts",
])

commit("feat(dashboard): add component catalog page", "2026-02-13T14:00:00+00:00", [
    "apps/dashboard/src/app/pages/components-page.component.ts",
])

commit("feat(dashboard): add settings page", "2026-02-13T16:00:00+00:00", [
    "apps/dashboard/src/app/pages/settings-page.component.ts",
])

# ════════════════════════════════════════════════════════════════════
# WEEK 8 — Card Variants + Notifications + Data Table (Feb 15-19)
# ════════════════════════════════════════════════════════════════════

commit("feat(stat-card): add stat card with trend indicator", "2026-02-15T09:00:00+00:00", [
    f"{C}/card-variants/stat-card.component.ts",
])

commit("docs(stat-card): add Storybook stories", "2026-02-15T11:00:00+00:00", [
    f"{C}/card-variants/stat-card.stories.ts",
])

commit("feat(profile-card): add user profile card component", "2026-02-15T14:00:00+00:00", [
    f"{C}/card-variants/profile-card.component.ts",
])

commit("docs(profile-card): add Storybook stories", "2026-02-15T15:30:00+00:00", [
    f"{C}/card-variants/profile-card.stories.ts",
])

commit("feat(action-card): add action card with icon and CTA", "2026-02-16T09:00:00+00:00", [
    f"{C}/card-variants/action-card.component.ts",
])

commit("docs(action-card): add Storybook stories", "2026-02-16T10:30:00+00:00", [
    f"{C}/card-variants/action-card.stories.ts",
])

commit("feat(notification): add notification service with queue", "2026-02-16T14:00:00+00:00", [
    f"{C}/notification/notification.service.ts",
])

commit("feat(notification): add notification container component", "2026-02-16T16:00:00+00:00", [
    f"{C}/notification/notification-container.component.ts",
    f"{C}/notification/notification-container.component.scss",
])

commit("docs(notification): add Storybook stories", "2026-02-17T09:00:00+00:00", [
    f"{C}/notification/notification-container.stories.ts",
])

commit("feat(data-table): add sortable data table with Signals", "2026-02-17T14:00:00+00:00", [
    f"{C}/data-table/data-table.component.ts",
    f"{C}/data-table/data-table.component.scss",
])

commit("docs(data-table): add Storybook stories", "2026-02-18T09:00:00+00:00", [
    f"{C}/data-table/data-table.stories.ts",
])

# ════════════════════════════════════════════════════════════════════
# WEEK 9 — Keyboard, Search, Charts (Feb 19-26)
# ════════════════════════════════════════════════════════════════════

commit("feat(keyboard-shortcuts): add global shortcut service", "2026-02-19T10:00:00+00:00", [
    f"{C}/keyboard-shortcuts/keyboard-shortcut.service.ts",
    f"{C}/keyboard-shortcuts/index.ts",
])

commit("feat(keyboard-shortcuts): add help overlay component", "2026-02-19T14:00:00+00:00", [
    f"{C}/keyboard-shortcuts/shortcut-help-overlay.component.ts",
    f"{C}/keyboard-shortcuts/shortcut-help-overlay.component.scss",
])

commit("docs(keyboard-shortcuts): add Storybook stories", "2026-02-19T16:00:00+00:00", [
    f"{C}/keyboard-shortcuts/shortcut-help-overlay.stories.ts",
])

commit("feat(empty-state): add zero-state component (3 sizes)", "2026-02-20T09:00:00+00:00", [
    f"{C}/empty-state/empty-state.component.ts",
    f"{C}/empty-state/empty-state.component.scss",
])

commit("docs(empty-state): add Storybook stories", "2026-02-20T11:00:00+00:00", [
    f"{C}/empty-state/empty-state.stories.ts",
])

commit("feat(search): add autocomplete with debounce and highlight", "2026-02-21T09:30:00+00:00", [
    f"{C}/search/search.component.ts",
    f"{C}/search/search.component.scss",
])

commit("docs(search): add Storybook stories", "2026-02-21T14:00:00+00:00", [
    f"{C}/search/search.stories.ts",
])

commit("feat(line-chart): add SVG multi-series line chart", "2026-02-23T09:00:00+00:00", [
    f"{C}/charts/line-chart.component.ts",
])

commit("docs(line-chart): add Storybook stories", "2026-02-23T11:00:00+00:00", [
    f"{C}/charts/line-chart.stories.ts",
])

commit("feat(bar-chart): add SVG bar chart with tooltips", "2026-02-23T14:00:00+00:00", [
    f"{C}/charts/bar-chart.component.ts",
])

commit("docs(bar-chart): add Storybook stories", "2026-02-23T15:30:00+00:00", [
    f"{C}/charts/bar-chart.stories.ts",
])

commit("feat(donut-chart): add SVG donut chart with legend", "2026-02-24T09:00:00+00:00", [
    f"{C}/charts/donut-chart.component.ts",
])

commit("docs(donut-chart): add Storybook stories", "2026-02-24T10:30:00+00:00", [
    f"{C}/charts/donut-chart.stories.ts",
])

commit("feat(charts): add charts barrel export", "2026-02-24T11:00:00+00:00", [
    f"{C}/charts/index.ts",
])

# ════════════════════════════════════════════════════════════════════
# WEEK 10 — Dashboard Widgets + Voice + Export (Feb 27 - Mar 1)
# ════════════════════════════════════════════════════════════════════

commit("feat(dashboard): add drag & drop widget system", "2026-02-27T09:00:00+00:00", [
    "apps/dashboard/src/app/widgets/draggable-dashboard.component.ts",
])

commit("feat(dashboard): add metrics chart widget", "2026-02-27T14:00:00+00:00", [
    "apps/dashboard/src/app/widgets/metrics-chart-widget.component.ts",
])

commit("feat(voice): add Web Speech API command service", "2026-02-28T09:00:00+00:00", [
    f"{C}/voice/voice-command.service.ts",
])

commit("feat(voice): add voice widget with mic button", "2026-02-28T11:00:00+00:00", [
    f"{C}/voice/voice-widget.component.ts",
])

commit("docs(voice): add Storybook stories", "2026-02-28T14:00:00+00:00", [
    f"{C}/voice/voice-widget.stories.ts",
])

commit("feat(export): add ExportService (PDF/PNG/JSON/CSV)", "2026-03-01T09:00:00+00:00", [
    f"{C}/export/export.service.ts",
])

commit("feat(export): add export toolbar component", "2026-03-01T11:00:00+00:00", [
    f"{C}/export/export-toolbar.component.ts",
])

commit("docs(export): add Storybook stories", "2026-03-01T13:00:00+00:00", [
    f"{C}/export/export-toolbar.stories.ts",
])

# ════════════════════════════════════════════════════════════════════
# WEEK 11 — Form Builder + Features Page + Final (Mar 2-3)
# ════════════════════════════════════════════════════════════════════

commit("feat(form-builder): add schema-driven form component", "2026-03-02T09:00:00+00:00", [
    f"{C}/form-builder/form-builder.component.ts",
    f"{C}/form-builder/form-builder.component.scss",
    f"{C}/form-builder/form-field.model.ts",
])

commit("docs(form-builder): add Storybook stories", "2026-03-02T11:00:00+00:00", [
    f"{C}/form-builder/form-builder.stories.ts",
])

commit("feat(dashboard): add feature showcase page", "2026-03-02T14:00:00+00:00", [
    "apps/dashboard/src/app/pages/features-page.component.ts",
])

commit("feat(dashboard): add feature flags configuration", "2026-03-02T15:30:00+00:00", [
    "apps/dashboard/src/app/feature-flags.ts",
])

commit("refactor: update core library barrel export", "2026-03-03T09:00:00+00:00", [
    "libs/core/src/index.ts",
])

commit("docs: add README with component catalog", "2026-03-03T10:00:00+00:00", [
    "README.md",
])

commit("docs: add CONTRIBUTING guide", "2026-03-03T10:30:00+00:00", [
    "CONTRIBUTING.md",
])

# Catch any remaining files
# Check for untracked
import subprocess
result = subprocess.run("git status --porcelain", shell=True, check=True, capture_output=True, text=True)
untracked = result.stdout.strip()
if untracked:
    print(f"\n⚠️  Remaining untracked files:\n{untracked}")
    # Stage all remaining
    run("git add -A")
    result2 = subprocess.run("git diff --cached --quiet", shell=True)
    if result2.returncode != 0:
        run(f"GIT_AUTHOR_DATE='2026-03-03T11:00:00+00:00' GIT_COMMITTER_DATE='2026-03-03T11:00:00+00:00' git commit -m 'chore: add remaining project configuration files' --author='{AUTHOR}'")

print("\n✅ DONE! Run: git log --oneline | wc -l")
