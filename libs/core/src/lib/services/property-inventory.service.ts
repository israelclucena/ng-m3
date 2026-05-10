import { Injectable, signal, computed } from '@angular/core';

/** Categoria do item — usada para agrupar e direccionar deduções fiscais/caução. */
export type InventoryItemCategory =
  | 'furniture'        // sofá, cama, mesa, cadeiras, armários
  | 'appliance'        // frigorífico, máquina lavar, forno, micro-ondas
  | 'electronics'      // televisão, router, aspirador
  | 'kitchenware'      // tachos, talheres, pratos, copos
  | 'textiles'         // cortinas, alcatifa, almofadas
  | 'fixture';         // candeeiros, suportes, persianas

/** Estado de cada item registado. */
export type InventoryItemCondition = 'new' | 'good' | 'fair' | 'worn' | 'damaged' | 'missing';

/**
 * Item itemizado do inventário (recheio) do imóvel.
 *
 * Um item é registado no move-in com uma condição inicial e revisitado no
 * move-out — a delta entre as duas condições alimenta directamente o
 * `DepositReturnEstimator` para deduções por danos legítimos versus desgaste
 * normal (NRAU art. 5.º responsabilidade por danos).
 */
export interface InventoryItem {
  /** Identificador estável. */
  readonly id: string;
  /** Etiqueta humana ("Frigorífico Bosch KGN"). */
  readonly label: string;
  /** Local do imóvel onde o item se encontra ("Cozinha", "Sala", etc.). */
  readonly room: string;
  /** Categoria do item. */
  readonly category: InventoryItemCategory;
  /** Quantidade (ex: 4 cadeiras, 2 candeeiros). */
  readonly quantity: number;
  /** Condição registada na vistoria de entrada. */
  readonly conditionAtMoveIn: InventoryItemCondition;
  /** Condição na vistoria de saída — undefined antes de move-out. */
  readonly conditionAtMoveOut?: InventoryItemCondition;
  /** Custo de substituição estimado, em euros (usado para cálculo de retenção). */
  readonly replacementCostEur: number;
  /** Notas adicionais (manchas, riscos, modelo). */
  readonly notes?: string;
}

/** Severidade derivada do par (entrada → saída). */
export type ConditionDeltaSeverity = 'unchanged' | 'wear' | 'damage' | 'loss';

/** Linha agregada por sala — útil para a UI agrupar visualmente. */
export interface InventoryRoomGroup {
  readonly room: string;
  readonly items: ReadonlyArray<InventoryItem>;
  readonly totalReplacementCost: number;
}

/** Linha de delta por item após move-out. */
export interface InventoryDeltaLine {
  readonly item: InventoryItem;
  readonly severity: ConditionDeltaSeverity;
  /** Custo retido sugerido (0 para wear & tear; replacement total para loss). */
  readonly suggestedDeduction: number;
}

/** Ranking ordinal das condições — quanto maior, pior. */
const CONDITION_RANK: Record<InventoryItemCondition, number> = {
  new: 0,
  good: 1,
  fair: 2,
  worn: 3,
  damaged: 4,
  missing: 5,
};

let __invSeq = 0;
const nextId = () => `inv-${++__invSeq}-${Date.now().toString(36)}`;

/**
 * Default seed — apartamento PT mobilado típico (T2 com cozinha equipada).
 * Permite à UI ter algo a mostrar imediatamente sem onboarding.
 */
