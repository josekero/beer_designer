package com.beerdesigner.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;

/**
 * Cookie-based CSRF repository for stateless authentication.
 *
 * <p>Spring clears the token when it observes a newly populated security context. In this
 * application the context is rebuilt from BEER_SESSION on every request, so that automatic
 * rotation would remove XSRF-TOKEN after every successful write. Session termination already
 * clears both cookies explicitly in AuthController.</p>
 */
final class StableCookieCsrfTokenRepository implements CsrfTokenRepository {
  private final CsrfTokenRepository delegate;

  static StableCookieCsrfTokenRepository angular() {
    return new StableCookieCsrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse());
  }

  StableCookieCsrfTokenRepository(CsrfTokenRepository delegate) {
    this.delegate = delegate;
  }

  @Override public CsrfToken generateToken(HttpServletRequest request) {
    return delegate.generateToken(request);
  }

  @Override public void saveToken(CsrfToken token, HttpServletRequest request, HttpServletResponse response) {
    if (token != null) delegate.saveToken(token, request, response);
  }

  @Override public CsrfToken loadToken(HttpServletRequest request) {
    return delegate.loadToken(request);
  }
}
