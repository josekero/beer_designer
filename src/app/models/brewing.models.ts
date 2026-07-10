//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

export type HopFormat = 'pellet' | 'flor' | 'cryo';
export type HopUse = 'hervido' | 'whirlpool' | 'dry hop';
export type YeastType = 'ale' | 'lager' | 'kveik' | 'sour';
export type Flocculation = 'baja' | 'media' | 'alta';

export interface Hop {
  id: string;
  name: string;
  brand?: string;
  country: string;
  alphaAcids: number;
  betaAcids?: number;
  format: HopFormat;
  recommendedUse: HopUse[];
  aromas: string[];
  description: string;
  imageUrl?: string;
  distributorName?: string;
  distributorUrl?: string;
}

export interface Malt {
  id: string;
  name: string;
  brand?: string;
  type: string;
  potential: number;
  colorSrm: number;
  diastaticPower?: number;
  maxRecommendedPercent: number;
  description: string;
  imageUrl?: string;
  distributorName?: string;
  distributorUrl?: string;
}

export interface Yeast {
  id: string;
  name: string;
  brand?: string;
  laboratory?: string;
  type: YeastType;
  attenuationMin: number;
  attenuationMax: number;
  temperatureMin: number;
  temperatureMax: number;
  flocculation: Flocculation;
  alcoholTolerance: number;
  sensoryProfile: string;
  imageUrl?: string;
  distributorName?: string;
  distributorUrl?: string;
}

export interface Adjunct {
  id: string;
  name: string;
  brand?: string;
  category: string;
  format: string;
  recommendedUse: string[];
  dosageGuidance?: string;
  fermentabilityPercent?: number;
  allergens?: string;
  description: string;
  imageUrl?: string;
  distributorName?: string;
  distributorUrl?: string;
}

export interface AgingIngredient {
  id: string;
  name: string;
  brand?: string;
  type: string;
  woodType: string;
  previousUse?: string;
  origin?: string;
  barrelDetails?: string;
  intensity?: string;
  contactTimeDaysMin?: number;
  contactTimeDaysMax?: number;
  description: string;
  imageUrl?: string;
  distributorName?: string;
  distributorUrl?: string;
}

export interface WaterProfile {
  id: string;
  name: string;
  calcium: number;
  magnesium: number;
  sodium: number;
  sulfate: number;
  chloride: number;
  bicarbonate: number;
  targetPh: number;
  description: string;
}

export interface BjcpStyle {
  id: string;
  code: string;
  name: string;
  category: string;
  ogMin: number;
  ogMax: number;
  fgMin: number;
  fgMax: number;
  ibuMin: number;
  ibuMax: number;
  srmMin: number;
  srmMax: number;
  abvMin: number;
  abvMax: number;
  sensoryDescription: string;
}

export interface RecipeMalt {
  maltId: string;
  amountKg: number;
}

export interface RecipeHop {
  hopId: string;
  amountG: number;
  alphaAcids: number;
  timeMin: number;
  use: HopUse;
}

export interface WaterAddition {
  name: string;
  amountG: number;
}

export interface MashStep {
  name: string;
  temperatureC: number;
  timeMin: number;
}

export interface BoilStep {
  name: string;
  timeMin: number;
  description: string;
}

export interface FermentationPlan {
  primaryDays: number;
  primaryTempC: number;
  secondaryDays: number;
  secondaryTempC: number;
}

export interface DryHopPlan {
  enabled: boolean;
  days: number;
  temperatureC: number;
}

export interface PackagingPlan {
  maturationDays: number;
  carbonationVolumes: number;
  method: string;
}

export interface Recipe {
  id: string;
  name: string;
  styleId: string;
  batchVolumeL: number;
  efficiencyPercent: number;
  boilVolumeL: number;
  malts: RecipeMalt[];
  hops: RecipeHop[];
  yeastId: string;
  waterProfileId: string;
  waterAdditions: WaterAddition[];
  mashSteps: MashStep[];
  boilSteps: BoilStep[];
  fermentation: FermentationPlan;
  dryHop: DryHopPlan;
  packaging: PackagingPlan;
  notes: string;
  version?: number;
  updatedAt?: string;
}

export interface RecipeMetrics {
  og: number;
  fg: number;
  abv: number;
  ibu: number;
  srm: number;
}

export interface StyleComparison {
  metric: keyof RecipeMetrics;
  label: string;
  value: number;
  min: number;
  max: number;
  inRange: boolean;
  displayValue: string;
  displayRange: string;
}

export interface BrewDayMalt {
  ingredientName: string;
  plannedAmountKg?: number;
  actualAmountKg?: number;
  substituteName: string;
  notes: string;
}

export interface BrewDayHop {
  ingredientName: string;
  plannedAmountG?: number;
  actualAmountG?: number;
  plannedTimeMin?: number;
  actualTimeMin?: number;
  use: string;
  substituteName: string;
  notes: string;
}

export interface BrewDayEvent {
  eventTime?: string;
  type: string;
  description: string;
  value: string;
  unit: string;
}

export interface BrewDay {
  id: string;
  recipeId: string;
  recipeName?: string;
  title: string;
  batchNumber: string;
  brewDate: string;
  startTime: string;
  endTime: string;
  status: 'planificada' | 'en curso' | 'terminada' | 'cancelada';
  brewer: string;
  targetVolumeL?: number;
  actualVolumeL?: number;
  targetOg?: number;
  actualOg?: number;
  targetFg?: number;
  actualFg?: number;
  actualAbv?: number;
  mashPh?: number;
  notes: string;
  malts: BrewDayMalt[];
  hops: BrewDayHop[];
  events: BrewDayEvent[];
  updatedAt?: string;
}
