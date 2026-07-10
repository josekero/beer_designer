//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.recipe;

import com.beerdesigner.recipe.RecipeDtos.RecipeDetailDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecipeWriteService {
  private final JdbcTemplate jdbcTemplate;

  public RecipeWriteService(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @Transactional
  public void save(String id, RecipeDetailDto recipe) {
    jdbcTemplate.update("""
        INSERT INTO recipes (
          id, name, style_id, batch_volume_l, efficiency_percent, boil_volume_l,
          yeast_id, water_profile_id, primary_days, primary_temp_c, secondary_days,
          secondary_temp_c, dry_hop_enabled, dry_hop_days, dry_hop_temp_c,
          maturation_days, carbonation_volumes, packaging_method, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
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
          version = recipes.version + 1,
          updated_at = now()
        """,
        id,
        recipe.name(),
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
        recipe.notes()
    );

    replaceChildren(id, recipe);
  }

  private void replaceChildren(String recipeId, RecipeDetailDto recipe) {
    jdbcTemplate.update("DELETE FROM recipe_malts WHERE recipe_id = ?", recipeId);
    jdbcTemplate.update("DELETE FROM recipe_hops WHERE recipe_id = ?", recipeId);
    jdbcTemplate.update("DELETE FROM recipe_water_additions WHERE recipe_id = ?", recipeId);
    jdbcTemplate.update("DELETE FROM recipe_mash_steps WHERE recipe_id = ?", recipeId);
    jdbcTemplate.update("DELETE FROM recipe_boil_steps WHERE recipe_id = ?", recipeId);

    for (int index = 0; index < recipe.malts().size(); index++) {
      var item = recipe.malts().get(index);
      jdbcTemplate.update(
          "INSERT INTO recipe_malts (recipe_id, malt_id, amount_kg, position) VALUES (?, ?, ?, ?)",
          recipeId, item.maltId(), item.amountKg(), index
      );
    }

    for (int index = 0; index < recipe.hops().size(); index++) {
      var item = recipe.hops().get(index);
      jdbcTemplate.update(
          "INSERT INTO recipe_hops (recipe_id, hop_id, amount_g, alpha_acids, time_min, use, position) VALUES (?, ?, ?, ?, ?, ?, ?)",
          recipeId, item.hopId(), item.amountG(), item.alphaAcids(), item.timeMin(), item.use(), index
      );
    }

    for (int index = 0; index < recipe.waterAdditions().size(); index++) {
      var item = recipe.waterAdditions().get(index);
      jdbcTemplate.update(
          "INSERT INTO recipe_water_additions (recipe_id, name, amount_g, position) VALUES (?, ?, ?, ?)",
          recipeId, item.name(), item.amountG(), index
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
  }
}
