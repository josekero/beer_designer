package com.beerdesigner.recipe;
import jakarta.persistence.*;
import java.math.BigDecimal;
@Entity @Table(name="recipe_maturation_additions")
public class RecipeMaturationAddition {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="recipe_id") private Recipe recipe;
 private String type; @Column(name="hop_id") private String hopId; @Column(name="adjunct_id") private String adjunctId; private String name; private String batch; private BigDecimal amount; private String unit;
 @Column(name="add_day") private Integer addDay; @Column(name="contact_days") private Integer contactDays; @Column(name="temperature_c") private BigDecimal temperatureC; private String notes; private Integer position;
 public String getType(){return type;} public String getHopId(){return hopId;} public String getAdjunctId(){return adjunctId;} public String getName(){return name;} public String getBatch(){return batch;} public BigDecimal getAmount(){return amount;} public String getUnit(){return unit;} public Integer getAddDay(){return addDay;} public Integer getContactDays(){return contactDays;} public BigDecimal getTemperatureC(){return temperatureC;} public String getNotes(){return notes;} public Integer getPosition(){return position;}
}
