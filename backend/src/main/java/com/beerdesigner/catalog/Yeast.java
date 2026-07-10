package com.beerdesigner.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "yeasts")
public class Yeast {
  @Id
  private String id;
  private String name;
  private String laboratory;
  private String type;
  @Column(name = "attenuation_min")
  private BigDecimal attenuationMin;
  @Column(name = "attenuation_max")
  private BigDecimal attenuationMax;
  @Column(name = "temperature_min")
  private BigDecimal temperatureMin;
  @Column(name = "temperature_max")
  private BigDecimal temperatureMax;
  private String flocculation;
  @Column(name = "alcohol_tolerance")
  private BigDecimal alcoholTolerance;
  @Column(name = "sensory_profile")
  private String sensoryProfile;

  public String getId() { return id; }
  public String getName() { return name; }
  public String getLaboratory() { return laboratory; }
  public String getType() { return type; }
  public BigDecimal getAttenuationMin() { return attenuationMin; }
  public BigDecimal getAttenuationMax() { return attenuationMax; }
  public BigDecimal getTemperatureMin() { return temperatureMin; }
  public BigDecimal getTemperatureMax() { return temperatureMax; }
  public String getFlocculation() { return flocculation; }
  public BigDecimal getAlcoholTolerance() { return alcoholTolerance; }
  public String getSensoryProfile() { return sensoryProfile; }
}
