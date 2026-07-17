package com.beerdesigner.recipe;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

class RecipeDeletionServiceTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);

  @BeforeEach void authenticate() {
    com.beerdesigner.TestSecurity.asUser();
    when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);
  }
  @AfterEach void clearAuthentication() { com.beerdesigner.TestSecurity.clear(); }

  @Test
  void refusesToDeleteRecipesUsedByBrewDays(@TempDir Path directory) {
    when(jdbc.queryForObject(anyString(), any(Class.class), any(Object[].class))).thenReturn(1);
    var service = new RecipeDeletionService(jdbc, directory.toString());

    assertThatThrownBy(() -> service.delete("recipe-1"))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> org.assertj.core.api.Assertions.assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    verify(jdbc, never()).update(anyString(), any(Object[].class));
  }

  @Test
  void reportsUnknownRecipes(@TempDir Path directory) {
    when(jdbc.queryForObject(anyString(), any(Class.class), any(Object[].class))).thenReturn(0);
    when(jdbc.query(anyString(), any(org.springframework.jdbc.core.RowMapper.class), any(Object[].class))).thenReturn(List.of());

    assertThatThrownBy(() -> new RecipeDeletionService(jdbc, directory.toString()).delete("missing"))
        .isInstanceOf(RecipeNotFoundException.class);
  }

  @Test
  void deletesDatabaseRowAndStoredImage(@TempDir Path directory) throws Exception {
    Files.writeString(directory.resolve("label.png"), "image");
    when(jdbc.queryForObject(anyString(), any(Class.class), any(Object[].class))).thenReturn(0);
    when(jdbc.query(anyString(), any(org.springframework.jdbc.core.RowMapper.class), any(Object[].class))).thenReturn(List.of("label.png"));

    new RecipeDeletionService(jdbc, directory.toString()).delete("recipe-1");

    verify(jdbc).update("DELETE FROM recipes WHERE id=? AND owner_id=?", "recipe-1",
        com.beerdesigner.TestSecurity.USER_ID);
    org.assertj.core.api.Assertions.assertThat(directory.resolve("label.png")).doesNotExist();
  }
}
