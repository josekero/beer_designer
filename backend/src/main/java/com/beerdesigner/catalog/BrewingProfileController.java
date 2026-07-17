package com.beerdesigner.catalog;

import com.beerdesigner.auth.UserContext;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/profiles")
public class BrewingProfileController {
  private final JdbcTemplate jdbc;

  public BrewingProfileController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

  public record MashProfile(String id, String name, BigDecimal mashTempC, Integer mashTimeMin,
                            BigDecimal mashOutTempC, Integer mashOutTimeMin, String notes) {}
  public record CarbonationProfile(String id, String name, String method, BigDecimal targetVolumes,
                                   BigDecimal temperatureC, BigDecimal pressureBar, String notes) {}
  public record FermentationProfile(String id, String name, Integer primaryDays, BigDecimal primaryTempC,
                                    Integer secondaryDays, BigDecimal secondaryTempC, Integer maturationDays,
                                    BigDecimal maturationTempC, String notes) {}

  @GetMapping("/mash")
  public List<MashProfile> mash() {
    return jdbc.query("SELECT * FROM mash_profiles WHERE owner_id IS NULL OR owner_id=? ORDER BY name",
        (r, n) -> new MashProfile(r.getString("id"), r.getString("name"), r.getBigDecimal("mash_temp_c"),
            r.getInt("mash_time_min"), r.getBigDecimal("mash_out_temp_c"), nullableInt(r, "mash_out_time_min"),
            r.getString("notes")), UserContext.userId());
  }

  @PutMapping("/mash/{id}")
  public MashProfile saveMash(@PathVariable String id, @RequestBody MashProfile profile) {
    UUID owner = owner();
    String savedId = ownedId(id, owner);
    int changed = jdbc.update("""
        INSERT INTO mash_profiles(id,name,mash_temp_c,mash_time_min,mash_out_temp_c,mash_out_time_min,notes,owner_id)
        VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,mash_temp_c=EXCLUDED.mash_temp_c,
        mash_time_min=EXCLUDED.mash_time_min,mash_out_temp_c=EXCLUDED.mash_out_temp_c,
        mash_out_time_min=EXCLUDED.mash_out_time_min,notes=EXCLUDED.notes
        WHERE mash_profiles.owner_id IS NOT DISTINCT FROM EXCLUDED.owner_id
        """, savedId, profile.name(), profile.mashTempC(), profile.mashTimeMin(), profile.mashOutTempC(),
        profile.mashOutTimeMin(), profile.notes(), owner);
    ensureSaved(changed);
    return mash().stream().filter(item -> item.id().equals(savedId)).findFirst().orElseThrow();
  }

  @DeleteMapping("/mash/{id}")
  public void deleteMash(@PathVariable String id) { delete("mash_profiles", id); }

  @GetMapping("/carbonation")
  public List<CarbonationProfile> carbonation() {
    return jdbc.query("SELECT * FROM carbonation_profiles WHERE owner_id IS NULL OR owner_id=? ORDER BY name",
        (r, n) -> new CarbonationProfile(r.getString("id"), r.getString("name"), r.getString("method"),
            r.getBigDecimal("target_volumes"), r.getBigDecimal("temperature_c"), r.getBigDecimal("pressure_bar"),
            r.getString("notes")), UserContext.userId());
  }

  @PutMapping("/carbonation/{id}")
  public CarbonationProfile saveCarbonation(@PathVariable String id, @RequestBody CarbonationProfile profile) {
    UUID owner = owner();
    String savedId = ownedId(id, owner);
    int changed = jdbc.update("""
        INSERT INTO carbonation_profiles(id,name,method,target_volumes,temperature_c,pressure_bar,notes,owner_id)
        VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,method=EXCLUDED.method,
        target_volumes=EXCLUDED.target_volumes,temperature_c=EXCLUDED.temperature_c,
        pressure_bar=EXCLUDED.pressure_bar,notes=EXCLUDED.notes
        WHERE carbonation_profiles.owner_id IS NOT DISTINCT FROM EXCLUDED.owner_id
        """, savedId, profile.name(), profile.method(), profile.targetVolumes(), profile.temperatureC(),
        profile.pressureBar(), profile.notes(), owner);
    ensureSaved(changed);
    return carbonation().stream().filter(item -> item.id().equals(savedId)).findFirst().orElseThrow();
  }

