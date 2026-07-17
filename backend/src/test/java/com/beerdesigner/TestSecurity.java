package com.beerdesigner;

import com.beerdesigner.auth.AuthDtos.UserDto;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

public final class TestSecurity {
  public static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

  private TestSecurity() {}

  public static void asUser() { as("USER"); }

  public static void asAdmin() { as("ADMIN"); }

  public static void clear() { SecurityContextHolder.clearContext(); }

  private static void as(String role) {
    UserDto user = new UserDto(USER_ID, "test@beerdesigner.local", "Test Brewer", role,
        "gallery", "amber-pint", false, OffsetDateTime.now());
    SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
        user, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))));
  }
}
