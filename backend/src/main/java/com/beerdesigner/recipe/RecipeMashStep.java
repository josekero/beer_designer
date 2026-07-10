//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

package com.beerdesigner.recipe;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "recipe_mash_steps")
public class RecipeMashStep {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "recipe_id")
  private Recipe recipe;
  private String name;
  @Column(name = "temperature_c")
  private BigDecimal temperatureC;
  @Column(name = "time_min")
  private Integer timeMin;
  private Integer position;

  public String getName() { return name; }
  public BigDecimal getTemperatureC() { return temperatureC; }
  public Integer getTimeMin() { return timeMin; }
  public Integer getPosition() { return position; }
}
