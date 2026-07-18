package com.beerdesigner.community;

import com.beerdesigner.community.CommunityDtos.CommunityView;
import com.beerdesigner.community.CommunityDtos.VisibilityRequest;
import com.beerdesigner.community.CommunityDtos.IngredientVisibilityRequest;
import com.beerdesigner.community.CommunityDtos.CommunityRecipeDetail;
import com.beerdesigner.community.CommunityDtos.CommunityRecipePage;
import com.beerdesigner.community.CommunityDtos.LikeRequest;
import com.beerdesigner.community.CommunityDtos.RecipeEngagement;
import com.beerdesigner.community.CommunityDtos.CommunityCopyResult;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/community")
public class CommunityController {
  private final CommunityService community;
  public CommunityController(CommunityService community) { this.community = community; }
  @GetMapping public CommunityView view() { return community.view(); }
  @GetMapping("/recipes")
  public CommunityRecipePage recipes(@RequestParam(defaultValue = "community") String kind,
      @RequestParam(defaultValue = "") String query,
      @RequestParam(defaultValue = "recent") String sort,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "9") int size) {
    return community.recipes(kind, query, sort, page, size);
  }
  @GetMapping("/recipes/{id}")
  public CommunityRecipeDetail recipe(@PathVariable String id) { return community.detail(id); }
  @PutMapping("/recipes/{id}/like")
  public RecipeEngagement like(@PathVariable String id, @RequestBody LikeRequest request) {
    return community.like(id, request.liked());
  }
  @PutMapping("/recipes/{id}/visibility") @ResponseStatus(HttpStatus.NO_CONTENT)
  public void visibility(@PathVariable String id, @RequestBody VisibilityRequest request) {
    community.visibility(id, request.publicRecipe());
  }
  @PostMapping("/recipes/{id}/copy") @ResponseStatus(HttpStatus.CREATED)
  public CommunityCopyResult copy(@PathVariable String id) { return community.copy(id); }
  @PutMapping("/ingredients/{type}/{id}/visibility") @ResponseStatus(HttpStatus.NO_CONTENT)
  public void ingredientVisibility(@PathVariable String type, @PathVariable String id,
      @RequestBody IngredientVisibilityRequest request) {
    community.ingredientVisibility(type, id, request.publicIngredient());
  }
  @PostMapping("/ingredients/{type}/{id}/copy") @ResponseStatus(HttpStatus.CREATED)
  public Map<String,String> copyIngredient(@PathVariable String type, @PathVariable String id) {
    return Map.of("id", community.copyIngredient(type, id));
  }
}
