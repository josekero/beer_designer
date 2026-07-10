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

  public record HopDto(
      String id,
      String name,
      String country,
      BigDecimal alphaAcids,
      BigDecimal betaAcids,
      String format,
      List<String> recommendedUse,
      List<String> aromas,
      String description,
      String imageUrl
  ) {}

  public record MaltDto(
      String id,
      String name,
      String type,
      BigDecimal potential,
      BigDecimal colorSrm,
      BigDecimal diastaticPower,
      BigDecimal maxRecommendedPercent,
      String description,
      String imageUrl
  ) {}

  public record YeastDto(
      String id,
      String name,
      String laboratory,
      String type,
      BigDecimal attenuationMin,
      BigDecimal attenuationMax,
      BigDecimal temperatureMin,
      BigDecimal temperatureMax,
      String flocculation,
      BigDecimal alcoholTolerance,
      String sensoryProfile,
      String imageUrl
  ) {}

  public record ImportResultDto(String type, int imported) {}
}
