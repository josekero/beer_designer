package com.beerdesigner.auth;

import com.beerdesigner.auth.AuthDtos.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.core.io.Resource;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService auth;
  private final boolean secureCookie;
  private final long sessionHours;
  private final UserAvatarService avatars;

  public AuthController(AuthService auth, UserAvatarService avatars,
      @Value("${beer-designer.auth.secure-cookie:false}") boolean secureCookie,
      @Value("${beer-designer.auth.session-hours:168}") long sessionHours) {
    this.auth = auth;
    this.avatars = avatars;
    this.secureCookie = secureCookie;
    this.sessionHours = sessionHours;
  }

  @PostMapping("/register") public ResponseEntity<UserDto> register(@RequestBody RegisterRequest request) { return session(auth.register(request)); }
  @PostMapping("/login") public ResponseEntity<UserDto> login(@RequestBody LoginRequest request) { return session(auth.login(request)); }
  @GetMapping("/me") public UserDto me() { return UserContext.current(); }
  @GetMapping("/csrf") public CsrfToken csrf(CsrfToken token) { return token; }
  @GetMapping("/avatars") public List<String> avatars() { return auth.gallery(); }
  @PutMapping("/profile") public UserDto profile(@RequestBody ProfileRequest request) { return auth.updateProfile(UserContext.userId(), request); }
  @PutMapping("/password") public void password(@RequestBody PasswordRequest request) { auth.changePassword(UserContext.userId(), request); }

  @PostMapping(path="/avatar",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
  public UserDto uploadAvatar(@RequestParam("file") MultipartFile file){avatars.store(UserContext.userId(),file);return auth.findUser(UserContext.userId());}
  @GetMapping("/avatar")
  public ResponseEntity<Resource> avatar(){var avatar=avatars.load(UserContext.userId());return ResponseEntity.ok().contentType(MediaType.parseMediaType(avatar.contentType())).body(avatar.resource());}

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(HttpServletRequest request) {
    auth.logout(SessionAuthenticationFilter.cookie(request, SessionAuthenticationFilter.SESSION_COOKIE));
    return ResponseEntity.noContent().headers(clearCookies()).build();
  }

  private ResponseEntity<UserDto> session(SessionResult result) {
    HttpHeaders headers = new HttpHeaders();
    headers.add(HttpHeaders.SET_COOKIE, cookie(SessionAuthenticationFilter.SESSION_COOKIE, result.sessionToken(), true).toString());
    headers.add(HttpHeaders.SET_COOKIE, cookie(SessionAuthenticationFilter.CSRF_COOKIE, result.csrfToken(), false).toString());
    return ResponseEntity.ok().headers(headers).body(result.user());
  }
  private HttpHeaders clearCookies() {
    HttpHeaders headers = new HttpHeaders();
    headers.add(HttpHeaders.SET_COOKIE, cookie(SessionAuthenticationFilter.SESSION_COOKIE, "", true, Duration.ZERO).toString());
    headers.add(HttpHeaders.SET_COOKIE, cookie(SessionAuthenticationFilter.CSRF_COOKIE, "", false, Duration.ZERO).toString());
    return headers;
  }
  private ResponseCookie cookie(String name, String value, boolean httpOnly) { return cookie(name, value, httpOnly, Duration.ofHours(sessionHours)); }
  private ResponseCookie cookie(String name, String value, boolean httpOnly, Duration age) {
    return ResponseCookie.from(name, value).httpOnly(httpOnly).secure(secureCookie).sameSite("Strict")
        .path("/").maxAge(age).build();
  }
}
