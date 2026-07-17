//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.catalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;

public interface HopRepository extends JpaRepository<Hop, String> {
  @Query("select i from Hop i where i.ownerId is null or i.ownerId=:owner order by i.name")
  List<Hop> findVisible(@Param("owner") UUID owner);
}
