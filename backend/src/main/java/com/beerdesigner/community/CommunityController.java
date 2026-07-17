package com.beerdesigner.community;

import com.beerdesigner.community.CommunityDtos.CommunityView;
import com.beerdesigner.community.CommunityDtos.VisibilityRequest;
import com.beerdesigner.community.CommunityDtos.IngredientVisibilityRequest;
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

@RestController
@RequestMapping("/api/community")
public class CommunityController {
  private final CommunityService community;
  public CommunityController(CommunityService community) { this.community = community; }
  @GetMapping public CommunityView view() { return community.view(); }
  @PutMapping("/recipes/{id}/visibility") @ResponseStatus(HttpStatus.NO_CONTENT)
  public void visibility(@PathVariable String id, @RequestBody VisibilityRequest request) {
    community.visibility(id, request.publicRecipe());
  }
  @PostMapping("/recipes/{id}/copy") @ResponseStatus(HttpStatus.CREATED)
  public Map<String,String> copy(@PathVariable String id) { return Map.of("id", community.copy(id)); }
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
