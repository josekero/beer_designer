import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, Observable, take } from 'rxjs';
import { ApiRepositoryService } from '../../core/services/api-repository.service';
import { NotificationService } from '../../core/services/notification.service';
import { CarbonationProfile, EquipmentProfile, FermentationProfile, MashProfile } from '../../models/brewing.models';
import { UiTranslatePipe } from '../../shared/pipes/ui-translate.pipe';

type ProfileType='equipment'|'mash'|'carbonation'|'fermentation';
@Component({selector:'app-profile-manager',imports:[ReactiveFormsModule,UiTranslatePipe],templateUrl:'./profile-manager.html',styleUrl:'./profile-manager.scss'})
export class ProfileManager implements OnInit {
  private fb=inject(FormBuilder); private api=inject(ApiRepositoryService); private notifications=inject(NotificationService);
  type:ProfileType='equipment'; equipment:EquipmentProfile[]=[]; mash:MashProfile[]=[]; carbonation:CarbonationProfile[]=[]; fermentation:FermentationProfile[]=[];
  equipmentForm=this.fb.nonNullable.group({id:[''],name:[''],batchVolumeL:[20],boilVolumeL:[24],efficiencyPercent:[72],boilOffLPerHour:[3],mashTunDeadspaceL:[1],trubChillerLossL:[1],fermentationLossL:[1],hopUtilizationPercent:[100],mashTunVolumeL:[30],kettleVolumeL:[30],fermenterVolumeL:[25],notes:['']});
  mashForm=this.fb.nonNullable.group({id:[''],name:[''],mashTempC:[66],mashTimeMin:[60],mashOutTempC:[78],mashOutTimeMin:[5],notes:['']});
  carbonationForm=this.fb.nonNullable.group({id:[''],name:[''],method:['Botella'],targetVolumes:[2.4],temperatureC:[20],pressureBar:[0],notes:['']});
  fermentationForm=this.fb.nonNullable.group({id:[''],name:[''],primaryDays:[10],primaryTempC:[19],secondaryDays:[0],secondaryTempC:[18],maturationDays:[14],maturationTempC:[12],notes:['']});
  ngOnInit(){this.load();}
  load(){forkJoin({equipment:this.api.getEquipmentProfiles(),mash:this.api.getMashProfiles(),carbonation:this.api.getCarbonationProfiles(),fermentation:this.api.getFermentationProfiles()}).pipe(take(1)).subscribe(data=>{Object.assign(this,data);if(!this.equipmentForm.controls.id.value&&data.equipment[0])this.select('equipment',data.equipment[0]);});}
  changeType(type:ProfileType){this.type=type;const items=this.items();if(items[0])this.select(type,items[0]);else this.create();}
  items():any[]{return this[this.type] as any[];}
  form():any{return this.type==='equipment'?this.equipmentForm:this.type==='mash'?this.mashForm:this.type==='carbonation'?this.carbonationForm:this.fermentationForm;}
  select(type:ProfileType,item:any){this.type=type;this.form().reset(item);}
  create(){this.form().reset({id:`profile-${Date.now()}`,name:'Nuevo perfil'});}
  duplicate(){const value=this.form().getRawValue();this.form().patchValue({...value,id:`profile-${Date.now()}`,name:`Copia de ${value.name}`});}
  save(){const value=this.form().getRawValue();const request:Observable<unknown>=this.type==='equipment'?this.api.saveEquipmentProfile(value):this.type==='mash'?this.api.saveMashProfile(value):this.type==='carbonation'?this.api.saveCarbonationProfile(value):this.api.saveFermentationProfile(value);request.pipe(take(1)).subscribe({next:()=>{this.notifications.success(`Perfil “${value.name}” guardado.`);this.load();},error:()=>this.notifications.error('No se pudo guardar el perfil.')});}
  remove(){const value=this.form().getRawValue();if(!value.id||!window.confirm(`¿Eliminar “${value.name}”?`))return;this.api.deleteProfile(this.type,value.id).pipe(take(1)).subscribe({next:()=>{this.notifications.success('Perfil eliminado.');this.form().reset();this.load();},error:(e)=>this.notifications.error(e.status===409?'El perfil está utilizado por una receta.':'No se pudo eliminar el perfil.')});}
}
