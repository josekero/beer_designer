package com.beerdesigner.brewery;

import java.time.OffsetDateTime;

public final class BreweryDtos {
  private BreweryDtos() {}

  public record BreweryDto(
      String id,
      String name,
      String untappdUrl,
      String logoUrl,
      Integer logoWidth,
      Integer logoHeight,
      OffsetDateTime updatedAt
  ) {}
}
