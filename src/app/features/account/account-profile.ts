import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { BEER_AVATARS, BeerAvatar } from '../../shared/components/beer-avatar/beer-avatar';

@Component({selector:'app-account-profile',imports:[ReactiveFormsModule,BeerAvatar],templateUrl:'./account-profile.html',styleUrl:'./account-profile.scss'})
export class AccountProfile{
  readonly auth=inject(AuthService);private readonly fb=inject(FormBuilder);private readonly notifications=inject(NotificationService);
  readonly avatars=BEER_AVATARS;readonly saving=signal(false);readonly avatarVersion=signal(Date.now());
  readonly profile=this.fb.nonNullable.group({displayName:[this.auth.user()?.displayName??'',[Validators.required,Validators.minLength(2)]],avatarValue:[this.auth.user()?.avatarValue??'hop-pirate']});
  readonly password=this.fb.nonNullable.group({currentPassword:['',Validators.required],newPassword:['',[Validators.required,Validators.minLength(10),Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)]]});
  save():void{if(this.profile.invalid)return;this.saving.set(true);const value=this.profile.getRawValue();this.auth.updateProfile(value.displayName,'gallery',value.avatarValue).pipe(finalize(()=>this.saving.set(false))).subscribe({next:()=>this.notifications.success('Perfil actualizado.'),error:()=>this.notifications.error('No se pudo actualizar el perfil.')});}
  upload(event:Event):void{const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return;this.auth.uploadAvatar(file).subscribe({next:()=>{this.avatarVersion.set(Date.now());this.notifications.success('Foto de perfil actualizada.');},error:()=>this.notifications.error('Selecciona un JPG o PNG válido de hasta 3 MB.')});input.value='';}
  changePassword():void{if(this.password.invalid){this.password.markAllAsTouched();return;}const value=this.password.getRawValue();this.auth.changePassword(value.currentPassword,value.newPassword).subscribe({next:()=>{this.notifications.success('Contraseña actualizada. Vuelve a iniciar sesión.');this.auth.user.set(null);location.assign('/login');},error:error=>this.notifications.error(error.error?.message||error.error?.detail||'La contraseña actual no es correcta o la nueva no cumple los requisitos.')});}
}
