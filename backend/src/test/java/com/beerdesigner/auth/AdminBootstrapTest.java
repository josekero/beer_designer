package com.beerdesigner.auth;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.springframework.boot.ApplicationArguments;

class AdminBootstrapTest {
  @Test
  void delegatesTheConfiguredInitialAdministrator() {
    AuthService auth = mock(AuthService.class);
    new AdminBootstrap(auth, "admin@example.com", "password123", "Administrator")
        .run(mock(ApplicationArguments.class));
    verify(auth).bootstrapAdmin("admin@example.com", "password123", "Administrator");
  }
}
