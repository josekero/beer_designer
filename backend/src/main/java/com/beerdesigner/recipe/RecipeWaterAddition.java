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
@Table(name = "recipe_water_additions")
public class RecipeWaterAddition {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "recipe_id")
  private Recipe recipe;
  private String name;
  @Column(name = "amount_g")
  private BigDecimal amountG;
  private Integer position;

  public String getName() { return name; }
  public BigDecimal getAmountG() { return amountG; }
  public Integer getPosition() { return position; }
}
