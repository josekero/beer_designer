package com.beerdesigner.recipe;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "recipe_process_additions")
public class RecipeProcessAddition {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "recipe_id") private Recipe recipe;
  private String name;
  private String brand;
  @Column(name = "amount_g") private BigDecimal amountG;
  private String stage;
  @Column(name = "time_min") private Integer timeMin;
  @Column(name = "temperature_c") private BigDecimal temperatureC;
  @Column(name = "day_label") private String dayLabel;
  private String notes;
  private Integer position;
  public String getName(){return name;} public String getBrand(){return brand;} public BigDecimal getAmountG(){return amountG;}
  public String getStage(){return stage;} public Integer getTimeMin(){return timeMin;} public BigDecimal getTemperatureC(){return temperatureC;}
  public String getDayLabel(){return dayLabel;} public String getNotes(){return notes;} public Integer getPosition(){return position;}
}
