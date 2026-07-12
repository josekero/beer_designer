package com.beerdesigner.recipe;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name="recipe_yeasts")
public class RecipeYeast {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="recipe_id") private Recipe recipe;
  @Column(name="yeast_id") private String yeastId;
  private String format;
  private BigDecimal amount;
  private String unit;
  @Column(name="pitch_temp_c") private BigDecimal pitchTempC;
  @Column(name="starter_volume_l") private BigDecimal starterVolumeL;
  private String notes;
  private Integer position;
  public String getYeastId(){return yeastId;} public String getFormat(){return format;} public BigDecimal getAmount(){return amount;} public String getUnit(){return unit;}
  public BigDecimal getPitchTempC(){return pitchTempC;} public BigDecimal getStarterVolumeL(){return starterVolumeL;} public String getNotes(){return notes;} public Integer getPosition(){return position;}
}
