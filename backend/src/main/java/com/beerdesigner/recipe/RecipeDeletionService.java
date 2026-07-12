package com.beerdesigner.recipe;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RecipeDeletionService {
  private final JdbcTemplate jdbc;
  private final Path storagePath;
  public RecipeDeletionService(JdbcTemplate jdbc, @Value("${beer-designer.image-storage-path}") String storagePath) {
    this.jdbc=jdbc; this.storagePath=Path.of(storagePath).toAbsolutePath().normalize();
  }
  @Transactional
  public void delete(String id) {
    Integer uses=jdbc.queryForObject("SELECT count(*) FROM brew_days WHERE recipe_id=?",Integer.class,id);
    if (uses!=null && uses>0) throw new ResponseStatusException(HttpStatus.CONFLICT,"No se puede eliminar: la receta tiene elaboraciones asociadas");
    var names=jdbc.query("SELECT image_stored_name FROM recipes WHERE id=?",(rs,n)->rs.getString(1),id);
    if(names.isEmpty()) throw new RecipeNotFoundException(id);
    jdbc.update("DELETE FROM recipes WHERE id=?",id);
    if(names.getFirst()!=null) try { Files.deleteIfExists(storagePath.resolve(names.getFirst())); } catch(IOException ignored) { }
  }
}
