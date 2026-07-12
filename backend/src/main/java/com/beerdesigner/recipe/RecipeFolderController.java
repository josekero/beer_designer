package com.beerdesigner.recipe;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/recipe-folders")
public class RecipeFolderController {
  private final JdbcTemplate jdbc;
  public RecipeFolderController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

  public record FolderDto(String id, String name, int sortOrder, boolean isDefault, List<String> recipeIds) {}
  public record FolderNameDto(String name) {}
  public record LayoutFolderDto(String id, List<String> recipeIds) {}
  public record LayoutDto(List<String> folderIds, List<LayoutFolderDto> folders) {}

  @GetMapping
  public List<FolderDto> list() {
    return jdbc.query("SELECT id,name,sort_order,is_default FROM recipe_folders ORDER BY sort_order,id", (rs, row) ->
      new FolderDto(rs.getString("id"), rs.getString("name"), rs.getInt("sort_order"), rs.getBoolean("is_default"),
        jdbc.queryForList("SELECT id FROM recipes WHERE folder_id=? ORDER BY folder_sort_order,id", String.class, rs.getString("id"))));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public FolderDto create(@RequestBody FolderNameDto body) {
    String name = cleanName(body.name());
    String id = "folder-" + System.currentTimeMillis();
    Integer order = jdbc.queryForObject("SELECT COALESCE(MAX(sort_order),-1)+1 FROM recipe_folders", Integer.class);
    jdbc.update("INSERT INTO recipe_folders(id,name,sort_order,is_default) VALUES(?,?,?,false)", id, name, order);
    return new FolderDto(id, name, order == null ? 0 : order, false, List.of());
  }

  @PutMapping("/{id}")
  public void rename(@PathVariable String id, @RequestBody FolderNameDto body) {
    if (jdbc.update("UPDATE recipe_folders SET name=? WHERE id=?", cleanName(body.name()), id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Transactional
  public void delete(@PathVariable String id) {
    Boolean isDefault = jdbc.query("SELECT is_default FROM recipe_folders WHERE id=?", rs -> rs.next() ? rs.getBoolean(1) : null, id);
    if (isDefault == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    if (isDefault) throw new ResponseStatusException(HttpStatus.CONFLICT, "La carpeta General no se puede borrar");
    jdbc.update("UPDATE recipes SET folder_id='general', folder_sort_order=(SELECT COALESCE(MAX(folder_sort_order),-1)+1 FROM recipes WHERE folder_id='general') WHERE folder_id=?", id);
    jdbc.update("DELETE FROM recipe_folders WHERE id=?", id);
  }

  @PutMapping("/layout")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Transactional
  public void layout(@RequestBody LayoutDto body) {
    for (int i=0; i<body.folderIds().size(); i++) jdbc.update("UPDATE recipe_folders SET sort_order=? WHERE id=?", i, body.folderIds().get(i));
    for (LayoutFolderDto folder : body.folders()) {
      for (int i=0; i<folder.recipeIds().size(); i++) jdbc.update("UPDATE recipes SET folder_id=?, folder_sort_order=? WHERE id=?", folder.id(), i, folder.recipeIds().get(i));
    }
  }

  private String cleanName(String value) {
    String name = value == null ? "" : value.trim();
    if (name.isEmpty() || name.length() > 60) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre de carpeta no válido");
    return name;
  }
}
