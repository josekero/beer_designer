//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.brewday;

import com.beerdesigner.brewday.BrewDayDtos.BrewDayDto;
import com.beerdesigner.brewday.BrewDayDtos.BrewDayEventDto;
import com.beerdesigner.brewday.BrewDayDtos.BrewDayHopDto;
import com.beerdesigner.brewday.BrewDayDtos.BrewDayMaltDto;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BrewDayService {
  private final JdbcTemplate jdbcTemplate;

  public BrewDayService(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<BrewDayDto> findBetween(LocalDate from, LocalDate to) {
    return jdbcTemplate.query("""
        SELECT bd.*, r.name AS recipe_name
        FROM brew_days bd
        JOIN recipes r ON r.id = bd.recipe_id
        WHERE bd.brew_date BETWEEN ? AND ?
        ORDER BY bd.brew_date ASC, bd.start_time ASC
        """, (rs, rowNum) -> toDto(rs), from, to);
  }

  public BrewDayDto findById(String id) {
    return jdbcTemplate.query("""
        SELECT bd.*, r.name AS recipe_name
        FROM brew_days bd
        JOIN recipes r ON r.id = bd.recipe_id
        WHERE bd.id = ?
        """, (rs, rowNum) -> toDto(rs), id).stream()
        .findFirst()
        .orElseThrow(() -> new BrewDayNotFoundException(id));
  }

  @Transactional
  public BrewDayDto save(String id, BrewDayDto brewDay) {
    jdbcTemplate.update("""
        INSERT INTO brew_days (
          id, recipe_id, title, batch_number, brew_date, start_time, end_time, status,
          brewer, target_volume_l, actual_volume_l, target_og, actual_og, target_fg,
          actual_fg, actual_abv, mash_ph, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          recipe_id = EXCLUDED.recipe_id,
          title = EXCLUDED.title,
          batch_number = EXCLUDED.batch_number,
          brew_date = EXCLUDED.brew_date,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          status = EXCLUDED.status,
          brewer = EXCLUDED.brewer,
          target_volume_l = EXCLUDED.target_volume_l,
          actual_volume_l = EXCLUDED.actual_volume_l,
          target_og = EXCLUDED.target_og,
          actual_og = EXCLUDED.actual_og,
          target_fg = EXCLUDED.target_fg,
          actual_fg = EXCLUDED.actual_fg,
          actual_abv = EXCLUDED.actual_abv,
          mash_ph = EXCLUDED.mash_ph,
          notes = EXCLUDED.notes,
          updated_at = now()
        """,
        id, brewDay.recipeId(), brewDay.title(), brewDay.batchNumber(), brewDay.brewDate(),
        brewDay.startTime(), brewDay.endTime(), blankDefault(brewDay.status(), "planificada"),
        blankDefault(brewDay.brewer(), ""), brewDay.targetVolumeL(), brewDay.actualVolumeL(),
        brewDay.targetOg(), brewDay.actualOg(), brewDay.targetFg(), brewDay.actualFg(),
        brewDay.actualAbv(), brewDay.mashPh(), blankDefault(brewDay.notes(), "")
    );

    replaceChildren(id, brewDay);
    return findById(id);
  }

  private void replaceChildren(String id, BrewDayDto brewDay) {
    jdbcTemplate.update("DELETE FROM brew_day_malts WHERE brew_day_id = ?", id);
    jdbcTemplate.update("DELETE FROM brew_day_hops WHERE brew_day_id = ?", id);
    jdbcTemplate.update("DELETE FROM brew_day_events WHERE brew_day_id = ?", id);

    for (int index = 0; index < brewDay.malts().size(); index++) {
      var item = brewDay.malts().get(index);
      jdbcTemplate.update("""
          INSERT INTO brew_day_malts (
            brew_day_id, ingredient_name, planned_amount_kg, actual_amount_kg,
            substitute_name, notes, position
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          """, id, item.ingredientName(), item.plannedAmountKg(), item.actualAmountKg(),
          blankDefault(item.substituteName(), ""), blankDefault(item.notes(), ""), index);
    }

    for (int index = 0; index < brewDay.hops().size(); index++) {
      var item = brewDay.hops().get(index);
      jdbcTemplate.update("""
          INSERT INTO brew_day_hops (
            brew_day_id, ingredient_name, planned_amount_g, actual_amount_g,
            planned_time_min, actual_time_min, use, substitute_name, notes, position
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          """, id, item.ingredientName(), item.plannedAmountG(), item.actualAmountG(),
          item.plannedTimeMin(), item.actualTimeMin(), blankDefault(item.use(), ""),
          blankDefault(item.substituteName(), ""), blankDefault(item.notes(), ""), index);
    }

    for (int index = 0; index < brewDay.events().size(); index++) {
      var item = brewDay.events().get(index);
      jdbcTemplate.update("""
          INSERT INTO brew_day_events (
            brew_day_id, event_time, type, description, value, unit, position
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          """, id, item.eventTime(), blankDefault(item.type(), ""), blankDefault(item.description(), ""),
          blankDefault(item.value(), ""), blankDefault(item.unit(), ""), index);
    }
  }

  private BrewDayDto toDto(ResultSet rs) throws SQLException {
    var id = rs.getString("id");
    return new BrewDayDto(
        id,
        rs.getString("recipe_id"),
        rs.getString("recipe_name"),
        rs.getString("title"),
        rs.getString("batch_number"),
        rs.getObject("brew_date", LocalDate.class),
        rs.getTime("start_time").toLocalTime(),
        rs.getTime("end_time").toLocalTime(),
        rs.getString("status"),
        rs.getString("brewer"),
        rs.getBigDecimal("target_volume_l"),
        rs.getBigDecimal("actual_volume_l"),
        rs.getBigDecimal("target_og"),
        rs.getBigDecimal("actual_og"),
        rs.getBigDecimal("target_fg"),
        rs.getBigDecimal("actual_fg"),
        rs.getBigDecimal("actual_abv"),
        rs.getBigDecimal("mash_ph"),
        rs.getString("notes"),
        malts(id),
        hops(id),
        events(id),
        rs.getObject("updated_at", java.time.OffsetDateTime.class)
    );
  }

  private List<BrewDayMaltDto> malts(String id) {
    return jdbcTemplate.query("""
        SELECT * FROM brew_day_malts WHERE brew_day_id = ? ORDER BY position ASC
        """, (rs, rowNum) -> new BrewDayMaltDto(
        rs.getString("ingredient_name"),
        rs.getBigDecimal("planned_amount_kg"),
        rs.getBigDecimal("actual_amount_kg"),
        rs.getString("substitute_name"),
        rs.getString("notes")
    ), id);
  }

  private List<BrewDayHopDto> hops(String id) {
    return jdbcTemplate.query("""
        SELECT * FROM brew_day_hops WHERE brew_day_id = ? ORDER BY position ASC
        """, (rs, rowNum) -> new BrewDayHopDto(
        rs.getString("ingredient_name"),
        rs.getBigDecimal("planned_amount_g"),
        rs.getBigDecimal("actual_amount_g"),
        nullableInt(rs, "planned_time_min"),
        nullableInt(rs, "actual_time_min"),
        rs.getString("use"),
        rs.getString("substitute_name"),
        rs.getString("notes")
    ), id);
  }

  private List<BrewDayEventDto> events(String id) {
    return jdbcTemplate.query("""
        SELECT * FROM brew_day_events WHERE brew_day_id = ? ORDER BY position ASC
        """, (rs, rowNum) -> new BrewDayEventDto(
        rs.getTime("event_time") == null ? null : rs.getTime("event_time").toLocalTime(),
        rs.getString("type"),
        rs.getString("description"),
        rs.getString("value"),
        rs.getString("unit")
    ), id);
  }

  private Integer nullableInt(ResultSet rs, String column) throws SQLException {
    int value = rs.getInt(column);
    return rs.wasNull() ? null : value;
  }

  private String blankDefault(String value, String fallback) {
    return value == null || value.isBlank() ? fallback : value;
  }
}

class BrewDayNotFoundException extends RuntimeException {
  BrewDayNotFoundException(String id) {
    super("Brew day not found: " + id);
  }
}
