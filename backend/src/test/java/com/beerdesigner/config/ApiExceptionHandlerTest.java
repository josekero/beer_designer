package com.beerdesigner.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class ApiExceptionHandlerTest {
  @Test
  void exposesSafeApplicationErrorMessages() {
    var response = new ApiExceptionHandler().responseStatus(
        new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña actual no es correcta"));
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    assertThat(response.getBody()).containsEntry("message", "La contraseña actual no es correcta");
  }
}
