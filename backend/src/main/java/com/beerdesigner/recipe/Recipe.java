//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

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
  private String brewer;
  @Column(name = "untappd_url")
  private String untappdUrl;
  @Column(name="equipment_profile_id") private String equipmentProfileId;
  @Column(name="mash_profile_id") private String mashProfileId;
  @Column(name="carbonation_profile_id") private String carbonationProfileId;
  @Column(name="fermentation_profile_id") private String fermentationProfileId;
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
  @Column(name = "image_stored_name")
  private String imageStoredName;
  @Column(name = "image_original_name")
  private String imageOriginalName;
  @Column(name = "image_content_type")
  private String imageContentType;
  @Column(name = "image_size_bytes")
  private Long imageSizeBytes;
  @Column(name = "image_width")
  private Integer imageWidth;
  @Column(name = "image_height")
  private Integer imageHeight;
  @Column(name = "image_uploaded_at")
  private OffsetDateTime imageUploadedAt;
  @Column(name="water_calcium") private BigDecimal waterCalcium;
  @Column(name="water_magnesium") private BigDecimal waterMagnesium;
  @Column(name="water_sodium") private BigDecimal waterSodium;
  @Column(name="water_sulfate") private BigDecimal waterSulfate;
  @Column(name="water_chloride") private BigDecimal waterChloride;
  @Column(name="water_bicarbonate") private BigDecimal waterBicarbonate;
  @Column(name="mash_target_ph") private BigDecimal mashTargetPh;
  @Column(name="sparge_target_ph") private BigDecimal spargeTargetPh;
  @Column(name="water_notes") private String waterNotes;
  private Integer version;
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
  @OneToMany(mappedBy = "recipe") @OrderBy("position ASC")
  private List<RecipeProcessAddition> processAdditions;

  public String getId() { return id; }
  public String getName() { return name; }
  public String getBrewer() { return brewer; }
  public String getUntappdUrl() { return untappdUrl; }
  public String getEquipmentProfileId(){return equipmentProfileId;}
  public String getMashProfileId(){return mashProfileId;}
  public String getCarbonationProfileId(){return carbonationProfileId;}
  public String getFermentationProfileId(){return fermentationProfileId;}
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
  public String getImageStoredName() { return imageStoredName; }
  public String getImageOriginalName() { return imageOriginalName; }
  public String getImageContentType() { return imageContentType; }
  public Long getImageSizeBytes() { return imageSizeBytes; }
  public Integer getImageWidth() { return imageWidth; }
  public Integer getImageHeight() { return imageHeight; }
  public OffsetDateTime getImageUploadedAt() { return imageUploadedAt; }
  public BigDecimal getWaterCalcium(){return waterCalcium;} public BigDecimal getWaterMagnesium(){return waterMagnesium;}
  public BigDecimal getWaterSodium(){return waterSodium;} public BigDecimal getWaterSulfate(){return waterSulfate;}
  public BigDecimal getWaterChloride(){return waterChloride;} public BigDecimal getWaterBicarbonate(){return waterBicarbonate;}
  public BigDecimal getMashTargetPh(){return mashTargetPh;} public BigDecimal getSpargeTargetPh(){return spargeTargetPh;}
  public String getWaterNotes(){return waterNotes;}
  public Integer getVersion() { return version; }
  public OffsetDateTime getCreatedAt() { return createdAt; }
  public OffsetDateTime getUpdatedAt() { return updatedAt; }
  public List<RecipeMalt> getMalts() { return malts; }
  public List<RecipeHop> getHops() { return hops; }
  public List<RecipeWaterAddition> getWaterAdditions() { return waterAdditions; }
  public List<RecipeMashStep> getMashSteps() { return mashSteps; }
  public List<RecipeBoilStep> getBoilSteps() { return boilSteps; }
  public List<RecipeProcessAddition> getProcessAdditions(){return processAdditions;}
}
