//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { Injectable } from '@angular/core';
import { BjcpStyle, Malt, Recipe, RecipeMetrics, StyleComparison, Yeast } from '../../models/brewing.models';

@Injectable({ providedIn: 'root' })
export class BrewingCalculatorService {
  calculate(recipe: Recipe, malts: Malt[], yeast?: Yeast, hopUtilizationPercent = 100): RecipeMetrics {
    const og = this.calculateOg(recipe, malts);
    const attenuation = yeast ? (yeast.attenuationMin + yeast.attenuationMax) / 2 / 100 : 0.75;
    const fg = this.roundGravity(1 + (og - 1) * (1 - attenuation));
    const abv = this.round((og - fg) * 131.25, 1);
    const ibu = this.calculateIbu(recipe, hopUtilizationPercent);
    const srm = this.calculateSrm(recipe, malts);
    return { og, fg, abv, ibu, srm };
  }

  compareToStyle(metrics: RecipeMetrics, style: BjcpStyle): StyleComparison[] {
    return [
      this.comparison('og', 'OG', metrics.og, style.ogMin, style.ogMax, 3),
      this.comparison('fg', 'FG', metrics.fg, style.fgMin, style.fgMax, 3),
      this.comparison('ibu', 'IBU', metrics.ibu, style.ibuMin, style.ibuMax, 0),
      this.comparison('srm', 'SRM', metrics.srm, style.srmMin, style.srmMax, 1),
      this.comparison('abv', 'ABV %', metrics.abv, style.abvMin, style.abvMax, 1)
    ];
  }

  private calculateOg(recipe: Recipe, malts: Malt[]): number {
    const volumeGallons = recipe.batchVolumeL / 3.78541;
    const efficiency = recipe.efficiencyPercent / 100;
    const totalPoints = recipe.malts.reduce((sum, item) => {
      const malt = malts.find((candidate) => candidate.id === item.maltId);
      if (!malt) {
        return sum;
      }

      // Gravity points: potential ppg * malt pounds * brewhouse efficiency / final gallons.
      const pounds = item.amountKg * 2.20462;
      const ppg = (malt.potential - 1) * 1000;
      return sum + ppg * pounds * efficiency;
    }, 0);

    return this.roundGravity(1 + totalPoints / Math.max(volumeGallons, 1) / 1000);
  }

  private calculateIbu(recipe: Recipe, hopUtilizationPercent: number): number {
    const volumeL = Math.max(recipe.batchVolumeL, 1);
    const gravityFactor = 1.65 * Math.pow(0.000125, recipe.batchVolumeL > 0 ? 0.05 : 0);

    return this.round(recipe.hops.reduce((sum, hop) => {
      if (hop.type === 'adjunto') return sum;
      if (hop.use === 'dry hop') {
        return sum;
      }

      const timeFactor = hop.use === 'whirlpool' ? 0.06 : (1 - Math.exp(-0.04 * hop.timeMin)) / 4.15;
      // Tinseth simplificado: AAU en mg/L multiplicado por utilizacion de tiempo y ajuste de gravedad.
      const utilization = gravityFactor * timeFactor * hopUtilizationPercent / 100;
      const ibu = hop.amountG * (hop.alphaAcids / 100) * utilization * 1000 / volumeL;
      return sum + ibu;
    }, 0), 0);
  }

  private calculateSrm(recipe: Recipe, malts: Malt[]): number {
    const volumeGallons = Math.max(recipe.batchVolumeL / 3.78541, 1);
    const mcu = recipe.malts.reduce((sum, item) => {
      const malt = malts.find((candidate) => candidate.id === item.maltId);
      if (!malt) {
        return sum;
      }

      // Morey approximation for beer color from malt color units.
      return sum + malt.colorSrm * item.amountKg * 2.20462 / volumeGallons;
    }, 0);
    return this.round(1.4922 * Math.pow(mcu, 0.6859), 1);
  }

  private comparison(metric: keyof RecipeMetrics, label: string, value: number, min: number, max: number, decimals: number): StyleComparison {
    return {
      metric,
      label,
      value,
      min,
      max,
      inRange: value >= min && value <= max,
      displayValue: value.toFixed(decimals),
      displayRange: `${min.toFixed(decimals)} - ${max.toFixed(decimals)}`
    };
  }

  private roundGravity(value: number): number {
    return this.round(value, 3);
  }

  private round(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }
}
