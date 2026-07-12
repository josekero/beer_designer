package com.beerdesigner.recipe;
import jakarta.persistence.*; import java.math.BigDecimal;
@Entity @Table(name="recipe_fermentation_steps") public class RecipeFermentationStep{
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="recipe_id") private Recipe recipe;
 private String stage; @Column(name="start_day") private Integer startDay; @Column(name="duration_days") private Integer durationDays; @Column(name="temperature_c") private BigDecimal temperatureC; private String notes; private Integer position;
 public String getStage(){return stage;} public Integer getStartDay(){return startDay;} public Integer getDurationDays(){return durationDays;} public BigDecimal getTemperatureC(){return temperatureC;} public String getNotes(){return notes;} public Integer getPosition(){return position;}
}
