package com.beerdesigner.auth;

import java.time.OffsetDateTime;
import java.util.UUID;

public final class AuthDtos {
  private AuthDtos() {}

  public record UserDto(UUID id, String email, String displayName, String role, String avatarKind,
                        String avatarValue, boolean passwordChangeRequired, OffsetDateTime createdAt) {}
  public record RegisterRequest(String email, String password, String displayName) {}
  public record LoginRequest(String email, String password) {}
  public record ProfileRequest(String displayName, String avatarKind, String avatarValue) {}
  public record PasswordRequest(String currentPassword, String newPassword) {}
  public record SessionResult(UserDto user, String sessionToken, String csrfToken) {}
  public record AuthenticatedUser(UserDto user, String csrfHash) {}
}
