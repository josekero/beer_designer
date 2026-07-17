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

public interface YeastRepository extends JpaRepository<Yeast, String> {
  @Query("select i from Yeast i where i.ownerId is null or i.ownerId=:owner order by i.name")
  List<Yeast> findVisible(@Param("owner") UUID owner);
}
