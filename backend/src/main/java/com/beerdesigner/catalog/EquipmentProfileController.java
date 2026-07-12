package com.beerdesigner.catalog;
import java.util.List;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
@RestController @RequestMapping("/api/equipment-profiles")
public class EquipmentProfileController {
  private final EquipmentProfileRepository repository;
  private final JdbcTemplate jdbc;
  public EquipmentProfileController(EquipmentProfileRepository repository,JdbcTemplate jdbc){this.repository=repository;this.jdbc=jdbc;}
  @GetMapping public List<EquipmentProfile> list(){return repository.findAllByOrderByNameAsc();}
  @PutMapping("/{id}") public EquipmentProfile save(@PathVariable String id,@RequestBody EquipmentDto p){
    jdbc.update("""
      INSERT INTO equipment_profiles (id,name,batch_volume_l,boil_volume_l,efficiency_percent,boil_off_l_per_hour,mash_tun_deadspace_l,trub_chiller_loss_l,fermentation_loss_l,hop_utilization_percent,notes,mash_tun_volume_l,kettle_volume_l,fermenter_volume_l)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,batch_volume_l=EXCLUDED.batch_volume_l,boil_volume_l=EXCLUDED.boil_volume_l,efficiency_percent=EXCLUDED.efficiency_percent,boil_off_l_per_hour=EXCLUDED.boil_off_l_per_hour,mash_tun_deadspace_l=EXCLUDED.mash_tun_deadspace_l,trub_chiller_loss_l=EXCLUDED.trub_chiller_loss_l,fermentation_loss_l=EXCLUDED.fermentation_loss_l,hop_utilization_percent=EXCLUDED.hop_utilization_percent,notes=EXCLUDED.notes,mash_tun_volume_l=EXCLUDED.mash_tun_volume_l,kettle_volume_l=EXCLUDED.kettle_volume_l,fermenter_volume_l=EXCLUDED.fermenter_volume_l
      """,id,p.name,p.batchVolumeL,p.boilVolumeL,p.efficiencyPercent,p.boilOffLPerHour,p.mashTunDeadspaceL,p.trubChillerLossL,p.fermentationLossL,p.hopUtilizationPercent,p.notes,p.mashTunVolumeL,p.kettleVolumeL,p.fermenterVolumeL);
    return repository.findById(id).orElseThrow();
  }
  @DeleteMapping("/{id}") public void delete(@PathVariable String id){try{repository.deleteById(id);repository.flush();}catch(DataIntegrityViolationException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"El perfil está utilizado por recetas");}}
  public record EquipmentDto(String id,String name,java.math.BigDecimal batchVolumeL,java.math.BigDecimal boilVolumeL,java.math.BigDecimal efficiencyPercent,java.math.BigDecimal boilOffLPerHour,java.math.BigDecimal mashTunDeadspaceL,java.math.BigDecimal trubChillerLossL,java.math.BigDecimal fermentationLossL,java.math.BigDecimal hopUtilizationPercent,String notes,java.math.BigDecimal mashTunVolumeL,java.math.BigDecimal kettleVolumeL,java.math.BigDecimal fermenterVolumeL){}
}
