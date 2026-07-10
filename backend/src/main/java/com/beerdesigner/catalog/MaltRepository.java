package com.beerdesigner.catalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MaltRepository extends JpaRepository<Malt, String> {
  List<Malt> findAllByOrderByNameAsc();
}
