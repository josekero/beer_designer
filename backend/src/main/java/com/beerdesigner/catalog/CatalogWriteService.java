//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.catalog;

import com.beerdesigner.catalog.CatalogDtos.AdjunctDto;
import com.beerdesigner.catalog.CatalogDtos.AgingIngredientDto;
import com.beerdesigner.catalog.CatalogDtos.HopDto;
import com.beerdesigner.catalog.CatalogDtos.ImportResultDto;
import com.beerdesigner.catalog.CatalogDtos.MaltDto;
import com.beerdesigner.catalog.CatalogDtos.YeastDto;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import javax.xml.parsers.DocumentBuilderFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.w3c.dom.Element;

@Service
public class CatalogWriteService {
  private final JdbcTemplate jdbcTemplate;

  public CatalogWriteService(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @Transactional
  public HopDto saveHop(String id, HopDto hop) {
    jdbcTemplate.update("""
        INSERT INTO hops (
          id, name, brand, country, alpha_acids, beta_acids, format, recommended_use,
          aromas, description, image_url, distributor_name, distributor_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        """,
        id, hop.name(), blankToNull(hop.brand()), hop.country(), hop.alphaAcids(), hop.betaAcids(), hop.format(),
        toTextArray(hop.recommendedUse()), toTextArray(hop.aromas()), hop.description(), blankToNull(hop.imageUrl()),
        blankToNull(hop.distributorName()), blankToNull(hop.distributorUrl())
    );
    return new HopDto(id, hop.name(), hop.brand(), hop.country(), hop.alphaAcids(), hop.betaAcids(), hop.format(), hop.recommendedUse(), hop.aromas(), hop.description(), hop.imageUrl(), hop.distributorName(), hop.distributorUrl());
  }

  @Transactional
  public MaltDto saveMalt(String id, MaltDto malt) {
    jdbcTemplate.update("""
        INSERT INTO malts (
          id, name, brand, type, potential, color_srm, diastatic_power,
          max_recommended_percent, description, image_url, distributor_name, distributor_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        """,
        id, malt.name(), blankToNull(malt.brand()), malt.type(), malt.potential(), malt.colorSrm(), malt.diastaticPower(),
        malt.maxRecommendedPercent(), malt.description(), blankToNull(malt.imageUrl()), blankToNull(malt.distributorName()), blankToNull(malt.distributorUrl())
    );
    return new MaltDto(id, malt.name(), malt.brand(), malt.type(), malt.potential(), malt.colorSrm(), malt.diastaticPower(), malt.maxRecommendedPercent(), malt.description(), malt.imageUrl(), malt.distributorName(), malt.distributorUrl());
  }

  @Transactional
  public YeastDto saveYeast(String id, YeastDto yeast) {
    jdbcTemplate.update("""
        INSERT INTO yeasts (
          id, name, brand, laboratory, type, attenuation_min, attenuation_max, temperature_min,
          temperature_max, flocculation, alcohol_tolerance, sensory_profile, image_url,
          distributor_name, distributor_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        """,
        id, yeast.name(), blankToNull(yeast.brand()), blankToNull(yeast.laboratory()), yeast.type(), yeast.attenuationMin(), yeast.attenuationMax(),
        yeast.temperatureMin(), yeast.temperatureMax(), yeast.flocculation(), yeast.alcoholTolerance(), yeast.sensoryProfile(), blankToNull(yeast.imageUrl()),
        blankToNull(yeast.distributorName()), blankToNull(yeast.distributorUrl())
    );
    return new YeastDto(id, yeast.name(), yeast.brand(), yeast.laboratory(), yeast.type(), yeast.attenuationMin(), yeast.attenuationMax(), yeast.temperatureMin(), yeast.temperatureMax(), yeast.flocculation(), yeast.alcoholTolerance(), yeast.sensoryProfile(), yeast.imageUrl(), yeast.distributorName(), yeast.distributorUrl());
  }

  @Transactional
  public AdjunctDto saveAdjunct(String id, AdjunctDto adjunct) {
    jdbcTemplate.update("""
        INSERT INTO adjuncts (
          id, name, brand, category, format, recommended_use, dosage_guidance,
          fermentability_percent, allergens, description, image_url, distributor_name, distributor_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        """,
        id, adjunct.name(), blankToNull(adjunct.brand()), adjunct.category(), adjunct.format(), toTextArray(adjunct.recommendedUse()),
        blankToNull(adjunct.dosageGuidance()), adjunct.fermentabilityPercent(), blankToNull(adjunct.allergens()), adjunct.description(),
        blankToNull(adjunct.imageUrl()), blankToNull(adjunct.distributorName()), blankToNull(adjunct.distributorUrl())
    );
    return new AdjunctDto(id, adjunct.name(), adjunct.brand(), adjunct.category(), adjunct.format(), adjunct.recommendedUse(), adjunct.dosageGuidance(), adjunct.fermentabilityPercent(), adjunct.allergens(), adjunct.description(), adjunct.imageUrl(), adjunct.distributorName(), adjunct.distributorUrl());
  }

  @Transactional
  public AgingIngredientDto saveAgingIngredient(String id, AgingIngredientDto agingIngredient) {
    jdbcTemplate.update("""
        INSERT INTO aging_ingredients (
          id, name, brand, type, wood_type, previous_use, origin, barrel_details,
          intensity, contact_time_days_min, contact_time_days_max, description,
          image_url, distributor_name, distributor_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        """,
        id, agingIngredient.name(), blankToNull(agingIngredient.brand()), agingIngredient.type(), agingIngredient.woodType(),
        blankToNull(agingIngredient.previousUse()), blankToNull(agingIngredient.origin()), blankToNull(agingIngredient.barrelDetails()),
        blankToNull(agingIngredient.intensity()), agingIngredient.contactTimeDaysMin(), agingIngredient.contactTimeDaysMax(),
        agingIngredient.description(), blankToNull(agingIngredient.imageUrl()), blankToNull(agingIngredient.distributorName()),
        blankToNull(agingIngredient.distributorUrl())
    );
    return new AgingIngredientDto(id, agingIngredient.name(), agingIngredient.brand(), agingIngredient.type(), agingIngredient.woodType(), agingIngredient.previousUse(), agingIngredient.origin(), agingIngredient.barrelDetails(), agingIngredient.intensity(), agingIngredient.contactTimeDaysMin(), agingIngredient.contactTimeDaysMax(), agingIngredient.description(), agingIngredient.imageUrl(), agingIngredient.distributorName(), agingIngredient.distributorUrl());
  }

  @Transactional
  public ImportResultDto importHopsXml(String xml) {
    var hops = elements(xml, "hop").stream().map(this::hopFromXml).toList();
    hops.forEach((hop) -> saveHop(hop.id(), hop));
    return new ImportResultDto("hops", hops.size());
  }

  @Transactional
  public ImportResultDto importMaltsXml(String xml) {
    var malts = elements(xml, "malt").stream().map(this::maltFromXml).toList();
    malts.forEach((malt) -> saveMalt(malt.id(), malt));
    return new ImportResultDto("malts", malts.size());
  }

  @Transactional
  public ImportResultDto importYeastsXml(String xml) {
    var yeasts = elements(xml, "yeast").stream().map(this::yeastFromXml).toList();
    yeasts.forEach((yeast) -> saveYeast(yeast.id(), yeast));
    return new ImportResultDto("yeasts", yeasts.size());
  }

  @Transactional
  public ImportResultDto importAdjunctsXml(String xml) {
    var adjuncts = elements(xml, "adjunct").stream().map(this::adjunctFromXml).toList();
    adjuncts.forEach((adjunct) -> saveAdjunct(adjunct.id(), adjunct));
    return new ImportResultDto("adjuncts", adjuncts.size());
  }

  @Transactional
  public ImportResultDto importAgingIngredientsXml(String xml) {
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
