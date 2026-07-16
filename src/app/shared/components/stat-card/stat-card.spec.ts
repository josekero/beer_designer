import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  it('renders its label, numeric value and detail', async () => {
    await TestBed.configureTestingModule({ imports: [StatCard] }).compileComponents();
    const fixture = TestBed.createComponent(StatCard);
    fixture.componentRef.setInput('label', 'Recetas');
    fixture.componentRef.setInput('value', 12);
    fixture.componentRef.setInput('detail', '3 editadas esta semana');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('span')?.textContent).toContain('Recetas');
    expect(element.querySelector('strong')?.textContent).toContain('12');
    expect(element.querySelector('small')?.textContent).toContain('3 editadas esta semana');
  });
});