const DEFAULT_ITEMS: ReadonlyArray<InventoryItem> = [
  { id: 'i-frigo',     label: 'Frigorífico Bosch KGN',          room: 'Cozinha', category: 'appliance',   quantity: 1, conditionAtMoveIn: 'good', replacementCostEur: 850 },
  { id: 'i-fogao',     label: 'Fogão indução Teka 4 zonas',     room: 'Cozinha', category: 'appliance',   quantity: 1, conditionAtMoveIn: 'good', replacementCostEur: 480 },
  { id: 'i-maq-louca', label: 'Máquina lavar loiça AEG',        room: 'Cozinha', category: 'appliance',   quantity: 1, conditionAtMoveIn: 'fair', replacementCostEur: 520 },
  { id: 'i-microondas', label: 'Micro-ondas LG',                room: 'Cozinha', category: 'appliance',   quantity: 1, conditionAtMoveIn: 'good', replacementCostEur: 110 },
  { id: 'i-loica',     label: 'Conjunto loiça (12 peças)',      room: 'Cozinha', category: 'kitchenware', quantity: 12, conditionAtMoveIn: 'good', replacementCostEur: 80 },
  { id: 'i-talheres',  label: 'Talheres (set 24)',              room: 'Cozinha', category: 'kitchenware', quantity: 24, conditionAtMoveIn: 'good', replacementCostEur: 45 },
  { id: 'i-sofa',      label: 'Sofá 3 lugares cinza IKEA',      room: 'Sala',    category: 'furniture',   quantity: 1, conditionAtMoveIn: 'good', replacementCostEur: 600 },
  { id: 'i-tv',        label: 'Televisão LG 50"',                room: 'Sala',    category: 'electronics', quantity: 1, conditionAtMoveIn: 'good', replacementCostEur: 450 },
  { id: 'i-mesa-jantar', label: 'Mesa de jantar carvalho 6 lug.', room: 'Sala',  category: 'furniture',   quantity: 1, conditionAtMoveIn: 'good', replacementCostEur: 350 },
  { id: 'i-cadeiras',  label: 'Cadeiras (set 6)',                room: 'Sala',    category: 'furniture',   quantity: 6, conditionAtMoveIn: 'good', replacementCostEur: 210 },
  { id: 'i-cama-prin', label: 'Cama queen-size c/ colchão',     room: 'Quarto principal', category: 'furniture', quantity: 1, conditionAtMoveIn: 'good', replacementCostEur: 700 },
  { id: 'i-armario-prin', label: 'Armário 3 portas c/ espelho', room: 'Quarto principal', category: 'furniture', quantity: 1, conditionAtMoveIn: 'good', replacementCostEur: 420 },
  { id: 'i-cama-sec',  label: 'Cama solteiro c/ colchão',       room: 'Quarto secundário', category: 'furniture', quantity: 1, conditionAtMoveIn: 'fair', replacementCostEur: 380 },
  { id: 'i-cortinas',  label: 'Cortinas + varões (3 conjuntos)', room: 'Geral',  category: 'textiles',    quantity: 3, conditionAtMoveIn: 'good', replacementCostEur: 180 },
  { id: 'i-router',    label: 'Router MEO Smart',                room: 'Sala',   category: 'electronics', quantity: 1, conditionAtMoveIn: 'good', replacementCostEur: 60 },
];

/**
 * Calcula a severidade da delta entre duas condições.
 * - inalterado / melhorado → 'unchanged'
 * - desce 1 nível (ex: good → fair) → 'wear' (desgaste normal, não dedutível)
 * - desce 2+ níveis → 'damage' (dedutível parcialmente)
 * - 'missing' no move-out → 'loss' (custo total de reposição)
 */
export function classifyDelta(
  before: InventoryItemCondition,
  after: InventoryItemCondition,
): ConditionDeltaSeverity {
  if (after === 'missing') return 'loss';
  const drop = CONDITION_RANK[after] - CONDITION_RANK[before];
  if (drop <= 0) return 'unchanged';
  if (drop === 1) return 'wear';
  return 'damage';
}

/**
 * Heurística de retenção sugerida com base na severidade.
 * - unchanged / wear → 0 (desgaste normal não retém caução, NRAU art. 5.º)
 * - damage → 50% do custo de reposição (estimativa pragmática)
 * - loss → 100% do custo de reposição
 */
export function suggestedDeduction(
  item: InventoryItem,
  severity: ConditionDeltaSeverity,
): number {
  if (severity === 'loss') return round2(item.replacementCostEur * item.quantity);
  if (severity === 'damage') return round2(item.replacementCostEur * 0.5);
  return 0;
}

/**
 * State + computeds para o registo de inventário (recheio) do imóvel.
 *
 * Liga o triângulo `PropertyInspection` (vistoria) → `PropertyInventory`
 * (descritivo do recheio) → `DepositReturnEstimator` (retenção fundamentada).
 * NRAU art. 5.º exige descritivo prévio para defender deduções; este service
 * fornece esse descritivo + delta automatizada move-in → move-out.
 *
 * Sem RxJS — pure signals.
 */
@Injectable({ providedIn: 'root' })
export class PropertyInventoryService {
  private readonly _items = signal<InventoryItem[]>(
    DEFAULT_ITEMS.map(i => ({ ...i })),
  );

  /** Lista completa de items (read-only). */
  readonly items = this._items.asReadonly();

  /** Total agregado de items distintos. */
  readonly totalItems = computed(() => this._items().length);

