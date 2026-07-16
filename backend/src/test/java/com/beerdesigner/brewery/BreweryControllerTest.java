package com.beerdesigner.brewery;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beerdesigner.brewery.BreweryDtos.BreweryDto;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mock.web.MockMultipartFile;

class BreweryControllerTest {
  private final BreweryService service = mock(BreweryService.class);
  private final BreweryController controller = new BreweryController(service);
  private final BreweryDto brewery = new BreweryDto(
      "guaja", "Guaja Brewery", "https://untappd.com/guaja", null, null, null, OffsetDateTime.now());

  @Test
  void delegatesCatalogMutationsAndLogoUpload() {
    var logo = new MockMultipartFile("file", "guaja.png", "image/png", new byte[] {1});
    when(service.findAll()).thenReturn(List.of(brewery));
    when(service.save("guaja", brewery)).thenReturn(brewery);
    when(service.storeLogo("guaja", logo)).thenReturn(brewery);

    assertThat(controller.breweries()).containsExactly(brewery);
    assertThat(controller.save("guaja", brewery)).isSameAs(brewery);
    assertThat(controller.uploadLogo("guaja", logo)).isSameAs(brewery);
    controller.delete("guaja");

    verify(service).delete("guaja");
  }

  @Test
  void servesLogosInlineWithoutBrowserCaching() {
    var resource = new ByteArrayResource(new byte[] {1, 2, 3});
    when(service.loadLogo("guaja")).thenReturn(
        new BreweryService.StoredLogo(resource, "image/png", "guaja.png"));

    var response = controller.logo("guaja");

    assertThat(response.getBody()).isSameAs(resource);
    assertThat(response.getHeaders().getContentType().toString()).isEqualTo("image/png");
    assertThat(response.getHeaders().getCacheControl()).contains("no-cache");
    assertThat(response.getHeaders().getContentDisposition().getFilename()).isEqualTo("guaja.png");
  }
}
