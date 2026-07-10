//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.catalog;

import java.util.List;
import java.util.Comparator;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
  private final BjcpStyleRepository styleRepository;
  private final HopRepository hopRepository;
  private final MaltRepository maltRepository;
  private final YeastRepository yeastRepository;
  private final WaterProfileRepository waterProfileRepository;

  public CatalogController(
      BjcpStyleRepository styleRepository,
      HopRepository hopRepository,
      MaltRepository maltRepository,
      YeastRepository yeastRepository,
      WaterProfileRepository waterProfileRepository
  ) {
    this.styleRepository = styleRepository;
    this.hopRepository = hopRepository;
    this.maltRepository = maltRepository;
    this.yeastRepository = yeastRepository;
    this.waterProfileRepository = waterProfileRepository;
  }

  @GetMapping("/bjcp-styles")
  public List<BjcpStyle> styles() {
    return styleRepository.findAll().stream()
        .sorted(Comparator
            .comparingInt((BjcpStyle style) -> styleCodeNumber(style.getCode()))
            .thenComparing(BjcpStyle::getCode))
        .toList();
  }

  @GetMapping("/hops")
  public List<Hop> hops() {
    return hopRepository.findAllByOrderByNameAsc();
  }

  @GetMapping("/malts")
  public List<Malt> malts() {
    return maltRepository.findAllByOrderByNameAsc();
  }

  @GetMapping("/yeasts")
  public List<Yeast> yeasts() {
    return yeastRepository.findAllByOrderByNameAsc();
  }

  @GetMapping("/water-profiles")
  public List<WaterProfile> waterProfiles() {
    return waterProfileRepository.findAllByOrderByNameAsc();
  }

  private int styleCodeNumber(String code) {
    String digits = code.replaceAll("\\D.*$", "");
    return digits.isEmpty() ? 0 : Integer.parseInt(digits);
  }
}
