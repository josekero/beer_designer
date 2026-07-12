//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.recipe;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public final class RecipeDtos {
  private RecipeDtos() {}

  public record RecipeSummaryDto(
      String id,
      String name,
      String brewer,
      String untappdUrl,
      String equipmentProfileId,
      String mashProfileId,
      String carbonationProfileId,
      String fermentationProfileId,
      String styleId,
      BigDecimal batchVolumeL,
      BigDecimal efficiencyPercent,
      String yeastId,
      String waterProfileId,
      String notes,
      Integer version,
      OffsetDateTime updatedAt,
      RecipeImageDto image
  ) {}

  public record RecipeDetailDto(
      String id,
      String name,
      String brewer,
      String untappdUrl,
      String equipmentProfileId,
      String mashProfileId,
      String carbonationProfileId,
      String fermentationProfileId,
      String styleId,
      BigDecimal batchVolumeL,
      BigDecimal efficiencyPercent,
      BigDecimal boilVolumeL,
      String yeastId,
      String waterProfileId,
      List<RecipeMaltDto> malts,
      List<RecipeHopDto> hops,
      List<RecipeWaterAdditionDto> waterAdditions,
      List<RecipeMashStepDto> mashSteps,
      List<RecipeBoilStepDto> boilSteps,
      List<RecipeProcessAdditionDto> processAdditions,
      WaterTreatmentDto waterTreatment,
      FermentationDto fermentation,
      DryHopDto dryHop,
      PackagingDto packaging,
      String notes,
      Integer version,
      OffsetDateTime updatedAt,
      RecipeImageDto image
  ) {}

  public record RecipeImageDto(String url, String originalName, String contentType, Long sizeBytes, Integer width, Integer height, OffsetDateTime uploadedAt) {}

  public record RecipeMaltDto(String maltId, BigDecimal amountKg, String notes) {}
  public record RecipeHopDto(String hopId, BigDecimal amountG, BigDecimal alphaAcids, Integer timeMin, String use) {}
  public record RecipeWaterAdditionDto(String name, BigDecimal amountG) {}
  public record RecipeMashStepDto(String name, BigDecimal temperatureC, Integer timeMin) {}
  public record RecipeBoilStepDto(String name, Integer timeMin, String description) {}
  public record RecipeProcessAdditionDto(String name, String brand, BigDecimal amountG, String stage, Integer timeMin, BigDecimal temperatureC, String dayLabel, String notes) {}
  public record WaterTreatmentDto(BigDecimal calcium, BigDecimal magnesium, BigDecimal sodium, BigDecimal sulfate, BigDecimal chloride, BigDecimal bicarbonate, BigDecimal mashPh, BigDecimal spargePh, String notes) {}
  public record FermentationDto(Integer primaryDays, BigDecimal primaryTempC, Integer secondaryDays, BigDecimal secondaryTempC) {}
  public record DryHopDto(Boolean enabled, Integer days, BigDecimal temperatureC) {}
  public record PackagingDto(Integer maturationDays, BigDecimal carbonationVolumes, String method) {}
}
