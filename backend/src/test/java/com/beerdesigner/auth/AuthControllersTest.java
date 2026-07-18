package com.beerdesigner.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beerdesigner.TestSecurity;
import com.beerdesigner.auth.AuthDtos.LoginRequest;
import com.beerdesigner.auth.AuthDtos.ProfileRequest;
import com.beerdesigner.auth.AuthDtos.SessionResult;
import com.beerdesigner.auth.AuthDtos.UserDto;
import java.sql.ResultSet;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.csrf.DefaultCsrfToken;
import org.springframework.web.server.ResponseStatusException;

class AuthControllersTest {
  private final AuthService auth = mock(AuthService.class);
  private final UserAvatarService avatars = mock(UserAvatarService.class);
  private final UserDto user = new UserDto(TestSecurity.USER_ID, "test@example.com", "Brewer", "USER",
      "gallery", "amber-pint", false, OffsetDateTime.now());

  @AfterEach void clear() { SecurityContextHolder.clearContext(); }

  @Test
  void createsAndClearsStrictSessionCookies() {
    AuthController controller = new AuthController(auth, avatars, false, 24);
    when(auth.login(any())).thenReturn(new SessionResult(user, "session", "csrf"));
    var login = controller.login(new LoginRequest("test@example.com", "password123"));
    assertThat(login.getHeaders().get("Set-Cookie")).hasSize(2).allMatch(value -> value.contains("SameSite=Strict"));

    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setCookies(new jakarta.servlet.http.Cookie(SessionAuthenticationFilter.SESSION_COOKIE, "session"));
    var logout = controller.logout(request);
    assertThat(logout.getStatusCode().value()).isEqualTo(204);
    verify(auth).logout("session");
  }

  @Test
  void delegatesAuthenticatedProfileAndGalleryOperations() {
    TestSecurity.asUser();
    AuthController controller = new AuthController(auth, avatars, false, 24);
    when(auth.gallery()).thenReturn(List.of("teku"));
    when(auth.updateProfile(any(), any())).thenReturn(user);
    assertThat(controller.me().id()).isEqualTo(TestSecurity.USER_ID);
    var csrf = new DefaultCsrfToken("X-XSRF-TOKEN", "_csrf", "csrf-token");
    assertThat(controller.csrf(csrf).getToken()).isEqualTo("csrf-token");
    assertThat(controller.avatars()).containsExactly("teku");
    assertThat(controller.profile(new ProfileRequest("Brewer", "gallery", "teku"))).isEqualTo(user);
  }

  @Test
  @SuppressWarnings({"unchecked", "rawtypes"})
  void summarizesListsAndChangesUserAccess() throws Exception {
    JdbcTemplate jdbc = mock(JdbcTemplate.class);
    when(jdbc.queryForObject(anyString(), any(Class.class))).thenReturn(3L, 8L, 120L, 4L, 1L);
    ResultSet row = mock(ResultSet.class);
    UUID other = UUID.randomUUID();
    when(row.getObject("id", UUID.class)).thenReturn(other);
    when(row.getString("email")).thenReturn("other@example.com");
    when(row.getString("display_name")).thenReturn("Other");
    when(row.getString("role")).thenReturn("USER");
    when(row.getObject("created_at", OffsetDateTime.class)).thenReturn(OffsetDateTime.now());
    when(row.getLong("recipe_count")).thenReturn(2L);
    when(jdbc.query(anyString(), any(RowMapper.class))).thenAnswer(invocation ->
        List.of(((RowMapper) invocation.getArgument(1)).mapRow(row, 0)));
    when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);
    AdminController controller = new AdminController(jdbc);
    assertThat(controller.summary()).containsEntry("users", 3L).containsEntry("recipes", 8L)
        .containsEntry("ingredients", 120L);
    assertThat(controller.users()).singleElement().satisfies(value -> assertThat(value.recipes()).isEqualTo(2));

    TestSecurity.asAdmin();
    controller.access(other, new AdminController.UserAccessRequest("INVALID", false));
    assertThatThrownBy(() -> controller.access(TestSecurity.USER_ID,
        new AdminController.UserAccessRequest("ADMIN", false)))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
  }
}
