package com.beerdesigner.timer;

import com.beerdesigner.auth.UserContext;
import com.beerdesigner.timer.BrewTimerDtos.BrewTimerConfiguration;
import com.beerdesigner.timer.BrewTimerDtos.BrewTimerDto;
import java.util.HashSet;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BrewTimerService {
  private static final int MAX_TIMERS = 3;
  private static final int MAX_TOTAL_SECONDS = 359999;
  private final JdbcTemplate jdbc;

  public BrewTimerService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

  public BrewTimerConfiguration configuration() {
    Boolean initialized = jdbc.queryForObject(
        "SELECT EXISTS(SELECT 1 FROM user_timer_settings WHERE user_id=?)",
        Boolean.class, UserContext.userId());
    if (!Boolean.TRUE.equals(initialized)) return new BrewTimerConfiguration(false, List.of());
    var timers = jdbc.query("""
        SELECT timer_id,label,mode,duration_seconds,display_seconds,anchor_seconds,
               anchor_epoch_ms,running,completed
        FROM user_brew_timers WHERE user_id=? ORDER BY position
        """, (rs, row) -> {
          int duration = rs.getInt("duration_seconds");
          return new BrewTimerDto(rs.getString("timer_id"), rs.getString("label"),
              rs.getString("mode"), duration / 60, duration % 60,
              rs.getInt("display_seconds"), rs.getInt("anchor_seconds"),
              rs.getObject("anchor_epoch_ms", Long.class), rs.getBoolean("running"),
              rs.getBoolean("completed"));
        }, UserContext.userId());
    return new BrewTimerConfiguration(true, timers);
  }

  @Transactional
  public BrewTimerConfiguration save(List<BrewTimerDto> timers) {
    validate(timers);
    jdbc.update("""
        INSERT INTO user_timer_settings(user_id,updated_at) VALUES(?,now())
        ON CONFLICT(user_id) DO UPDATE SET updated_at=now()
        """, UserContext.userId());
    jdbc.update("DELETE FROM user_brew_timers WHERE user_id=?", UserContext.userId());
    for (int position = 0; position < timers.size(); position++) {
      BrewTimerDto timer = timers.get(position);
      int duration = timer.durationMinutes() * 60 + timer.durationSeconds();
      jdbc.update("""
          INSERT INTO user_brew_timers(user_id,timer_id,position,label,mode,duration_seconds,
            display_seconds,anchor_seconds,anchor_epoch_ms,running,completed)
          VALUES(?,?,?,?,?,?,?,?,?,?,?)
          """, UserContext.userId(), timer.id(), position, timer.label().trim(), timer.mode(),
          duration, timer.displaySeconds(), timer.anchorSeconds(), timer.anchorEpochMs(),
          timer.running(), timer.completed());
    }
    return new BrewTimerConfiguration(true, List.copyOf(timers));
  }

  private void validate(List<BrewTimerDto> timers) {
    if (timers == null || timers.size() > MAX_TIMERS) invalid("Puedes guardar un máximo de 3 temporizadores");
    var ids = new HashSet<String>();
    for (BrewTimerDto timer : timers) {
      if (timer == null || timer.id() == null || !timer.id().matches("[A-Za-z0-9_-]{1,80}"))
        invalid("Identificador de temporizador no válido");
      if (!ids.add(timer.id())) invalid("Los temporizadores no pueden estar duplicados");
      if (timer.label() == null || timer.label().trim().isEmpty() || timer.label().trim().length() > 80)
        invalid("La etiqueta debe tener entre 1 y 80 caracteres");
      if (!"countdown".equals(timer.mode()) && !"stopwatch".equals(timer.mode()))
        invalid("Dirección de temporizador no válida");
      if (timer.durationMinutes() < 0 || timer.durationSeconds() < 0 || timer.durationSeconds() > 59
          || timer.durationMinutes() * 60L + timer.durationSeconds() > MAX_TOTAL_SECONDS
          || timer.displaySeconds() < 0 || timer.displaySeconds() > MAX_TOTAL_SECONDS
          || timer.anchorSeconds() < 0 || timer.anchorSeconds() > MAX_TOTAL_SECONDS)
        invalid("Duración de temporizador no válida");
      if (timer.running() && timer.anchorEpochMs() == null)
        invalid("Un temporizador activo necesita una hora de inicio");
    }
  }

  private void invalid(String message) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
  }
}
