//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.catalog;

import com.beerdesigner.auth.UserContext;
import com.beerdesigner.catalog.CatalogDtos.AdjunctDto;
import com.beerdesigner.catalog.CatalogDtos.AgingIngredientDto;
import com.beerdesigner.catalog.CatalogDtos.BrewingSaltDto;
import com.beerdesigner.catalog.CatalogDtos.HopDto;
import com.beerdesigner.catalog.CatalogDtos.ImportResultDto;
import com.beerdesigner.catalog.CatalogDtos.IngredientStockDto;
import com.beerdesigner.catalog.CatalogDtos.MaltDto;
import com.beerdesigner.catalog.CatalogDtos.YeastDto;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import javax.xml.parsers.DocumentBuilderFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import org.w3c.dom.Element;

@Service
public class CatalogWriteService {
  private static final List<String> STOCK_TYPES = List.of("hops", "malts", "yeasts", "adjuncts", "salts", "aging");
  private final JdbcTemplate jdbcTemplate;

  public CatalogWriteService(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<IngredientStockDto> findIngredientStock() {
    return jdbcTemplate.query(
        "SELECT ingredient_type, ingredient_id, in_stock FROM ingredient_stock WHERE user_id=? ORDER BY ingredient_type, ingredient_id",
        (rs, row) -> new IngredientStockDto(rs.getString("ingredient_type"), rs.getString("ingredient_id"), rs.getBoolean("in_stock")), UserContext.userId()
    );
  }

  @Transactional
  public IngredientStockDto saveIngredientStock(String type, String id, IngredientStockDto stock) {
    if (!STOCK_TYPES.contains(type)) throw new IllegalArgumentException("Tipo de ingrediente no válido: " + type);
    if (id == null || id.isBlank()) throw new IllegalArgumentException("El identificador del ingrediente es obligatorio");
    boolean inStock = stock != null && stock.inStock();
    jdbcTemplate.update("""
        INSERT INTO ingredient_stock (user_id, ingredient_type, ingredient_id, in_stock, updated_at)
        VALUES (?, ?, ?, ?, now())
        ON CONFLICT (user_id, ingredient_type, ingredient_id) DO UPDATE SET
          in_stock = EXCLUDED.in_stock,
          updated_at = now()
        """, UserContext.userId(), type, id, inStock);
    return new IngredientStockDto(type, id, inStock);
  }

  @Transactional
  public void deleteIngredient(String type, String id) {
    if (!STOCK_TYPES.contains(type)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de ingrediente no válido: " + type);
    }
    if (id == null || id.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El identificador del ingrediente es obligatorio");
    }

    try {
      int deleted = deleteCatalogRow(type, id);
      if (deleted == 0) {
        throw new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Ingrediente no encontrado o no tienes permiso para borrarlo"
        );
      }
      jdbcTemplate.update("DELETE FROM ingredient_sharing WHERE ingredient_type=? AND ingredient_id=?", type, id);
      deleteStockRows(type, id);
    } catch (DataIntegrityViolationException exception) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "No se puede borrar este ingrediente porque ya se utiliza en una receta o elaboración",
          exception
      );
    }
  }

  private int deleteCatalogRow(String type, String id) {
    if (UserContext.isAdmin()) {
      return switch (type) {
        case "hops" -> jdbcTemplate.update("DELETE FROM hops WHERE id=? AND owner_id IS NULL", id);
        case "malts" -> jdbcTemplate.update("DELETE FROM malts WHERE id=? AND owner_id IS NULL", id);
        case "yeasts" -> jdbcTemplate.update("DELETE FROM yeasts WHERE id=? AND owner_id IS NULL", id);
        case "adjuncts" -> jdbcTemplate.update("DELETE FROM adjuncts WHERE id=? AND owner_id IS NULL", id);
        case "salts" -> jdbcTemplate.update("DELETE FROM brewing_salts WHERE id=? AND owner_id IS NULL", id);
        case "aging" -> jdbcTemplate.update("DELETE FROM aging_ingredients WHERE id=? AND owner_id IS NULL", id);
        default -> 0;
      };
    }

    UUID ownerId = UserContext.userId();
    return switch (type) {
      case "hops" -> jdbcTemplate.update("DELETE FROM hops WHERE id=? AND owner_id=?", id, ownerId);
      case "malts" -> jdbcTemplate.update("DELETE FROM malts WHERE id=? AND owner_id=?", id, ownerId);
      case "yeasts" -> jdbcTemplate.update("DELETE FROM yeasts WHERE id=? AND owner_id=?", id, ownerId);
      case "adjuncts" -> jdbcTemplate.update("DELETE FROM adjuncts WHERE id=? AND owner_id=?", id, ownerId);
      case "salts" -> jdbcTemplate.update("DELETE FROM brewing_salts WHERE id=? AND owner_id=?", id, ownerId);
      case "aging" -> jdbcTemplate.update("DELETE FROM aging_ingredients WHERE id=? AND owner_id=?", id, ownerId);
      default -> 0;
    };
  }

  private void deleteStockRows(String type, String id) {
    if (UserContext.isAdmin()) {
      jdbcTemplate.update("DELETE FROM ingredient_stock WHERE ingredient_type=? AND ingredient_id=?", type, id);
      return;
    }
    jdbcTemplate.update(
        "DELETE FROM ingredient_stock WHERE user_id=? AND ingredient_type=? AND ingredient_id=?",
        UserContext.userId(), type, id
    );
  }

  @Transactional
  public BrewingSaltDto saveSalt(String id, BrewingSaltDto salt) {
    UUID owner = catalogOwner();
    String savedId = effectiveId(id, owner);
    int changed = jdbcTemplate.update("""
        INSERT INTO brewing_salts (
          id, owner_id, name, formula, category, calcium_percent, magnesium_percent, sodium_percent,
          sulfate_percent, chloride_percent, bicarbonate_percent, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          formula = EXCLUDED.formula,
          category = EXCLUDED.category,
          calcium_percent = EXCLUDED.calcium_percent,
          magnesium_percent = EXCLUDED.magnesium_percent,
          sodium_percent = EXCLUDED.sodium_percent,
          sulfate_percent = EXCLUDED.sulfate_percent,
          chloride_percent = EXCLUDED.chloride_percent,
          bicarbonate_percent = EXCLUDED.bicarbonate_percent,
          description = EXCLUDED.description
        WHERE brewing_salts.owner_id IS NOT DISTINCT FROM EXCLUDED.owner_id
        """,
        savedId, owner, salt.name(), blankToNull(salt.formula()), blankToNull(salt.category()),
        salt.calciumPercent(), salt.magnesiumPercent(), salt.sodiumPercent(), salt.sulfatePercent(),
        salt.chloridePercent(), salt.bicarbonatePercent(), blankToNull(salt.description())
    );
    ensureSaved(changed);
    return new BrewingSaltDto(
        savedId, owner, salt.name(), salt.formula(), salt.category(), salt.calciumPercent(),
        salt.magnesiumPercent(), salt.sodiumPercent(), salt.sulfatePercent(),
        salt.chloridePercent(), salt.bicarbonatePercent(), salt.description()
    );
  }

  @Transactional
  public HopDto saveHop(String id, HopDto hop) {
    UUID owner = catalogOwner(); String savedId = effectiveId(id, owner);
    int changed = jdbcTemplate.update("""
        INSERT INTO hops (
          id, owner_id, name, brand, country, alpha_acids, beta_acids, format, recommended_use,
          aromas, description, image_url, distributor_name, distributor_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          brand = EXCLUDED.brand,
          country = EXCLUDED.country,
          alpha_acids = EXCLUDED.alpha_acids,
          beta_acids = EXCLUDED.beta_acids,
          format = EXCLUDED.format,
          recommended_use = EXCLUDED.recommended_use,
          aromas = EXCLUDED.aromas,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          distributor_name = EXCLUDED.distributor_name,
          distributor_url = EXCLUDED.distributor_url
        WHERE hops.owner_id IS NOT DISTINCT FROM EXCLUDED.owner_id
        """,
        savedId, owner, hop.name(), blankToNull(hop.brand()), hop.country(), hop.alphaAcids(), hop.betaAcids(), hop.format(),
        toTextArray(hop.recommendedUse()), toTextArray(hop.aromas()), hop.description(), blankToNull(hop.imageUrl()),
        blankToNull(hop.distributorName()), blankToNull(hop.distributorUrl())
    );
    ensureSaved(changed);
    return new HopDto(savedId, hop.name(), hop.brand(), hop.country(), hop.alphaAcids(), hop.betaAcids(), hop.format(), hop.recommendedUse(), hop.aromas(), hop.description(), hop.imageUrl(), hop.distributorName(), hop.distributorUrl());
  }

  @Transactional
  public MaltDto saveMalt(String id, MaltDto malt) {
    UUID owner = catalogOwner(); String savedId = effectiveId(id, owner);
    int changed = jdbcTemplate.update("""
        INSERT INTO malts (
          id, owner_id, name, brand, type, potential, color_srm, diastatic_power,
          max_recommended_percent, description, image_url, distributor_name, distributor_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          brand = EXCLUDED.brand,
          type = EXCLUDED.type,
          potential = EXCLUDED.potential,
          color_srm = EXCLUDED.color_srm,
          diastatic_power = EXCLUDED.diastatic_power,
          max_recommended_percent = EXCLUDED.max_recommended_percent,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          distributor_name = EXCLUDED.distributor_name,
          distributor_url = EXCLUDED.distributor_url
        WHERE malts.owner_id IS NOT DISTINCT FROM EXCLUDED.owner_id
        """,
        savedId, owner, malt.name(), blankToNull(malt.brand()), malt.type(), malt.potential(), malt.colorSrm(), malt.diastaticPower(),
        malt.maxRecommendedPercent(), malt.description(), blankToNull(malt.imageUrl()), blankToNull(malt.distributorName()), blankToNull(malt.distributorUrl())
    );
    ensureSaved(changed);
    return new MaltDto(savedId, malt.name(), malt.brand(), malt.type(), malt.potential(), malt.colorSrm(), malt.diastaticPower(), malt.maxRecommendedPercent(), malt.description(), malt.imageUrl(), malt.distributorName(), malt.distributorUrl());
  }

  @Transactional
  public YeastDto saveYeast(String id, YeastDto yeast) {
    UUID owner = catalogOwner(); String savedId = effectiveId(id, owner);
    int changed = jdbcTemplate.update("""
        INSERT INTO yeasts (
          id, owner_id, name, brand, laboratory, type, attenuation_min, attenuation_max, temperature_min,
          temperature_max, flocculation, alcohol_tolerance, sensory_profile, image_url,
          distributor_name, distributor_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          brand = EXCLUDED.brand,
          laboratory = EXCLUDED.laboratory,
          type = EXCLUDED.type,
          attenuation_min = EXCLUDED.attenuation_min,
          attenuation_max = EXCLUDED.attenuation_max,
          temperature_min = EXCLUDED.temperature_min,
          temperature_max = EXCLUDED.temperature_max,
          flocculation = EXCLUDED.flocculation,
          alcohol_tolerance = EXCLUDED.alcohol_tolerance,
          sensory_profile = EXCLUDED.sensory_profile,
          image_url = EXCLUDED.image_url,
          distributor_name = EXCLUDED.distributor_name,
          distributor_url = EXCLUDED.distributor_url
        WHERE yeasts.owner_id IS NOT DISTINCT FROM EXCLUDED.owner_id
        """,
        savedId, owner, yeast.name(), blankToNull(yeast.brand()), blankToNull(yeast.laboratory()), yeast.type(), yeast.attenuationMin(), yeast.attenuationMax(),
        yeast.temperatureMin(), yeast.temperatureMax(), yeast.flocculation(), yeast.alcoholTolerance(), yeast.sensoryProfile(), blankToNull(yeast.imageUrl()),
        blankToNull(yeast.distributorName()), blankToNull(yeast.distributorUrl())
    );
    ensureSaved(changed);
    return new YeastDto(savedId, yeast.name(), yeast.brand(), yeast.laboratory(), yeast.type(), yeast.attenuationMin(), yeast.attenuationMax(), yeast.temperatureMin(), yeast.temperatureMax(), yeast.flocculation(), yeast.alcoholTolerance(), yeast.sensoryProfile(), yeast.imageUrl(), yeast.distributorName(), yeast.distributorUrl());
  }

  @Transactional
  public AdjunctDto saveAdjunct(String id, AdjunctDto adjunct) {
    UUID owner = catalogOwner(); String savedId = effectiveId(id, owner);
    int changed = jdbcTemplate.update("""
        INSERT INTO adjuncts (
          id, owner_id, name, brand, category, format, recommended_use, dosage_guidance,
          fermentability_percent, allergens, description, image_url, distributor_name, distributor_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          brand = EXCLUDED.brand,
          category = EXCLUDED.category,
          format = EXCLUDED.format,
          recommended_use = EXCLUDED.recommended_use,
          dosage_guidance = EXCLUDED.dosage_guidance,
          fermentability_percent = EXCLUDED.fermentability_percent,
          allergens = EXCLUDED.allergens,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          distributor_name = EXCLUDED.distributor_name,
          distributor_url = EXCLUDED.distributor_url
        WHERE adjuncts.owner_id IS NOT DISTINCT FROM EXCLUDED.owner_id
        """,
        savedId, owner, adjunct.name(), blankToNull(adjunct.brand()), adjunct.category(), adjunct.format(), toTextArray(adjunct.recommendedUse()),
        blankToNull(adjunct.dosageGuidance()), adjunct.fermentabilityPercent(), blankToNull(adjunct.allergens()), adjunct.description(),
        blankToNull(adjunct.imageUrl()), blankToNull(adjunct.distributorName()), blankToNull(adjunct.distributorUrl())
    );
    ensureSaved(changed);
    return new AdjunctDto(savedId, adjunct.name(), adjunct.brand(), adjunct.category(), adjunct.format(), adjunct.recommendedUse(), adjunct.dosageGuidance(), adjunct.fermentabilityPercent(), adjunct.allergens(), adjunct.description(), adjunct.imageUrl(), adjunct.distributorName(), adjunct.distributorUrl());
  }

  @Transactional
  public AgingIngredientDto saveAgingIngredient(String id, AgingIngredientDto agingIngredient) {
    UUID owner = catalogOwner(); String savedId = effectiveId(id, owner);
    int changed = jdbcTemplate.update("""
        INSERT INTO aging_ingredients (
          id, owner_id, name, brand, type, wood_type, previous_use, origin, barrel_details,
          intensity, contact_time_days_min, contact_time_days_max, description,
          image_url, distributor_name, distributor_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          brand = EXCLUDED.brand,
          type = EXCLUDED.type,
          wood_type = EXCLUDED.wood_type,
          previous_use = EXCLUDED.previous_use,
          origin = EXCLUDED.origin,
          barrel_details = EXCLUDED.barrel_details,
          intensity = EXCLUDED.intensity,
          contact_time_days_min = EXCLUDED.contact_time_days_min,
          contact_time_days_max = EXCLUDED.contact_time_days_max,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          distributor_name = EXCLUDED.distributor_name,
          distributor_url = EXCLUDED.distributor_url
        WHERE aging_ingredients.owner_id IS NOT DISTINCT FROM EXCLUDED.owner_id
        """,
        savedId, owner, agingIngredient.name(), blankToNull(agingIngredient.brand()), agingIngredient.type(), agingIngredient.woodType(),
        blankToNull(agingIngredient.previousUse()), blankToNull(agingIngredient.origin()), blankToNull(agingIngredient.barrelDetails()),
        blankToNull(agingIngredient.intensity()), agingIngredient.contactTimeDaysMin(), agingIngredient.contactTimeDaysMax(),
        agingIngredient.description(), blankToNull(agingIngredient.imageUrl()), blankToNull(agingIngredient.distributorName()),
        blankToNull(agingIngredient.distributorUrl())
    );
    ensureSaved(changed);
    return new AgingIngredientDto(savedId, agingIngredient.name(), agingIngredient.brand(), agingIngredient.type(), agingIngredient.woodType(), agingIngredient.previousUse(), agingIngredient.origin(), agingIngredient.barrelDetails(), agingIngredient.intensity(), agingIngredient.contactTimeDaysMin(), agingIngredient.contactTimeDaysMax(), agingIngredient.description(), agingIngredient.imageUrl(), agingIngredient.distributorName(), agingIngredient.distributorUrl());
  }

  @Transactional
  public ImportResultDto importHopsXml(String xml) {
    requireAdmin();
    var hops = elements(xml, "hop").stream().map(this::hopFromXml).toList();
    hops.forEach((hop) -> saveHop(hop.id(), hop));
    return new ImportResultDto("hops", hops.size());
  }

  @Transactional
  public ImportResultDto importMaltsXml(String xml) {
    requireAdmin();
    var malts = elements(xml, "malt").stream().map(this::maltFromXml).toList();
    malts.forEach((malt) -> saveMalt(malt.id(), malt));
    return new ImportResultDto("malts", malts.size());
  }

  @Transactional
  public ImportResultDto importYeastsXml(String xml) {
    requireAdmin();
    var yeasts = elements(xml, "yeast").stream().map(this::yeastFromXml).toList();
    yeasts.forEach((yeast) -> saveYeast(yeast.id(), yeast));
    return new ImportResultDto("yeasts", yeasts.size());
  }

  @Transactional
  public ImportResultDto importAdjunctsXml(String xml) {
    requireAdmin();
    var adjuncts = elements(xml, "adjunct").stream().map(this::adjunctFromXml).toList();
    adjuncts.forEach((adjunct) -> saveAdjunct(adjunct.id(), adjunct));
    return new ImportResultDto("adjuncts", adjuncts.size());
  }

  @Transactional
  public ImportResultDto importAgingIngredientsXml(String xml) {
    requireAdmin();
    var agingIngredients = elements(xml, "aging").stream().map(this::agingIngredientFromXml).toList();
    agingIngredients.forEach((agingIngredient) -> saveAgingIngredient(agingIngredient.id(), agingIngredient));
    return new ImportResultDto("aging", agingIngredients.size());
  }

  private HopDto hopFromXml(Element node) {
    return new HopDto(
        attr(node, "id"),
        text(node, "name"),
        optionalText(node, "brand"),
        text(node, "country"),
        decimal(node, "alphaAcids"),
        optionalDecimal(node, "betaAcids"),
        text(node, "format"),
        csv(node, "recommendedUse"),
        csv(node, "aromas"),
        text(node, "description"),
        optionalText(node, "imageUrl"),
        optionalText(node, "distributorName"),
        optionalText(node, "distributorUrl")
    );
  }

  private MaltDto maltFromXml(Element node) {
    return new MaltDto(
        attr(node, "id"),
        text(node, "name"),
        optionalText(node, "brand"),
        text(node, "type"),
        decimal(node, "potential"),
        decimal(node, "colorSrm"),
        optionalDecimal(node, "diastaticPower"),
        decimal(node, "maxRecommendedPercent"),
        text(node, "description"),
        optionalText(node, "imageUrl"),
        optionalText(node, "distributorName"),
        optionalText(node, "distributorUrl")
    );
  }

  private YeastDto yeastFromXml(Element node) {
    return new YeastDto(
        attr(node, "id"),
        text(node, "name"),
        optionalText(node, "brand"),
        optionalText(node, "laboratory"),
        text(node, "type"),
        decimal(node, "attenuationMin"),
        decimal(node, "attenuationMax"),
        decimal(node, "temperatureMin"),
        decimal(node, "temperatureMax"),
        text(node, "flocculation"),
        decimal(node, "alcoholTolerance"),
        text(node, "sensoryProfile"),
        optionalText(node, "imageUrl"),
        optionalText(node, "distributorName"),
        optionalText(node, "distributorUrl")
    );
  }

  private AdjunctDto adjunctFromXml(Element node) {
    return new AdjunctDto(
        attr(node, "id"),
        text(node, "name"),
        optionalText(node, "brand"),
        text(node, "category"),
        text(node, "format"),
        csv(node, "recommendedUse"),
        optionalText(node, "dosageGuidance"),
        optionalDecimal(node, "fermentabilityPercent"),
        optionalText(node, "allergens"),
        text(node, "description"),
        optionalText(node, "imageUrl"),
        optionalText(node, "distributorName"),
        optionalText(node, "distributorUrl")
    );
  }

  private AgingIngredientDto agingIngredientFromXml(Element node) {
    return new AgingIngredientDto(
        attr(node, "id"),
        text(node, "name"),
        optionalText(node, "brand"),
        text(node, "type"),
        text(node, "woodType"),
        optionalText(node, "previousUse"),
        optionalText(node, "origin"),
        optionalText(node, "barrelDetails"),
        optionalText(node, "intensity"),
        optionalInteger(node, "contactTimeDaysMin"),
        optionalInteger(node, "contactTimeDaysMax"),
        text(node, "description"),
        optionalText(node, "imageUrl"),
        optionalText(node, "distributorName"),
        optionalText(node, "distributorUrl")
    );
  }

  private List<Element> elements(String xml, String tagName) {
    try {
      var factory = DocumentBuilderFactory.newInstance();
      factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
      var document = factory.newDocumentBuilder().parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
      var nodes = document.getElementsByTagName(tagName);
      return java.util.stream.IntStream.range(0, nodes.getLength())
          .mapToObj((index) -> (Element) nodes.item(index))
          .toList();
    } catch (Exception exception) {
      throw new IllegalArgumentException("Invalid ingredients XML", exception);
    }
  }

  private String[] toTextArray(List<String> values) {
    return values == null ? new String[0] : values.toArray(String[]::new);
  }

  private UUID catalogOwner() { return UserContext.isAdmin() ? null : UserContext.userId(); }
  private String effectiveId(String requested, UUID owner) {
    String id = requested == null ? "" : requested.trim().toLowerCase(java.util.Locale.ROOT)
        .replaceAll("[^a-z0-9-]+", "-").replaceAll("^-|-$", "");
    if (id.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identificador no válido");
    if (owner == null) return id;
    String prefix = "user-" + owner.toString().substring(0, 8) + "-";
    return id.startsWith(prefix) ? id : prefix + id;
  }
  private void ensureSaved(int changed) {
    if (changed == 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese ingrediente pertenece al catálogo del sistema o a otro usuario");
  }
  private void requireAdmin() {
    if (!UserContext.isAdmin()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo un administrador puede importar el catálogo del sistema");
  }

  private List<String> csv(Element root, String tagName) {
    return Arrays.stream(text(root, tagName).split(","))
        .map(String::trim)
        .filter((value) -> !value.isBlank())
        .toList();
  }

  private BigDecimal decimal(Element root, String tagName) {
    return new BigDecimal(text(root, tagName));
  }

  private BigDecimal optionalDecimal(Element root, String tagName) {
    var value = optionalText(root, tagName);
    return value == null ? null : new BigDecimal(value);
  }

  private Integer optionalInteger(Element root, String tagName) {
    var value = optionalText(root, tagName);
    return value == null ? null : Integer.valueOf(value);
  }

  private String text(Element root, String tagName) {
    return root.getElementsByTagName(tagName).item(0).getTextContent().trim();
  }

  private String optionalText(Element root, String tagName) {
    var nodes = root.getElementsByTagName(tagName);
    if (nodes.getLength() == 0) {
      return null;
    }

    return blankToNull(nodes.item(0).getTextContent().trim());
  }

  private String attr(Element root, String attrName) {
    return root.getAttribute(attrName);
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value;
  }
}
