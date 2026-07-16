package com.beerdesigner.brewery;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beerdesigner.brewery.BreweryDtos.BreweryDto;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.List;
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
}
