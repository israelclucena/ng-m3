/** Item de menu com suporte a 3 níveis de profundidade */
export interface NavMenuItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  children?: NavMenuItem[];
  badge?: NavBadge;
  disabled?: boolean;
}

export interface NavBadge {
  value?: string | number;
  color?: 'error' | 'primary';
}

/** Configuração global do rail */
export interface NavRailConfig {
  title?: string;
  showFab?: boolean;
  fabIcon?: string;
  fabLabel?: string;
  showDarkModeToggle?: boolean;
  showSearch?: boolean;
  collapsedWidth?: number;
  expandedWidth?: number;
  flyoutWidth?: number;
  modalBreakpoint?: number;
}

/** Evento emitido ao navegar */
export interface NavRailNavigationEvent {
  item: NavMenuItem;
  route: string;
  level: 1 | 2 | 3;
}

/** Evento emitido ao clicar no FAB */
export interface NavRailFabEvent {
  timestamp: number;
}
