package com.beerdesigner.community;

import com.beerdesigner.auth.UserContext;
import com.beerdesigner.community.CommunityDtos.CommunityMember;
import com.beerdesigner.community.CommunityDtos.CommunityIngredient;
import com.beerdesigner.community.CommunityDtos.CommunityRecipe;
import com.beerdesigner.community.CommunityDtos.CommunityView;
import com.beerdesigner.recipe.RecipeMapper;
import com.beerdesigner.recipe.RecipeRepository;
import com.beerdesigner.recipe.RecipeWriteService;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CommunityService {
  private static final List<String> INGREDIENT_TYPES = List.of("hops", "malts", "yeasts", "adjuncts", "salts", "aging");
  private static final String COMMUNITY_SELECT = """
      SELECT r.id,r.name,r.brewer,r.style_id,r.batch_volume_l,r.notes,r.version,r.updated_at,
             u.display_name,u.avatar_kind,u.avatar_value,
             COALESCE(s.is_public,false) is_public,COALESCE(s.is_template,false) is_template
      FROM recipes r JOIN app_users u ON u.id=r.owner_id
      LEFT JOIN recipe_sharing s ON s.recipe_id=r.id
      """;
  private static final String INGREDIENT_SELECT = """
      SELECT 'hops' ingredient_type,id,owner_id,name,COALESCE(brand,'') brand,description,
             concat(format,' · ',alpha_acids,'% AA') detail FROM hops
      UNION ALL
      SELECT 'malts',id,owner_id,name,COALESCE(brand,''),description,
             concat(type,' · ',color_srm,' SRM') FROM malts
      UNION ALL
      SELECT 'yeasts',id,owner_id,name,COALESCE(NULLIF(brand,''),laboratory,''),sensory_profile,
             concat(type,' · ',temperature_min,'–',temperature_max,' °C') FROM yeasts
      UNION ALL
      SELECT 'adjuncts',id,owner_id,name,COALESCE(brand,''),description,
             concat(category,' · ',format) FROM adjuncts
      UNION ALL
      SELECT 'salts',id,owner_id,name,'' brand,description,
             concat(formula,' · ',category) FROM brewing_salts
      UNION ALL
      SELECT 'aging',id,owner_id,name,COALESCE(brand,''),description,
             concat(type,' · ',wood_type) FROM aging_ingredients
      """;
  private final JdbcTemplate jdbc;
  private final RecipeRepository recipes;
  private final RecipeMapper mapper;
  private final RecipeWriteService writer;

  public CommunityService(JdbcTemplate jdbc, RecipeRepository recipes, RecipeMapper mapper,
      RecipeWriteService writer) {
    this.jdbc = jdbc; this.recipes = recipes; this.mapper = mapper; this.writer = writer;
  }

  public CommunityView view() {
    var latest = jdbc.query(COMMUNITY_SELECT + " WHERE s.is_public=true AND s.is_template=false AND u.role<>'ADMIN' ORDER BY s.published_at DESC NULLS LAST LIMIT 12", this::recipe);
    var templates = jdbc.query(COMMUNITY_SELECT + " WHERE s.is_template=true OR (s.is_public=true AND u.role='ADMIN') ORDER BY s.published_at DESC NULLS LAST LIMIT 12", this::recipe);
    var mine = jdbc.query(COMMUNITY_SELECT + " WHERE r.owner_id=? ORDER BY r.updated_at DESC", this::recipe, UserContext.userId());
    var sharedIngredients = jdbc.query("""
        SELECT i.*,s.published_at,u.display_name,u.avatar_kind,u.avatar_value,
               (i.owner_id=?) owned_by_me,true public_ingredient
        FROM (
        """ + INGREDIENT_SELECT + """
        ) i JOIN ingredient_sharing s ON s.ingredient_type=i.ingredient_type AND s.ingredient_id=i.id
            JOIN app_users u ON u.id=i.owner_id
        ORDER BY s.published_at DESC LIMIT 24
        """, this::ingredient, UserContext.userId());
    var myIngredients = jdbc.query("""
        SELECT i.*,s.published_at,u.display_name,u.avatar_kind,u.avatar_value,
               true owned_by_me,(s.ingredient_id IS NOT NULL) public_ingredient
        FROM (
        """ + INGREDIENT_SELECT + """
        ) i JOIN app_users u ON u.id=i.owner_id
            LEFT JOIN ingredient_sharing s ON s.ingredient_type=i.ingredient_type AND s.ingredient_id=i.id
        WHERE i.owner_id=? ORDER BY i.name
        """, this::ingredient, UserContext.userId());
    var members = jdbc.query("""
        SELECT display_name,avatar_kind,avatar_value,created_at FROM app_users
        WHERE enabled=true ORDER BY created_at DESC LIMIT 8
        """, (rs,row) -> new CommunityMember(rs.getString("display_name"), rs.getString("avatar_kind"),
        rs.getString("avatar_value"), rs.getObject("created_at", OffsetDateTime.class)));
    Long memberCount = jdbc.queryForObject("SELECT count(*) FROM app_users WHERE enabled=true", Long.class);
    Long active = jdbc.queryForObject("""
        SELECT count(DISTINCT user_id) FROM user_sessions
        WHERE revoked_at IS NULL AND expires_at>now() AND last_seen_at>now()-interval '15 minutes'
        """, Long.class);
    return new CommunityView(latest, templates, mine, sharedIngredients, myIngredients, members,
        memberCount == null ? 0 : memberCount, active == null ? 0 : active);
  }

  public void visibility(String recipeId, boolean visible) {
    if (!recipes.existsByIdAndOwnerId(recipeId, UserContext.userId()))
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Receta no encontrada");
    jdbc.update("""
        INSERT INTO recipe_sharing(recipe_id,is_public,is_template,published_at)
        VALUES(?,?,false,CASE WHEN ? THEN now() ELSE NULL END)
        ON CONFLICT(recipe_id) DO UPDATE SET is_public=EXCLUDED.is_public,is_template=false,
          published_at=CASE WHEN EXCLUDED.is_public THEN COALESCE(recipe_sharing.published_at,now()) ELSE NULL END,
          updated_at=now()
        """, recipeId, visible, visible);
  }

  @Transactional
  public String copy(String recipeId) {
    Boolean available = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM recipe_sharing WHERE recipe_id=? AND is_public=true)", Boolean.class, recipeId);
    if (!Boolean.TRUE.equals(available)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La receta ya no está compartida");
    var source = recipes.findById(recipeId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receta no encontrada"));
    var detail = mapper.toDetail(source);
    String requestedId = "community-" + System.currentTimeMillis();
    var copy = new com.beerdesigner.recipe.RecipeDtos.RecipeDetailDto(requestedId,
        detail.name() + " · copia", detail.brewer(), detail.untappdUrl(), detail.equipmentProfileId(),
        detail.mashProfileId(), detail.carbonationProfileId(), detail.fermentationProfileId(),
        detail.glasswareId(), detail.styleId(), detail.batchVolumeL(), detail.efficiencyPercent(),
        detail.boilVolumeL(), detail.yeastId(), detail.waterProfileId(), detail.malts(), detail.hops(),
        detail.yeasts(), detail.waterAdditions(), detail.mashSteps(), detail.boilSteps(),
        detail.processAdditions(), detail.maturationAdditions(), detail.fermentationSteps(),
        detail.waterTreatment(), detail.fermentation(), detail.dryHop(), detail.packaging(),
        detail.notes(), 1, null, null);
    return writer.save(UserContext.userId(), requestedId, copy);
  }

  @Transactional
  public void ingredientVisibility(String type, String ingredientId, boolean visible) {
    requireIngredientType(type);
    if (!ownsIngredient(type, ingredientId, UserContext.userId())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ingrediente personal no encontrado");
    }
    if (!visible) {
      jdbc.update("DELETE FROM ingredient_sharing WHERE ingredient_type=? AND ingredient_id=? AND owner_id=?",
          type, ingredientId, UserContext.userId());
      return;
    }
    jdbc.update("""
        INSERT INTO ingredient_sharing(ingredient_type,ingredient_id,owner_id,published_at,updated_at)
        VALUES(?,?,?,now(),now())
        ON CONFLICT(ingredient_type,ingredient_id) DO UPDATE SET
          published_at=COALESCE(ingredient_sharing.published_at,now()),updated_at=now()
        WHERE ingredient_sharing.owner_id=EXCLUDED.owner_id
        """, type, ingredientId, UserContext.userId());
  }

  @Transactional
  public String copyIngredient(String type, String ingredientId) {
    requireIngredientType(type);
    UUID sourceOwner;
    try {
      sourceOwner = jdbc.queryForObject("""
          SELECT owner_id FROM ingredient_sharing
          WHERE ingredient_type=? AND ingredient_id=?
          """, UUID.class, type, ingredientId);
    } catch (EmptyResultDataAccessException exception) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El ingrediente ya no está compartido");
    }
    if (sourceOwner == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El ingrediente ya no está compartido");
    }
    if (sourceOwner.equals(UserContext.userId())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Este ingrediente ya pertenece a tu catálogo");
    }

    String targetId = personalIngredientId(type, ingredientId);
    int copied = copyIngredientRow(type, ingredientId, sourceOwner, targetId);
    if (copied == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El ingrediente original ya no existe");
    }
    return targetId;
  }

  private boolean ownsIngredient(String type, String id, UUID ownerId) {
    Integer count = switch (type) {
      case "hops" -> jdbc.queryForObject("SELECT count(*) FROM hops WHERE id=? AND owner_id=?", Integer.class, id, ownerId);
      case "malts" -> jdbc.queryForObject("SELECT count(*) FROM malts WHERE id=? AND owner_id=?", Integer.class, id, ownerId);
      case "yeasts" -> jdbc.queryForObject("SELECT count(*) FROM yeasts WHERE id=? AND owner_id=?", Integer.class, id, ownerId);
      case "adjuncts" -> jdbc.queryForObject("SELECT count(*) FROM adjuncts WHERE id=? AND owner_id=?", Integer.class, id, ownerId);
      case "salts" -> jdbc.queryForObject("SELECT count(*) FROM brewing_salts WHERE id=? AND owner_id=?", Integer.class, id, ownerId);
      case "aging" -> jdbc.queryForObject("SELECT count(*) FROM aging_ingredients WHERE id=? AND owner_id=?", Integer.class, id, ownerId);
      default -> 0;
    };
    return count != null && count > 0;
  }

  private int copyIngredientRow(String type, String sourceId, UUID sourceOwner, String targetId) {
    UUID owner = UserContext.userId();
    return switch (type) {
      case "hops" -> jdbc.update("""
          INSERT INTO hops(id,owner_id,name,brand,country,alpha_acids,beta_acids,format,recommended_use,aromas,description,image_url,distributor_name,distributor_url)
          SELECT ?,?,name,brand,country,alpha_acids,beta_acids,format,recommended_use,aromas,description,image_url,distributor_name,distributor_url FROM hops WHERE id=? AND owner_id=?
          """, targetId, owner, sourceId, sourceOwner);
      case "malts" -> jdbc.update("""
          INSERT INTO malts(id,owner_id,name,brand,type,potential,color_srm,diastatic_power,max_recommended_percent,description,image_url,distributor_name,distributor_url)
          SELECT ?,?,name,brand,type,potential,color_srm,diastatic_power,max_recommended_percent,description,image_url,distributor_name,distributor_url FROM malts WHERE id=? AND owner_id=?
          """, targetId, owner, sourceId, sourceOwner);
      case "yeasts" -> jdbc.update("""
          INSERT INTO yeasts(id,owner_id,name,brand,laboratory,type,attenuation_min,attenuation_max,temperature_min,temperature_max,flocculation,alcohol_tolerance,sensory_profile,image_url,distributor_name,distributor_url)
          SELECT ?,?,name,brand,laboratory,type,attenuation_min,attenuation_max,temperature_min,temperature_max,flocculation,alcohol_tolerance,sensory_profile,image_url,distributor_name,distributor_url FROM yeasts WHERE id=? AND owner_id=?
          """, targetId, owner, sourceId, sourceOwner);
      case "adjuncts" -> jdbc.update("""
          INSERT INTO adjuncts(id,owner_id,name,brand,category,format,recommended_use,dosage_guidance,fermentability_percent,allergens,description,image_url,distributor_name,distributor_url)
          SELECT ?,?,name,brand,category,format,recommended_use,dosage_guidance,fermentability_percent,allergens,description,image_url,distributor_name,distributor_url FROM adjuncts WHERE id=? AND owner_id=?
          """, targetId, owner, sourceId, sourceOwner);
      case "salts" -> jdbc.update("""
          INSERT INTO brewing_salts(id,owner_id,name,formula,category,calcium_percent,magnesium_percent,sodium_percent,sulfate_percent,chloride_percent,bicarbonate_percent,description)
          SELECT ?,?,name,formula,category,calcium_percent,magnesium_percent,sodium_percent,sulfate_percent,chloride_percent,bicarbonate_percent,description FROM brewing_salts WHERE id=? AND owner_id=?
          """, targetId, owner, sourceId, sourceOwner);
      case "aging" -> jdbc.update("""
          INSERT INTO aging_ingredients(id,owner_id,name,brand,type,wood_type,previous_use,origin,barrel_details,intensity,contact_time_days_min,contact_time_days_max,description,image_url,distributor_name,distributor_url)
          SELECT ?,?,name,brand,type,wood_type,previous_use,origin,barrel_details,intensity,contact_time_days_min,contact_time_days_max,description,image_url,distributor_name,distributor_url FROM aging_ingredients WHERE id=? AND owner_id=?
          """, targetId, owner, sourceId, sourceOwner);
      default -> 0;
    };
  }

  private String personalIngredientId(String type, String sourceId) {
    String clean = sourceId.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9-]+", "-")
        .replaceAll("^-|-$", "");
    if (clean.length() > 42) clean = clean.substring(clean.length() - 42);
    String singular = switch (type) {
      case "hops" -> "hop";
      case "malts" -> "malt";
      case "yeasts" -> "yeast";
      case "adjuncts" -> "adjunct";
      case "salts" -> "salt";
      case "aging" -> "aging";
      default -> "ingredient";
    };
    return "user-" + UserContext.userId().toString().substring(0, 8) + "-" + singular
        + "-" + clean + "-" + Long.toString(System.currentTimeMillis(), 36);
  }

  private void requireIngredientType(String type) {
    if (!INGREDIENT_TYPES.contains(type)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de ingrediente no válido");
    }
  }

  private CommunityRecipe recipe(ResultSet rs, int row) throws SQLException {
    return new CommunityRecipe(rs.getString("id"), rs.getString("name"), rs.getString("brewer"),
        rs.getString("style_id"), rs.getBigDecimal("batch_volume_l"), rs.getString("notes"),
        rs.getInt("version"), rs.getObject("updated_at", OffsetDateTime.class),
        rs.getString("display_name"), rs.getString("avatar_kind"), rs.getString("avatar_value"),
        rs.getBoolean("is_public"), rs.getBoolean("is_template"));
  }

  private CommunityIngredient ingredient(ResultSet rs, int row) throws SQLException {
    return new CommunityIngredient(rs.getString("ingredient_type"), rs.getString("id"),
        rs.getString("name"), rs.getString("brand"), rs.getString("description"),
        rs.getString("detail"), rs.getObject("published_at", OffsetDateTime.class),
        rs.getString("display_name"), rs.getString("avatar_kind"), rs.getString("avatar_value"),
        rs.getBoolean("owned_by_me"), rs.getBoolean("public_ingredient"));
  }
}
