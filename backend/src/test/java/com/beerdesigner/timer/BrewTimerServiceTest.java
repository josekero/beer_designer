package com.beerdesigner.timer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beerdesigner.TestSecurity;
import com.beerdesigner.timer.BrewTimerDtos.BrewTimerDto;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

class BrewTimerServiceTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final BrewTimerService service = new BrewTimerService(jdbc);

  @AfterEach void clearSecurity() { TestSecurity.clear(); }

  @Test
  void returnsAnUninitializedConfigurationForANewUser() {
    TestSecurity.asUser();
    when(jdbc.queryForObject(anyString(), eq(Boolean.class), eq(TestSecurity.USER_ID)))
        .thenReturn(false);

    var configuration = service.configuration();

    assertThat(configuration.initialized()).isFalse();
    assertThat(configuration.timers()).isEmpty();
  }

  @Test
  void replacesTheCurrentUsersTimersInTheirChosenOrder() {
    TestSecurity.asUser();
    var countdown = timer("boil", "Hervido", "countdown", 60, 0, 3600, 3600, null, false);
    var stopwatch = timer("whirlpool", "Whirlpool", "stopwatch", 0, 0, 12, 10,
        1_784_281_600_000L, true);

    var saved = service.save(List.of(countdown, stopwatch));

    assertThat(saved.initialized()).isTrue();
    assertThat(saved.timers()).containsExactly(countdown, stopwatch);
    verify(jdbc).update(anyString(), eq(TestSecurity.USER_ID), eq("boil"), eq(0),
        eq("Hervido"), eq("countdown"), eq(3600), eq(3600), eq(3600),
        eq(null), eq(false), eq(false));
  }

  @Test
  void rejectsInvalidOrExcessiveTimerConfigurations() {
    TestSecurity.asUser();
    var valid = timer("one", "Uno", "countdown", 1, 0, 60, 60, null, false);
    assertThatThrownBy(() -> service.save(List.of(valid, valid, valid, valid)))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    assertThatThrownBy(() -> service.save(List.of(
        timer("running", "Activo", "stopwatch", 0, 0, 2, 0, null, true))))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
  }

  private BrewTimerDto timer(String id, String label, String mode, int minutes, int seconds,
      int display, int anchor, Long epoch, boolean running) {
    return new BrewTimerDto(id, label, mode, minutes, seconds, display, anchor, epoch,
        running, false);
  }
}
