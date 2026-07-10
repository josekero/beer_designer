package com.beerdesigner.catalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface YeastRepository extends JpaRepository<Yeast, String> {
  List<Yeast> findAllByOrderByNameAsc();
}
