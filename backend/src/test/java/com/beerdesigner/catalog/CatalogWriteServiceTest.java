package com.beerdesigner.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.beerdesigner.catalog.CatalogDtos.*;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class CatalogWriteServiceTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final CatalogWriteService service = new CatalogWriteService(jdbc);

  @Test
  void savesOnlyWhitelistedSaltFieldsAndUsesThePathIdentifier() {
    BrewingSaltDto request = new BrewingSaltDto(
        "untrusted-body-id", "Cloruro de calcio", " ", "mineral",
        decimal("27.2"), decimal("0"), decimal("0"), decimal("0"), decimal("48.2"), decimal("0"), "");

    BrewingSaltDto saved = service.saveSalt("route-id", request);

    assertThat(saved.id()).isEqualTo("route-id");
    assertThat(saved.name()).isEqualTo("Cloruro de calcio");
    verify(jdbc).update(anyString(), any(Object[].class));
  }

  @Test
  void updatesIngredientStockWithoutModifyingTheCatalogEntity() {
    IngredientStockDto saved = service.saveIngredientStock(
        "hops", "citra", new IngredientStockDto("ignored", "ignored", true));

    assertThat(saved).isEqualTo(new IngredientStockDto("hops", "citra", true));
    verify(jdbc).update(anyString(), any(Object[].class));
    assertThatThrownBy(() -> service.saveIngredientStock("unknown", "citra", saved))
        .isInstanceOf(IllegalArgumentException.class);
    assertThatThrownBy(() -> service.saveIngredientStock("hops", " ", saved))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void savesEveryEditableCatalogType() {
    HopDto hop = new HopDto("body", "Citra", "", "US", decimal("12"), null, "pellet",
        List.of("whirlpool"), List.of("citrus"), "description", "", "", "");
    MaltDto malt = new MaltDto("body", "Pale Ale", "", "grain", decimal("1.037"), decimal("3"),
        null, decimal("100"), "description", "", "", "");
    YeastDto yeast = new YeastDto("body", "London Ale", "", "", "ale", decimal("70"), decimal("75"),
        decimal("18"), decimal("22"), "medium", decimal("10"), "fruity", "", "", "");
    AdjunctDto adjunct = new AdjunctDto("body", "Cacao", "", "spice", "solid", null,
        "", null, "", "description", "", "", "");
    AgingIngredientDto aging = new AgingIngredientDto("body", "Oak", "", "wood", "oak", "", "", "",
        "", null, null, "description", "", "", "");

    assertThat(service.saveHop("hop", hop).id()).isEqualTo("hop");
    assertThat(service.saveMalt("malt", malt).id()).isEqualTo("malt");
    assertThat(service.saveYeast("yeast", yeast).id()).isEqualTo("yeast");
    assertThat(service.saveAdjunct("adjunct", adjunct).id()).isEqualTo("adjunct");
    assertThat(service.saveAgingIngredient("aging", aging).id()).isEqualTo("aging");
    verify(jdbc, times(5)).update(anyString(), any(Object[].class));
  }

  @Test
  void importsAllSupportedIngredientXmlTypes() {
    String xml = """
        <catalog>
          <hop id="citra"><name>Citra</name><country>US</country><alphaAcids>12</alphaAcids><format>pellet</format><recommendedUse>boil, whirlpool</recommendedUse><aromas>citrus, tropical</aromas><description>Modern hop</description></hop>
          <malt id="pale"><name>Pale Ale</name><type>grain</type><potential>1.037</potential><colorSrm>3</colorSrm><maxRecommendedPercent>100</maxRecommendedPercent><description>Base malt</description></malt>
          <yeast id="london"><name>London Ale</name><type>ale</type><attenuationMin>70</attenuationMin><attenuationMax>75</attenuationMax><temperatureMin>18</temperatureMin><temperatureMax>22</temperatureMax><flocculation>medium</flocculation><alcoholTolerance>10</alcoholTolerance><sensoryProfile>fruity</sensoryProfile></yeast>
          <adjunct id="cacao"><name>Cacao</name><category>spice</category><format>solid</format><recommendedUse>maturation</recommendedUse><description>Nibs</description></adjunct>
          <aging id="oak"><name>Oak</name><type>wood</type><woodType>oak</woodType><description>Oak cubes</description></aging>
        </catalog>
        """;

    assertThat(service.importHopsXml(xml).imported()).isOne();
    assertThat(service.importMaltsXml(xml).type()).isEqualTo("malts");
    assertThat(service.importYeastsXml(xml).imported()).isOne();
    assertThat(service.importAdjunctsXml(xml).imported()).isOne();
    assertThat(service.importAgingIngredientsXml(xml).imported()).isOne();
    verify(jdbc, times(5)).update(anyString(), any(Object[].class));
  }

  @Test
  void rejectsMalformedXmlAndHandlesEmptyCatalogs() {
    assertThat(service.importHopsXml("<catalog/>").imported()).isZero();
    assertThatThrownBy(() -> service.importHopsXml("<catalog>"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Invalid ingredients XML");
  }

  private BigDecimal decimal(String value) {
    return new BigDecimal(value);
  }
}
