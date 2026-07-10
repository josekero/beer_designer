package com.beerdesigner.recipe;

import com.beerdesigner.recipe.RecipeDtos.RecipeDetailDto;
import com.beerdesigner.recipe.RecipeDtos.RecipeSummaryDto;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recipes")
public class RecipeController {
  private final RecipeRepository recipeRepository;
  private final RecipeMapper recipeMapper;

  public RecipeController(RecipeRepository recipeRepository, RecipeMapper recipeMapper) {
    this.recipeRepository = recipeRepository;
    this.recipeMapper = recipeMapper;
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
}

@ResponseStatus(HttpStatus.NOT_FOUND)
class RecipeNotFoundException extends RuntimeException {
  RecipeNotFoundException(String id) {
    super("Recipe not found: " + id);
  }
}
