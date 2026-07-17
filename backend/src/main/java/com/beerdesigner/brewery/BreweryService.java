package com.beerdesigner.brewery;

import com.beerdesigner.auth.UserContext;
import com.beerdesigner.brewery.BreweryDtos.BreweryDto;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Iterator;
import java.util.List;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BreweryService {
  private static final long MAX_BYTES = 3L * 1024 * 1024;
  private static final int MAX_DIMENSION = 4000;
  private static final Set<String> ALLOWED_FORMATS = Set.of("jpeg", "jpg", "png");
  private final JdbcTemplate jdbc;
  private final Path storagePath;

  public BreweryService(JdbcTemplate jdbc, @Value("${beer-designer.image-storage-path}") String imageStoragePath) {
    this.jdbc = jdbc;
    storagePath = Path.of(imageStoragePath).toAbsolutePath().normalize().resolve("breweries");
    try {
      Files.createDirectories(storagePath);
    } catch (IOException exception) {
      throw new IllegalStateException("Could not initialize brewery logo storage", exception);
    }
  }

  public List<BreweryDto> findAll() {
    return jdbc.query("SELECT * FROM breweries WHERE owner_id=? ORDER BY name", this::toDto, UserContext.userId());
  }

  public BreweryDto findById(String id) {
    return jdbc.query("SELECT * FROM breweries WHERE id = ? AND owner_id=?", this::toDto, id, UserContext.userId()).stream()
        .findFirst()
        .orElseThrow(() -> notFound(id));
  }

  @Transactional
  public BreweryDto save(String id, BreweryDto brewery) {
    var ownerId = UserContext.userId();
    id = ownedId(id, ownerId);
    if (!id.matches("[a-z0-9][a-z0-9-]{0,79}")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El identificador de la brewery no es válido");
    }
    if (brewery.name() == null || brewery.name().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre de la brewery es obligatorio");
    }
    jdbc.update("""
        INSERT INTO breweries (id, owner_id, name, untappd_url)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          untappd_url = EXCLUDED.untappd_url,
          updated_at = now()
        WHERE breweries.owner_id=EXCLUDED.owner_id
        """, id, ownerId, brewery.name().trim(), blank(brewery.untappdUrl()));
    return findById(id);
  }

  private String ownedId(String requestedId, java.util.UUID ownerId) {
    if (UserContext.isAdmin()) return requestedId;
    String prefix = "u-" + ownerId.toString().substring(0, 8) + "-";
    return requestedId.startsWith(prefix) ? requestedId : prefix + requestedId;
  }

  @Transactional
  public void delete(String id) {
    var ownerId = UserContext.userId();
    List<String> storedNames = jdbc.query("SELECT logo_stored_name FROM breweries WHERE id = ? AND owner_id=?",
        (rs, row) -> rs.getString(1), id, ownerId);
    String storedName = storedNames.isEmpty() ? null : storedNames.getFirst();
    if (jdbc.update("DELETE FROM breweries WHERE id = ? AND owner_id=?", id, ownerId) == 0) throw notFound(id);
    if (storedName != null) {
      try { Files.deleteIfExists(resolveStoredName(storedName)); } catch (IOException ignored) { }
    }
  }

  @Transactional
  public BreweryDto storeLogo(String id, MultipartFile file) {
    BreweryDto current = findById(id);
    if (file.isEmpty() || file.getSize() > MAX_BYTES) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El logo debe pesar como máximo 3 MB");
    }
    ImageInfo info = inspect(file);
    String storedName = UUID.randomUUID() + ("png".equals(info.format()) ? ".png" : ".jpg");
    Path target = storagePath.resolve(storedName).normalize();
    if (!target.startsWith(storagePath)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ruta de logo no válida");
    var ownerId = UserContext.userId();
    List<String> previousNames = jdbc.query("SELECT logo_stored_name FROM breweries WHERE id = ? AND owner_id=?",
        (rs, row) -> rs.getString(1), id, ownerId);
    String previous = previousNames.isEmpty() ? null : previousNames.getFirst();
    try (InputStream input = file.getInputStream()) {
      Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
      jdbc.update("""
          UPDATE breweries SET logo_stored_name = ?, logo_original_name = ?, logo_content_type = ?,
            logo_size_bytes = ?, logo_width = ?, logo_height = ?, updated_at = now()
          WHERE id = ? AND owner_id=?
          """, storedName, safeOriginalName(file.getOriginalFilename()), info.contentType(), file.getSize(),
          info.width(), info.height(), id, ownerId);
      if (previous != null) Files.deleteIfExists(resolveStoredName(previous));
    } catch (IOException exception) {
      try { Files.deleteIfExists(target); } catch (IOException ignored) { }
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar el logo", exception);
    }
    return findById(current.id());
  }

  public StoredLogo loadLogo(String id) {
    return jdbc.query("SELECT logo_stored_name, logo_content_type, logo_original_name FROM breweries WHERE id = ? AND owner_id=?",
        (rs, row) -> new String[] {rs.getString(1), rs.getString(2), rs.getString(3)}, id, UserContext.userId()).stream()
        .findFirst()
        .map(values -> {
          if (values[0] == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La brewery no tiene logo");
          try {
            Resource resource = new UrlResource(resolveStoredName(values[0]).toUri());
            if (!resource.exists() || !resource.isReadable()) throw new IOException("Missing logo");
            return new StoredLogo(resource, values[1], values[2]);
          } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el logo", exception);
          }
        }).orElseThrow(() -> notFound(id));
  }

  private BreweryDto toDto(ResultSet rs, int row) throws SQLException {
    String id = rs.getString("id");
    String storedName = rs.getString("logo_stored_name");
    return new BreweryDto(id, rs.getString("name"), rs.getString("untappd_url"),
        storedName == null ? null : "/api/breweries/" + id + "/logo",
        (Integer) rs.getObject("logo_width"), (Integer) rs.getObject("logo_height"),
        rs.getObject("updated_at", java.time.OffsetDateTime.class));
  }

  private ImageInfo inspect(MultipartFile file) {
    try (InputStream input = file.getInputStream(); ImageInputStream imageInput = ImageIO.createImageInputStream(input)) {
      if (imageInput == null) throw new IOException("Invalid image");
      Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInput);
      if (!readers.hasNext()) throw new IOException("Unknown image format");
      ImageReader reader = readers.next();
      try {
        reader.setInput(imageInput, true, true);
        String format = reader.getFormatName().toLowerCase(Locale.ROOT);
        int width = reader.getWidth(0);
        int height = reader.getHeight(0);
        if (!ALLOWED_FORMATS.contains(format) || width <= 0 || height <= 0 || width > MAX_DIMENSION || height > MAX_DIMENSION) {
          throw new IOException("Unsupported image");
        }
        return new ImageInfo(format, "png".equals(format) ? "image/png" : "image/jpeg", width, height);
      } finally { reader.dispose(); }
    } catch (IOException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se admiten logos JPG o PNG de hasta 4000 × 4000 px", exception);
    }
  }

  private String safeOriginalName(String name) {
    String base = name == null || name.isBlank() ? "logo" : Path.of(name).getFileName().toString();
    String sanitized = base.replaceAll("[^\\p{L}\\p{N}._ -]", "_");
    return sanitized.substring(0, Math.min(180, sanitized.length()));
  }

  private Path resolveStoredName(String storedName) {
    Path resolved = storagePath.resolve(storedName).normalize();
    if (!resolved.startsWith(storagePath)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ruta de logo no válida");
    return resolved;
  }

  private String blank(String value) { return value == null ? "" : value.trim(); }
  private ResponseStatusException notFound(String id) { return new ResponseStatusException(HttpStatus.NOT_FOUND, "Brewery no encontrada: " + id); }
  private record ImageInfo(String format, String contentType, int width, int height) {}
  public record StoredLogo(Resource resource, String contentType, String originalName) {}
}
