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
@Table(name = "hops")
public class Hop {
  @Id
  private String id;
  @Column(name = "owner_id") private UUID ownerId;
  private String name;
  private String brand;
  private String country;
  @Column(name = "alpha_acids")
  private BigDecimal alphaAcids;
  @Column(name = "beta_acids")
  private BigDecimal betaAcids;
  private String format;
  @Column(name = "recommended_use", columnDefinition = "text[]")
  private String[] recommendedUse;
  @Column(columnDefinition = "text[]")
  private String[] aromas;
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
  public String getCountry() { return country; }
  public BigDecimal getAlphaAcids() { return alphaAcids; }
  public BigDecimal getBetaAcids() { return betaAcids; }
  public String getFormat() { return format; }
  public String[] getRecommendedUse() { return recommendedUse; }
  public String[] getAromas() { return aromas; }
  public String getDescription() { return description; }
  public String getImageUrl() { return imageUrl; }
  public String getDistributorName() { return distributorName; }
  public String getDistributorUrl() { return distributorUrl; }
}
