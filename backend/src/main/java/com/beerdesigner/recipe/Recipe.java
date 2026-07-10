package com.beerdesigner.recipe;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "recipes")
public class Recipe {
  @Id
  private String id;
  private String name;
  @Column(name = "style_id")
  private String styleId;
  @Column(name = "batch_volume_l")
  private BigDecimal batchVolumeL;
  @Column(name = "efficiency_percent")
  private BigDecimal efficiencyPercent;
  @Column(name = "boil_volume_l")
  private BigDecimal boilVolumeL;
  @Column(name = "yeast_id")
  private String yeastId;
  @Column(name = "water_profile_id")
  private String waterProfileId;
  @Column(name = "primary_days")
  private Integer primaryDays;
  @Column(name = "primary_temp_c")
  private BigDecimal primaryTempC;
  @Column(name = "secondary_days")
  private Integer secondaryDays;
  @Column(name = "secondary_temp_c")
  private BigDecimal secondaryTempC;
  @Column(name = "dry_hop_enabled")
  private Boolean dryHopEnabled;
  @Column(name = "dry_hop_days")
  private Integer dryHopDays;
  @Column(name = "dry_hop_temp_c")
  private BigDecimal dryHopTempC;
  @Column(name = "maturation_days")
  private Integer maturationDays;
  @Column(name = "carbonation_volumes")
  private BigDecimal carbonationVolumes;
  @Column(name = "packaging_method")
  private String packagingMethod;
  private String notes;
  @Column(name = "created_at")
  private OffsetDateTime createdAt;
  @Column(name = "updated_at")
  private OffsetDateTime updatedAt;

  @OneToMany(mappedBy = "recipe")
  @OrderBy("position ASC")
  private List<RecipeMalt> malts;
  @OneToMany(mappedBy = "recipe")
  @OrderBy("position ASC")
  private List<RecipeHop> hops;
  @OneToMany(mappedBy = "recipe")
  @OrderBy("position ASC")
  private List<RecipeWaterAddition> waterAdditions;
  @OneToMany(mappedBy = "recipe")
  @OrderBy("position ASC")
  private List<RecipeMashStep> mashSteps;
  @OneToMany(mappedBy = "recipe")
  @OrderBy("position ASC")
  private List<RecipeBoilStep> boilSteps;

  public String getId() { return id; }
  public String getName() { return name; }
  public String getStyleId() { return styleId; }
  public BigDecimal getBatchVolumeL() { return batchVolumeL; }
  public BigDecimal getEfficiencyPercent() { return efficiencyPercent; }
  public BigDecimal getBoilVolumeL() { return boilVolumeL; }
  public String getYeastId() { return yeastId; }
  public String getWaterProfileId() { return waterProfileId; }
  public Integer getPrimaryDays() { return primaryDays; }
  public BigDecimal getPrimaryTempC() { return primaryTempC; }
  public Integer getSecondaryDays() { return secondaryDays; }
  public BigDecimal getSecondaryTempC() { return secondaryTempC; }
  public Boolean getDryHopEnabled() { return dryHopEnabled; }
  public Integer getDryHopDays() { return dryHopDays; }
  public BigDecimal getDryHopTempC() { return dryHopTempC; }
  public Integer getMaturationDays() { return maturationDays; }
  public BigDecimal getCarbonationVolumes() { return carbonationVolumes; }
  public String getPackagingMethod() { return packagingMethod; }
  public String getNotes() { return notes; }
  public OffsetDateTime getCreatedAt() { return createdAt; }
  public OffsetDateTime getUpdatedAt() { return updatedAt; }
  public List<RecipeMalt> getMalts() { return malts; }
  public List<RecipeHop> getHops() { return hops; }
  public List<RecipeWaterAddition> getWaterAdditions() { return waterAdditions; }
  public List<RecipeMashStep> getMashSteps() { return mashSteps; }
  public List<RecipeBoilStep> getBoilSteps() { return boilSteps; }
}
