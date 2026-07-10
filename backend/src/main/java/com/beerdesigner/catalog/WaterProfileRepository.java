//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.catalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WaterProfileRepository extends JpaRepository<WaterProfile, String> {
  List<WaterProfile> findAllByOrderByNameAsc();
}
