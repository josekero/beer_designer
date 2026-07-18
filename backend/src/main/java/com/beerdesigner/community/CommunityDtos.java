package com.beerdesigner.community;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import com.beerdesigner.recipe.RecipeDtos.RecipeDetailDto;

public final class CommunityDtos {
  private CommunityDtos() {}

  public record CommunityRecipe(String id, String name, String brewer, String styleId,
      BigDecimal batchVolumeL, String glasswareId, BigDecimal srm, String notes,
      Integer version, OffsetDateTime updatedAt,
      String authorName, String authorAvatarKind, String authorAvatarValue,
      boolean publicRecipe, boolean template, long likeCount, long copyCount,
      boolean likedByCurrentUser) {}
  public record CommunityRecipePage(List<CommunityRecipe> items, long totalElements,
      int page, int size, int totalPages) {}
  public record CommunityRecipeDetail(RecipeDetailDto recipe) {}
  public record RecipeEngagement(long likeCount, long copyCount, boolean likedByCurrentUser) {}
  public record CommunityCopyResult(String id, long copyCount) {}
  public record CommunityMember(String displayName, String avatarKind, String avatarValue,
      OffsetDateTime joinedAt) {}
  public record CommunityIngredient(String type, String id, String name, String brand,
      String description, String detail, OffsetDateTime publishedAt, String authorName,
      String authorAvatarKind, String authorAvatarValue, boolean ownedByCurrentUser,
      boolean publicIngredient) {}
  public record CommunityView(List<CommunityRecipe> latestRecipes, List<CommunityRecipe> templates,
      List<CommunityRecipe> myRecipes, List<CommunityIngredient> sharedIngredients,
      List<CommunityIngredient> myIngredients, List<CommunityMember> recentMembers,
      long memberCount, long activeUsers, long publicRecipeCount, long templateCount,
      long sharedIngredientCount) {}
  public record VisibilityRequest(boolean publicRecipe) {}
  public record LikeRequest(boolean liked) {}
  public record IngredientVisibilityRequest(boolean publicIngredient) {}
}
