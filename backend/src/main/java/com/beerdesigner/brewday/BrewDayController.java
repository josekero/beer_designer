//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.brewday;

import com.beerdesigner.brewday.BrewDayDtos.BrewDayDto;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/brew-days")
public class BrewDayController {
  private final BrewDayService brewDayService;

  public BrewDayController(BrewDayService brewDayService) {
    this.brewDayService = brewDayService;
  }

  @GetMapping
  public List<BrewDayDto> brewDays(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
  ) {
    return brewDayService.findBetween(from, to);
  }

  @GetMapping("/{id}")
  public BrewDayDto brewDay(@PathVariable String id) {
    return brewDayService.findById(id);
  }

  @PutMapping("/{id}")
  public BrewDayDto save(@PathVariable String id, @RequestBody BrewDayDto brewDay) {
    return brewDayService.save(id, brewDay);
  }
}
