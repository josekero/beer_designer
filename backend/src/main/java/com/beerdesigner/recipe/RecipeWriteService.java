//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.recipe;

import com.beerdesigner.recipe.RecipeDtos.RecipeDetailDto;
import com.beerdesigner.auth.AuthService;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RecipeWriteService {
  private final JdbcTemplate jdbcTemplate;

  public RecipeWriteService(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @Transactional
  public String save(UUID ownerId, String id, RecipeDetailDto recipe) {
    id = ownedId(ownerId, id);
    int changed = jdbcTemplate.update("""
        INSERT INTO recipes (
          id, owner_id, folder_id, name, brewer, untappd_url, equipment_profile_id, mash_profile_id, carbonation_profile_id, fermentation_profile_id, glassware_id, style_id, batch_volume_l, efficiency_percent, boil_volume_l,
          yeast_id, water_profile_id, primary_days, primary_temp_c, secondary_days,
          secondary_temp_c, dry_hop_enabled, dry_hop_days, dry_hop_temp_c,
          maturation_days, carbonation_volumes, packaging_method, notes,
          water_calcium, water_magnesium, water_sodium, water_sulfate, water_chloride,
          water_bicarbonate, mash_target_ph, sparge_target_ph, water_notes, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          brewer = EXCLUDED.brewer,
          untappd_url = EXCLUDED.untappd_url,
          equipment_profile_id=EXCLUDED.equipment_profile_id,
          mash_profile_id=EXCLUDED.mash_profile_id,
          carbonation_profile_id=EXCLUDED.carbonation_profile_id,
          fermentation_profile_id=EXCLUDED.fermentation_profile_id,
          glassware_id=EXCLUDED.glassware_id,
          style_id = EXCLUDED.style_id,
          batch_volume_l = EXCLUDED.batch_volume_l,
          efficiency_percent = EXCLUDED.efficiency_percent,
          boil_volume_l = EXCLUDED.boil_volume_l,
          yeast_id = EXCLUDED.yeast_id,
          water_profile_id = EXCLUDED.water_profile_id,
          primary_days = EXCLUDED.primary_days,
          primary_temp_c = EXCLUDED.primary_temp_c,
          secondary_days = EXCLUDED.secondary_days,
          secondary_temp_c = EXCLUDED.secondary_temp_c,
          dry_hop_enabled = EXCLUDED.dry_hop_enabled,
          dry_hop_days = EXCLUDED.dry_hop_days,
          dry_hop_temp_c = EXCLUDED.dry_hop_temp_c,
          maturation_days = EXCLUDED.maturation_days,
          carbonation_volumes = EXCLUDED.carbonation_volumes,
          packaging_method = EXCLUDED.packaging_method,
          notes = EXCLUDED.notes,
          water_calcium=EXCLUDED.water_calcium, water_magnesium=EXCLUDED.water_magnesium,
          water_sodium=EXCLUDED.water_sodium, water_sulfate=EXCLUDED.water_sulfate,
          water_chloride=EXCLUDED.water_chloride, water_bicarbonate=EXCLUDED.water_bicarbonate,
          mash_target_ph=EXCLUDED.mash_target_ph, sparge_target_ph=EXCLUDED.sparge_target_ph,
          water_notes=EXCLUDED.water_notes,
          version = EXCLUDED.version,
          updated_at = now()
        WHERE recipes.owner_id = EXCLUDED.owner_id
        """,
        id,
        ownerId,
        AuthService.defaultFolderId(ownerId),
        recipe.name(),
        recipe.brewer(),
        validatedUntappdUrl(recipe.untappdUrl()),
        recipe.equipmentProfileId(),
        recipe.mashProfileId(),
        recipe.carbonationProfileId(),
        recipe.fermentationProfileId(),
        recipe.glasswareId(),
        recipe.styleId(),
        recipe.batchVolumeL(),
        recipe.efficiencyPercent(),
        recipe.boilVolumeL(),
        recipe.yeastId(),
        recipe.waterProfileId(),
        recipe.fermentation().primaryDays(),
        recipe.fermentation().primaryTempC(),
        recipe.fermentation().secondaryDays(),
        recipe.fermentation().secondaryTempC(),
        recipe.dryHop().enabled(),
        recipe.dryHop().days(),
        recipe.dryHop().temperatureC(),
        recipe.packaging().maturationDays(),
        recipe.packaging().carbonationVolumes(),
        recipe.packaging().method(),
        recipe.notes(), recipe.waterTreatment().calcium(), recipe.waterTreatment().magnesium(),
        recipe.waterTreatment().sodium(), recipe.waterTreatment().sulfate(), recipe.waterTreatment().chloride(),
        recipe.waterTreatment().bicarbonate(), recipe.waterTreatment().mashPh(), recipe.waterTreatment().spargePh(),
        recipe.waterTreatment().notes(), recipe.version() == null ? 1 : recipe.version()
    );

    if (changed == 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese identificador de receta ya está siendo utilizado");

    replaceChildren(id, recipe);
    return id;
  }

  private String ownedId(UUID ownerId, String requestedId) {
    if (AuthService.LEGACY_ADMIN_ID.equals(ownerId)) return requestedId;
    String prefix = "u-" + ownerId.toString().substring(0, 8) + "-";
    return requestedId.startsWith(prefix) ? requestedId : prefix + requestedId;
  }

  private String validatedUntappdUrl(String value) {
    if (value == null || value.isBlank()) return null;
    String url=value.trim();
    if (!url.matches("https://(www\\.)?untappd\\.com/b/[A-Za-z0-9_-]+/[0-9]+/?")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La URL de Untappd no es una página de cerveza válida");
    }
    return url;
  }

  private void replaceChildren(String recipeId, RecipeDetailDto recipe) {
    jdbcTemplate.update("DELETE FROM recipe_malts WHERE recipe_id = ?", recipeId);
    jdbcTemplate.update("DELETE FROM recipe_hops WHERE recipe_id = ?", recipeId);
    jdbcTemplate.update("DELETE FROM recipe_yeasts WHERE recipe_id = ?", recipeId);
    jdbcTemplate.update("DELETE FROM recipe_water_additions WHERE recipe_id = ?", recipeId);
    jdbcTemplate.update("DELETE FROM recipe_mash_steps WHERE recipe_id = ?", recipeId);
    jdbcTemplate.update("DELETE FROM recipe_boil_steps WHERE recipe_id = ?", recipeId);
    jdbcTemplate.update("DELETE FROM recipe_process_additions WHERE recipe_id = ?", recipeId);
    jdbcTemplate.update("DELETE FROM recipe_maturation_additions WHERE recipe_id = ?",recipeId);
    jdbcTemplate.update("DELETE FROM recipe_fermentation_steps WHERE recipe_id=?",recipeId);

    for (int index = 0; index < recipe.malts().size(); index++) {
      var item = recipe.malts().get(index);
      jdbcTemplate.update(
          "INSERT INTO recipe_malts (recipe_id, malt_id, amount_kg, notes, position) VALUES (?, ?, ?, ?, ?)",
          recipeId, item.maltId(), item.amountKg(), item.notes(), index
      );
    }

    for (int index = 0; index < recipe.hops().size(); index++) {
      var item = recipe.hops().get(index);
      jdbcTemplate.update(
          "INSERT INTO recipe_hops (recipe_id,type,hop_id,adjunct_id,amount_g,alpha_acids,time_min,temperature_c,use,notes,position) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
          recipeId,item.type()==null?"lúpulo":item.type(),item.hopId(),item.adjunctId(),item.amountG(),item.alphaAcids()==null?0:item.alphaAcids(),item.timeMin(),item.temperatureC()==null?("whirlpool".equals(item.use())?80:100):item.temperatureC(),item.use(),item.notes()==null?"":item.notes(),index
      );
    }
    for (int index=0; index<recipe.yeasts().size(); index++) {
      var item=recipe.yeasts().get(index);
      jdbcTemplate.update("INSERT INTO recipe_yeasts(recipe_id,yeast_id,format,amount,unit,pitch_temp_c,starter_volume_l,notes,position) VALUES(?,?,?,?,?,?,?,?,?)",recipeId,item.yeastId(),item.format(),item.amount(),item.unit(),item.pitchTempC(),item.starterVolumeL(),item.notes(),index);
    }

    for (int index = 0; index < recipe.waterAdditions().size(); index++) {
      var item = recipe.waterAdditions().get(index);
      jdbcTemplate.update(
          "INSERT INTO recipe_water_additions (recipe_id,salt_id,name,amount_g,position) VALUES (?,?,?,?,?)",
          recipeId,item.saltId(),item.name(),item.amountG(),index
      );
    }

    for (int index = 0; index < recipe.mashSteps().size(); index++) {
      var item = recipe.mashSteps().get(index);
      jdbcTemplate.update(
          "INSERT INTO recipe_mash_steps (recipe_id, name, temperature_c, time_min, position) VALUES (?, ?, ?, ?, ?)",
          recipeId, item.name(), item.temperatureC(), item.timeMin(), index
      );
    }

    for (int index = 0; index < recipe.boilSteps().size(); index++) {
      var item = recipe.boilSteps().get(index);
      jdbcTemplate.update(
          "INSERT INTO recipe_boil_steps (recipe_id, name, time_min, description, position) VALUES (?, ?, ?, ?, ?)",
          recipeId, item.name(), item.timeMin(), item.description(), index
      );
    }
    for (int index = 0; index < recipe.processAdditions().size(); index++) {
      var item = recipe.processAdditions().get(index);
      jdbcTemplate.update("""
          INSERT INTO recipe_process_additions (recipe_id,name,brand,amount_g,stage,time_min,temperature_c,day_label,notes,position)
          VALUES (?,?,?,?,?,?,?,?,?,?)
          """, recipeId, item.name(), item.brand(), item.amountG(), item.stage(), item.timeMin(), item.temperatureC(), item.dayLabel(), item.notes(), index);
    }
    for(int index=0;index<recipe.maturationAdditions().size();index++){
      var item=recipe.maturationAdditions().get(index);
      jdbcTemplate.update("INSERT INTO recipe_maturation_additions(recipe_id,type,hop_id,adjunct_id,name,batch,amount,unit,add_day,contact_days,temperature_c,notes,position) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",recipeId,item.type(),item.hopId(),item.adjunctId(),item.name(),item.batch(),item.amount(),item.unit(),item.addDay(),item.contactDays(),item.temperatureC(),item.notes(),index);
    }
    for(int index=0;index<recipe.fermentationSteps().size();index++){var item=recipe.fermentationSteps().get(index);jdbcTemplate.update("INSERT INTO recipe_fermentation_steps(recipe_id,stage,start_day,duration_days,temperature_c,notes,position) VALUES(?,?,?,?,?,?,?)",recipeId,item.stage(),item.startDay(),item.durationDays(),item.temperatureC(),item.notes(),index);}
  }
}
