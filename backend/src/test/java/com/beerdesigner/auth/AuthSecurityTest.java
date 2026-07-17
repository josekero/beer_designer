package com.beerdesigner.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beerdesigner.auth.AuthDtos.AuthenticatedUser;
import com.beerdesigner.auth.AuthDtos.LoginRequest;
import com.beerdesigner.auth.AuthDtos.RegisterRequest;
import com.beerdesigner.auth.AuthDtos.UserDto;
import jakarta.servlet.FilterChain;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

class AuthSecurityTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final PasswordEncoder passwords = mock(PasswordEncoder.class);
  private final AuthService service = new AuthService(jdbc, passwords, 24);

  @AfterEach void clearContext() { SecurityContextHolder.clearContext(); }

  @Test
  void rejectsInvalidRegistrationAndUnknownCredentials() {
    assertThatThrownBy(() -> service.register(new RegisterRequest("bad", "password123", "Brewer")))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    when(jdbc.query(anyString(), any(org.springframework.jdbc.core.RowMapper.class), any(Object[].class)))
        .thenReturn(List.of());
    assertThatThrownBy(() -> service.login(new LoginRequest("nobody@example.com", "password123")))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
  }

  @Test
  void hashesSessionSecretsAndBuildsPerUserFolders() {
    String hash = AuthService.hash("secret");
    assertThat(hash).hasSize(64).isEqualTo(AuthService.hash("secret")).isNotEqualTo(AuthService.hash("other"));
    assertThat(AuthService.defaultFolderId(AuthService.LEGACY_ADMIN_ID)).isEqualTo("general");
    assertThat(AuthService.defaultFolderId(UUID.fromString("11111111-1111-1111-1111-111111111111")))
        .isEqualTo("general-11111111-1111-1111-1111-111111111111");
  }

  @Test
  void filterAuthenticatesValidSessionsAndRejectsMissingCsrf() throws Exception {
    AuthService auth = mock(AuthService.class);
    UserDto user = user();
    String csrf = "csrf-secret";
    when(auth.authenticate("session-secret")).thenReturn(new AuthenticatedUser(user, AuthService.hash(csrf)));
    SessionAuthenticationFilter filter = new SessionAuthenticationFilter(auth);
    FilterChain chain = mock(FilterChain.class);

    MockHttpServletRequest get = request("GET");
    MockHttpServletResponse getResponse = new MockHttpServletResponse();
    filter.doFilter(get, getResponse, chain);
    assertThat(UserContext.current()).isEqualTo(user);
    verify(chain).doFilter(get, getResponse);

    SecurityContextHolder.clearContext();
    MockHttpServletRequest post = request("POST");
    MockHttpServletResponse forbidden = new MockHttpServletResponse();
    filter.doFilter(post, forbidden, chain);
    assertThat(forbidden.getStatus()).isEqualTo(403);
    verify(chain, never()).doFilter(post, forbidden);

    MockHttpServletRequest validPost = request("POST");
    validPost.addHeader("X-XSRF-TOKEN", csrf);
    MockHttpServletResponse validResponse = new MockHttpServletResponse();
    filter.doFilter(validPost, validResponse, chain);
    verify(chain).doFilter(validPost, validResponse);
  }

  @Test
  void filterAllowsAnonymousRequestsToContinue() throws Exception {
    AuthService auth = mock(AuthService.class);
    SessionAuthenticationFilter filter = new SessionAuthenticationFilter(auth);
    FilterChain chain = mock(FilterChain.class);
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/health");
    MockHttpServletResponse response = new MockHttpServletResponse();
    filter.doFilter(request, response, chain);
    verify(chain).doFilter(request, response);
    assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
  }

  private MockHttpServletRequest request(String method) {
    MockHttpServletRequest request = new MockHttpServletRequest(method, "/api/recipes");
    request.setCookies(new jakarta.servlet.http.Cookie(SessionAuthenticationFilter.SESSION_COOKIE, "session-secret"));
    return request;
  }

  private UserDto user() {
    return new UserDto(UUID.randomUUID(), "brewer@example.com", "Brewer", "USER", "gallery",
        "amber-pint", false, OffsetDateTime.now());
  }
}
