package com.beerdesigner.community;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.beerdesigner.community.CommunityDtos.CommunityView;
import com.beerdesigner.community.CommunityDtos.VisibilityRequest;
import com.beerdesigner.community.CommunityDtos.IngredientVisibilityRequest;
import com.beerdesigner.community.CommunityDtos.LikeRequest;
import com.beerdesigner.community.CommunityDtos.RecipeEngagement;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class CommunityControllerTest {
  @Test
  void delegatesCommunityReadsVisibilityAndCopies() {
    CommunityService service = Mockito.mock(CommunityService.class);
    CommunityView view = new CommunityView(List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), 3, 1, 2, 1, 4);
    when(service.view()).thenReturn(view);
    when(service.copy("shared")).thenReturn(new CommunityDtos.CommunityCopyResult("my-copy", 2));
    CommunityController controller = new CommunityController(service);

    assertThat(controller.view()).isEqualTo(view);
    controller.visibility("mine", new VisibilityRequest(true));
    verify(service).visibility("mine", true);
    assertThat(controller.copy("shared").id()).isEqualTo("my-copy");

    when(service.copyIngredient("hops", "shared-hop")).thenReturn("my-hop");
    controller.ingredientVisibility("hops", "mine", new IngredientVisibilityRequest(true));
    verify(service).ingredientVisibility("hops", "mine", true);
    assertThat(controller.copyIngredient("hops", "shared-hop")).containsEntry("id", "my-hop");

    RecipeEngagement engagement = new RecipeEngagement(7, 3, true);
    when(service.like("shared", true)).thenReturn(engagement);
    assertThat(controller.like("shared", new LikeRequest(true))).isEqualTo(engagement);
    verify(service).like("shared", true);
  }
}
