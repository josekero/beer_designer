package com.beerdesigner.timer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beerdesigner.timer.BrewTimerDtos.BrewTimerConfiguration;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class BrewTimerControllerTest {
  @Test
  void delegatesReadingAndSavingTheCurrentUsersConfiguration() {
    BrewTimerService service = Mockito.mock(BrewTimerService.class);
    var configuration = new BrewTimerConfiguration(true, List.of());
    when(service.configuration()).thenReturn(configuration);
    when(service.save(List.of())).thenReturn(configuration);
    var controller = new BrewTimerController(service);

    assertThat(controller.configuration()).isSameAs(configuration);
    assertThat(controller.save(List.of())).isSameAs(configuration);
    verify(service).save(List.of());
  }
}
