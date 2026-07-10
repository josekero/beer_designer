//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

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
  private String brand;
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
  @Column(name = "image_url")
  private String imageUrl;
  @Column(name = "distributor_name")
  private String distributorName;
  @Column(name = "distributor_url")
  private String distributorUrl;

  public String getId() { return id; }
  public String getName() { return name; }
  public String getBrand() { return brand; }
  public String getLaboratory() { return laboratory; }
  public String getType() { return type; }
  public BigDecimal getAttenuationMin() { return attenuationMin; }
  public BigDecimal getAttenuationMax() { return attenuationMax; }
  public BigDecimal getTemperatureMin() { return temperatureMin; }
  public BigDecimal getTemperatureMax() { return temperatureMax; }
  public String getFlocculation() { return flocculation; }
  public BigDecimal getAlcoholTolerance() { return alcoholTolerance; }
  public String getSensoryProfile() { return sensoryProfile; }
  public String getImageUrl() { return imageUrl; }
  public String getDistributorName() { return distributorName; }
  public String getDistributorUrl() { return distributorUrl; }
}
