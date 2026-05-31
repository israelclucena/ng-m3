/**
 * Storybook test-runner config — accessibility gate scaffold.
 *
 * Sprint 069 setup: wires @axe-core/playwright into the test-runner so every
 * story is checked for WCAG violations. PoC scope — no triage of existing
 * stories yet (Sprint 070 will enable globally, fix flagged stories, and
 * promote to a CI gate). For now run targeted: `nx test-storybook core`.
 *
 * Pattern: postVisit hook injects axe into the story iframe, runs the audit,
 * and fails the story if any serious/critical violations are found.
 *
 * Reference: https://storybook.js.org/docs/writing-tests/accessibility-testing#test-runner-axe-integration
 */
import type { TestRunnerConfig } from '@storybook/test-runner';
import { getStoryContext } from '@storybook/test-runner';
import AxeBuilder from '@axe-core/playwright';

const config: TestRunnerConfig = {
  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context);
    if (storyContext.parameters?.['a11y']?.disable) return;

    const results = await new AxeBuilder({ page })
      .include('#storybook-root')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    if (blocking.length > 0) {
      const summary = blocking
        .map((v) => `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'})`)
        .join('\n');
      throw new Error(`Accessibility violations in "${context.title} / ${context.name}":\n${summary}`);
    }
  },
};

export default config;
