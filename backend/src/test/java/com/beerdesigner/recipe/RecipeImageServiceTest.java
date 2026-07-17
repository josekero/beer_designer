package com.beerdesigner.recipe;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

class RecipeImageServiceTest {
  @TempDir Path storage;

  @BeforeEach void authenticate() { com.beerdesigner.TestSecurity.asUser(); }
  @AfterEach void clearAuthentication() { com.beerdesigner.TestSecurity.clear(); }

  @Test
  void rejectsEmptyAndOversizedImages() {
    RecipeRepository repository = repositoryWith(new Recipe());
    RecipeImageService service = service(repository);

    assertBadRequest(() -> service.store("recipe-1", new MockMultipartFile("file", new byte[0])));
    assertBadRequest(() -> service.store("recipe-1", new MockMultipartFile("file", new byte[5 * 1024 * 1024 + 1])));
  }

  @Test
  void rejectsContentThatIsNotARealJpegOrPng() {
    RecipeImageService service = service(repositoryWith(new Recipe()));
    MockMultipartFile text = new MockMultipartFile("file", "label.png", "image/png", "not an image".getBytes());

    assertBadRequest(() -> service.store("recipe-1", text));
  }

  @Test
  void reportsRecipesWithoutAnImage() {
    RecipeImageService service = service(repositoryWith(new Recipe()));

    assertThatThrownBy(() -> service.load("recipe-1"))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
  }

  @Test
  void loadsAnExistingImageWithItsMetadata() throws Exception {
    Recipe recipe = mock(Recipe.class);
    when(recipe.getImageStoredName()).thenReturn("existing.png");
    when(recipe.getImageContentType()).thenReturn("image/png");
    when(recipe.getImageOriginalName()).thenReturn("my-label.png");
    Files.write(storage.resolve("existing.png"), new byte[] {1, 2, 3});
    RecipeImageService service = service(repositoryWith(recipe));

    var image = service.load("recipe-1");

    assertThat(image.resource().exists()).isTrue();
    assertThat(image.contentType()).isEqualTo("image/png");
    assertThat(image.originalName()).isEqualTo("my-label.png");
  }

  @Test
  void reportsUnknownRecipes() {
    RecipeRepository repository = mock(RecipeRepository.class);
    when(repository.findByIdAndOwnerId("missing", com.beerdesigner.TestSecurity.USER_ID)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service(repository).load("missing"))
        .isInstanceOf(RecipeNotFoundException.class);
  }

  private RecipeImageService service(RecipeRepository repository) {
    return new RecipeImageService(storage.toString(), mock(JdbcTemplate.class), repository);
  }

  private RecipeRepository repositoryWith(Recipe recipe) {
    RecipeRepository repository = mock(RecipeRepository.class);
    when(repository.findByIdAndOwnerId("recipe-1", com.beerdesigner.TestSecurity.USER_ID)).thenReturn(Optional.of(recipe));
    return repository;
  }

  private void assertBadRequest(org.assertj.core.api.ThrowableAssert.ThrowingCallable operation) {
    assertThatThrownBy(operation)
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
  }
}
