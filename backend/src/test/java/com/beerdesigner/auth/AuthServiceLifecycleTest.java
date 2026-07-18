package com.beerdesigner.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beerdesigner.auth.AuthDtos.LoginRequest;
import com.beerdesigner.auth.AuthDtos.PasswordRequest;
import com.beerdesigner.auth.AuthDtos.ProfileRequest;
import com.beerdesigner.auth.AuthDtos.RegisterRequest;
import java.sql.ResultSet;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.stubbing.Answer;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

class AuthServiceLifecycleTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final PasswordEncoder passwords = mock(PasswordEncoder.class);
  private final ResultSet row = mock(ResultSet.class);
  private final AuthService service = new AuthService(jdbc, passwords, 24);
  private final UUID id = UUID.fromString("11111111-1111-1111-1111-111111111111");

  @BeforeEach
  void userRow() throws Exception {
    when(row.getObject("id", UUID.class)).thenReturn(id);
    when(row.getString("email")).thenReturn("brewer@example.com");
    when(row.getString("display_name")).thenReturn("Brewer");
    when(row.getString("role")).thenReturn("USER");
    when(row.getString("avatar_kind")).thenReturn("gallery");
    when(row.getString("avatar_value")).thenReturn("hop-pirate");
    when(row.getObject("created_at", OffsetDateTime.class)).thenReturn(OffsetDateTime.now());
    when(row.getString("password_hash")).thenReturn("encoded");
    when(row.getString("csrf_hash")).thenReturn(AuthService.hash("csrf"));
    when(passwords.encode(anyString())).thenReturn("encoded");
  }

  @Test
  void registersAUserWithAnIsolatedDefaultFolderAndSession() {
    when(jdbc.queryForObject(anyString(), any(Class.class), any())).thenReturn(false);
    answerUserQueries();

    var result = service.register(new RegisterRequest(" Brewer@Example.com ", "password123", " Brewer "));

    assertThat(result.user().email()).isEqualTo("brewer@example.com");
    assertThat(result.sessionToken()).isNotBlank();
    assertThat(result.csrfToken()).isNotBlank();
    verify(jdbc, atLeast(3)).update(anyString(), any(Object[].class));
  }

  @Test
  void rejectsDuplicateRegistrationAndBadPasswords() {
    when(jdbc.queryForObject(anyString(), any(Class.class), any())).thenReturn(true);
    assertStatus(HttpStatus.CONFLICT,
        () -> service.register(new RegisterRequest("brewer@example.com", "password123", "Brewer")));
    assertStatus(HttpStatus.BAD_REQUEST,
        () -> service.register(new RegisterRequest("brewer@example.com", "onlyletters", "Brewer")));
  }

  @Test
  void logsInAuthenticatesTouchesActivityAndLogsOut() {
    answerUserQueries();
    when(passwords.matches("password123", "encoded")).thenReturn(true);

    var login = service.login(new LoginRequest("BREWER@example.com", "password123"));
    assertThat(login.user().id()).isEqualTo(id);
    assertThat(service.authenticate(login.sessionToken())).isNotNull();
    assertThat(service.authenticate(" ")).isNull();
    service.logout(login.sessionToken());
    service.logout(null);
  }

  @Test
  void rejectsWrongLoginAndUpdatesProfileSafely() {
    answerUserQueries();
    when(passwords.matches(anyString(), anyString())).thenReturn(false);
    assertStatus(HttpStatus.UNAUTHORIZED,
        () -> service.login(new LoginRequest("brewer@example.com", "wrong")));

    var profile = service.updateProfile(id, new ProfileRequest("New Brewer", "gallery", "unknown"));
    assertThat(profile.id()).isEqualTo(id);
    service.updateProfile(id, new ProfileRequest("New Brewer", "upload", "avatar.png"));
    assertThat(service.gallery()).hasSize(14)
        .contains("hop-pirate", "brew-wizard", "barrel-brewer", "water-alchemist", "co2-bubble", "football-pint")
        .doesNotContain("oak-barrel");
  }

  @Test
  void changesPasswordAndRevokesExistingSessions() {
    when(jdbc.queryForObject(anyString(), any(Class.class), any())).thenReturn("encoded");
    when(passwords.matches("current123", "encoded")).thenReturn(true);
    service.changePassword(id, new PasswordRequest("current123", "different123"));

    when(passwords.matches("wrong", "encoded")).thenReturn(false);
    assertStatus(HttpStatus.BAD_REQUEST,
        () -> service.changePassword(id, new PasswordRequest("wrong", "different123")));
  }

  @Test
  void findsAndBootstrapsTheAdministrator() {
    answerUserQueries();
    assertThat(service.findUser(id).displayName()).isEqualTo("Brewer");
    service.bootstrapAdmin("admin@example.com", "adminpass123", "Administrator");
    verify(passwords).encode("adminpass123");
  }

  @SuppressWarnings({"unchecked", "rawtypes"})
  private void answerUserQueries() {
    Answer<List<?>> answer = invocation -> {
      RowMapper mapper = invocation.getArgument(1);
      return List.of(mapper.mapRow(row, 0));
    };
    when(jdbc.query(anyString(), any(RowMapper.class), any(Object[].class))).thenAnswer(answer);
  }

  private void assertStatus(HttpStatus status, Runnable action) {
    assertThatThrownBy(action::run).isInstanceOfSatisfying(ResponseStatusException.class,
        error -> assertThat(error.getStatusCode()).isEqualTo(status));
  }
}
