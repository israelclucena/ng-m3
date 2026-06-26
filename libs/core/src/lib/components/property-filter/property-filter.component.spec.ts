import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  PropertyFilterComponent,
  type PropertyFilterState,
} from './property-filter.component';
import type { PropertyType } from '../property-card/property-card.component';

/** Build a synthetic input change event carrying a string value. */
function inputEvent(value: string): Event {
  return { target: { value } } as unknown as Event;
}

/** Build a synthetic checkbox change event. */
function checkboxEvent(checked: boolean): Event {
  return { target: { checked } } as unknown as Event;
}

describe('PropertyFilterComponent', () => {
  let fixture: ComponentFixture<PropertyFilterComponent>;
  let component: PropertyFilterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyFilterComponent);
    component = fixture.componentInstance;
  });

  /** Capture the most recent `filterChange` payload. */
  function captureChange(): { last: () => PropertyFilterState | null; count: () => number } {
    let last: PropertyFilterState | null = null;
    let count = 0;
    component.filterChange.subscribe((s) => { last = s; count++; });
    return { last: () => last, count: () => count };
  }

  // ── defaults ───────────────────────────────────────────────────────────────

  it('starts with an empty, inactive filter state', () => {
    expect(component.selectedTypes()).toEqual([]);
    expect(component.priceMin()).toBeNull();
    expect(component.priceMax()).toBeNull();
    expect(component.bedroomsMin()).toBeNull();
    expect(component.areaMin()).toBeNull();
    expect(component.areaMax()).toBeNull();
    expect(component.availableOnly()).toBe(false);
    expect(component.verifiedOnly()).toBe(false);
    expect(component.hasActiveFilters()).toBe(false);
    expect(component.activeFilterChips()).toEqual([]);
  });

  it('exposes reference data for the template', () => {
    expect(component.propertyTypes.length).toBeGreaterThan(0);
    expect(component.pricePresets[0].label).toBe('Todos');
    expect(component.bedroomOptions.map((b) => b.value)).toEqual([0, 1, 2, 3, 4]);
  });

  // ── type chips ───────────────────────────────────────────────────────────────

  it('toggles a property type on and off', () => {
    const spy = captureChange();
    component.toggleType('apartment');
    expect(component.selectedTypes()).toEqual(['apartment']);
    expect(spy.last()?.types).toEqual(['apartment']);

    component.toggleType('apartment');
    expect(component.selectedTypes()).toEqual([]);
    expect(spy.count()).toBe(2);
  });

  it('accumulates multiple selected types', () => {
    component.toggleType('apartment');
    component.toggleType('studio');
    expect(component.selectedTypes()).toEqual<PropertyType[]>(['apartment', 'studio']);
    expect(component.hasActiveFilters()).toBe(true);
  });

  // ── price ────────────────────────────────────────────────────────────────────

  it('applies a price preset and reports it active', () => {
    const preset = component.pricePresets[2]; // €800 – €1.500
    component.applyPricePreset(preset);
    expect(component.priceMin()).toBe(preset.min);
    expect(component.priceMax()).toBe(preset.max);
    expect(component.isPricePresetActive(preset)).toBe(true);
    expect(component.isPricePresetActive(component.pricePresets[1])).toBe(false);
  });

  it('parses manual price inputs and treats blank as null', () => {
    component.onPriceMinChange(inputEvent('900'));
    component.onPriceMaxChange(inputEvent('1800'));
    expect(component.priceMin()).toBe(900);
    expect(component.priceMax()).toBe(1800);

    component.onPriceMinChange(inputEvent(''));
    expect(component.priceMin()).toBeNull();
  });

  // ── bedrooms & area ────────────────────────────────────────────────────────────

  it('sets and clears the bedrooms minimum', () => {
    component.setBedroomsMin(2);
    expect(component.bedroomsMin()).toBe(2);
    component.setBedroomsMin(null);
    expect(component.bedroomsMin()).toBeNull();
  });

  it('parses area inputs and treats blank as null', () => {
    component.onAreaMinChange(inputEvent('50'));
    component.onAreaMaxChange(inputEvent('120'));
    expect(component.areaMin()).toBe(50);
    expect(component.areaMax()).toBe(120);

    component.onAreaMaxChange(inputEvent(''));
    expect(component.areaMax()).toBeNull();
  });

  // ── toggles ───────────────────────────────────────────────────────────────────

  it('reflects the availability and verified toggles', () => {
    component.onAvailableToggle(checkboxEvent(true));
    component.onVerifiedToggle(checkboxEvent(true));
    expect(component.availableOnly()).toBe(true);
    expect(component.verifiedOnly()).toBe(true);

    component.onAvailableToggle(checkboxEvent(false));
    expect(component.availableOnly()).toBe(false);
  });

  // ── active chips ──────────────────────────────────────────────────────────────

  it('builds a summary chip per active filter group', () => {
    component.toggleType('villa');
    component.applyPricePreset(component.pricePresets[2]);
    component.setBedroomsMin(3);
    component.onAreaMinChange(inputEvent('80'));
    component.onAvailableToggle(checkboxEvent(true));
    component.onVerifiedToggle(checkboxEvent(true));

    const keys = component.activeFilterChips().map((c) => c.key);
    expect(keys).toEqual(['types', 'price', 'bedrooms', 'area', 'available', 'verified']);
  });

  it('labels the type chip with the human-readable property label', () => {
    component.toggleType('apartment');
    const chip = component.activeFilterChips().find((c) => c.key === 'types');
    expect(chip?.label).toContain('Apartamento');
  });

  // ── remove individual filters ────────────────────────────────────────────────

  it('removes a single filter group without touching the others', () => {
    component.toggleType('house');
    component.setBedroomsMin(2);

    component.removeFilter('bedrooms');
    expect(component.bedroomsMin()).toBeNull();
    expect(component.selectedTypes()).toEqual(['house']);
  });

  it('removeFilter("price") clears both price bounds', () => {
    component.applyPricePreset(component.pricePresets[2]);
    component.removeFilter('price');
    expect(component.priceMin()).toBeNull();
    expect(component.priceMax()).toBeNull();
  });

  it('removeFilter("area") clears both area bounds', () => {
    component.onAreaMinChange(inputEvent('40'));
    component.onAreaMaxChange(inputEvent('90'));
    component.removeFilter('area');
    expect(component.areaMin()).toBeNull();
    expect(component.areaMax()).toBeNull();
  });

  // ── clear all + reset ──────────────────────────────────────────────────────────

  it('clears every filter and emits both reset and change', () => {
    component.toggleType('studio');
    component.applyPricePreset(component.pricePresets[3]);
    component.setBedroomsMin(1);
    component.onAvailableToggle(checkboxEvent(true));

    let resetCount = 0;
    component.filterReset.subscribe(() => resetCount++);
    const spy = captureChange();

    component.clearAll();

    expect(component.hasActiveFilters()).toBe(false);
    expect(resetCount).toBe(1);
    expect(spy.last()).toEqual<PropertyFilterState>({
      types: [],
      priceMin: null,
      priceMax: null,
      bedroomsMin: null,
      areaMin: null,
      areaMax: null,
      availableOnly: false,
      verifiedOnly: false,
    });
  });

  // ── getState ──────────────────────────────────────────────────────────────────

  it('getState() snapshots the current control values', () => {
    component.toggleType('penthouse');
    component.onPriceMinChange(inputEvent('2000'));
    component.setBedroomsMin(4);
    component.onVerifiedToggle(checkboxEvent(true));

    expect(component.getState()).toEqual<PropertyFilterState>({
      types: ['penthouse'],
      priceMin: 2000,
      priceMax: null,
      bedroomsMin: 4,
      areaMin: null,
      areaMax: null,
      availableOnly: false,
      verifiedOnly: true,
    });
  });

  it('emits the latest state on every control change', () => {
    const spy = captureChange();
    component.toggleType('room');
    component.setBedroomsMin(1);
    expect(spy.count()).toBe(2);
    expect(spy.last()?.bedroomsMin).toBe(1);
  });
});
