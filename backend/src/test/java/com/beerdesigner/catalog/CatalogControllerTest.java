package com.beerdesigner.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beerdesigner.catalog.CatalogDtos.BrewingSaltDto;
import com.beerdesigner.catalog.CatalogDtos.IngredientStockDto;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;

class CatalogControllerTest {
  private final BrewingSaltRepository saltRepository = mock(BrewingSaltRepository.class);
  private final CatalogWriteService writeService = mock(CatalogWriteService.class);
  private final CatalogController controller = new CatalogController(
      mock(BjcpStyleRepository.class), mock(HopRepository.class), mock(MaltRepository.class),
      mock(YeastRepository.class), mock(AdjunctRepository.class), mock(AgingIngredientRepository.class),
      mock(WaterProfileRepository.class), writeService, saltRepository);

  @BeforeEach void authenticate() { com.beerdesigner.TestSecurity.asUser(); }
  @AfterEach void clearAuthentication() { com.beerdesigner.TestSecurity.clear(); }

  @Test
  void returnsSaltDtosInsteadOfPersistentEntities() {
    BrewingSalt entity = new BrewingSalt();
    entity.setId("calcium-chloride");
    entity.setName("Cloruro de calcio");
    entity.setFormula("CaCl2");
    entity.setCategory("mineral");
    entity.setCalciumPercent(new BigDecimal("27.2"));
    entity.setChloridePercent(new BigDecimal("48.2"));
    entity.setDescription("Aumenta calcio y cloruro");
    when(saltRepository.findVisible(com.beerdesigner.TestSecurity.USER_ID)).thenReturn(List.of(entity));

    List<BrewingSaltDto> result = controller.salts();

    assertThat(result).hasSize(1);
    assertThat(result.getFirst().id()).isEqualTo("calcium-chloride");
    assertThat(result.getFirst().chloridePercent()).isEqualByComparingTo("48.2");
  }

  @Test
  void pathIdentifierOverridesTheUntrustedBodyIdentifier() {
    BrewingSaltDto body = salt("body-controlled-id");
    BrewingSaltDto saved = salt("route-controlled-id");
    when(writeService.saveSalt("route-controlled-id", body)).thenReturn(saved);

    assertThat(controller.saveSalt("route-controlled-id", body).id()).isEqualTo("route-controlled-id");
    verify(writeService).saveSalt("route-controlled-id", body);
  }

  @Test
  void readsAndUpdatesIngredientStockThroughTheCatalogService() {
    IngredientStockDto stock = new IngredientStockDto("hops", "citra", true);
    when(writeService.findIngredientStock()).thenReturn(List.of(stock));
    when(writeService.saveIngredientStock("hops", "citra", stock)).thenReturn(stock);

    assertThat(controller.ingredientStock()).containsExactly(stock);
    assertThat(controller.saveIngredientStock("hops", "citra", stock)).isEqualTo(stock);
    verify(writeService).saveIngredientStock("hops", "citra", stock);
  }

  @Test
  void delegatesIngredientDeletionWithItsCatalogType() {
    controller.deleteIngredient("adjuncts", "my-cacao");
    verify(writeService).deleteIngredient("adjuncts", "my-cacao");
  }

  private BrewingSaltDto salt(String id) {
    return new BrewingSaltDto(id, null, "Cloruro de calcio", "CaCl2", "mineral",
        new BigDecimal("27.2"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
        new BigDecimal("48.2"), BigDecimal.ZERO, "Agua con más cuerpo");
  }
}
