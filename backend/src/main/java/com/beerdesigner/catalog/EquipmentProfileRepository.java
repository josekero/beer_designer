package com.beerdesigner.catalog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface EquipmentProfileRepository extends JpaRepository<EquipmentProfile,String>{List<EquipmentProfile> findAllByOrderByNameAsc();}
