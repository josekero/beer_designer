package com.beerdesigner.catalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HopRepository extends JpaRepository<Hop, String> {
  List<Hop> findAllByOrderByNameAsc();
}
