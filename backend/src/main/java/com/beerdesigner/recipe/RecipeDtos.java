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
      String styleId,
      BigDecimal batchVolumeL,
      BigDecimal efficiencyPercent,
      String yeastId,
      String waterProfileId,
      String notes,
      Integer version,
      OffsetDateTime updatedAt
  ) {}

  public record RecipeDetailDto(
      String id,
      String name,
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
      FermentationDto fermentation,
      DryHopDto dryHop,
      PackagingDto packaging,
      String notes,
      Integer version,
      OffsetDateTime updatedAt
  ) {}

  public record RecipeMaltDto(String maltId, BigDecimal amountKg) {}
  public record RecipeHopDto(String hopId, BigDecimal amountG, BigDecimal alphaAcids, Integer timeMin, String use) {}
  public record RecipeWaterAdditionDto(String name, BigDecimal amountG) {}
  public record RecipeMashStepDto(String name, BigDecimal temperatureC, Integer timeMin) {}
  public record RecipeBoilStepDto(String name, Integer timeMin, String description) {}
  public record FermentationDto(Integer primaryDays, BigDecimal primaryTempC, Integer secondaryDays, BigDecimal secondaryTempC) {}
  public record DryHopDto(Boolean enabled, Integer days, BigDecimal temperatureC) {}
  public record PackagingDto(Integer maturationDays, BigDecimal carbonationVolumes, String method) {}
}
