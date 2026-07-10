import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { BjcpStyle, Hop, Malt, Recipe, WaterProfile, Yeast } from '../../models/brewing.models';

@Injectable({ providedIn: 'root' })
export class XmlRepositoryService {
  private readonly http = inject(HttpClient);
  private readonly parser = new DOMParser();

  getHops(): Observable<Hop[]> {
    return this.loadXml('assets/data/hops.xml').pipe(
      map((xml) => this.nodes(xml, 'hop').map((node) => ({
        id: this.attr(node, 'id'),
        name: this.text(node, 'name'),
        country: this.text(node, 'country'),
        alphaAcids: this.num(node, 'alphaAcids'),
        betaAcids: this.optionalNum(node, 'betaAcids'),
        format: this.text(node, 'format') as Hop['format'],
        recommendedUse: this.text(node, 'recommendedUse').split(',').map((item) => item.trim() as Hop['recommendedUse'][number]),
        aromas: this.text(node, 'aromas').split(',').map((item) => item.trim()),
        description: this.text(node, 'description')
      }))),
      shareReplay(1)
    );
  }

  getMalts(): Observable<Malt[]> {
    return this.loadXml('assets/data/malts.xml').pipe(
      map((xml) => this.nodes(xml, 'malt').map((node) => ({
        id: this.attr(node, 'id'),
        name: this.text(node, 'name'),
        type: this.text(node, 'type'),
        potential: this.num(node, 'potential'),
        colorSrm: this.num(node, 'colorSrm'),
        diastaticPower: this.optionalNum(node, 'diastaticPower'),
        maxRecommendedPercent: this.num(node, 'maxRecommendedPercent'),
        description: this.text(node, 'description')
      }))),
      shareReplay(1)
    );
  }

  getYeasts(): Observable<Yeast[]> {
    return this.loadXml('assets/data/yeasts.xml').pipe(
      map((xml) => this.nodes(xml, 'yeast').map((node) => ({
        id: this.attr(node, 'id'),
        name: this.text(node, 'name'),
        laboratory: this.optionalText(node, 'laboratory'),
        type: this.text(node, 'type') as Yeast['type'],
        attenuationMin: this.num(node, 'attenuationMin'),
        attenuationMax: this.num(node, 'attenuationMax'),
        temperatureMin: this.num(node, 'temperatureMin'),
        temperatureMax: this.num(node, 'temperatureMax'),
        flocculation: this.text(node, 'flocculation') as Yeast['flocculation'],
        alcoholTolerance: this.num(node, 'alcoholTolerance'),
        sensoryProfile: this.text(node, 'sensoryProfile')
      }))),
      shareReplay(1)
    );
  }

  getWaterProfiles(): Observable<WaterProfile[]> {
    return this.loadXml('assets/data/water-profiles.xml').pipe(
      map((xml) => this.nodes(xml, 'profile').map((node) => ({
        id: this.attr(node, 'id'),
        name: this.text(node, 'name'),
        calcium: this.num(node, 'calcium'),
        magnesium: this.num(node, 'magnesium'),
        sodium: this.num(node, 'sodium'),
        sulfate: this.num(node, 'sulfate'),
        chloride: this.num(node, 'chloride'),
        bicarbonate: this.num(node, 'bicarbonate'),
        targetPh: this.num(node, 'targetPh'),
        description: this.text(node, 'description')
      }))),
      shareReplay(1)
    );
  }

  getStyles(): Observable<BjcpStyle[]> {
    return this.loadXml('assets/data/bjcp-styles.xml').pipe(
      map((xml) => this.nodes(xml, 'style').map((node) => ({
        id: this.attr(node, 'id'),
        code: this.text(node, 'code'),
        name: this.text(node, 'name'),
        category: this.text(node, 'category'),
        ogMin: this.num(node, 'ogMin'),
        ogMax: this.num(node, 'ogMax'),
        fgMin: this.num(node, 'fgMin'),
        fgMax: this.num(node, 'fgMax'),
        ibuMin: this.num(node, 'ibuMin'),
        ibuMax: this.num(node, 'ibuMax'),
        srmMin: this.num(node, 'srmMin'),
        srmMax: this.num(node, 'srmMax'),
        abvMin: this.num(node, 'abvMin'),
        abvMax: this.num(node, 'abvMax'),
        sensoryDescription: this.text(node, 'sensoryDescription')
      }))),
      shareReplay(1)
    );
  }

