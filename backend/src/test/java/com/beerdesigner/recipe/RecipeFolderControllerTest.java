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
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.web.server.ResponseStatusException;

class RecipeFolderControllerTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final RecipeFolderController controller = new RecipeFolderController(jdbc);

  @Test
  @SuppressWarnings("unchecked")
  void listsFoldersWithTheirOrderedRecipeIdentifiers() throws Exception {
    ResultSet rs = mock(ResultSet.class);
    when(rs.getString("id")).thenReturn("general");
    when(rs.getString("name")).thenReturn("General");
    when(rs.getInt("sort_order")).thenReturn(0);
    when(rs.getBoolean("is_default")).thenReturn(true);
    when(jdbc.queryForList(anyString(), eq(String.class), eq("general"))).thenReturn(List.of("recipe-1"));
    when(jdbc.query(startsWith("SELECT id,name"), any(RowMapper.class))).thenAnswer(invocation -> {
      RowMapper<RecipeFolderController.FolderDto> mapper = invocation.getArgument(1);
      return List.of(mapper.mapRow(rs, 0));
    });

    assertThat(controller.list()).containsExactly(
        new RecipeFolderController.FolderDto("general", "General", 0, true, List.of("recipe-1")));
  }

  @Test
  void createsAndRenamesCleanFolderNames() {
    when(jdbc.queryForObject(anyString(), eq(Integer.class))).thenReturn(3);
    when(jdbc.update(startsWith("UPDATE recipe_folders SET name"), eq("Guaja"), eq("folder-1"))).thenReturn(1);

    var created = controller.create(new RecipeFolderController.FolderNameDto("  Producción  "));
    assertThat(created.name()).isEqualTo("Producción");
    assertThat(created.sortOrder()).isEqualTo(3);
    controller.rename("folder-1", new RecipeFolderController.FolderNameDto(" Guaja "));

    verify(jdbc).update(startsWith("INSERT INTO recipe_folders"), eq(created.id()), eq("Producción"), eq(3));
  }

  @Test
  void rejectsInvalidNamesAndMissingFolders() {
    assertThatThrownBy(() -> controller.create(new RecipeFolderController.FolderNameDto("  ")))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    when(jdbc.update(anyString(), any(), eq("missing"))).thenReturn(0);
    assertThatThrownBy(() -> controller.rename("missing", new RecipeFolderController.FolderNameDto("Nombre")))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
  }

  @Test
  @SuppressWarnings("unchecked")
  void deletesCustomFoldersAndProtectsTheDefaultFolder() {
    when(jdbc.query(startsWith("SELECT is_default"), any(ResultSetExtractor.class), eq("custom"))).thenReturn(false);
    controller.delete("custom");
    verify(jdbc).update(startsWith("UPDATE recipes SET folder_id='general'"), eq("custom"));
    verify(jdbc).update("DELETE FROM recipe_folders WHERE id=?", "custom");

    when(jdbc.query(startsWith("SELECT is_default"), any(ResultSetExtractor.class), eq("general"))).thenReturn(true);
    assertThatThrownBy(() -> controller.delete("general"))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    when(jdbc.query(startsWith("SELECT is_default"), any(ResultSetExtractor.class), eq("missing"))).thenReturn(null);
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

    verify(jdbc).update("UPDATE recipe_folders SET sort_order=? WHERE id=?", 0, "general");
    verify(jdbc).update("UPDATE recipe_folders SET sort_order=? WHERE id=?", 1, "production");
    verify(jdbc).update("UPDATE recipes SET folder_id=?, folder_sort_order=? WHERE id=?", "general", 0, "r1");
    verify(jdbc).update("UPDATE recipes SET folder_id=?, folder_sort_order=? WHERE id=?", "production", 0, "r2");
    verify(jdbc).update("UPDATE recipes SET folder_id=?, folder_sort_order=? WHERE id=?", "production", 1, "r3");
  }
}
