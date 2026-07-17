package com.beerdesigner.auth;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Iterator;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserAvatarService {
  private static final long MAX_BYTES = 3L * 1024 * 1024;
  private static final Set<String> FORMATS = Set.of("png", "jpeg", "jpg");
  private final Path root;
  private final JdbcTemplate jdbc;

  public UserAvatarService(@Value("${beer-designer.image-storage-path}") String storage, JdbcTemplate jdbc) {
    this.root = Path.of(storage).toAbsolutePath().normalize().resolve("users");
    this.jdbc = jdbc;
    try {
      Files.createDirectories(root);
    } catch (IOException error) {
      throw new IllegalStateException("Could not initialize avatar storage", error);
    }
  }

  public void store(UUID userId, MultipartFile file) {
    if (file.isEmpty() || file.getSize() > MAX_BYTES) {
      throw bad("La imagen debe ser JPG o PNG y pesar menos de 3 MB", null);
    }
    String format = inspect(file);
    Path folder = root.resolve(userId.toString()).normalize();
    if (!folder.startsWith(root)) throw bad("Ruta de avatar no válida", null);
    try {
      Files.createDirectories(folder);
      Path target = folder.resolve("avatar." + ("png".equals(format) ? "png" : "jpg"));
      try (InputStream input = file.getInputStream()) {
        Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
      }
      jdbc.update("UPDATE app_users SET avatar_kind='upload',avatar_value=?,updated_at=now() WHERE id=?",
          target.getFileName().toString(), userId);
    } catch (IOException error) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar el avatar", error);
    }
  }

  public StoredAvatar load(UUID userId) {
    String name = jdbc.queryForObject(
        "SELECT CASE WHEN avatar_kind='upload' THEN avatar_value END FROM app_users WHERE id=?",
        String.class, userId);
    if (name == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no tiene foto propia");
    Path file = root.resolve(userId.toString()).resolve(name).normalize();
    if (!file.startsWith(root)) throw bad("Ruta de avatar no válida", null);
    try {
      Resource resource = new UrlResource(file.toUri());
      if (!resource.exists() || !resource.isReadable()) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el avatar");
      }
      return new StoredAvatar(resource, name.endsWith(".png") ? "image/png" : "image/jpeg");
    } catch (java.net.MalformedURLException error) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el avatar", error);
    }
  }

  private String inspect(MultipartFile file) {
    try (InputStream input = file.getInputStream(); ImageInputStream image = ImageIO.createImageInputStream(input)) {
      if (image == null) throw new IOException();
      Iterator<ImageReader> readers = ImageIO.getImageReaders(image);
      if (!readers.hasNext()) throw new IOException();
      ImageReader reader = readers.next();
      try {
        reader.setInput(image, true, true);
        String format = reader.getFormatName().toLowerCase(Locale.ROOT);
        int width = reader.getWidth(0);
        int height = reader.getHeight(0);
        if (!FORMATS.contains(format) || width < 1 || height < 1 || width > 4000 || height > 4000) {
          throw new IOException();
        }
        return format;
      } finally {
        reader.dispose();
      }
    } catch (IOException error) {
      throw bad("Solo se admiten imágenes JPG o PNG válidas de hasta 4000 × 4000 px", error);
    }
  }

  private ResponseStatusException bad(String message, Throwable error) {
    return new ResponseStatusException(HttpStatus.BAD_REQUEST, message, error);
  }

  public record StoredAvatar(Resource resource, String contentType) {}
}
