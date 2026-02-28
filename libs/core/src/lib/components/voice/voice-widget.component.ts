import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceCommandService } from './voice-command.service';

/**
 * VoiceWidget — Microphone button + status display for voice commands.
 *
 * Shows listening state, transcription, and last matched command.
 * Registers a default set of demo commands on init.
 *
 * @example
 * ```html
 * <iu-voice-widget></iu-voice-widget>
 * ```
 */
@Component({
  selector: 'iu-voice-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="voice-widget" [class]="'voice-widget--' + svc.status()">

      <!-- Unsupported -->
      @if (!svc.isSupported()) {
        <div class="voice-widget__unsupported">
          <span class="material-symbols-outlined">mic_off</span>
          <p>Web Speech API não suportada neste browser.</p>
          <p class="hint">Usa Chrome ou Edge para testar Voice Commands.</p>
        </div>
      }

      @if (svc.isSupported()) {
        <!-- Mic Button -->
        <button
          class="voice-widget__mic"
          [class.voice-widget__mic--active]="svc.status() === 'listening'"
          (click)="svc.toggle()"
          [title]="svc.status() === 'listening' ? 'Parar' : 'Começar a ouvir'"
        >
          <span class="material-symbols-outlined">
            {{ svc.status() === 'listening' ? 'mic' : 'mic_none' }}
          </span>
          <div class="voice-widget__ripple"></div>
        </button>

        <!-- Status -->
        <div class="voice-widget__info">
          <div class="voice-widget__status">
            <span class="voice-widget__dot" [class]="'dot--' + svc.status()"></span>
            <span>{{ statusLabel() }}</span>
          </div>

          @if (svc.transcript()) {
            <div class="voice-widget__transcript">
              "{{ svc.transcript() }}"
            </div>
          }

          @if (svc.lastMatch()) {
            <div class="voice-widget__match">
              ✅ {{ svc.lastMatch() }}
            </div>
          }
        </div>
      }
    </div>

    <!-- Commands List -->
    @if (svc.isSupported()) {
      <div class="voice-commands-list">
        <h4>Comandos disponíveis</h4>
        @for (cmd of commands; track cmd.description) {
          <div class="voice-cmd">
            <span class="material-symbols-outlined">record_voice_over</span>
            <div>
              <strong>"{{ cmd.phrases[0] }}"</strong>
              <span class="voice-cmd__desc">{{ cmd.description }}</span>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .voice-widget {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px;
      background: var(--md-sys-color-surface-container-low);
      border-radius: 20px;
      margin-bottom: 24px;
    }
    .voice-widget__unsupported {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px;
      width: 100%;
      text-align: center;
      .material-symbols-outlined { font-size: 48px; opacity: 0.4; }
      .hint { font-size: 0.85rem; color: var(--md-sys-color-on-surface-variant); }
    }
    .voice-widget__mic {
      position: relative;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      border: none;
      background: var(--md-sys-color-surface-container-high);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.2s;
      .material-symbols-outlined { font-size: 32px; color: var(--md-sys-color-on-surface-variant); transition: color 0.2s; }
      &:hover { background: var(--md-sys-color-primary-container); }
      &.voice-widget__mic--active {
        background: var(--md-sys-color-primary);
        .material-symbols-outlined { color: var(--md-sys-color-on-primary); }
      }
    }
    .voice-widget__ripple {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid var(--md-sys-color-primary);
      opacity: 0;
      pointer-events: none;
    }
    .voice-widget--listening .voice-widget__ripple {
      animation: ripple 1.5s ease-out infinite;
    }
    @keyframes ripple {
      0%   { opacity: 0.6; transform: scale(1); }
      100% { opacity: 0; transform: scale(1.6); }
    }
    .voice-widget__info { flex: 1; }
    .voice-widget__status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .voice-widget__dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: var(--md-sys-color-outline);
      &.dot--listening { background: #4caf50; animation: pulse 1s infinite; }
      &.dot--processing { background: var(--md-sys-color-primary); }
      &.dot--error { background: #f44336; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .voice-widget__transcript {
      font-style: italic;
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.95rem;
    }
    .voice-widget__match {
      color: var(--md-sys-color-primary);
      font-size: 0.9rem;
      margin-top: 4px;
    }
    .voice-commands-list {
      h4 {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--md-sys-color-on-surface-variant);
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }
    .voice-cmd {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      .material-symbols-outlined { font-size: 20px; color: var(--md-sys-color-primary); margin-top: 2px; }
      strong { display: block; font-size: 0.95rem; }
    }
    .voice-cmd__desc {
      font-size: 0.8rem;
      color: var(--md-sys-color-on-surface-variant);
    }
  `],
})
export class VoiceWidgetComponent implements OnInit, OnDestroy {
  readonly svc = inject(VoiceCommandService);

  commands = [
    { phrases: ['dashboard', 'ir para dashboard'], description: 'Navegar para o Dashboard' },
    { phrases: ['components', 'ver componentes'], description: 'Navegar para Components' },
    { phrases: ['settings', 'definições'], description: 'Navegar para Settings' },
    { phrases: ['tema escuro', 'dark mode'], description: 'Activar tema escuro' },
    { phrases: ['tema claro', 'light mode'], description: 'Activar tema claro' },
    { phrases: ['exportar', 'export'], description: 'Abrir painel de exportação' },
  ];

  ngOnInit(): void {
    for (const cmd of this.commands) {
      this.svc.register({
        phrases: cmd.phrases,
        description: cmd.description,
        handler: (t) => console.log('[VoiceCommand]', cmd.description, t),
      });
    }
  }

  ngOnDestroy(): void {
    this.svc.stop();
    this.svc.unregisterAll();
  }

  statusLabel(): string {
    const map: Record<string, string> = {
      idle: 'Clica no microfone para começar',
      listening: 'A ouvir...',
      processing: 'A processar...',
      error: 'Erro — verifica permissões do microfone',
      unsupported: 'Não suportado',
    };
    return map[this.svc.status()] ?? '';
  }
}
