import { Injectable, computed, inject, signal } from '@angular/core';
import {
  LandlordCommunicationTemplatesService,
  CommunicationVars,
} from './landlord-communication-templates.service';

/** A message that was prepared (filled) and sent / copied through the center. */
export interface CommunicationHistoryEntry {
  readonly id: string;
  readonly templateId: string;
  readonly templateTitle: string;
  readonly body: string;
  readonly sentAt: Date;
  /** `'sent'` once the user clicked "Send"; `'copied'` for clipboard copy. */
  readonly mode: 'sent' | 'copied';
}

let __histSeq = 0;
const nextHistId = () => `comm-${++__histSeq}-${Date.now().toString(36)}`;

/**
 * Editor state for {@link CommunicationCenterComponent}.
 *
 * Holds the currently-selected template, the placeholder values the landlord
 * has typed, and the local history of dispatched messages. All filling logic
 * is delegated to {@link LandlordCommunicationTemplatesService.fillTemplate}.
 *
 * No RxJS — pure signals.
 */
@Injectable({ providedIn: 'root' })
export class CommunicationCenterStateService {
  private readonly templates = inject(LandlordCommunicationTemplatesService);

  /** Currently selected template id, or `null` when nothing is chosen. */
  readonly selectedTemplateId = signal<string | null>(null);

  /** Free-form values keyed by placeholder name. */
  readonly placeholderValues = signal<Record<string, string>>({});

  private readonly _history = signal<CommunicationHistoryEntry[]>([]);

  /** Read-only history of sent / copied messages (most-recent first). */
  readonly historyEntries = this._history.asReadonly();

  /** The currently-selected `CommunicationTemplate`, or `undefined`. */
  readonly currentTemplate = computed(() => {
    const id = this.selectedTemplateId();
    return id == null ? undefined : this.templates.getTemplate(id);
  });

  /** Result of filling the current template with current placeholder values. */
  readonly filledResult = computed(() => {
    const id = this.selectedTemplateId();
    if (id == null) return undefined;
    return this.templates.fillTemplate(id, this.placeholderValues() as CommunicationVars);
  });

  /** Body with placeholders substituted (or empty when no template). */
  readonly filledBody = computed(() => this.filledResult()?.body ?? '');

  /** Placeholder names still empty in the current template. */
  readonly missingPlaceholders = computed<ReadonlyArray<string>>(() => this.filledResult()?.missing ?? []);

  /** True when a template is selected and all placeholders are filled. */
  readonly canSend = computed(
    () => this.currentTemplate() !== undefined && this.missingPlaceholders().length === 0,
  );

  /** Replace the current template selection. Resets placeholder values. */
  selectTemplate(id: string | null): void {
    this.selectedTemplateId.set(id);
    this.placeholderValues.set({});
  }

  /** Update a single placeholder value. */
  setPlaceholder(key: string, value: string): void {
    this.placeholderValues.update(prev => ({ ...prev, [key]: value }));
  }

  /** Append a `'sent'` entry to history (no-op when not ready to send). */
  send(): CommunicationHistoryEntry | undefined {
    if (!this.canSend()) return undefined;
    return this.appendHistory('sent');
  }

  /**
   * Append a `'copied'` entry to history. Returns the entry; the caller is
   * responsible for the actual clipboard write (the service stays UI-free).
   */
  copyToClipboard(): CommunicationHistoryEntry | undefined {
    if (!this.canSend()) return undefined;
    return this.appendHistory('copied');
  }

  /** Wipe the local history (does not affect templates or current draft). */
  clearHistory(): void {
    this._history.set([]);
  }

  private appendHistory(mode: 'sent' | 'copied'): CommunicationHistoryEntry {
    const tpl = this.currentTemplate()!;
    const entry: CommunicationHistoryEntry = {
      id: nextHistId(),
      templateId: tpl.id,
      templateTitle: tpl.titulo,
      body: this.filledBody(),
      sentAt: new Date(),
      mode,
    };
    this._history.update(list => [entry, ...list]);
    return entry;
  }
}
