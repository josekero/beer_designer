package com.beerdesigner.brewery;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beerdesigner.brewery.BreweryDtos.BreweryDto;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

class BreweryServiceTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final BreweryDto brewery = new BreweryDto(
      "guaja", "Guaja Brewery", "https://untappd.com/guaja", null, null, null, OffsetDateTime.now());
  @TempDir Path storage;
  private BreweryService service;

  @BeforeEach
  void setUp() {
    service = new BreweryService(jdbc, storage.toString());
  }

  @Test
  void savesAValidatedAndNormalizedBrewery() {
    when(jdbc.query(anyString(), any(RowMapper.class), eq("guaja"))).thenReturn(List.of(brewery));

    assertThat(service.save("guaja", new BreweryDto(
        "ignored", "  Guaja Brewery  ", "  https://untappd.com/guaja  ", null, null, null, null)))
        .isEqualTo(brewery);

    verify(jdbc).update(anyString(), eq("guaja"), eq("Guaja Brewery"), eq("https://untappd.com/guaja"));
  }

  @Test
  void rejectsUnsafeIdentifiersAndBlankNames() {
    assertThatThrownBy(() -> service.save("../guaja", brewery)).isInstanceOf(ResponseStatusException.class);
    assertThatThrownBy(() -> service.save("guaja", new BreweryDto(
        "guaja", " ", null, null, null, null, null))).isInstanceOf(ResponseStatusException.class);
  }

  @Test
  void reportsMissingBreweriesOnReadAndDelete() {
    when(jdbc.query(anyString(), any(RowMapper.class), eq("missing"))).thenReturn(List.of());
    when(jdbc.query(anyString(), any(RowMapper.class), eq("guaja"))).thenReturn(List.of());
    when(jdbc.update(anyString(), eq("guaja"))).thenReturn(0);

    assertThatThrownBy(() -> service.findById("missing")).isInstanceOf(ResponseStatusException.class);
    assertThatThrownBy(() -> service.delete("guaja")).isInstanceOf(ResponseStatusException.class);
  }

  @Test
  void rejectsEmptyOversizedAndNonImageLogos() {
    when(jdbc.query(anyString(), any(RowMapper.class), eq("guaja"))).thenReturn(List.of(brewery));
    var empty = new MockMultipartFile("file", "empty.png", "image/png", new byte[0]);
    var oversized = mock(org.springframework.web.multipart.MultipartFile.class);
    when(oversized.getSize()).thenReturn(3L * 1024 * 1024 + 1);
    var text = new MockMultipartFile("file", "logo.png", "image/png", "not an image".getBytes());

    assertThatThrownBy(() -> service.storeLogo("guaja", empty)).isInstanceOf(ResponseStatusException.class);
    assertThatThrownBy(() -> service.storeLogo("guaja", oversized)).isInstanceOf(ResponseStatusException.class);
    assertThatThrownBy(() -> service.storeLogo("guaja", text)).isInstanceOf(ResponseStatusException.class);
  }

  @Test
  void storesAndLoadsAValidatedPngLogo() throws Exception {
    AtomicReference<String> storedName = new AtomicReference<>();
    when(jdbc.query(anyString(), any(RowMapper.class), eq("guaja"))).thenAnswer(invocation -> {
      String sql = invocation.getArgument(0);
      if (sql.contains("SELECT *")) return List.of(brewery);
      if (sql.contains("logo_content_type") && storedName.get() != null) {
        return java.util.Collections.singletonList(
            new String[] {storedName.get(), "image/png", "guaja_logo.png"});
      }
      return List.of();
    });
    doAnswer(invocation -> {
      String sql = invocation.getArgument(0);
      if (sql.contains("UPDATE breweries SET logo_stored_name")) storedName.set(invocation.getArgument(1));
      return 1;
    }).when(jdbc).update(anyString(), any(Object[].class));

    var file = new MockMultipartFile("file", "guaja?logo.png", "image/png", png(24, 18));
    assertThat(service.storeLogo("guaja", file)).isEqualTo(brewery);
    assertThat(storedName.get()).endsWith(".png");
    assertThat(Files.exists(storage.resolve("breweries").resolve(storedName.get()))).isTrue();

    var loaded = service.loadLogo("guaja");
    assertThat(loaded.contentType()).isEqualTo("image/png");
    assertThat(loaded.originalName()).isEqualTo("guaja_logo.png");
    assertThat(loaded.resource().isReadable()).isTrue();
  }

  @Test
  void rejectsMissingLogosAndUnsafeStoredPaths() {
    when(jdbc.query(anyString(), any(RowMapper.class), eq("missing"))).thenReturn(List.of());
    when(jdbc.query(anyString(), any(RowMapper.class), eq("without-logo")))
        .thenReturn(java.util.Collections.singletonList(new String[] {null, null, null}));
    when(jdbc.query(anyString(), any(RowMapper.class), eq("unsafe")))
        .thenReturn(java.util.Collections.singletonList(
            new String[] {"../escape.png", "image/png", "escape.png"}));

    assertThatThrownBy(() -> service.loadLogo("missing")).isInstanceOf(ResponseStatusException.class);
    assertThatThrownBy(() -> service.loadLogo("without-logo")).isInstanceOf(ResponseStatusException.class);
    assertThatThrownBy(() -> service.loadLogo("unsafe")).isInstanceOf(ResponseStatusException.class);
  }

  @Test
  void deletesTheDatabaseRowAndItsStoredLogo() throws Exception {
    Path logo = storage.resolve("breweries").resolve("old-logo.png");
    Files.write(logo, png(2, 2));
    when(jdbc.query(anyString(), any(RowMapper.class), eq("guaja"))).thenReturn(List.of("old-logo.png"));
    when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

    service.delete("guaja");

    assertThat(Files.exists(logo)).isFalse();
  }

  private byte[] png(int width, int height) throws Exception {
    var output = new ByteArrayOutputStream();
    ImageIO.write(new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB), "png", output);
    return output.toByteArray();
  }
}
