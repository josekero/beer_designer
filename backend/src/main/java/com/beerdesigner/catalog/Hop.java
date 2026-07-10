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
@Table(name = "hops")
public class Hop {
  @Id
  private String id;
  private String name;
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

  public String getId() { return id; }
  public String getName() { return name; }
  public String getCountry() { return country; }
  public BigDecimal getAlphaAcids() { return alphaAcids; }
  public BigDecimal getBetaAcids() { return betaAcids; }
  public String getFormat() { return format; }
  public String[] getRecommendedUse() { return recommendedUse; }
  public String[] getAromas() { return aromas; }
  public String getDescription() { return description; }
  public String getImageUrl() { return imageUrl; }
}
