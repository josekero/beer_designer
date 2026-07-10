//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.brewday;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

public final class BrewDayDtos {
  private BrewDayDtos() {}

  public record BrewDayDto(
      String id,
      String recipeId,
      String recipeName,
      String title,
      String batchNumber,
      LocalDate brewDate,
      LocalTime startTime,
      LocalTime endTime,
      String status,
      String brewer,
      BigDecimal targetVolumeL,
      BigDecimal actualVolumeL,
      BigDecimal targetOg,
      BigDecimal actualOg,
      BigDecimal targetFg,
      BigDecimal actualFg,
      BigDecimal actualAbv,
      BigDecimal mashPh,
      String notes,
      List<BrewDayMaltDto> malts,
      List<BrewDayHopDto> hops,
      List<BrewDayEventDto> events,
      OffsetDateTime updatedAt
  ) {}

  public record BrewDayMaltDto(
      String ingredientName,
      BigDecimal plannedAmountKg,
      BigDecimal actualAmountKg,
      String substituteName,
      String notes
  ) {}

  public record BrewDayHopDto(
      String ingredientName,
      BigDecimal plannedAmountG,
      BigDecimal actualAmountG,
      Integer plannedTimeMin,
      Integer actualTimeMin,
      String use,
      String substituteName,
      String notes
  ) {}

  public record BrewDayEventDto(
      LocalTime eventTime,
      String type,
      String description,
      String value,
      String unit
  ) {}
}
