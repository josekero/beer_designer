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
@Table(name = "bjcp_styles")
public class BjcpStyle {
  @Id
  private String id;
  private String code;
  private String name;
  private String category;
  @Column(name = "og_min")
  private BigDecimal ogMin;
  @Column(name = "og_max")
  private BigDecimal ogMax;
  @Column(name = "fg_min")
  private BigDecimal fgMin;
  @Column(name = "fg_max")
  private BigDecimal fgMax;
  @Column(name = "ibu_min")
  private BigDecimal ibuMin;
  @Column(name = "ibu_max")
  private BigDecimal ibuMax;
  @Column(name = "srm_min")
  private BigDecimal srmMin;
  @Column(name = "srm_max")
  private BigDecimal srmMax;
  @Column(name = "abv_min")
  private BigDecimal abvMin;
  @Column(name = "abv_max")
  private BigDecimal abvMax;
  @Column(name = "sensory_description")
  private String sensoryDescription;

  public String getId() { return id; }
  public String getCode() { return code; }
  public String getName() { return name; }
  public String getCategory() { return category; }
  public BigDecimal getOgMin() { return ogMin; }
  public BigDecimal getOgMax() { return ogMax; }
  public BigDecimal getFgMin() { return fgMin; }
  public BigDecimal getFgMax() { return fgMax; }
  public BigDecimal getIbuMin() { return ibuMin; }
  public BigDecimal getIbuMax() { return ibuMax; }
  public BigDecimal getSrmMin() { return srmMin; }
  public BigDecimal getSrmMax() { return srmMax; }
  public BigDecimal getAbvMin() { return abvMin; }
  public BigDecimal getAbvMax() { return abvMax; }
  public String getSensoryDescription() { return sensoryDescription; }
}
