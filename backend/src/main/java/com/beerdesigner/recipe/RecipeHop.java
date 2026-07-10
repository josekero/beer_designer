//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

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
@Table(name = "recipe_hops")
public class RecipeHop {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "recipe_id")
  private Recipe recipe;
  @Column(name = "hop_id")
  private String hopId;
  @Column(name = "amount_g")
  private BigDecimal amountG;
  @Column(name = "alpha_acids")
  private BigDecimal alphaAcids;
  @Column(name = "time_min")
  private Integer timeMin;
  private String use;
  private Integer position;

  public String getHopId() { return hopId; }
  public BigDecimal getAmountG() { return amountG; }
  public BigDecimal getAlphaAcids() { return alphaAcids; }
  public Integer getTimeMin() { return timeMin; }
  public String getUse() { return use; }
  public Integer getPosition() { return position; }
}
