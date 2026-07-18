package com.beerdesigner.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.beerdesigner.auth.AuthService;
import com.beerdesigner.auth.SessionAuthenticationFilter;
import com.beerdesigner.health.HealthController;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(HealthController.class)
@Import({SecurityConfig.class, SessionAuthenticationFilter.class})
class SecurityFilterChainTest {
  @Autowired private MockMvc mvc;
  @MockitoBean private AuthService auth;

  @Test
  void permitsHealthButProtectsTheRestOfTheApi() throws Exception {
    when(auth.authenticate(any())).thenReturn(null);
    mvc.perform(get("/api/health")).andExpect(status().isOk());
    mvc.perform(get("/api/recipes")).andExpect(status().isUnauthorized());
  }

  @Test
  void rejectsUnsafeRequestsWithoutCsrfAndAcceptsAngularCookieHeaderPair() throws Exception {
    when(auth.authenticate(any())).thenReturn(null);
    mvc.perform(post("/api/health")).andExpect(status().isForbidden());
    mvc.perform(post("/api/health")
        .cookie(new Cookie(SessionAuthenticationFilter.CSRF_COOKIE, "browser-token"))
        .header("X-XSRF-TOKEN", "browser-token"))
        .andExpect(status().isMethodNotAllowed());
  }

  @Test
  void loginAndRegistrationAreTheOnlyCsrfExemptApiWrites() throws Exception {
    when(auth.authenticate(any())).thenReturn(null);
    mvc.perform(post("/api/auth/login")).andExpect(status().isNotFound());
    mvc.perform(post("/api/auth/register")).andExpect(status().isNotFound());
  }
}
