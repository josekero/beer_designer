package com.beerdesigner.auth;

import com.beerdesigner.auth.AuthDtos.UserDto;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

public final class UserContext {
  private UserContext() {}

  public static UserDto current() {
    Object principal = SecurityContextHolder.getContext().getAuthentication() == null ? null
        : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    if (principal instanceof UserDto user) return user;
    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
  }

  public static UUID userId() { return current().id(); }
  public static boolean isAdmin() { return "ADMIN".equals(current().role()); }
}
