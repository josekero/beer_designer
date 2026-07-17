package com.beerdesigner.brewday;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beerdesigner.brewday.BrewDayDtos.*;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

class BrewDayServiceTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final BrewDayService service = new BrewDayService(jdbc);

  @BeforeEach void authenticate() {
    com.beerdesigner.TestSecurity.asAdmin();
    when(jdbc.queryForObject(anyString(), any(Class.class), any(Object[].class))).thenReturn(1);
    when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);
  }
  @AfterEach void clearAuthentication() { com.beerdesigner.TestSecurity.clear(); }

  @Test
  void savesTheSheetAndEveryProductionRecord() {
    BrewDayDto sheet = sheet();
    when(jdbc.query(anyString(), any(RowMapper.class), any(Object[].class))).thenReturn(List.of(sheet));

    BrewDayDto saved = service.save("brew-route-id", sheet);

    assertThat(saved).isSameAs(sheet);
    verify(jdbc, times(13)).update(anyString(), any(Object[].class));
  }

  @Test
  void mapsACompleteSheetAndItsChildrenFromJdbc() throws Exception {
    ResultSet rs = resultSet();
    when(jdbc.query(anyString(), any(RowMapper.class), any(Object[].class))).thenAnswer(invocation -> {
      RowMapper<?> mapper = invocation.getArgument(1);
      return List.of(mapper.mapRow(rs, 0));
    });

    List<BrewDayDto> result = service.findBetween(LocalDate.parse("2026-07-01"), LocalDate.parse("2026-07-31"));

    assertThat(result).hasSize(1);
    BrewDayDto mapped = result.getFirst();
    assertThat(mapped.id()).isEqualTo("brew-1");
    assertThat(mapped.malts()).hasSize(1);
    assertThat(mapped.hops()).hasSize(1);
    assertThat(mapped.yeasts()).hasSize(1);
    assertThat(mapped.additions()).hasSize(1);
    assertThat(mapped.events()).hasSize(1);
    assertThat(mapped.tasks()).hasSize(1);
  }

  @Test
  void reportsMissingSheetsAndFailedDeletes() {
    when(jdbc.query(anyString(), any(RowMapper.class), any(Object[].class))).thenReturn(List.of());
    assertThatThrownBy(() -> service.findById("missing")).isInstanceOf(BrewDayNotFoundException.class);

    when(jdbc.update(anyString(), any(Object[].class))).thenReturn(0);
    assertThatThrownBy(() -> service.delete("missing")).isInstanceOf(BrewDayNotFoundException.class);
  }

  @Test
  void deletesExistingSheets() {
    when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);
    service.delete("brew-1");
    verify(jdbc).update("DELETE FROM brew_days WHERE id = ? AND owner_id=?", "brew-1",
        com.beerdesigner.TestSecurity.USER_ID);
  }

  private BrewDayDto sheet() {
    BigDecimal one = BigDecimal.ONE;
    return new BrewDayDto(
        "body-id", "recipe-1", "NEIPA", "Brew NEIPA", "L-001", LocalDate.parse("2026-07-13"),
        LocalTime.of(9, 0), LocalTime.of(15, 0), "", "", null, null, null, null, one, one, one, one, one, one, one,
        new BigDecimal("5.2"), new BigDecimal("5.5"), one, one, one, one, one, one, "", "",
        List.of(new BrewDayMaltDto("Pale", one, one, "", "", decimal("100"), "LOT-M")),
        List.of(new BrewDayHopDto("Citra", one, one, 20, 20, decimal("80"), decimal("80"), "whirlpool", "", "", "LOT-H")),
        List.of(new BrewDayYeastDto("London", one, one, "", "", decimal("19"), "")),
        List.of(new BrewDayAdditionDto("Servomyces", "", one, one, "boil", 10, 10, decimal("100"), "", "", "")),
        List.of(new BrewDayEventDto(LocalTime.of(10, 0), "", "", "", "")),
        List.of(new BrewDayTaskDto(LocalDate.parse("2026-07-16"), LocalTime.of(10, 0), "", "Dry hop", "", "")),
        null);
  }

  private ResultSet resultSet() throws Exception {
    ResultSet rs = mock(ResultSet.class);
    when(rs.getString(anyString())).thenAnswer(invocation -> switch ((String) invocation.getArgument(0)) {
      case "id" -> "brew-1";
      case "recipe_id" -> "recipe-1";
      case "recipe_name" -> "NEIPA";
      default -> "value";
    });
    when(rs.getBigDecimal(anyString())).thenReturn(BigDecimal.ONE);
    when(rs.getObject("brew_date", LocalDate.class)).thenReturn(LocalDate.parse("2026-07-13"));
    when(rs.getObject("task_date", LocalDate.class)).thenReturn(LocalDate.parse("2026-07-16"));
    when(rs.getObject("updated_at", OffsetDateTime.class)).thenReturn(OffsetDateTime.parse("2026-07-13T09:00:00Z"));
    when(rs.getTime(anyString())).thenReturn(Time.valueOf("09:00:00"));
    when(rs.getInt(anyString())).thenReturn(10);
    when(rs.wasNull()).thenReturn(false);
    return rs;
  }

  private BigDecimal decimal(String value) {
    return new BigDecimal(value);
  }
}
