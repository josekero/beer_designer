package com.beerdesigner.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "malts")
public class Malt {
  @Id
  private String id;
  private String name;
  private String type;
  private BigDecimal potential;
  @Column(name = "color_srm")
  private BigDecimal colorSrm;
  @Column(name = "diastatic_power")
  private BigDecimal diastaticPower;
  @Column(name = "max_recommended_percent")
  private BigDecimal maxRecommendedPercent;
  private String description;

  public String getId() { return id; }
  public String getName() { return name; }
  public String getType() { return type; }
  public BigDecimal getPotential() { return potential; }
  public BigDecimal getColorSrm() { return colorSrm; }
  public BigDecimal getDiastaticPower() { return diastaticPower; }
  public BigDecimal getMaxRecommendedPercent() { return maxRecommendedPercent; }
  public String getDescription() { return description; }
}
