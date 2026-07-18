package com.beerdesigner.auth;

import com.beerdesigner.auth.AuthDtos.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
  public static final UUID LEGACY_ADMIN_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
  private static final SecureRandom RANDOM = new SecureRandom();
  private static final String DEFAULT_AVATAR = "hop-pirate";
  private static final List<String> GALLERY = List.of(
      DEFAULT_AVATAR, "hop-viking", "hop-astronaut", "mad-brewer", "brew-wizard", "beer-robot",
      "hop-monster", "beer-skull", "brewmaster", "homebrewer", "barrel-brewer", "water-alchemist",
      "co2-bubble", "football-pint");
  private final JdbcTemplate jdbc;
  private final PasswordEncoder passwords;
  private final long sessionHours;

  public AuthService(JdbcTemplate jdbc, PasswordEncoder passwords,
                     @Value("${beer-designer.auth.session-hours:168}") long sessionHours) {
    this.jdbc = jdbc;
    this.passwords = passwords;
    this.sessionHours = sessionHours;
  }

  @Transactional
  public SessionResult register(RegisterRequest request) {
    String email = validEmail(request.email());
    String name = validName(request.displayName());
    validatePassword(request.password());
    if (Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM app_users WHERE lower(email)=?)",
        Boolean.class, email))) throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese email");
    UUID id = UUID.randomUUID();
    jdbc.update("INSERT INTO app_users(id,email,password_hash,display_name) VALUES(?,?,?,?)",
        id, email, passwords.encode(request.password()), name);
    jdbc.update("INSERT INTO recipe_folders(id,name,sort_order,is_default,owner_id) VALUES(?,?,0,true,?)",
        defaultFolderId(id), "General", id);
    return createSession(findUser(id));
  }

  @Transactional
  public SessionResult login(LoginRequest request) {
    String email = request.email() == null ? "" : request.email().trim().toLowerCase(Locale.ROOT);
    var rows = jdbc.query("SELECT * FROM app_users WHERE lower(email)=? AND enabled=true", this::toUserWithPassword, email);
    if (rows.isEmpty() || !passwords.matches(request.password() == null ? "" : request.password(), rows.getFirst().passwordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email o contraseña incorrectos");
    }
    return createSession(rows.getFirst().user());
  }

  public AuthenticatedUser authenticate(String rawToken) {
    if (rawToken == null || rawToken.isBlank()) return null;
    var rows = jdbc.query("""
        SELECT u.*, s.csrf_hash FROM user_sessions s JOIN app_users u ON u.id=s.user_id
        WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>now() AND u.enabled=true
        """, (rs, row) -> new AuthenticatedUser(toUser(rs, row), rs.getString("csrf_hash")), hash(rawToken));
    if (rows.isEmpty()) return null;
    jdbc.update("UPDATE user_sessions SET last_seen_at=now() WHERE token_hash=?", hash(rawToken));
    jdbc.update("UPDATE app_users SET last_seen_at=now() WHERE id=?", rows.getFirst().user().id());
    return rows.getFirst();
  }

  public void logout(String rawToken) {
    if (rawToken != null) jdbc.update("UPDATE user_sessions SET revoked_at=now() WHERE token_hash=?", hash(rawToken));
  }

  @Transactional
  public UserDto updateProfile(UUID id, ProfileRequest request) {
    String kind = "upload".equals(request.avatarKind()) ? "upload" : "gallery";
    String avatar = request.avatarValue() == null ? DEFAULT_AVATAR : request.avatarValue();
    if ("gallery".equals(kind) && !GALLERY.contains(avatar)) avatar = DEFAULT_AVATAR;
    jdbc.update("UPDATE app_users SET display_name=?,avatar_kind=?,avatar_value=?,updated_at=now() WHERE id=?",
        validName(request.displayName()), kind, avatar, id);
    return findUser(id);
  }

  @Transactional
  public void changePassword(UUID id, PasswordRequest request) {
    String currentHash = jdbc.queryForObject("SELECT password_hash FROM app_users WHERE id=?", String.class, id);
    if (currentHash == null || !passwords.matches(request.currentPassword(), currentHash)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña actual no es correcta");
    }
    validatePassword(request.newPassword());
    jdbc.update("UPDATE app_users SET password_hash=?,password_change_required=false,updated_at=now() WHERE id=?",
        passwords.encode(request.newPassword()), id);
    jdbc.update("UPDATE user_sessions SET revoked_at=now() WHERE user_id=?", id);
  }

  public UserDto findUser(UUID id) {
    return jdbc.query("SELECT * FROM app_users WHERE id=?", this::toUser, id).stream().findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
  }

  public List<String> gallery() { return GALLERY; }

  @Transactional
  public void bootstrapAdmin(String email, String password, String name) {
    validatePassword(password);
    jdbc.update("""
        UPDATE app_users SET email=?,password_hash=?,display_name=?,role='ADMIN',enabled=true,
          password_change_required=true,updated_at=now() WHERE id=? AND password_hash='{bootstrap}'
        """, validEmail(email), passwords.encode(password), validName(name), LEGACY_ADMIN_ID);
  }

  public static String defaultFolderId(UUID userId) {
    return LEGACY_ADMIN_ID.equals(userId) ? "general" : "general-" + userId;
  }
  public static String hash(String value) {
    try {
      return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
          .digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException exception) { throw new IllegalStateException(exception); }
  }

  private SessionResult createSession(UserDto user) {
    String token = randomToken();
    String csrf = randomToken();
    jdbc.update("DELETE FROM user_sessions WHERE expires_at<=now() OR revoked_at IS NOT NULL");
    jdbc.update("INSERT INTO user_sessions(id,user_id,token_hash,csrf_hash,expires_at) VALUES(?,?,?,?,?)",
        UUID.randomUUID(), user.id(), hash(token), hash(csrf), OffsetDateTime.now().plusHours(sessionHours));
    return new SessionResult(user, token, csrf);
  }

  private UserDto toUser(ResultSet rs, int row) throws SQLException {
    return new UserDto(rs.getObject("id", UUID.class), rs.getString("email"), rs.getString("display_name"),
        rs.getString("role"), rs.getString("avatar_kind"), rs.getString("avatar_value"),
        rs.getBoolean("password_change_required"), rs.getObject("created_at", OffsetDateTime.class));
  }
  private UserWithPassword toUserWithPassword(ResultSet rs, int row) throws SQLException {
    return new UserWithPassword(toUser(rs, row), rs.getString("password_hash"));
  }
  private String validEmail(String value) {
    String email = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    if (!email.matches("^[^@\\s]{1,100}@[^@\\s]{1,150}\\.[^@\\s]{2,}$"))
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email no válido");
    return email;
  }
  private String validName(String value) {
    String name = value == null ? "" : value.trim();
    if (name.length() < 2 || name.length() > 80)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre debe tener entre 2 y 80 caracteres");
    return name;
  }
  private void validatePassword(String value) {
    if (value == null || value.length() < 10 || value.length() > 200 || !value.matches(".*[A-Za-z].*") || !value.matches(".*[0-9].*"))
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña debe tener al menos 10 caracteres, letras y números");
  }
  private String randomToken() { byte[] value = new byte[32]; RANDOM.nextBytes(value); return Base64.getUrlEncoder().withoutPadding().encodeToString(value); }
  private record UserWithPassword(UserDto user, String passwordHash) {}
}
