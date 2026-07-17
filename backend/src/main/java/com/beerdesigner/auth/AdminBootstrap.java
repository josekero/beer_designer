package com.beerdesigner.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrap implements ApplicationRunner {
  private final AuthService auth;
  private final String email;
  private final String password;
  private final String name;
  public AdminBootstrap(AuthService auth, @Value("${beer-designer.auth.admin-email}") String email,
      @Value("${beer-designer.auth.admin-password}") String password,
      @Value("${beer-designer.auth.admin-name}") String name) {
    this.auth = auth; this.email = email; this.password = password; this.name = name;
  }
  @Override public void run(ApplicationArguments args) { auth.bootstrapAdmin(email, password, name); }
}
