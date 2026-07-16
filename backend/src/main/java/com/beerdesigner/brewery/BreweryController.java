package com.beerdesigner.brewery;

import com.beerdesigner.brewery.BreweryDtos.BreweryDto;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/breweries")
public class BreweryController {
  private final BreweryService service;

  public BreweryController(BreweryService service) { this.service = service; }

  @GetMapping public List<BreweryDto> breweries() { return service.findAll(); }
  @PutMapping("/{id}") public BreweryDto save(@PathVariable String id, @RequestBody BreweryDto brewery) { return service.save(id, brewery); }
  @DeleteMapping("/{id}") public void delete(@PathVariable String id) { service.delete(id); }
  @PostMapping(path = "/{id}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public BreweryDto uploadLogo(@PathVariable String id, @RequestParam("file") MultipartFile file) { return service.storeLogo(id, file); }

  @GetMapping("/{id}/logo")
  public ResponseEntity<Resource> logo(@PathVariable String id) {
    var logo = service.loadLogo(id);
    return ResponseEntity.ok().contentType(MediaType.parseMediaType(logo.contentType()))
        .cacheControl(CacheControl.noCache())
        .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(logo.originalName()).build().toString())
        .body(logo.resource());
  }
}
