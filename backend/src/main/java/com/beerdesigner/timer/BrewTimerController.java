package com.beerdesigner.timer;

import com.beerdesigner.timer.BrewTimerDtos.BrewTimerConfiguration;
import com.beerdesigner.timer.BrewTimerDtos.BrewTimerDto;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/timers")
public class BrewTimerController {
  private final BrewTimerService timers;

  public BrewTimerController(BrewTimerService timers) { this.timers = timers; }

  @GetMapping
  public BrewTimerConfiguration configuration() { return timers.configuration(); }

  @PutMapping
  public BrewTimerConfiguration save(@RequestBody List<BrewTimerDto> configuration) {
    return timers.save(configuration);
  }
}
