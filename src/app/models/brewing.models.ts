//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

export type HopFormat = 'pellet' | 'flor' | 'cryo';
export type HopUse = 'first wort' | 'hervido' | 'whirlpool' | 'dry hop';
export type YeastType = 'ale' | 'lager' | 'kveik' | 'sour';
export type Flocculation = 'baja' | 'media' | 'alta';

export interface Hop {
  id: string;
  ownerId?: string;
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
  inStock?: boolean;
}

export interface Malt {
  id: string;
  ownerId?: string;
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
  inStock?: boolean;
}

export interface Yeast {
  id: string;
  ownerId?: string;
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
  inStock?: boolean;
}

export interface Adjunct {
  id: string;
  ownerId?: string;
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
  inStock?: boolean;
}

export interface AgingIngredient {
  id: string;
  ownerId?: string;
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
  inStock?: boolean;
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
export interface BrewingSalt{id:string;ownerId?:string;name:string;formula:string;category:string;calciumPercent:number;magnesiumPercent:number;sodiumPercent:number;sulfatePercent:number;chloridePercent:number;bicarbonatePercent:number;description:string;brand?:string;distributorName?:string;inStock?:boolean;}
export type IngredientCatalogType='hops'|'malts'|'yeasts'|'adjuncts'|'salts'|'aging';
export interface IngredientStock {ingredientType:IngredientCatalogType;ingredientId:string;inStock:boolean;}

export interface ApplicationUser {
  id:string; email:string; displayName:string; role:'USER'|'ADMIN'; avatarKind:'gallery'|'upload';
  avatarValue:string; passwordChangeRequired:boolean; createdAt:string;
}
export interface AdminUser extends ApplicationUser {enabled:boolean;lastSeenAt?:string;recipes:number;}
export interface AdminSummary {users:number;recipes:number;brewDays:number;activeUsers:number;ingredients:number;}
export interface CommunityRecipe {id:string;name:string;brewer?:string;styleId?:string;batchVolumeL?:number;glasswareId?:string;srm?:number;notes?:string;version:number;updatedAt:string;authorName:string;authorAvatarKind:'gallery'|'upload';authorAvatarValue:string;publicRecipe:boolean;template:boolean;likeCount:number;copyCount:number;likedByCurrentUser:boolean;}
export interface CommunityRecipePage {items:CommunityRecipe[];totalElements:number;page:number;size:number;totalPages:number;}
export interface CommunityRecipeDetail {recipe:Recipe;}
export interface RecipeEngagement {likeCount:number;copyCount:number;likedByCurrentUser:boolean;}
export interface CommunityCopyResult {id:string;copyCount:number;}
export interface CommunityMember {displayName:string;avatarKind:'gallery'|'upload';avatarValue:string;joinedAt:string;}
export interface CommunityIngredient {type:IngredientCatalogType;id:string;name:string;brand?:string;description:string;detail:string;publishedAt?:string;authorName:string;authorAvatarKind:'gallery'|'upload';authorAvatarValue:string;ownedByCurrentUser:boolean;publicIngredient:boolean;}
export interface CommunityView {latestRecipes:CommunityRecipe[];templates:CommunityRecipe[];myRecipes:CommunityRecipe[];sharedIngredients:CommunityIngredient[];myIngredients:CommunityIngredient[];recentMembers:CommunityMember[];memberCount:number;activeUsers:number;publicRecipeCount:number;templateCount:number;sharedIngredientCount:number;}
export interface AdminRecipe {id:string;name:string;ownerName:string;publicRecipe:boolean;template:boolean;updatedAt:string;}

export interface EquipmentProfile {
  id:string; name:string; batchVolumeL:number; boilVolumeL:number; efficiencyPercent:number;
  boilOffLPerHour:number; mashTunDeadspaceL:number; trubChillerLossL:number; fermentationLossL:number;
  hopUtilizationPercent:number; notes:string;
  mashTunVolumeL:number; kettleVolumeL:number; fermenterVolumeL:number;
}
export interface MashProfile {id:string;name:string;mashTempC:number;mashTimeMin:number;mashOutTempC:number;mashOutTimeMin:number;notes:string;}
export interface CarbonationProfile {id:string;name:string;method:string;targetVolumes:number;temperatureC:number;pressureBar:number;notes:string;}
export interface FermentationProfile {id:string;name:string;primaryDays:number;primaryTempC:number;secondaryDays:number;secondaryTempC:number;maturationDays:number;maturationTempC:number;notes:string;}
export interface RecipeFolder {id:string;name:string;sortOrder:number;isDefault:boolean;recipeIds:string[];}

export interface BjcpStyle {
  id: string;
  code: string;
  name: string;
  category: string;
  ogMin: number;
  ogMax: number;
  fgMin: number;
  fgMax: number;
  ibuMin: number | null;
  ibuMax: number | null;
  srmMin: number | null;
  srmMax: number | null;
  abvMin: number;
  abvMax: number;
  sensoryDescription: string;
  sensoryDescriptionEs: string | null;
}

export interface RecipeMalt {
  maltId: string;
  amountKg: number;
  notes: string;
}

export interface RecipeProcessAddition {
  name: string; brand: string; amountG: number;
  stage: 'hervido' | 'whirlpool' | 'fermentación' | 'dry hop' | 'envasado';
  timeMin?: number; temperatureC?: number; dayLabel: string; notes: string;
}

export interface WaterTreatment {
  calcium: number; magnesium: number; sodium: number; sulfate: number; chloride: number; bicarbonate: number;
  mashPh: number; spargePh: number; notes: string;
}

export interface RecipeHop {
  type?: 'lúpulo'|'adjunto'; hopId?: string; adjunctId?:string;
  amountG: number;
  alphaAcids: number;
  timeMin: number;
  temperatureC?:number;
  use: HopUse;
  notes?:string;
}
export interface RecipeYeast { yeastId:string; format:'seca'|'líquida'; amount:number; unit:'g'|'ml'|'paquetes'; pitchTempC:number; starterVolumeL:number; notes:string; }
export interface RecipeMaturationAddition { type:'lúpulo'|'adjunto'; hopId?:string; adjunctId?:string; name:string; batch:string; amount:number; unit:'g'|'kg'|'ml'; addDay:number; contactDays:number; temperatureC:number; notes:string; }
export interface RecipeFermentationStep {stage:'primaria'|'secundaria'|'cold crash'|'estabilización'|'maduración'|'otra';startDay:number;durationDays:number;temperatureC:number;notes:string;}

export interface WaterAddition {
  saltId?:string;
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
  brewer: string;
  untappdUrl?: string;
  equipmentProfileId?: string;
  mashProfileId?: string;
  carbonationProfileId?: string;
  fermentationProfileId?: string;
  glasswareId?: string;
  styleId: string;
  batchVolumeL: number;
  efficiencyPercent: number;
  boilVolumeL: number;
  malts: RecipeMalt[];
  hops: RecipeHop[];
  yeastId: string;
  yeasts: RecipeYeast[];
  waterProfileId: string;
  waterAdditions: WaterAddition[];
  mashSteps: MashStep[];
  boilSteps: BoilStep[];
  processAdditions: RecipeProcessAddition[];
  maturationAdditions: RecipeMaturationAddition[];
  waterTreatment: WaterTreatment;
  fermentation: FermentationPlan;
  fermentationSteps:RecipeFermentationStep[];
  dryHop: DryHopPlan;
  packaging: PackagingPlan;
  notes: string;
  version?: number;
  updatedAt?: string;
  image?: RecipeImage;
}

export interface RecipeImage {
  url: string;
  originalName: string;
  contentType: 'image/jpeg' | 'image/png';
  sizeBytes: number;
  width: number;
  height: number;
  uploadedAt: string;
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
  plannedPercent?: number;
  lotNumber?: string;
}

export interface BrewDayAddition {
  ingredientName: string; brand: string; plannedAmountG?: number; actualAmountG?: number;
  stage: string; plannedTimeMin?: number; actualTimeMin?: number; temperatureC?: number; dayLabel: string; notes: string; lotNumber?:string;
}

export interface BrewDayHop {
  ingredientName: string;
  plannedAmountG?: number;
  actualAmountG?: number;
  plannedTimeMin?: number;
  actualTimeMin?: number;
  plannedTemperatureC?:number;
  actualTemperatureC?:number;
  use: string;
  substituteName: string;
  notes: string;
  lotNumber?:string;
}

export interface BrewDayYeast {ingredientName:string;plannedAmount?:number;actualAmount?:number;unit:string;lotNumber:string;pitchTempC?:number;notes:string;}

export interface BrewDayEvent {
  eventTime?: string;
  type: string;
  description: string;
  value: string;
  unit: string;
}

export interface BrewDayTask {
  taskDate: string;
  taskTime: string;
  type: 'dry hop' | 'adjunto' | 'cold crash' | 'trasiego' | 'envasado' | 'tarea';
  title: string;
  status: 'pendiente' | 'completada' | 'cancelada';
  notes: string;
}

export interface Brewery {
  id: string;
  name: string;
  untappdUrl: string;
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  updatedAt?: string;
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
  breweryId?: string;
  breweryName?: string;
  breweryUntappdUrl?: string;
  breweryLogoUrl?: string;
  targetVolumeL?: number;
  actualVolumeL?: number;
  targetOg?: number;
  actualOg?: number;
  targetFg?: number;
  actualFg?: number;
  actualAbv?: number;
  mashPh?: number;
  spargePh?: number;
  waterCalcium?: number; waterMagnesium?: number; waterSodium?: number; waterSulfate?: number;
  waterChloride?: number; waterBicarbonate?: number; waterNotes?: string;
  notes: string;
  malts: BrewDayMalt[];
  hops: BrewDayHop[];
  yeasts:BrewDayYeast[];
  additions: BrewDayAddition[];
  events: BrewDayEvent[];
  tasks: BrewDayTask[];
  updatedAt?: string;
}

export type BrewTimerMode = 'countdown' | 'stopwatch';

export interface BrewTimerPreference {
  id: string;
  label: string;
  mode: BrewTimerMode;
  durationMinutes: number;
  durationSeconds: number;
  displaySeconds: number;
  anchorSeconds: number;
  anchorEpochMs: number | null;
  running: boolean;
  completed: boolean;
}

export interface BrewTimerConfiguration {
  initialized: boolean;
  timers: BrewTimerPreference[];
}
