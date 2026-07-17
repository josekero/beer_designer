package com.beerdesigner.catalog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface EquipmentProfileRepository extends JpaRepository<EquipmentProfile,String>{
  @org.springframework.data.jpa.repository.Query("select p from EquipmentProfile p where p.ownerId is null or p.ownerId=:owner order by p.name")
  List<EquipmentProfile> findVisible(@org.springframework.data.repository.query.Param("owner") java.util.UUID owner);
  java.util.Optional<EquipmentProfile> findByIdAndOwnerId(String id, java.util.UUID ownerId);
}
