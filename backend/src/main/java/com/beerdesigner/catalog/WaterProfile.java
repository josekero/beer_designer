package com.beerdesigner.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "water_profiles")
public class WaterProfile {
  @Id
  private String id;
  private String name;
  private BigDecimal calcium;
  private BigDecimal magnesium;
  private BigDecimal sodium;
  private BigDecimal sulfate;
  private BigDecimal chloride;
  private BigDecimal bicarbonate;
  @Column(name = "target_ph")
  private BigDecimal targetPh;
  private String description;

  public String getId() { return id; }
  public String getName() { return name; }
  public BigDecimal getCalcium() { return calcium; }
  public BigDecimal getMagnesium() { return magnesium; }
  public BigDecimal getSodium() { return sodium; }
  public BigDecimal getSulfate() { return sulfate; }
  public BigDecimal getChloride() { return chloride; }
  public BigDecimal getBicarbonate() { return bicarbonate; }
  public BigDecimal getTargetPh() { return targetPh; }
  public String getDescription() { return description; }
}
