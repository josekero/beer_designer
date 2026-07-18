package com.beerdesigner.config;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;

class StableCookieCsrfTokenRepositoryTest {
  @Test
  void delegatesGenerationLoadingAndSavingButIgnoresAutomaticDeletion() {
    CsrfTokenRepository delegate = mock(CsrfTokenRepository.class);
    HttpServletRequest request = mock(HttpServletRequest.class);
    HttpServletResponse response = mock(HttpServletResponse.class);
    CsrfToken token = mock(CsrfToken.class);
    when(delegate.generateToken(request)).thenReturn(token);
    when(delegate.loadToken(request)).thenReturn(token);
    var repository = new StableCookieCsrfTokenRepository(delegate);

    repository.generateToken(request);
    repository.loadToken(request);
    repository.saveToken(token, request, response);
    repository.saveToken(null, request, response);

    verify(delegate).generateToken(request);
    verify(delegate).loadToken(request);
    verify(delegate).saveToken(token, request, response);
    verify(delegate, never()).saveToken(null, request, response);
  }
}
