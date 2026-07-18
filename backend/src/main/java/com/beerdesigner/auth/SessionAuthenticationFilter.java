package com.beerdesigner.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {
  public static final String SESSION_COOKIE = "BEER_SESSION";
  public static final String CSRF_COOKIE = "XSRF-TOKEN";
  private final AuthService auth;

  public SessionAuthenticationFilter(AuthService auth) { this.auth = auth; }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String token = cookie(request, SESSION_COOKIE);
    var authenticated = auth.authenticate(token);
    if (authenticated != null) {
      var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + authenticated.user().role()));
      SecurityContextHolder.getContext().setAuthentication(
          new UsernamePasswordAuthenticationToken(authenticated.user(), token, authorities));
    }
    chain.doFilter(request, response);
  }

  public static String cookie(HttpServletRequest request, String name) {
    if (request.getCookies() == null) return null;
    for (Cookie cookie : request.getCookies()) if (name.equals(cookie.getName())) return cookie.getValue();
    return null;
  }
}
