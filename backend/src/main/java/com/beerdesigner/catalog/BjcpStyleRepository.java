package com.beerdesigner.catalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BjcpStyleRepository extends JpaRepository<BjcpStyle, String> {
  List<BjcpStyle> findAllByOrderByCodeAsc();
}
