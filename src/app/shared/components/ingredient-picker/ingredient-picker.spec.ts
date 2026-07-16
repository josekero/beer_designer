import { ElementRef } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IngredientPicker, PickerItem } from './ingredient-picker';

describe('IngredientPicker', () => {
  const items: PickerItem[] = [
    { id: 'citra', label: 'Citra', meta: 'pellet', search: 'cítrico USA' },
    { id: 'mosaic', label: 'Mosaic', meta: 'cryo' },
    { id: 'cascade', label: 'Cascade' },
  ];
  let host: HTMLElement;
  let picker: IngredientPicker;

  beforeEach(() => {
    host = document.createElement('div');
    picker = new IngredientPicker(new ElementRef(host));
    picker.items = items;
  });

  it('selecciona y filtra ingredientes ignorando acentos y metadatos', () => {
    picker.writeValue('citra');
    expect(picker.selected).toBe(items[0]);
    picker.input('CITRICO');
    expect(picker.filtered).toEqual([items[0]]);
    picker.input('cryo');
    expect(picker.filtered).toEqual([items[1]]);
    picker.input('sin coincidencias');
    expect(picker.filtered).toEqual([]);
    picker.input('');
    expect(picker.filtered).toEqual(items);
    picker.writeValue(null as unknown as string);
    expect(picker.value).toBe('');
  });

  it('limita el desplegable a cuarenta resultados', () => {
    picker.items = Array.from({ length: 45 }, (_, index) => ({ id: `${index}`, label: `Malta ${index}` }));
    expect(picker.filtered).toHaveLength(40);
  });

  it('filtra por stock sin ocultar el ingrediente ya seleccionado', () => {
    picker.items = [
      { id: 'citra', label: 'Citra', inStock: true },
      { id: 'mosaic', label: 'Mosaic', inStock: false },
      { id: 'cascade', label: 'Cascade' },
    ];
    picker.stockOnly = true;
    expect(picker.filtered.map(item => item.id)).toEqual(['citra']);

    picker.writeValue('mosaic');
    expect(picker.filtered.map(item => item.id)).toEqual(['citra', 'mosaic']);
  });

  it('notifica selección, cambio y pérdida de foco', () => {
    const change = vi.fn();
    const touched = vi.fn();
    const emitted = vi.fn();
    picker.registerOnChange(change);
    picker.registerOnTouched(touched);
    picker.selectionChange.subscribe(emitted);
    picker.focus();
    picker.select(items[1]);

    expect(picker.value).toBe('mosaic');
    expect(picker.open).toBe(false);
    expect(change).toHaveBeenCalledWith('mosaic');
    expect(touched).toHaveBeenCalledOnce();
    expect(emitted).toHaveBeenCalledWith('mosaic');

    const child = document.createElement('span');
    host.appendChild(child);
    picker.open = true;
    picker.outside({ target: child } as unknown as MouseEvent);
    expect(picker.open).toBe(true);
    picker.outside({ target: document.body } as unknown as MouseEvent);
    expect(picker.open).toBe(false);
    expect(touched).toHaveBeenCalledTimes(2);
  });

  it('navega con teclado respetando los límites y permite cerrar', () => {
    picker.focus();
    const down = keyboard('ArrowDown');
    picker.keydown(down);
    picker.keydown(down);
    picker.keydown(down);
    expect(picker.activeIndex).toBe(2);
    expect(down.preventDefault).toHaveBeenCalled();

    picker.keydown(keyboard('ArrowUp'));
    expect(picker.activeIndex).toBe(1);
    picker.keydown(keyboard('Enter'));
    expect(picker.value).toBe('mosaic');
    picker.open = true;
    picker.keydown(keyboard('Escape'));
    expect(picker.open).toBe(false);
  });

  it('no abre cuando está deshabilitado y reinicia el foco al habilitarlo', () => {
    picker.setDisabledState(true);
    picker.focus();
    expect(picker.open).toBe(false);
    picker.setDisabledState(false);
    picker.query = 'anterior';
    picker.activeIndex = 2;
    picker.focus();
    expect(picker).toMatchObject({ open: true, query: '', activeIndex: 0 });
  });
});

function keyboard(key: string): KeyboardEvent {
  return { key, preventDefault: vi.fn() } as unknown as KeyboardEvent;
}
