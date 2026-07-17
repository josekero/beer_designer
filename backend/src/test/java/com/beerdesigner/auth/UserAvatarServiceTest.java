package com.beerdesigner.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Path;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

class UserAvatarServiceTest {
  @TempDir Path storage;
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final UUID userId = UUID.fromString("11111111-1111-1111-1111-111111111111");

  @Test
  void validatesStoresAndLoadsAnAvatar() throws Exception {
    UserAvatarService service = new UserAvatarService(storage.toString(), jdbc);
    assertThatThrownBy(() -> service.store(userId, new MockMultipartFile("file", new byte[0])))
        .isInstanceOf(ResponseStatusException.class);
    assertThatThrownBy(() -> service.store(userId,
        new MockMultipartFile("file", "avatar.png", "image/png", "not-image".getBytes())))
        .isInstanceOf(ResponseStatusException.class);

    service.store(userId, new MockMultipartFile("file", "avatar.png", "image/png", png()));
    verify(jdbc).update(anyString(), any(Object[].class));
    when(jdbc.queryForObject(anyString(), any(Class.class), any())).thenReturn("avatar.png");
    var stored = service.load(userId);
    assertThat(stored.contentType()).isEqualTo("image/png");
    assertThat(stored.resource().isReadable()).isTrue();
  }

  private byte[] png() throws Exception {
    ByteArrayOutputStream output = new ByteArrayOutputStream();
    ImageIO.write(new BufferedImage(32, 32, BufferedImage.TYPE_INT_ARGB), "png", output);
    return output.toByteArray();
  }
}
