//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { map, startWith } from 'rxjs';
import { UiTranslatePipe } from '../../shared/pipes/ui-translate.pipe';

type CalculatorKey = 'abv' | 'temperature' | 'priming' | 'dilution' | 'efficiency';

interface CalculatorOption {
  key: CalculatorKey;
  name: string;
  eyebrow: string;
  description: string;
}

@Component({
  selector: 'app-brewing-calculators',
  imports: [AsyncPipe, DecimalPipe, ReactiveFormsModule, UiTranslatePipe],
  templateUrl: './brewing-calculators.html',
  styleUrl: './brewing-calculators.scss'
})
export class BrewingCalculators {
  private readonly fb = inject(FormBuilder);

  readonly calculators: CalculatorOption[] = [
    {
      key: 'abv',
      name: 'Alcohol y atenuación',
      eyebrow: 'OG + FG',
      description: 'Estima ABV, atenuación aparente y puntos fermentados.'
    },
    {
      key: 'temperature',
      name: 'Corrección de densidad',
      eyebrow: 'Hidrómetro',
      description: 'Ajusta una lectura tomada a temperatura distinta de calibración.'
    },
    {
      key: 'priming',
      name: 'Azúcar de carbonatación',
      eyebrow: 'Priming',
      description: 'Calcula gramos aproximados de azúcar para botella o barril.'
    },
    {
      key: 'dilution',
      name: 'Dilución de mosto',
      eyebrow: 'Volumen + gravedad',
      description: 'Calcula agua a añadir para alcanzar una densidad objetivo.'
    },
    {
      key: 'efficiency',
      name: 'Eficiencia de macerado',
      eyebrow: 'Pre-hervido',
      description: 'Estima eficiencia usando volumen, densidad y grano total.'
    }
  ];

  readonly selectedControl = this.fb.nonNullable.control<CalculatorKey>('abv');

  readonly abvForm = this.fb.nonNullable.group({
    og: [1.052],
    fg: [1.011]
  });

  readonly temperatureForm = this.fb.nonNullable.group({
    reading: [1.050],
    sampleTempC: [28],
    calibrationTempC: [20]
  });

  readonly primingForm = this.fb.nonNullable.group({
    volumeL: [20],
    beerTempC: [20],
    targetCo2: [2.4],
    sugarType: ['sucrose' as 'sucrose' | 'dextrose']
  });

  readonly dilutionForm = this.fb.nonNullable.group({
    currentVolumeL: [18],
    currentGravity: [1.060],
    targetGravity: [1.048]
  });

  readonly efficiencyForm = this.fb.nonNullable.group({
    wortVolumeL: [25],
    gravity: [1.046],
    grainKg: [5],
    averagePotential: [1.037]
  });

  readonly abvResult$ = this.abvForm.valueChanges.pipe(
    startWith(this.abvForm.getRawValue()),
    map((value) => {
      const og = this.gravity(value.og);
      const fg = this.gravity(value.fg);
      const fermentedPoints = Math.max((og - fg) * 1000, 0);

      // Formula clasica de homebrewing para ABV estimado: diferencia de gravedad * 131.25.
      const abv = (og - fg) * 131.25;
      const attenuation = og > 1 ? ((og - fg) / (og - 1)) * 100 : 0;

      return {
        abv: this.round(abv, 2),
        attenuation: this.round(attenuation, 1),
        fermentedPoints: this.round(fermentedPoints, 1)
      };
    })
  );

  readonly temperatureResult$ = this.temperatureForm.valueChanges.pipe(
    startWith(this.temperatureForm.getRawValue()),
    map((value) => {
      const reading = this.gravity(value.reading);
      const sampleTempF = this.celsiusToFahrenheit(value.sampleTempC);
      const calibrationTempF = this.celsiusToFahrenheit(value.calibrationTempC);

      // Correccion de hidrometro por temperatura usando polinomio habitual en Fahrenheit.
      const corrected = reading * this.waterDensityFactor(sampleTempF) / this.waterDensityFactor(calibrationTempF);
      return {
        corrected: this.round(corrected, 3),
        pointsDelta: this.round((corrected - reading) * 1000, 1)
      };
    })
  );

  readonly primingResult$ = this.primingForm.valueChanges.pipe(
    startWith(this.primingForm.getRawValue()),
    map((value) => {
      const residualCo2 = this.residualCo2(value.beerTempC);
      const co2ToAdd = Math.max(value.targetCo2 - residualCo2, 0);
      const gramsPerLiterPerVolume = value.sugarType === 'sucrose' ? 3.85 : 4.05;

      // Cada volumen de CO2 requiere aprox. 3.85 g/L de sacarosa o 4.05 g/L de dextrosa.
      const grams = value.volumeL * co2ToAdd * gramsPerLiterPerVolume;
      return {
        residualCo2: this.round(residualCo2, 2),
        co2ToAdd: this.round(co2ToAdd, 2),
        grams: this.round(grams, 0),
        gramsPerLiter: this.round(grams / Math.max(value.volumeL, 1), 1)
      };
    })
  );

  readonly dilutionResult$ = this.dilutionForm.valueChanges.pipe(
    startWith(this.dilutionForm.getRawValue()),
    map((value) => {
      const currentPoints = this.gravityPoints(value.currentGravity);
      const targetPoints = Math.max(this.gravityPoints(value.targetGravity), 1);

      // Conservacion de puntos de gravedad: puntos actuales * volumen actual = puntos objetivo * volumen final.
      const finalVolume = value.currentVolumeL * currentPoints / targetPoints;
      const waterToAdd = Math.max(finalVolume - value.currentVolumeL, 0);

      return {
        finalVolume: this.round(finalVolume, 1),
        waterToAdd: this.round(waterToAdd, 1)
      };
    })
  );

  readonly efficiencyResult$ = this.efficiencyForm.valueChanges.pipe(
    startWith(this.efficiencyForm.getRawValue()),
    map((value) => {
      const volumeGal = value.wortVolumeL / 3.78541;
      const grainLb = value.grainKg * 2.20462;
      const collectedPoints = this.gravityPoints(value.gravity) * volumeGal;
      const potentialPoints = this.gravityPoints(value.averagePotential) * grainLb;

      // Eficiencia = puntos recogidos en el mosto / puntos teoricos del grano.
      const efficiency = potentialPoints > 0 ? collectedPoints / potentialPoints * 100 : 0;

      return {
        collectedPoints: this.round(collectedPoints, 0),
        potentialPoints: this.round(potentialPoints, 0),
        efficiency: this.round(efficiency, 1)
      };
    })
  );

  select(key: CalculatorKey): void {
    this.selectedControl.setValue(key);
  }

  private gravity(value: number): number {
    return Math.max(Number(value) || 0, 0);
  }

  private gravityPoints(gravity: number): number {
    return Math.max((this.gravity(gravity) - 1) * 1000, 0);
  }

  private residualCo2(tempC: number): number {
    const tempF = this.celsiusToFahrenheit(tempC);
    return 3.0378 - 0.050062 * tempF + 0.00026555 * tempF * tempF;
  }

  private waterDensityFactor(tempF: number): number {
    return 1.00130346 - 0.000134722124 * tempF + 0.00000204052596 * tempF ** 2 - 0.00000000232820948 * tempF ** 3;
  }

  private celsiusToFahrenheit(tempC: number): number {
    return tempC * 9 / 5 + 32;
  }

  private round(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }
}
