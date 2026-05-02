import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  TaxStatementGeneratorComponent,
  TaxStatementService,
} from '@israel-ui/core';

@Component({
  selector: 'iu-tsg-story-empty',
  standalone: true,
  imports: [TaxStatementGeneratorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-tax-statement-generator />`,
})
class WrapperEmpty {
  constructor() {
    const svc = inject(TaxStatementService);
    svc.reset();
    svc.setYear(2025);
  }
}

@Component({
  selector: 'iu-tsg-story-basic',
  standalone: true,
  imports: [TaxStatementGeneratorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-tax-statement-generator />`,
})
class WrapperBasicYear {
  constructor() {
    const svc = inject(TaxStatementService);
    svc.reset();
    svc.setYear(2025);
    for (let m = 1; m <= 12; m++) {
      const month = `2025-${String(m).padStart(2, '0')}`;
      svc.addRentEntry({
        month,
        grossAmount: 950,
        withholding: 950 * 0.25,
      });
    }
  }
}

@Component({
  selector: 'iu-tsg-story-deductions',
  standalone: true,
  imports: [TaxStatementGeneratorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iu-tax-statement-generator />`,
})
class WrapperWithDeductions {
  constructor() {
    const svc = inject(TaxStatementService);
    svc.reset();
    svc.setYear(2025);
    svc.setPropertyId('apt-rua-flores-12-2e');
    for (let m = 1; m <= 12; m++) {
      const month = `2025-${String(m).padStart(2, '0')}`;
      svc.addRentEntry({
        month,
        grossAmount: 1100,
        withholding: 1100 * 0.25,
      });
    }
    svc.addExpense({
      category: 'imi',
      description: 'IMI 2025 — 1.ª prestação',
      amount: 320,
      date: '2025-05-31',
    });
    svc.addExpense({
      category: 'condominio',
      description: 'Condomínio (12 meses)',
      amount: 480,
      date: '2025-12-31',
    });
    svc.addExpense({
      category: 'conservacao',
      description: 'Substituição de caldeira + pintura WC',
      amount: 1200,
      date: '2025-09-15',
    });
  }
}

const meta: Meta = {
  title: 'Sprint 042/TaxStatementGenerator',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'IRS Categoria F (rendimentos prediais) annual statement helper. ' +
          'Aggregates rent entries + deductible expenses (IMI / condomínio / ' +
          'conservação / seguro / outros) and surfaces gross/net income, total ' +
          'IRS retido na fonte and effective rate — exactly what is needed for ' +
          'Modelo 3 / Anexo F. M3 tokens, no `@material/web`.',
      },
    },
  },
};

export default meta;

/** Pristine state — year 2025 selected, no rents or expenses yet. */
export const Empty: StoryObj = {
  render: () => ({ template: `<iu-tsg-story-empty />` }),
  decorators: [moduleMetadata({ imports: [WrapperEmpty] })],
};

/** 12 months of €950 rent at 25% retention — gross €11.4k, no deductions. */
export const BasicYear: StoryObj = {
  render: () => ({ template: `<iu-tsg-story-basic />` }),
  decorators: [moduleMetadata({ imports: [WrapperBasicYear] })],
};

/** 12 months of €1100 rent + IMI €320 + condominio €480 + conservação €1200. */
export const WithDeductions: StoryObj = {
  render: () => ({ template: `<iu-tsg-story-deductions />` }),
  decorators: [moduleMetadata({ imports: [WrapperWithDeductions] })],
};
