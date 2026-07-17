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
import java.util.UUID;

@Entity
@Table(name = "malts")
public class Malt {
  @Id
  private String id;
  @Column(name = "owner_id") private UUID ownerId;
  private String name;
  private String brand;
  private String type;
  private BigDecimal potential;
  @Column(name = "color_srm")
  private BigDecimal colorSrm;
  @Column(name = "diastatic_power")
  private BigDecimal diastaticPower;
  @Column(name = "max_recommended_percent")
  private BigDecimal maxRecommendedPercent;
  private String description;
  @Column(name = "image_url")
  private String imageUrl;
  @Column(name = "distributor_name")
  private String distributorName;
  @Column(name = "distributor_url")
  private String distributorUrl;

  public String getId() { return id; }
  public UUID getOwnerId() { return ownerId; }
  public String getName() { return name; }
  public String getBrand() { return brand; }
  public String getType() { return type; }
  public BigDecimal getPotential() { return potential; }
  public BigDecimal getColorSrm() { return colorSrm; }
  public BigDecimal getDiastaticPower() { return diastaticPower; }
  public BigDecimal getMaxRecommendedPercent() { return maxRecommendedPercent; }
  public String getDescription() { return description; }
  public String getImageUrl() { return imageUrl; }
  public String getDistributorName() { return distributorName; }
  public String getDistributorUrl() { return distributorUrl; }
}
