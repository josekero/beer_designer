package com.beerdesigner.recipe;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.ResultSet;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.web.server.ResponseStatusException;

class RecipeFolderControllerTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final RecipeFolderController controller = new RecipeFolderController(jdbc);

  @BeforeEach void authenticate() {
    com.beerdesigner.TestSecurity.asUser();
    when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);
  }
  @AfterEach void clearAuthentication() { com.beerdesigner.TestSecurity.clear(); }

  @Test
  @SuppressWarnings("unchecked")
  void listsFoldersWithTheirOrderedRecipeIdentifiers() throws Exception {
    ResultSet rs = mock(ResultSet.class);
    when(rs.getString("id")).thenReturn("general");
    when(rs.getString("name")).thenReturn("General");
    when(rs.getInt("sort_order")).thenReturn(0);
    when(rs.getBoolean("is_default")).thenReturn(true);
    when(jdbc.queryForList(anyString(), eq(String.class), eq("general"),
        eq(com.beerdesigner.TestSecurity.USER_ID))).thenReturn(List.of("recipe-1"));
    when(jdbc.query(startsWith("SELECT id,name"), any(RowMapper.class),
        eq(com.beerdesigner.TestSecurity.USER_ID))).thenAnswer(invocation -> {
      RowMapper<RecipeFolderController.FolderDto> mapper = invocation.getArgument(1);
      return List.of(mapper.mapRow(rs, 0));
    });

    assertThat(controller.list()).containsExactly(
        new RecipeFolderController.FolderDto("general", "General", 0, true, List.of("recipe-1")));
  }

  @Test
  void createsAndRenamesCleanFolderNames() {
    when(jdbc.queryForObject(anyString(), eq(Integer.class),
        eq(com.beerdesigner.TestSecurity.USER_ID))).thenReturn(3);

    var created = controller.create(new RecipeFolderController.FolderNameDto("  Producción  "));
    assertThat(created.name()).isEqualTo("Producción");
    assertThat(created.sortOrder()).isEqualTo(3);
    controller.rename("folder-1", new RecipeFolderController.FolderNameDto(" Guaja "));

    verify(jdbc).update(startsWith("INSERT INTO recipe_folders"), eq(created.id()), eq("Producción"), eq(3),
        eq(com.beerdesigner.TestSecurity.USER_ID));
  }

  @Test
  void rejectsInvalidNamesAndMissingFolders() {
    assertThatThrownBy(() -> controller.create(new RecipeFolderController.FolderNameDto("  ")))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    when(jdbc.update(anyString(), eq("Nombre"), eq("missing"),
        eq(com.beerdesigner.TestSecurity.USER_ID))).thenReturn(0);
    assertThatThrownBy(() -> controller.rename("missing", new RecipeFolderController.FolderNameDto("Nombre")))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
  }

  @Test
  @SuppressWarnings("unchecked")
  void deletesCustomFoldersAndProtectsTheDefaultFolder() {
    when(jdbc.query(startsWith("SELECT is_default"), any(ResultSetExtractor.class), eq("custom"),
        eq(com.beerdesigner.TestSecurity.USER_ID))).thenReturn(false);
    controller.delete("custom");
    verify(jdbc).update(startsWith("UPDATE recipes SET folder_id=?"),
        eq("general-" + com.beerdesigner.TestSecurity.USER_ID),
        eq("general-" + com.beerdesigner.TestSecurity.USER_ID), eq(com.beerdesigner.TestSecurity.USER_ID),
        eq("custom"), eq(com.beerdesigner.TestSecurity.USER_ID));
    verify(jdbc).update("DELETE FROM recipe_folders WHERE id=? AND owner_id=?", "custom",
        com.beerdesigner.TestSecurity.USER_ID);

    when(jdbc.query(startsWith("SELECT is_default"), any(ResultSetExtractor.class), eq("general"),
        eq(com.beerdesigner.TestSecurity.USER_ID))).thenReturn(true);
    assertThatThrownBy(() -> controller.delete("general"))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    when(jdbc.query(startsWith("SELECT is_default"), any(ResultSetExtractor.class), eq("missing"),
        eq(com.beerdesigner.TestSecurity.USER_ID))).thenReturn(null);
    assertThatThrownBy(() -> controller.delete("missing"))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
  }

  @Test
  void persistsFolderAndRecipeOrdering() {
    var layout = new RecipeFolderController.LayoutDto(
        List.of("general", "production"),
        List.of(
            new RecipeFolderController.LayoutFolderDto("general", List.of("r1")),
            new RecipeFolderController.LayoutFolderDto("production", List.of("r2", "r3"))));

    controller.layout(layout);

    verify(jdbc).update(startsWith("UPDATE recipe_folders SET sort_order"), eq(0), eq("general"),
        eq(com.beerdesigner.TestSecurity.USER_ID));
    verify(jdbc).update(startsWith("UPDATE recipe_folders SET sort_order"), eq(1), eq("production"),
        eq(com.beerdesigner.TestSecurity.USER_ID));
    verify(jdbc, org.mockito.Mockito.times(3)).update(startsWith("UPDATE recipes SET folder_id"), any(Object[].class));
  }
}
