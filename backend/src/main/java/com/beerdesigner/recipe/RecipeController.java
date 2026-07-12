//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.recipe;

import com.beerdesigner.recipe.RecipeDtos.RecipeDetailDto;
import com.beerdesigner.recipe.RecipeDtos.RecipeSummaryDto;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/recipes")
public class RecipeController {
  private final RecipeRepository recipeRepository;
  private final RecipeMapper recipeMapper;
  private final RecipeWriteService recipeWriteService;
  private final RecipeImageService recipeImageService;
  private final RecipeDeletionService recipeDeletionService;

  public RecipeController(RecipeRepository recipeRepository, RecipeMapper recipeMapper, RecipeWriteService recipeWriteService, RecipeImageService recipeImageService, RecipeDeletionService recipeDeletionService) {
    this.recipeRepository = recipeRepository;
    this.recipeMapper = recipeMapper;
    this.recipeWriteService = recipeWriteService;
    this.recipeImageService = recipeImageService;
    this.recipeDeletionService = recipeDeletionService;
  }

  @GetMapping
  public List<RecipeSummaryDto> recipes() {
    return recipeRepository.findAllByOrderByNameAsc().stream()
        .map(recipeMapper::toSummary)
        .toList();
  }

  @GetMapping("/{id}")
  @Transactional(readOnly = true)
  public RecipeDetailDto recipe(@PathVariable String id) {
    return recipeRepository.findById(id)
        .map(recipeMapper::toDetail)
        .orElseThrow(() -> new RecipeNotFoundException(id));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Transactional
  public RecipeDetailDto create(@RequestBody RecipeDetailDto recipe) {
    recipeWriteService.save(recipe.id(), recipe);
    return recipe(recipe.id());
  }

  @PutMapping("/{id}")
  @Transactional
  public RecipeDetailDto update(@PathVariable String id, @RequestBody RecipeDetailDto recipe) {
    recipeWriteService.save(id, recipe);
    return recipe(id);
  }

  @PostMapping(path = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public RecipeDtos.RecipeImageDto uploadImage(@PathVariable String id, @RequestParam("file") MultipartFile file) {
    return recipeImageService.store(id, file);
  }

  @GetMapping("/{id}/image")
  public ResponseEntity<Resource> image(@PathVariable String id) {
    var image = recipeImageService.load(id);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(image.contentType()))
        .cacheControl(CacheControl.noCache())
        .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(image.originalName()).build().toString())
        .body(image.resource());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable String id) { recipeDeletionService.delete(id); }
}

@ResponseStatus(HttpStatus.NOT_FOUND)
class RecipeNotFoundException extends RuntimeException {
  RecipeNotFoundException(String id) {
    super("Recipe not found: " + id);
  }
}
