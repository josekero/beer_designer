import { TestBed } from '@angular/core/testing';
import { BjcpStyle, Malt, Recipe, Yeast } from '../../models/brewing.models';
import { BrewingCalculatorService } from './brewing-calculator.service';

describe('BrewingCalculatorService', () => {
  let service: BrewingCalculatorService;
  const malt = { id: 'pale', potential: 1.037, colorSrm: 3 } as Malt;
  const yeast = { attenuationMin: 72, attenuationMax: 78 } as Yeast;
  const recipe = {
    batchVolumeL: 20,
    efficiencyPercent: 75,
    malts: [{ maltId: 'pale', amountKg: 5 }],
    hops: [{ type: 'lúpulo', amountG: 30, alphaAcids: 10, timeMin: 60, temperatureC: 100, use: 'hervido' }]
  } as Recipe;

  beforeEach(() => service = TestBed.inject(BrewingCalculatorService));

  it('calcula métricas cerveceras plausibles', () => {
    const metrics = service.calculate(recipe, [malt], yeast);
    expect(metrics.og).toBeGreaterThan(1.04);
    expect(metrics.fg).toBeLessThan(metrics.og);
    expect(metrics.abv).toBeGreaterThan(4);
    expect(metrics.ibu).toBeGreaterThan(0);
    expect(metrics.srm).toBeGreaterThan(0);
  });

  it('reduce la aportación de IBU en whirlpool y al bajar la temperatura', () => {
    const boiled = service.calculateHopIbu(recipe, recipe.hops[0], [malt]);
    const whirlpool:Recipe['hops'][number] = { ...recipe.hops[0], use: 'whirlpool', temperatureC: 80 };
    expect(service.calculateHopIbu(recipe, whirlpool, [malt])).toBeLessThan(boiled);
  });

  it('no atribuye IBU al dry hop ni a los adjuntos', () => {
    expect(service.calculateHopIbu(recipe, { ...recipe.hops[0], use: 'dry hop' }, [malt])).toBe(0);
    expect(service.calculateHopIbu(recipe, { ...recipe.hops[0], type: 'adjunto' }, [malt])).toBe(0);
  });

  it('aplica el porcentaje de utilización del equipo', () => {
    const full = service.calculateHopIbu(recipe, recipe.hops[0], [malt], 100);
    const half = service.calculateHopIbu(recipe, recipe.hops[0], [malt], 50);
    expect(half).toBeCloseTo(full / 2, 1);
  });

  it('considera inclusivos los límites del estilo', () => {
    const metrics = service.calculate(recipe, [malt], yeast);
    const style = { ogMin: metrics.og, ogMax: metrics.og, fgMin: 0, fgMax: 2, ibuMin: 0, ibuMax: 200, srmMin: 0, srmMax: 100, abvMin: 0, abvMax: 20 } as BjcpStyle;
    expect(service.compareToStyle(metrics, style).find(item => item.metric === 'og')?.inRange).toBe(true);
  });
});
