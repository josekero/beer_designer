package com.beerdesigner.catalog;
import jakarta.persistence.*;
import java.math.BigDecimal;
@Entity @Table(name="equipment_profiles")
public class EquipmentProfile {
  @Id private String id; private String name;
  @Column(name="batch_volume_l") private BigDecimal batchVolumeL;
  @Column(name="boil_volume_l") private BigDecimal boilVolumeL;
  @Column(name="efficiency_percent") private BigDecimal efficiencyPercent;
  @Column(name="boil_off_l_per_hour") private BigDecimal boilOffLPerHour;
  @Column(name="mash_tun_deadspace_l") private BigDecimal mashTunDeadspaceL;
  @Column(name="trub_chiller_loss_l") private BigDecimal trubChillerLossL;
  @Column(name="fermentation_loss_l") private BigDecimal fermentationLossL;
  @Column(name="hop_utilization_percent") private BigDecimal hopUtilizationPercent;
  @Column(name="mash_tun_volume_l") private BigDecimal mashTunVolumeL;
  @Column(name="kettle_volume_l") private BigDecimal kettleVolumeL;
  @Column(name="fermenter_volume_l") private BigDecimal fermenterVolumeL;
  private String notes;
  public String getId(){return id;} public String getName(){return name;} public BigDecimal getBatchVolumeL(){return batchVolumeL;}
  public BigDecimal getBoilVolumeL(){return boilVolumeL;} public BigDecimal getEfficiencyPercent(){return efficiencyPercent;}
  public BigDecimal getBoilOffLPerHour(){return boilOffLPerHour;} public BigDecimal getMashTunDeadspaceL(){return mashTunDeadspaceL;}
  public BigDecimal getTrubChillerLossL(){return trubChillerLossL;} public BigDecimal getFermentationLossL(){return fermentationLossL;}
  public BigDecimal getHopUtilizationPercent(){return hopUtilizationPercent;} public String getNotes(){return notes;}
  public BigDecimal getMashTunVolumeL(){return mashTunVolumeL;} public BigDecimal getKettleVolumeL(){return kettleVolumeL;} public BigDecimal getFermenterVolumeL(){return fermenterVolumeL;}
}
