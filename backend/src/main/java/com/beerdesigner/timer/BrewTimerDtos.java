package com.beerdesigner.timer;

import java.util.List;

public final class BrewTimerDtos {
  private BrewTimerDtos() {}

  public record BrewTimerDto(String id, String label, String mode, int durationMinutes,
      int durationSeconds, int displaySeconds, int anchorSeconds, Long anchorEpochMs,
      boolean running, boolean completed) {}

  public record BrewTimerConfiguration(boolean initialized, List<BrewTimerDto> timers) {}
}
