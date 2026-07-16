//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.catalog;

import com.beerdesigner.catalog.CatalogDtos.AdjunctDto;
import com.beerdesigner.catalog.CatalogDtos.AgingIngredientDto;
import com.beerdesigner.catalog.CatalogDtos.BrewingSaltDto;
import com.beerdesigner.catalog.CatalogDtos.HopDto;
import com.beerdesigner.catalog.CatalogDtos.ImportResultDto;
import com.beerdesigner.catalog.CatalogDtos.IngredientStockDto;
import com.beerdesigner.catalog.CatalogDtos.MaltDto;
import com.beerdesigner.catalog.CatalogDtos.YeastDto;
import java.util.List;
import java.util.Comparator;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
  private final BjcpStyleRepository styleRepository;
  private final HopRepository hopRepository;
  private final MaltRepository maltRepository;
  private final YeastRepository yeastRepository;
  private final AdjunctRepository adjunctRepository;
  private final AgingIngredientRepository agingIngredientRepository;
  private final WaterProfileRepository waterProfileRepository;
  private final CatalogWriteService catalogWriteService;
  private final BrewingSaltRepository saltRepository;

  public CatalogController(
      BjcpStyleRepository styleRepository,
      HopRepository hopRepository,
      MaltRepository maltRepository,
      YeastRepository yeastRepository,
      AdjunctRepository adjunctRepository,
      AgingIngredientRepository agingIngredientRepository,
      WaterProfileRepository waterProfileRepository,
      CatalogWriteService catalogWriteService,BrewingSaltRepository saltRepository
  ) {
    this.styleRepository = styleRepository;
    this.hopRepository = hopRepository;
    this.maltRepository = maltRepository;
    this.yeastRepository = yeastRepository;
    this.adjunctRepository = adjunctRepository;
    this.agingIngredientRepository = agingIngredientRepository;
    this.waterProfileRepository = waterProfileRepository;
    this.catalogWriteService = catalogWriteService;
    this.saltRepository=saltRepository;
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

  @PutMapping("/hops/{id}")
  public HopDto saveHop(@PathVariable String id, @RequestBody HopDto hop) {
    return catalogWriteService.saveHop(id, hop);
  }

  @PostMapping(path = "/hops/import-xml", consumes = { "application/xml", "text/xml", "text/plain" })
  public ImportResultDto importHopsXml(@RequestBody String xml) {
    return catalogWriteService.importHopsXml(xml);
  }

  @GetMapping("/malts")
  public List<Malt> malts() {
    return maltRepository.findAllByOrderByNameAsc();
  }

  @PutMapping("/malts/{id}")
  public MaltDto saveMalt(@PathVariable String id, @RequestBody MaltDto malt) {
    return catalogWriteService.saveMalt(id, malt);
  }

  @PostMapping(path = "/malts/import-xml", consumes = { "application/xml", "text/xml", "text/plain" })
  public ImportResultDto importMaltsXml(@RequestBody String xml) {
    return catalogWriteService.importMaltsXml(xml);
  }

  @GetMapping("/yeasts")
  public List<Yeast> yeasts() {
    return yeastRepository.findAllByOrderByNameAsc();
  }

  @PutMapping("/yeasts/{id}")
  public YeastDto saveYeast(@PathVariable String id, @RequestBody YeastDto yeast) {
    return catalogWriteService.saveYeast(id, yeast);
  }

  @PostMapping(path = "/yeasts/import-xml", consumes = { "application/xml", "text/xml", "text/plain" })
  public ImportResultDto importYeastsXml(@RequestBody String xml) {
    return catalogWriteService.importYeastsXml(xml);
  }

  @GetMapping("/adjuncts")
  public List<Adjunct> adjuncts() {
    return adjunctRepository.findAllByOrderByNameAsc();
  }

  @PutMapping("/adjuncts/{id}")
  public AdjunctDto saveAdjunct(@PathVariable String id, @RequestBody AdjunctDto adjunct) {
    return catalogWriteService.saveAdjunct(id, adjunct);
  }

  @PostMapping(path = "/adjuncts/import-xml", consumes = { "application/xml", "text/xml", "text/plain" })
  public ImportResultDto importAdjunctsXml(@RequestBody String xml) {
    return catalogWriteService.importAdjunctsXml(xml);
  }

  @GetMapping("/aging")
  public List<AgingIngredient> agingIngredients() {
    return agingIngredientRepository.findAllByOrderByNameAsc();
  }

  @PutMapping("/aging/{id}")
  public AgingIngredientDto saveAgingIngredient(@PathVariable String id, @RequestBody AgingIngredientDto agingIngredient) {
    return catalogWriteService.saveAgingIngredient(id, agingIngredient);
  }

  @PostMapping(path = "/aging/import-xml", consumes = { "application/xml", "text/xml", "text/plain" })
  public ImportResultDto importAgingIngredientsXml(@RequestBody String xml) {
    return catalogWriteService.importAgingIngredientsXml(xml);
  }

  @GetMapping("/water-profiles")
  public List<WaterProfile> waterProfiles() {
    return waterProfileRepository.findAllByOrderByNameAsc();
  }
  @GetMapping("/salts")
  public List<BrewingSaltDto> salts() {
    return saltRepository.findAllByOrderByNameAsc().stream()
        .map(BrewingSaltDto::from)
        .toList();
  }

  @PutMapping("/salts/{id}")
  public BrewingSaltDto saveSalt(@PathVariable String id, @RequestBody BrewingSaltDto salt) {
    return catalogWriteService.saveSalt(id, salt);
  }

  @GetMapping("/stock")
  public List<IngredientStockDto> ingredientStock() {
    return catalogWriteService.findIngredientStock();
  }

  @PutMapping("/stock/{type}/{id}")
  public IngredientStockDto saveIngredientStock(
      @PathVariable String type,
      @PathVariable String id,
      @RequestBody IngredientStockDto stock
  ) {
    return catalogWriteService.saveIngredientStock(type, id, stock);
  }

  private int styleCodeNumber(String code) {
    if (code.startsWith("C")) return 100 + Integer.parseInt(code.substring(1, 2));
    String digits = code.replaceAll("\\D.*$", "");
    return digits.isEmpty() ? 0 : Integer.parseInt(digits);
  }
}
