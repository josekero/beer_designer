package com.beerdesigner.recipe;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.beerdesigner.recipe.RecipeDtos.*;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

class RecipeWriteServiceTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final RecipeWriteService service = new RecipeWriteService(jdbc);

  @Test
  void savesRecipeAndEveryOrderedChildCollection() {
    service.save("recipe-1", detail("https://untappd.com/b/brewery-beer/12345", null));

    org.mockito.Mockito.verify(jdbc, org.mockito.Mockito.times(19))
        .update(anyString(), any(Object[].class));
  }

  @Test
  void acceptsBlankUntappdUrlAndExplicitVersion() {
    service.save("recipe-1", detail("  ", 4));

    org.mockito.Mockito.verify(jdbc, org.mockito.Mockito.times(19))
        .update(anyString(), any(Object[].class));
  }

  @Test
  void rejectsUrlsThatAreNotUntappdBeerPagesBeforeWriting() {
    assertThatThrownBy(() -> service.save("recipe-1", detail("https://example.com/phishing", 1)))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> org.assertj.core.api.Assertions.assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    verifyNoInteractions(jdbc);
  }

  private RecipeDetailDto detail(String untappdUrl, Integer version) {
    BigDecimal one = BigDecimal.ONE;
    return new RecipeDetailDto(
        "recipe-1", "NEIPA", "Brewer", untappdUrl, "equipment", "mash", "carbonation", "fermentation",
        "american-pint", "21C", new BigDecimal("20"), new BigDecimal("75"), new BigDecimal("25"), "yeast", "water",
        List.of(new RecipeMaltDto("malt", new BigDecimal("4.5"), "base")),
        List.of(new RecipeHopDto(null, "hop", null, new BigDecimal("100"), null, 20, null, "whirlpool", null)),
        List.of(new RecipeYeastDto("yeast", "seca", one, "g", new BigDecimal("19"), null, "fresh")),
        List.of(new RecipeWaterAdditionDto("gypsum", "Gypsum", one)),
        List.of(new RecipeMashStepDto("Saccharification", new BigDecimal("66"), 60)),
        List.of(new RecipeBoilStepDto("Boil", 60, "vigorous")),
        List.of(new RecipeProcessAdditionDto("Servomyces", "", one, "boil", 10, new BigDecimal("100"), "", "")),
        List.of(new RecipeMaturationAdditionDto("hop", "hop", null, "Citra", "first", one, "g", 3, 3, new BigDecimal("16"), "")),
        List.of(new RecipeFermentationStepDto("primary", 0, 10, new BigDecimal("19"), "")),
        new WaterTreatmentDto(one, one, one, one, one, one, new BigDecimal("5.2"), new BigDecimal("5.5"), "balanced"),
        new FermentationDto(10, new BigDecimal("19"), 0, new BigDecimal("18")),
        new DryHopDto(true, 3, new BigDecimal("16")),
        new PackagingDto(14, new BigDecimal("2.4"), "can"),
        "notes", version, null, null);
  }
}
