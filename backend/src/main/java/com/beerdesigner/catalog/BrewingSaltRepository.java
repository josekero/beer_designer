package com.beerdesigner.catalog;
import java.util.List; import java.util.UUID; import org.springframework.data.jpa.repository.JpaRepository; import org.springframework.data.jpa.repository.Query; import org.springframework.data.repository.query.Param;
public interface BrewingSaltRepository extends JpaRepository<BrewingSalt,String>{
 @Query("select i from BrewingSalt i where i.ownerId is null or i.ownerId=:owner order by i.name") List<BrewingSalt> findVisible(@Param("owner") UUID owner);
}