  @DeleteMapping("/carbonation/{id}")
  public void deleteCarbonation(@PathVariable String id) { delete("carbonation_profiles", id); }

  @GetMapping("/fermentation")
  public List<FermentationProfile> fermentation() {
    return jdbc.query("SELECT * FROM fermentation_profiles WHERE owner_id IS NULL OR owner_id=? ORDER BY name",
        (r, n) -> new FermentationProfile(r.getString("id"), r.getString("name"), r.getInt("primary_days"),
            r.getBigDecimal("primary_temp_c"), r.getInt("secondary_days"), r.getBigDecimal("secondary_temp_c"),
            r.getInt("maturation_days"), r.getBigDecimal("maturation_temp_c"), r.getString("notes")),
        UserContext.userId());
  }

  @PutMapping("/fermentation/{id}")
  public FermentationProfile saveFermentation(@PathVariable String id, @RequestBody FermentationProfile profile) {
    UUID owner = owner();
    String savedId = ownedId(id, owner);
    int changed = jdbc.update("""
        INSERT INTO fermentation_profiles(id,name,primary_days,primary_temp_c,secondary_days,secondary_temp_c,
          maturation_days,maturation_temp_c,notes,owner_id) VALUES(?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,primary_days=EXCLUDED.primary_days,
        primary_temp_c=EXCLUDED.primary_temp_c,secondary_days=EXCLUDED.secondary_days,
        secondary_temp_c=EXCLUDED.secondary_temp_c,maturation_days=EXCLUDED.maturation_days,
        maturation_temp_c=EXCLUDED.maturation_temp_c,notes=EXCLUDED.notes
        WHERE fermentation_profiles.owner_id IS NOT DISTINCT FROM EXCLUDED.owner_id
        """, savedId, profile.name(), profile.primaryDays(), profile.primaryTempC(), profile.secondaryDays(),
        profile.secondaryTempC(), profile.maturationDays(), profile.maturationTempC(), profile.notes(), owner);
    ensureSaved(changed);
    return fermentation().stream().filter(item -> item.id().equals(savedId)).findFirst().orElseThrow();
  }

  @DeleteMapping("/fermentation/{id}")
  public void deleteFermentation(@PathVariable String id) { delete("fermentation_profiles", id); }

  private void delete(String table, String id) {
    String sql = switch (table) {
      case "mash_profiles" -> "DELETE FROM mash_profiles WHERE id=? AND owner_id IS NOT DISTINCT FROM ?";
      case "carbonation_profiles" -> "DELETE FROM carbonation_profiles WHERE id=? AND owner_id IS NOT DISTINCT FROM ?";
      case "fermentation_profiles" -> "DELETE FROM fermentation_profiles WHERE id=? AND owner_id IS NOT DISTINCT FROM ?";
      default -> throw new IllegalArgumentException("Profile type not supported");
    };
    if (jdbc.update(sql, id, owner()) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
  }

  private UUID owner() { return UserContext.isAdmin() ? null : UserContext.userId(); }
  private String ownedId(String id, UUID owner) {
    if (owner == null) return id;
    String prefix = "u-" + owner.toString().substring(0, 8) + "-";
    return id.startsWith(prefix) ? id : prefix + id;
  }
  private void ensureSaved(int changed) {
    if (changed == 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese perfil pertenece a otro usuario");
  }
  private Integer nullableInt(ResultSet result, String column) throws SQLException {
    int value = result.getInt(column);
    return result.wasNull() ? null : value;
  }
}
