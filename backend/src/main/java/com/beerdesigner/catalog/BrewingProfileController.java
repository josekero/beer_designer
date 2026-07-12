package com.beerdesigner.catalog;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController @RequestMapping("/api/profiles")
public class BrewingProfileController {
  private final JdbcTemplate jdbc;
  public BrewingProfileController(JdbcTemplate jdbc){this.jdbc=jdbc;}
  public record MashProfile(String id,String name,BigDecimal mashTempC,Integer mashTimeMin,BigDecimal mashOutTempC,Integer mashOutTimeMin,String notes){}
  public record CarbonationProfile(String id,String name,String method,BigDecimal targetVolumes,BigDecimal temperatureC,BigDecimal pressureBar,String notes){}
  public record FermentationProfile(String id,String name,Integer primaryDays,BigDecimal primaryTempC,Integer secondaryDays,BigDecimal secondaryTempC,Integer maturationDays,BigDecimal maturationTempC,String notes){}

  @GetMapping("/mash") public List<MashProfile> mash(){return jdbc.query("SELECT * FROM mash_profiles ORDER BY name",(r,n)->new MashProfile(r.getString("id"),r.getString("name"),r.getBigDecimal("mash_temp_c"),r.getInt("mash_time_min"),r.getBigDecimal("mash_out_temp_c"),nullableInt(r,"mash_out_time_min"),r.getString("notes")));}
  @PutMapping("/mash/{id}") public MashProfile saveMash(@PathVariable String id,@RequestBody MashProfile p){jdbc.update("INSERT INTO mash_profiles VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,mash_temp_c=EXCLUDED.mash_temp_c,mash_time_min=EXCLUDED.mash_time_min,mash_out_temp_c=EXCLUDED.mash_out_temp_c,mash_out_time_min=EXCLUDED.mash_out_time_min,notes=EXCLUDED.notes",id,p.name,p.mashTempC,p.mashTimeMin,p.mashOutTempC,p.mashOutTimeMin,p.notes);return mash().stream().filter(x->x.id.equals(id)).findFirst().orElseThrow();}
  @DeleteMapping("/mash/{id}") public void deleteMash(@PathVariable String id){jdbc.update("DELETE FROM mash_profiles WHERE id=?",id);}
  @GetMapping("/carbonation") public List<CarbonationProfile> carbonation(){return jdbc.query("SELECT * FROM carbonation_profiles ORDER BY name",(r,n)->new CarbonationProfile(r.getString("id"),r.getString("name"),r.getString("method"),r.getBigDecimal("target_volumes"),r.getBigDecimal("temperature_c"),r.getBigDecimal("pressure_bar"),r.getString("notes")));}
  @PutMapping("/carbonation/{id}") public CarbonationProfile saveCarbonation(@PathVariable String id,@RequestBody CarbonationProfile p){jdbc.update("INSERT INTO carbonation_profiles VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,method=EXCLUDED.method,target_volumes=EXCLUDED.target_volumes,temperature_c=EXCLUDED.temperature_c,pressure_bar=EXCLUDED.pressure_bar,notes=EXCLUDED.notes",id,p.name,p.method,p.targetVolumes,p.temperatureC,p.pressureBar,p.notes);return carbonation().stream().filter(x->x.id.equals(id)).findFirst().orElseThrow();}
  @DeleteMapping("/carbonation/{id}") public void deleteCarbonation(@PathVariable String id){jdbc.update("DELETE FROM carbonation_profiles WHERE id=?",id);}
  @GetMapping("/fermentation") public List<FermentationProfile> fermentation(){return jdbc.query("SELECT * FROM fermentation_profiles ORDER BY name",(r,n)->new FermentationProfile(r.getString("id"),r.getString("name"),r.getInt("primary_days"),r.getBigDecimal("primary_temp_c"),r.getInt("secondary_days"),r.getBigDecimal("secondary_temp_c"),r.getInt("maturation_days"),r.getBigDecimal("maturation_temp_c"),r.getString("notes")));}
  @PutMapping("/fermentation/{id}") public FermentationProfile saveFermentation(@PathVariable String id,@RequestBody FermentationProfile p){jdbc.update("INSERT INTO fermentation_profiles VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,primary_days=EXCLUDED.primary_days,primary_temp_c=EXCLUDED.primary_temp_c,secondary_days=EXCLUDED.secondary_days,secondary_temp_c=EXCLUDED.secondary_temp_c,maturation_days=EXCLUDED.maturation_days,maturation_temp_c=EXCLUDED.maturation_temp_c,notes=EXCLUDED.notes",id,p.name,p.primaryDays,p.primaryTempC,p.secondaryDays,p.secondaryTempC,p.maturationDays,p.maturationTempC,p.notes);return fermentation().stream().filter(x->x.id.equals(id)).findFirst().orElseThrow();}
  @DeleteMapping("/fermentation/{id}") public void deleteFermentation(@PathVariable String id){jdbc.update("DELETE FROM fermentation_profiles WHERE id=?",id);}
  private Integer nullableInt(java.sql.ResultSet r,String column)throws java.sql.SQLException{int value=r.getInt(column);return r.wasNull()?null:value;}
}
