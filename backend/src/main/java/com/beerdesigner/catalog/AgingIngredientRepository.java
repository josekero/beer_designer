//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.catalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgingIngredientRepository extends JpaRepository<AgingIngredient, String> {
  List<AgingIngredient> findAllByOrderByNameAsc();
}
