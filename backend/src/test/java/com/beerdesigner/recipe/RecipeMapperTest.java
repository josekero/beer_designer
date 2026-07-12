package com.beerdesigner.recipe;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class RecipeMapperTest {
  private final RecipeMapper mapper = new RecipeMapper();

  @Test
  void mapsSummaryWithoutImage() {
    Recipe recipe = baseRecipe();

    var summary = mapper.toSummary(recipe);

    assertThat(summary.id()).isEqualTo("recipe-1");
    assertThat(summary.name()).isEqualTo("Test NEIPA");
    assertThat(summary.batchVolumeL()).isEqualByComparingTo("20");
    assertThat(summary.version()).isEqualTo(3);
    assertThat(summary.image()).isNull();
  }

  @Test
  void mapsImageMetadataIntoSummary() {
    Recipe recipe = baseRecipe();
    OffsetDateTime uploadedAt = OffsetDateTime.parse("2026-07-12T10:15:30Z");
    when(recipe.getImageStoredName()).thenReturn("stored.png");
    when(recipe.getImageOriginalName()).thenReturn("label.png");
    when(recipe.getImageContentType()).thenReturn("image/png");
    when(recipe.getImageSizeBytes()).thenReturn(2048L);
    when(recipe.getImageWidth()).thenReturn(800);
    when(recipe.getImageHeight()).thenReturn(600);
    when(recipe.getImageUploadedAt()).thenReturn(uploadedAt);

    var image = mapper.toSummary(recipe).image();

    assertThat(image).isNotNull();
    assertThat(image.url()).isEqualTo("/api/recipes/recipe-1/image");
    assertThat(image.originalName()).isEqualTo("label.png");
    assertThat(image.contentType()).isEqualTo("image/png");
    assertThat(image.uploadedAt()).isEqualTo(uploadedAt);
  }

  @Test
  void mapsDetailAndSortsIngredientsByPosition() {
    Recipe recipe = baseRecipe();
    RecipeMalt last = malt("malt-last", "2.5", 2);
    RecipeMalt first = malt("malt-first", "4.0", 1);
    RecipeHop whirlpool = hop("citra", 2);
    RecipeHop boil = hop("cascade", 1);
    when(recipe.getMalts()).thenReturn(List.of(last, first));
    when(recipe.getHops()).thenReturn(List.of(whirlpool, boil));

    var detail = mapper.toDetail(recipe);

    assertThat(detail.malts()).extracting(item -> item.maltId())
        .containsExactly("malt-first", "malt-last");
    assertThat(detail.hops()).extracting(item -> item.hopId())
        .containsExactly("cascade", "citra");
    assertThat(detail.waterTreatment().chloride()).isEqualByComparingTo("180");
    assertThat(detail.fermentation().primaryDays()).isEqualTo(10);
    assertThat(detail.dryHop().enabled()).isTrue();
    assertThat(detail.packaging().method()).isEqualTo("lata");
  }

  private Recipe baseRecipe() {
    Recipe recipe = mock(Recipe.class);
    when(recipe.getId()).thenReturn("recipe-1");
    when(recipe.getName()).thenReturn("Test NEIPA");
    when(recipe.getBatchVolumeL()).thenReturn(new BigDecimal("20"));
    when(recipe.getEfficiencyPercent()).thenReturn(new BigDecimal("75"));
    when(recipe.getVersion()).thenReturn(3);
    when(recipe.getPrimaryDays()).thenReturn(10);
    when(recipe.getDryHopEnabled()).thenReturn(true);
    when(recipe.getPackagingMethod()).thenReturn("lata");
    when(recipe.getWaterChloride()).thenReturn(new BigDecimal("180"));
    when(recipe.getMalts()).thenReturn(List.of());
    when(recipe.getHops()).thenReturn(List.of());
    when(recipe.getYeasts()).thenReturn(List.of());
    when(recipe.getWaterAdditions()).thenReturn(List.of());
    when(recipe.getMashSteps()).thenReturn(List.of());
    when(recipe.getBoilSteps()).thenReturn(List.of());
    when(recipe.getProcessAdditions()).thenReturn(List.of());
    when(recipe.getMaturationAdditions()).thenReturn(List.of());
    when(recipe.getFermentationSteps()).thenReturn(List.of());
    return recipe;
  }

  private RecipeMalt malt(String id, String amount, int position) {
    RecipeMalt malt = mock(RecipeMalt.class);
    when(malt.getMaltId()).thenReturn(id);
    when(malt.getAmountKg()).thenReturn(new BigDecimal(amount));
    when(malt.getPosition()).thenReturn(position);
    return malt;
  }

  private RecipeHop hop(String id, int position) {
    RecipeHop hop = mock(RecipeHop.class);
    when(hop.getHopId()).thenReturn(id);
    when(hop.getPosition()).thenReturn(position);
    return hop;
  }
}
