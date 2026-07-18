package com.beerdesigner.config;

import com.beerdesigner.auth.SessionAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.session.NullAuthenticatedSessionStrategy;

@Configuration
public class SecurityConfig {
  @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http, SessionAuthenticationFilter sessionFilter) throws Exception {
    var csrfRepository = StableCookieCsrfTokenRepository.angular();
    var csrfHandler = new CsrfTokenRequestAttributeHandler();
    return http
        .csrf(csrf -> csrf
            .csrfTokenRepository(csrfRepository)
            .csrfTokenRequestHandler(csrfHandler)
            .ignoringRequestMatchers("/api/auth/login", "/api/auth/register"))
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .sessionAuthenticationStrategy(new NullAuthenticatedSessionStrategy()))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/login", "/api/auth/register", "/api/health", "/actuator/health").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers("/api/**").authenticated()
            .anyRequest().permitAll())
        .exceptionHandling(errors -> errors.authenticationEntryPoint((request, response, exception) ->
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Authentication required")))
        .addFilterBefore(sessionFilter, CsrfFilter.class)
        .build();
  }
}
