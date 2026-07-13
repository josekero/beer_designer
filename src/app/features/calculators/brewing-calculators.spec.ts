import { FormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { BrewingCalculators } from './brewing-calculators';

describe('BrewingCalculators', () => {
  let calculators: BrewingCalculators;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FormBuilder] });
    calculators = TestBed.runInInjectionContext(() => new BrewingCalculators());
  });

  it('calcula alcohol, atenuación y evita resultados negativos', () => {
    let result = { abv: 0, attenuation: 0, fermentedPoints: 0 };
    const subscription = calculators.abvResult$.subscribe(value => result = value);
    expect(result).toEqual({ abv: 5.38, attenuation: 78.8, fermentedPoints: 41 });

    calculators.abvForm.setValue({ og: 1, fg: 1.01 });
    expect(result).toEqual({ abv: -1.31, attenuation: 0, fermentedPoints: 0 });
    subscription.unsubscribe();
  });

  it('corrige la lectura del hidrómetro según la temperatura', () => {
    let result = { corrected: 0, pointsDelta: 0 };
    const subscription = calculators.temperatureResult$.subscribe(value => result = value);
    expect(result.corrected).toBeGreaterThan(1.05);
    expect(result.pointsDelta).toBeGreaterThan(0);

    calculators.temperatureForm.setValue({ reading: 1.05, sampleTempC: 20, calibrationTempC: 20 });
    expect(result).toEqual({ corrected: 1.05, pointsDelta: 0 });
    subscription.unsubscribe();
  });

  it('calcula priming para sacarosa y dextrosa sin generar CO2 negativo', () => {
    let result = { residualCo2: 0, co2ToAdd: 0, grams: 0, gramsPerLiter: 0 };
    const subscription = calculators.primingResult$.subscribe(value => result = value);
    const sucrose = result.grams;
    calculators.primingForm.controls.sugarType.setValue('dextrose');
    expect(result.grams).toBeGreaterThan(sucrose);

    calculators.primingForm.patchValue({ targetCo2: 0, volumeL: 0 });
    expect(result.co2ToAdd).toBe(0);
    expect(result.gramsPerLiter).toBe(0);
    subscription.unsubscribe();
  });

  it('conserva los puntos al diluir y nunca propone quitar agua', () => {
    let result = { finalVolume: 0, waterToAdd: 0 };
    const subscription = calculators.dilutionResult$.subscribe(value => result = value);
    expect(result).toEqual({ finalVolume: 22.5, waterToAdd: 4.5 });

    calculators.dilutionForm.patchValue({ currentGravity: 1.04, targetGravity: 1.06 });
    expect(result.waterToAdd).toBe(0);
    calculators.dilutionForm.controls.targetGravity.setValue(1);
    expect(result.finalVolume).toBeGreaterThan(100);
    subscription.unsubscribe();
  });

  it('calcula eficiencia y permite cambiar de calculadora', () => {
    let result = { collectedPoints: 0, potentialPoints: 0, efficiency: 0 };
    const subscription = calculators.efficiencyResult$.subscribe(value => result = value);
    expect(result.collectedPoints).toBeGreaterThan(0);
    expect(result.potentialPoints).toBeGreaterThan(0);
    expect(result.efficiency).toBeGreaterThan(0);

    calculators.efficiencyForm.controls.averagePotential.setValue(1);
    expect(result.efficiency).toBe(0);
    calculators.select('efficiency');
    expect(calculators.selectedControl.value).toBe('efficiency');
    expect(calculators.calculators).toHaveLength(5);
    subscription.unsubscribe();
  });
});
