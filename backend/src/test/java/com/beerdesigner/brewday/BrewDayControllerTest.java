package com.beerdesigner.brewday;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beerdesigner.brewday.BrewDayDtos.BrewDayDto;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class BrewDayControllerTest {
  private final BrewDayService service = mock(BrewDayService.class);
  private final BrewDayController controller = new BrewDayController(service);

  @Test
  void delegatesEveryOperationToTheService() {
    LocalDate from = LocalDate.parse("2026-07-01");
    LocalDate to = LocalDate.parse("2026-07-31");
    BrewDayDto sheet = mock(BrewDayDto.class);
    when(service.findBetween(from, to)).thenReturn(List.of(sheet));
    when(service.findById("brew-1")).thenReturn(sheet);
    when(service.save("brew-1", sheet)).thenReturn(sheet);

    assertThat(controller.brewDays(from, to)).containsExactly(sheet);
    assertThat(controller.brewDay("brew-1")).isSameAs(sheet);
    assertThat(controller.save("brew-1", sheet)).isSameAs(sheet);
    controller.delete("brew-1");
    verify(service).delete("brew-1");
  }
}
