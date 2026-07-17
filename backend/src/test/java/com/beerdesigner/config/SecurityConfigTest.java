package com.beerdesigner.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class SecurityConfigTest {
  @Test
  void usesStrongBcryptPasswordHashes() {
    var encoder = new SecurityConfig().passwordEncoder();
    assertThat(encoder).isInstanceOf(BCryptPasswordEncoder.class);
    assertThat(encoder.matches("password123", encoder.encode("password123"))).isTrue();
  }
}
