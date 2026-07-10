//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.catalog;

import java.math.BigDecimal;
import java.util.List;

public final class CatalogDtos {
  private CatalogDtos() {}

  public record AdjunctDto(
      String id,
      String name,
      String brand,
      String category,
      String format,
      List<String> recommendedUse,
      String dosageGuidance,
      BigDecimal fermentabilityPercent,
      String allergens,
      String description,
      String imageUrl,
      String distributorName,
      String distributorUrl
  ) {}

  public record AgingIngredientDto(
      String id,
      String name,
      String brand,
      String type,
      String woodType,
      String previousUse,
      String origin,
      String barrelDetails,
      String intensity,
      Integer contactTimeDaysMin,
      Integer contactTimeDaysMax,
      String description,
      String imageUrl,
      String distributorName,
      String distributorUrl
  ) {}

  public record HopDto(
      String id,
      String name,
      String brand,
      String country,
      BigDecimal alphaAcids,
      BigDecimal betaAcids,
      String format,
      List<String> recommendedUse,
      List<String> aromas,
      String description,
      String imageUrl,
      String distributorName,
      String distributorUrl
  ) {}

  public record MaltDto(
      String id,
      String name,
      String brand,
      String type,
      BigDecimal potential,
      BigDecimal colorSrm,
      BigDecimal diastaticPower,
      BigDecimal maxRecommendedPercent,
      String description,
      String imageUrl,
      String distributorName,
      String distributorUrl
  ) {}

  public record YeastDto(
      String id,
      String name,
      String brand,
      String laboratory,
      String type,
      BigDecimal attenuationMin,
      BigDecimal attenuationMax,
      BigDecimal temperatureMin,
      BigDecimal temperatureMax,
      String flocculation,
      BigDecimal alcoholTolerance,
      String sensoryProfile,
      String imageUrl,
      String distributorName,
      String distributorUrl
  ) {}

  public record ImportResultDto(String type, int imported) {}
}
