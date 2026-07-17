package com.beerdesigner.recipe;

import com.beerdesigner.auth.UserContext;
import com.beerdesigner.recipe.RecipeDtos.RecipeImageDto;
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
public class RecipeImageService {
  private static final long MAX_BYTES = 5L * 1024 * 1024;
  private static final int MAX_DIMENSION = 6000;
  private static final Set<String> ALLOWED_FORMATS = Set.of("jpeg", "jpg", "png");
  private final Path storagePath;
  private final JdbcTemplate jdbcTemplate;
  private final RecipeRepository recipeRepository;

  public RecipeImageService(@Value("${beer-designer.image-storage-path}") String path, JdbcTemplate jdbcTemplate, RecipeRepository recipeRepository) {
    storagePath = Path.of(path).toAbsolutePath().normalize();
    this.jdbcTemplate = jdbcTemplate;
    this.recipeRepository = recipeRepository;
    try {
      Files.createDirectories(storagePath);
    } catch (IOException exception) {
      throw new IllegalStateException("Could not initialize recipe image storage", exception);
    }
  }

  public RecipeImageDto store(String recipeId, MultipartFile file) {
    Recipe recipe = ownedRecipe(recipeId);
    if (file.isEmpty() || file.getSize() > MAX_BYTES) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La imagen debe pesar como máximo 5 MB");
    }
    ImageInfo info = inspect(file);
    String storedName = UUID.randomUUID() + (info.format.equals("png") ? ".png" : ".jpg");
    Path target = storagePath.resolve(storedName);
    try (InputStream input = file.getInputStream()) {
      Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
      jdbcTemplate.update("""
          UPDATE recipes SET image_stored_name = ?, image_original_name = ?, image_content_type = ?,
          image_size_bytes = ?, image_width = ?, image_height = ?, image_uploaded_at = now(), updated_at = now()
          WHERE id = ? AND owner_id = ?
          """, storedName, safeOriginalName(file.getOriginalFilename()), info.contentType, file.getSize(), info.width, info.height, recipeId, UserContext.userId());
      if (recipe.getImageStoredName() != null) Files.deleteIfExists(storagePath.resolve(recipe.getImageStoredName()));
    } catch (IOException exception) {
      try { Files.deleteIfExists(target); } catch (IOException ignored) { }
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar la imagen", exception);
    }
    Recipe updated = ownedRecipe(recipeId);
    return new RecipeImageDto("/api/recipes/" + recipeId + "/image", updated.getImageOriginalName(), updated.getImageContentType(), updated.getImageSizeBytes(), updated.getImageWidth(), updated.getImageHeight(), updated.getImageUploadedAt());
  }

  public StoredImage load(String recipeId) {
    Recipe recipe = ownedRecipe(recipeId);
    if (recipe.getImageStoredName() == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La receta no tiene imagen");
    try {
      Resource resource = new UrlResource(storagePath.resolve(recipe.getImageStoredName()).toUri());
      if (!resource.exists() || !resource.isReadable()) throw new IOException("Image is missing");
      return new StoredImage(resource, recipe.getImageContentType(), recipe.getImageOriginalName());
    } catch (IOException exception) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el fichero de imagen", exception);
    }
  }

  private ImageInfo inspect(MultipartFile file) {
    try (InputStream input = file.getInputStream(); ImageInputStream imageInput = ImageIO.createImageInputStream(input)) {
      if (imageInput == null) throw new IOException("Invalid image");
      Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInput);
      if (!readers.hasNext()) throw new IOException("Unknown format");
      ImageReader reader = readers.next();
      try {
        reader.setInput(imageInput, true, true);
        String format = reader.getFormatName().toLowerCase(Locale.ROOT);
        int width = reader.getWidth(0);
        int height = reader.getHeight(0);
        if (!ALLOWED_FORMATS.contains(format) || width <= 0 || height <= 0 || width > MAX_DIMENSION || height > MAX_DIMENSION) throw new IOException("Unsupported image");
        return new ImageInfo(format, format.equals("png") ? "image/png" : "image/jpeg", width, height);
      } finally { reader.dispose(); }
    } catch (IOException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se admiten imágenes JPG o PNG válidas de hasta 6000 × 6000 px", exception);
    }
  }

  private Recipe ownedRecipe(String id) {
    return recipeRepository.findByIdAndOwnerId(id, UserContext.userId())
        .orElseThrow(() -> new RecipeNotFoundException(id));
  }

  private String safeOriginalName(String name) {
    String base = name == null || name.isBlank() ? "imagen" : Path.of(name).getFileName().toString();
    String sanitized = base.replaceAll("[^\\p{L}\\p{N}._ -]", "_");
    return sanitized.substring(0, Math.min(180, sanitized.length()));
  }

  private record ImageInfo(String format, String contentType, int width, int height) {}
  public record StoredImage(Resource resource, String contentType, String originalName) {}
}
