package com.beerdesigner.recipe;

import com.beerdesigner.auth.AuthService;
import com.beerdesigner.auth.UserContext;
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
    var ownerId = UserContext.userId();
    return jdbc.query("SELECT id,name,sort_order,is_default FROM recipe_folders WHERE owner_id=? ORDER BY sort_order,id", (rs, row) ->
      new FolderDto(rs.getString("id"), rs.getString("name"), rs.getInt("sort_order"), rs.getBoolean("is_default"),
        jdbc.queryForList("SELECT id FROM recipes WHERE folder_id=? AND owner_id=? ORDER BY folder_sort_order,id", String.class, rs.getString("id"), ownerId)), ownerId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public FolderDto create(@RequestBody FolderNameDto body) {
    String name = cleanName(body.name());
    var ownerId = UserContext.userId();
    String id = "folder-" + java.util.UUID.randomUUID();
    Integer order = jdbc.queryForObject("SELECT COALESCE(MAX(sort_order),-1)+1 FROM recipe_folders WHERE owner_id=?", Integer.class, ownerId);
    jdbc.update("INSERT INTO recipe_folders(id,name,sort_order,is_default,owner_id) VALUES(?,?,?,false,?)", id, name, order, ownerId);
    return new FolderDto(id, name, order == null ? 0 : order, false, List.of());
  }

  @PutMapping("/{id}")
  public void rename(@PathVariable String id, @RequestBody FolderNameDto body) {
    if (jdbc.update("UPDATE recipe_folders SET name=? WHERE id=? AND owner_id=?", cleanName(body.name()), id, UserContext.userId()) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Transactional
  public void delete(@PathVariable String id) {
    var ownerId = UserContext.userId();
    Boolean isDefault = jdbc.query("SELECT is_default FROM recipe_folders WHERE id=? AND owner_id=?", rs -> rs.next() ? rs.getBoolean(1) : null, id, ownerId);
    if (isDefault == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    if (isDefault) throw new ResponseStatusException(HttpStatus.CONFLICT, "La carpeta General no se puede borrar");
    String defaultId = AuthService.defaultFolderId(ownerId);
    jdbc.update("UPDATE recipes SET folder_id=?, folder_sort_order=(SELECT COALESCE(MAX(folder_sort_order),-1)+1 FROM recipes WHERE folder_id=? AND owner_id=?) WHERE folder_id=? AND owner_id=?", defaultId, defaultId, ownerId, id, ownerId);
    jdbc.update("DELETE FROM recipe_folders WHERE id=? AND owner_id=?", id, ownerId);
  }

  @PutMapping("/layout")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Transactional
  public void layout(@RequestBody LayoutDto body) {
    var ownerId = UserContext.userId();
    for (int i=0; i<body.folderIds().size(); i++) jdbc.update("UPDATE recipe_folders SET sort_order=? WHERE id=? AND owner_id=?", i, body.folderIds().get(i), ownerId);
    for (LayoutFolderDto folder : body.folders()) {
      for (int i=0; i<folder.recipeIds().size(); i++) jdbc.update("UPDATE recipes SET folder_id=?, folder_sort_order=? WHERE id=? AND owner_id=? AND EXISTS(SELECT 1 FROM recipe_folders f WHERE f.id=? AND f.owner_id=?)", folder.id(), i, folder.recipeIds().get(i), ownerId, folder.id(), ownerId);
    }
  }

  private String cleanName(String value) {
    String name = value == null ? "" : value.trim();
    if (name.isEmpty() || name.length() > 60) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre de carpeta no válido");
    return name;
  }
}