  /** Soma de unidades (Σ quantity). */
  readonly totalUnits = computed(() =>
    this._items().reduce((acc, it) => acc + Math.max(0, it.quantity), 0),
  );

  /** Custo total de reposição (Σ replacementCost × quantity). */
  readonly totalReplacementCost = computed(() =>
    round2(this._items().reduce((acc, it) =>
      acc + Math.max(0, it.replacementCostEur) * Math.max(0, it.quantity), 0)),
  );

  /** Items agrupados por sala, ordenados pela ordem de inserção. */
  readonly byRoom = computed<ReadonlyArray<InventoryRoomGroup>>(() => {
    const map = new Map<string, InventoryItem[]>();
    for (const it of this._items()) {
      const arr = map.get(it.room) ?? [];
      arr.push(it);
      map.set(it.room, arr);
    }
    const groups: InventoryRoomGroup[] = [];
    for (const [room, items] of map) {
      const totalReplacementCost = round2(
        items.reduce((acc, it) =>
          acc + Math.max(0, it.replacementCostEur) * Math.max(0, it.quantity), 0),
      );
      groups.push({ room, items, totalReplacementCost });
    }
    return groups;
  });

  /** Quantos items já têm condição registada no move-out. */
  readonly inspectedAtMoveOut = computed(() =>
    this._items().filter(i => i.conditionAtMoveOut !== undefined).length,
  );

  /** Percentagem inspeccionada no move-out (0..100). */
  readonly moveOutInspectionPct = computed(() => {
    const total = this.totalItems();
    return total === 0 ? 0 : Math.round((this.inspectedAtMoveOut() / total) * 100);
  });

  /** Linhas de delta para items com condição registada no move-out. */
  readonly deltaLines = computed<ReadonlyArray<InventoryDeltaLine>>(() =>
    this._items()
      .filter(i => i.conditionAtMoveOut !== undefined)
      .map(item => {
        const severity = classifyDelta(item.conditionAtMoveIn, item.conditionAtMoveOut!);
        return {
          item,
          severity,
          suggestedDeduction: suggestedDeduction(item, severity),
        };
      }),
  );

  /** Soma da retenção sugerida — alimenta directamente o DepositReturnEstimator. */
  readonly totalSuggestedDeduction = computed(() =>
    round2(this.deltaLines().reduce((acc, l) => acc + l.suggestedDeduction, 0)),
  );

  /** Adiciona um novo item ao inventário. */
  addItem(input: {
    label: string;
    room: string;
    category: InventoryItemCategory;
    quantity: number;
    conditionAtMoveIn: InventoryItemCondition;
    replacementCostEur: number;
    notes?: string;
  }): void {
    const item: InventoryItem = {
      id: nextId(),
      label: input.label.trim() || 'Sem descrição',
      room: input.room.trim() || 'Geral',
      category: input.category,
      quantity: safePositiveInt(input.quantity),
      conditionAtMoveIn: input.conditionAtMoveIn,
      replacementCostEur: safeNum(input.replacementCostEur),
      notes: input.notes?.trim() || undefined,
    };
    this._items.update(list => [...list, item]);
  }

  /** Remove um item do inventário. */
  removeItem(id: string): void {
    this._items.update(list => list.filter(i => i.id !== id));
  }

  /** Marca a condição do item no momento do move-out. */
  setMoveOutCondition(id: string, condition: InventoryItemCondition): void {
    this._items.update(list =>
      list.map(i => i.id === id ? { ...i, conditionAtMoveOut: condition } : i),
    );
  }

  /** Limpa apenas as condições de saída (mantém os items). */
  clearMoveOutConditions(): void {
    this._items.update(list =>
      list.map(i => ({
        id: i.id,
        label: i.label,
        room: i.room,
        category: i.category,
        quantity: i.quantity,
        conditionAtMoveIn: i.conditionAtMoveIn,
        replacementCostEur: i.replacementCostEur,
        notes: i.notes,
      })),
    );
  }

  /** Reset total — volta ao seed inicial. */
  resetAll(): void {
    this._items.set(DEFAULT_ITEMS.map(i => ({ ...i })));
  }

  /** Substitui completamente a lista (útil para integração com PropertyInspection). */
  setItems(list: ReadonlyArray<InventoryItem>): void {
    this._items.set(list.map(i => ({ ...i })));
  }
}

function safeNum(v: number): number {
  return Number.isFinite(v) && v >= 0 ? v : 0;
}

function safePositiveInt(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 1;
  return Math.floor(v);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
