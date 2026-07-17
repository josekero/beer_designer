//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.recipe;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecipeRepository extends JpaRepository<Recipe, String> {
  List<Recipe> findAllByOwnerIdOrderByNameAsc(UUID ownerId);
  Optional<Recipe> findByIdAndOwnerId(String id, UUID ownerId);
  boolean existsByIdAndOwnerId(String id, UUID ownerId);
}
