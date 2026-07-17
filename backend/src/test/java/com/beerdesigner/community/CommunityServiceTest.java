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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;

class CommunityServiceTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final RecipeRepository recipes = mock(RecipeRepository.class);
  private final CommunityService service = new CommunityService(jdbc, recipes,
      mock(RecipeMapper.class), mock(RecipeWriteService.class));

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
