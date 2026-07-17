package com.beerdesigner.community;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public final class CommunityDtos {
  private CommunityDtos() {}

  public record CommunityRecipe(String id, String name, String brewer, String styleId,
      BigDecimal batchVolumeL, String notes, Integer version, OffsetDateTime updatedAt,
      String authorName, String authorAvatarKind, String authorAvatarValue,
      boolean publicRecipe, boolean template) {}
  public record CommunityMember(String displayName, String avatarKind, String avatarValue,
      OffsetDateTime joinedAt) {}
  public record CommunityIngredient(String type, String id, String name, String brand,
      String description, String detail, OffsetDateTime publishedAt, String authorName,
      String authorAvatarKind, String authorAvatarValue, boolean ownedByCurrentUser,
      boolean publicIngredient) {}
  public record CommunityView(List<CommunityRecipe> latestRecipes, List<CommunityRecipe> templates,
      List<CommunityRecipe> myRecipes, List<CommunityIngredient> sharedIngredients,
      List<CommunityIngredient> myIngredients, List<CommunityMember> recentMembers,
      long memberCount, long activeUsers) {}
  public record VisibilityRequest(boolean publicRecipe) {}
  public record IngredientVisibilityRequest(boolean publicIngredient) {}
}