  getRecipes(): Observable<Recipe[]> {
    return this.loadXml('assets/data/recipes.xml').pipe(
      map((xml) => this.nodes(xml, 'recipe').map((node) => this.parseRecipe(node))),
      shareReplay(1)
    );
  }

  private loadXml(path: string): Observable<Document> {
    return this.http.get(path, { responseType: 'text' }).pipe(map((body) => this.parser.parseFromString(body, 'text/xml')));
  }

  private parseRecipe(node: Element): Recipe {
    const waterAdditions = this.nodes(node, 'waterAddition').map((item) => ({
      name: this.attr(item, 'name'),
      amountG: Number(this.attr(item, 'amountG'))
    }));

    return {
      id: this.attr(node, 'id'),
      name: this.text(node, 'name'),
      styleId: this.text(node, 'styleId'),
      batchVolumeL: this.num(node, 'batchVolumeL'),
      efficiencyPercent: this.num(node, 'efficiencyPercent'),
      boilVolumeL: this.num(node, 'boilVolumeL'),
      malts: this.nodes(node, 'recipeMalt').map((item) => ({ maltId: this.attr(item, 'maltId'), amountKg: Number(this.attr(item, 'amountKg')) })),
      hops: this.nodes(node, 'recipeHop').map((item) => ({
        hopId: this.attr(item, 'hopId'),
        amountG: Number(this.attr(item, 'amountG')),
        alphaAcids: Number(this.attr(item, 'alphaAcids')),
        timeMin: Number(this.attr(item, 'timeMin')),
        use: this.attr(item, 'use') as Recipe['hops'][number]['use']
      })),
      yeastId: this.text(node, 'yeastId'),
      waterProfileId: this.text(node, 'waterProfileId'),
      waterAdditions,
      mashSteps: this.nodes(node, 'mashStep').map((item) => ({
        name: this.attr(item, 'name'),
        temperatureC: Number(this.attr(item, 'temperatureC')),
        timeMin: Number(this.attr(item, 'timeMin'))
      })),
      boilSteps: this.nodes(node, 'boilStep').map((item) => ({
        name: this.attr(item, 'name'),
        timeMin: Number(this.attr(item, 'timeMin')),
        description: this.attr(item, 'description')
      })),
      fermentation: {
        primaryDays: this.num(node, 'primaryDays'),
        primaryTempC: this.num(node, 'primaryTempC'),
        secondaryDays: this.num(node, 'secondaryDays'),
        secondaryTempC: this.num(node, 'secondaryTempC')
      },
      dryHop: {
        enabled: this.text(node, 'dryHopEnabled') === 'true',
        days: this.num(node, 'dryHopDays'),
        temperatureC: this.num(node, 'dryHopTempC')
      },
      packaging: {
        maturationDays: this.num(node, 'maturationDays'),
        carbonationVolumes: this.num(node, 'carbonationVolumes'),
        method: this.text(node, 'packagingMethod')
      },
      notes: this.text(node, 'notes')
    };
  }

  private nodes(root: Document | Element, tagName: string): Element[] {
    return Array.from(root.getElementsByTagName(tagName));
  }

  private text(root: Element, tagName: string): string {
    return root.getElementsByTagName(tagName)[0]?.textContent?.trim() ?? '';
  }

  private optionalText(root: Element, tagName: string): string | undefined {
    const value = this.text(root, tagName);
    return value ? value : undefined;
  }

  private num(root: Element, tagName: string): number {
    return Number(this.text(root, tagName));
  }

  private optionalNum(root: Element, tagName: string): number | undefined {
    const value = this.text(root, tagName);
    return value ? Number(value) : undefined;
  }

  private attr(root: Element, attrName: string): string {
    return root.getAttribute(attrName) ?? '';
  }
}
