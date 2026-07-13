package com.beerdesigner.recipe;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beerdesigner.recipe.RecipeDtos.RecipeDetailDto;
import com.beerdesigner.recipe.RecipeDtos.RecipeImageDto;
import com.beerdesigner.recipe.RecipeDtos.RecipeSummaryDto;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

class RecipeControllerTest {
  private final RecipeRepository repository = mock(RecipeRepository.class);
  private final RecipeMapper mapper = mock(RecipeMapper.class);
  private final RecipeWriteService writeService = mock(RecipeWriteService.class);
  private final RecipeImageService imageService = mock(RecipeImageService.class);
  private final RecipeDeletionService deletionService = mock(RecipeDeletionService.class);
  private final RecipeController controller = new RecipeController(repository, mapper, writeService, imageService, deletionService);

  @Test
  void listsAndFindsRecipesThroughTheMapper() {
    Recipe entity = mock(Recipe.class);
    RecipeSummaryDto summary = mock(RecipeSummaryDto.class);
    RecipeDetailDto detail = mock(RecipeDetailDto.class);
    when(repository.findAllByOrderByNameAsc()).thenReturn(List.of(entity));
    when(repository.findById("recipe-1")).thenReturn(Optional.of(entity));
    when(mapper.toSummary(entity)).thenReturn(summary);
    when(mapper.toDetail(entity)).thenReturn(detail);

    assertThat(controller.recipes()).containsExactly(summary);
    assertThat(controller.recipe("recipe-1")).isSameAs(detail);
    assertThatThrownBy(() -> controller.recipe("missing")).isInstanceOf(RecipeNotFoundException.class);
  }

  @Test
  void createsAndUpdatesUsingTheRouteIdentifier() {
    Recipe entity = mock(Recipe.class);
    RecipeDetailDto request = mock(RecipeDetailDto.class);
    RecipeDetailDto response = mock(RecipeDetailDto.class);
    when(request.id()).thenReturn("body-id");
    when(repository.findById("body-id")).thenReturn(Optional.of(entity));
    when(repository.findById("route-id")).thenReturn(Optional.of(entity));
    when(mapper.toDetail(entity)).thenReturn(response);

    assertThat(controller.create(request)).isSameAs(response);
    assertThat(controller.update("route-id", request)).isSameAs(response);
    verify(writeService).save("body-id", request);
    verify(writeService).save("route-id", request);
  }

  @Test
  void uploadsAndServesImagesWithSafeResponseHeaders() {
    MultipartFile file = mock(MultipartFile.class);
    RecipeImageDto imageDto = mock(RecipeImageDto.class);
    var resource = new ByteArrayResource(new byte[] {1, 2, 3});
    when(imageService.store("recipe-1", file)).thenReturn(imageDto);
    when(imageService.load("recipe-1")).thenReturn(new RecipeImageService.StoredImage(resource, "image/png", "etiqueta.png"));

    assertThat(controller.uploadImage("recipe-1", file)).isSameAs(imageDto);
    var response = controller.image("recipe-1");
    assertThat(response.getBody()).isSameAs(resource);
    assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.IMAGE_PNG);
    assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION)).contains("inline").contains("etiqueta.png");
    assertThat(response.getHeaders().getCacheControl()).contains("no-cache");
  }

  @Test
  void delegatesDeletion() {
    controller.delete("recipe-1");
    verify(deletionService).delete("recipe-1");
  }
}
