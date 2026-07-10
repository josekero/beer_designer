package com.beerdesigner.catalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WaterProfileRepository extends JpaRepository<WaterProfile, String> {
  List<WaterProfile> findAllByOrderByNameAsc();
}
