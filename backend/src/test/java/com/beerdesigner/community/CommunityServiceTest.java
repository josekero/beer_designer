package com.beerdesigner.community;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beerdesigner.TestSecurity;
import com.beerdesigner.recipe.RecipeMapper;
import com.beerdesigner.recipe.RecipeRepository;
import com.beerdesigner.recipe.RecipeWriteService;
import com.beerdesigner.recipe.Recipe;
import com.beerdesigner.recipe.RecipeDtos.RecipeDetailDto;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;

class CommunityServiceTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final RecipeRepository recipes = mock(RecipeRepository.class);
  private final RecipeMapper mapper = mock(RecipeMapper.class);
  private final RecipeWriteService writer = mock(RecipeWriteService.class);
  private final CommunityService service = new CommunityService(jdbc, recipes, mapper, writer);

  @AfterEach void clear() { TestSecurity.clear(); }

  @Test
  void onlyOwnersCanPublishRecipes() {
    TestSecurity.asUser();
    when(recipes.existsByIdAndOwnerId("mine", TestSecurity.USER_ID)).thenReturn(true);
    service.visibility("mine", true);
    verify(jdbc).update(anyString(), any(Object[].class));

    assertThatThrownBy(() -> service.visibility("other", true))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> org.assertj.core.api.Assertions.assertThat(error.getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND));
  }

  @Test
  void refusesToCopyRecipesThatAreNoLongerPublic() {
    TestSecurity.asUser();
    when(jdbc.queryForObject(anyString(), any(Class.class), any())).thenReturn(false);
    assertThatThrownBy(() -> service.copy("private"))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> org.assertj.core.api.Assertions.assertThat(error.getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND));
  }

  @Test
  void publishesOnlyPersonalIngredientsOwnedByTheCurrentUser() {
    TestSecurity.asUser();
    when(jdbc.queryForObject(anyString(), eq(Integer.class), eq("my-hop"), eq(TestSecurity.USER_ID)))
        .thenReturn(1);

    service.ingredientVisibility("hops", "my-hop", true);
    verify(jdbc).update(anyString(), eq("hops"), eq("my-hop"), eq(TestSecurity.USER_ID));

    when(jdbc.queryForObject(anyString(), eq(Integer.class), eq("system-hop"), eq(TestSecurity.USER_ID)))
        .thenReturn(0);
    assertThatThrownBy(() -> service.ingredientVisibility("hops", "system-hop", true))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> org.assertj.core.api.Assertions.assertThat(error.getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND));
  }

  @Test
  void copiesPublishedIngredientsIntoTheCurrentUsersCatalog() {
    TestSecurity.asUser();
    UUID sourceOwner = UUID.fromString("22222222-2222-2222-2222-222222222222");
    when(jdbc.queryForObject(anyString(), eq(UUID.class), eq("hops"), eq("shared-hop")))
        .thenReturn(sourceOwner);
    when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

    String copied = service.copyIngredient("hops", "shared-hop");

    org.assertj.core.api.Assertions.assertThat(copied).startsWith("user-11111111-hop-shared-hop-");
  }

  @Test
  void copiesEverySupportedIngredientKindAndCanUnpublishThem() {
    TestSecurity.asUser();
    UUID sourceOwner = UUID.fromString("22222222-2222-2222-2222-222222222222");
    for (String type : new String[]{"hops", "malts", "yeasts", "adjuncts", "salts", "aging"}) {
      when(jdbc.queryForObject(anyString(), eq(UUID.class), eq(type), eq("shared")))
          .thenReturn(sourceOwner);
      when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);
      org.assertj.core.api.Assertions.assertThat(service.copyIngredient(type, "shared"))
          .startsWith("user-11111111-");

      when(jdbc.queryForObject(anyString(), eq(Integer.class), eq("mine"), eq(TestSecurity.USER_ID)))
          .thenReturn(1);
      service.ingredientVisibility(type, "mine", false);
    }
  }

  @Test
  void handlesMissingSharedIngredientAndDeletedSource() {
    TestSecurity.asUser();
    when(jdbc.queryForObject(anyString(), eq(UUID.class), eq("hops"), eq("missing")))
        .thenThrow(new org.springframework.dao.EmptyResultDataAccessException(1));
    assertThatThrownBy(() -> service.copyIngredient("hops", "missing"))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> org.assertj.core.api.Assertions.assertThat(error.getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND));

    when(jdbc.queryForObject(anyString(), eq(UUID.class), eq("hops"), eq("null-owner")))
        .thenReturn(null);
    assertThatThrownBy(() -> service.copyIngredient("hops", "null-owner"))
        .isInstanceOf(ResponseStatusException.class);

    UUID sourceOwner = UUID.fromString("22222222-2222-2222-2222-222222222222");
    when(jdbc.queryForObject(anyString(), eq(UUID.class), eq("hops"), eq("deleted")))
        .thenReturn(sourceOwner);
    when(jdbc.update(anyString(), any(Object[].class))).thenReturn(0);
    assertThatThrownBy(() -> service.copyIngredient("hops", "deleted"))
        .isInstanceOf(ResponseStatusException.class);
  }

  @Test
  void copiesAPublicRecipeIntoTheCurrentUsersLibrary() {
    TestSecurity.asUser();
    Recipe source = mock(Recipe.class);
    RecipeDetailDto detail = mock(RecipeDetailDto.class);
    when(jdbc.queryForObject(anyString(), eq(Boolean.class), eq("public-recipe"))).thenReturn(true);
    when(recipes.findById("public-recipe")).thenReturn(Optional.of(source));
    when(mapper.toDetail(source)).thenReturn(detail);
    when(detail.name()).thenReturn("Community IPA");
    when(writer.save(eq(TestSecurity.USER_ID), anyString(), any(RecipeDetailDto.class)))
        .thenReturn("copied-recipe");

    org.assertj.core.api.Assertions.assertThat(service.copy("public-recipe").id())
        .isEqualTo("copied-recipe");
    verify(writer).save(eq(TestSecurity.USER_ID), anyString(), any(RecipeDetailDto.class));
  }

  @Test
  void mapsCommunityRecipeAndIngredientPresentationFields() throws Exception {
    ResultSet recipeRow = mock(ResultSet.class);
    OffsetDateTime now = OffsetDateTime.parse("2026-07-18T08:00:00Z");
    when(recipeRow.getString("id")).thenReturn("recipe-1");
    when(recipeRow.getString("name")).thenReturn("Hazy IPA");
    when(recipeRow.getString("glassware_id")).thenReturn("teku");
    when(recipeRow.getBigDecimal("batch_volume_l")).thenReturn(new BigDecimal("20"));
    when(recipeRow.getBigDecimal("srm")).thenReturn(new BigDecimal("6.4"));
    when(recipeRow.getInt("version")).thenReturn(2);
    when(recipeRow.getObject("updated_at", OffsetDateTime.class)).thenReturn(now);
    when(recipeRow.getBoolean("is_public")).thenReturn(true);
    var recipe = (CommunityDtos.CommunityRecipe) ReflectionTestUtils.invokeMethod(
        service, "recipe", recipeRow, 0);
    org.assertj.core.api.Assertions.assertThat(recipe.glasswareId()).isEqualTo("teku");
    org.assertj.core.api.Assertions.assertThat(recipe.srm()).isEqualByComparingTo("6.4");

    ResultSet ingredientRow = mock(ResultSet.class);
    when(ingredientRow.getString("ingredient_type")).thenReturn("hops");
    when(ingredientRow.getString("id")).thenReturn("hop-1");
    when(ingredientRow.getString("name")).thenReturn("Experimental Hop");
    when(ingredientRow.getObject("published_at", OffsetDateTime.class)).thenReturn(now);
    when(ingredientRow.getBoolean("owned_by_me")).thenReturn(true);
    when(ingredientRow.getBoolean("public_ingredient")).thenReturn(true);
    var ingredient = (CommunityDtos.CommunityIngredient) ReflectionTestUtils.invokeMethod(
        service, "ingredient", ingredientRow, 0);
    org.assertj.core.api.Assertions.assertThat(ingredient.ownedByCurrentUser()).isTrue();
    org.assertj.core.api.Assertions.assertThat(ingredient.publicIngredient()).isTrue();
  }

  @Test
  void rejectsUnknownIngredientTypesAndCopyingOnesOwnIngredient() {
    TestSecurity.asUser();
    assertThatThrownBy(() -> service.copyIngredient("unknown", "one"))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> org.assertj.core.api.Assertions.assertThat(error.getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST));
    when(jdbc.queryForObject(anyString(), eq(UUID.class), eq("malts"), eq("mine")))
        .thenReturn(TestSecurity.USER_ID);
    assertThatThrownBy(() -> service.copyIngredient("malts", "mine"))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> org.assertj.core.api.Assertions.assertThat(error.getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT));
  }
}
