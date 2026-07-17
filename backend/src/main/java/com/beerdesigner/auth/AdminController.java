package com.beerdesigner.auth;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
  private final JdbcTemplate jdbc;
  public AdminController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

  public record AdminUserDto(UUID id, String email, String displayName, String role, boolean enabled,
                             OffsetDateTime createdAt, OffsetDateTime lastSeenAt, long recipes) {}
  public record UserAccessRequest(String role, boolean enabled) {}
  public record AdminRecipeDto(String id, String name, String ownerName, boolean publicRecipe,
                               boolean template, OffsetDateTime updatedAt) {}
  public record RecipeSharingRequest(boolean publicRecipe, boolean template) {}

  @GetMapping("/summary")
  public Map<String, Object> summary() {
    return Map.of(
        "users", jdbc.queryForObject("SELECT count(*) FROM app_users", Long.class),
        "recipes", jdbc.queryForObject("SELECT count(*) FROM recipes", Long.class),
        "ingredients", jdbc.queryForObject("""
            SELECT (SELECT count(*) FROM hops)+(SELECT count(*) FROM malts)+(SELECT count(*) FROM yeasts)+
                   (SELECT count(*) FROM adjuncts)+(SELECT count(*) FROM brewing_salts)+(SELECT count(*) FROM aging_ingredients)
            """, Long.class),
        "brewDays", jdbc.queryForObject("SELECT count(*) FROM brew_days", Long.class),
        "activeUsers", jdbc.queryForObject("""
            SELECT count(DISTINCT user_id) FROM user_sessions
            WHERE revoked_at IS NULL AND expires_at>now() AND last_seen_at>now()-interval '15 minutes'
            """, Long.class));
  }

  @GetMapping("/recipes")
  public List<AdminRecipeDto> recipes() {
    return jdbc.query("""
        SELECT r.id,r.name,u.display_name,r.updated_at,COALESCE(s.is_public,false) is_public,
               COALESCE(s.is_template,false) is_template
        FROM recipes r JOIN app_users u ON u.id=r.owner_id
        LEFT JOIN recipe_sharing s ON s.recipe_id=r.id ORDER BY r.updated_at DESC
        """, (rs,row) -> new AdminRecipeDto(rs.getString("id"), rs.getString("name"),
        rs.getString("display_name"), rs.getBoolean("is_public"), rs.getBoolean("is_template"),
        rs.getObject("updated_at", OffsetDateTime.class)));
  }

  @PutMapping("/recipes/{id}/sharing")
  public void sharing(@PathVariable String id, @RequestBody RecipeSharingRequest request) {
    boolean visible = request.publicRecipe() || request.template();
    if (jdbc.update("""
        INSERT INTO recipe_sharing(recipe_id,is_public,is_template,published_at)
        SELECT id,?,?,CASE WHEN ? THEN now() ELSE NULL END FROM recipes WHERE id=?
        ON CONFLICT(recipe_id) DO UPDATE SET is_public=EXCLUDED.is_public,is_template=EXCLUDED.is_template,
          published_at=CASE WHEN EXCLUDED.is_public THEN COALESCE(recipe_sharing.published_at,now()) ELSE NULL END,
          updated_at=now()
        """, visible, request.template(), visible, id) == 0)
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Receta no encontrada");
  }

  @GetMapping("/authorize")
  public org.springframework.http.ResponseEntity<Void> authorize() {
    return org.springframework.http.ResponseEntity.noContent().build();
  }

  @GetMapping("/users")
  public List<AdminUserDto> users() {
    return jdbc.query("""
        SELECT u.*, count(r.id) recipe_count FROM app_users u LEFT JOIN recipes r ON r.owner_id=u.id
        GROUP BY u.id ORDER BY u.created_at DESC
        """, (rs, row) -> new AdminUserDto(rs.getObject("id", UUID.class), rs.getString("email"),
        rs.getString("display_name"), rs.getString("role"), rs.getBoolean("enabled"),
        rs.getObject("created_at", OffsetDateTime.class), rs.getObject("last_seen_at", OffsetDateTime.class),
        rs.getLong("recipe_count")));
  }

  @PutMapping("/users/{id}/access")
  public void access(@PathVariable UUID id, @RequestBody UserAccessRequest request) {
    if (id.equals(UserContext.userId()) && !request.enabled())
      throw new ResponseStatusException(HttpStatus.CONFLICT, "No puedes desactivar tu propia cuenta");
    String role = "ADMIN".equals(request.role()) ? "ADMIN" : "USER";
    if (jdbc.update("UPDATE app_users SET role=?,enabled=?,updated_at=now() WHERE id=?", role, request.enabled(), id) == 0)
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
    if (!request.enabled()) jdbc.update("UPDATE user_sessions SET revoked_at=now() WHERE user_id=?", id);
  }

}
