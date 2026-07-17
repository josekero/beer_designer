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
import java.util.UUID;

@Entity
@Table(name = "aging_ingredients")
public class AgingIngredient {
  @Id
  private String id;
  @Column(name = "owner_id") private UUID ownerId;
  private String name;
  private String brand;
  private String type;
  @Column(name = "wood_type")
  private String woodType;
  @Column(name = "previous_use")
  private String previousUse;
  private String origin;
  @Column(name = "barrel_details")
  private String barrelDetails;
  private String intensity;
  @Column(name = "contact_time_days_min")
  private Integer contactTimeDaysMin;
  @Column(name = "contact_time_days_max")
  private Integer contactTimeDaysMax;
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
  public String getWoodType() { return woodType; }
  public String getPreviousUse() { return previousUse; }
  public String getOrigin() { return origin; }
  public String getBarrelDetails() { return barrelDetails; }
  public String getIntensity() { return intensity; }
  public Integer getContactTimeDaysMin() { return contactTimeDaysMin; }
  public Integer getContactTimeDaysMax() { return contactTimeDaysMax; }
  public String getDescription() { return description; }
  public String getImageUrl() { return imageUrl; }
  public String getDistributorName() { return distributorName; }
  public String getDistributorUrl() { return distributorUrl; }
}
