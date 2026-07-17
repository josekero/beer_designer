import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({selector:'app-auth-page',imports:[ReactiveFormsModule,RouterLink],templateUrl:'./auth-page.html',styleUrl:'./auth-page.scss'})
export class AuthPage {
  private readonly fb=inject(FormBuilder); private readonly auth=inject(AuthService);
  private readonly router=inject(Router); private readonly route=inject(ActivatedRoute); private readonly notifications=inject(NotificationService);
  readonly registerMode=this.route.snapshot.data['mode']==='register'; readonly submitting=signal(false); readonly showPassword=signal(false);
  readonly form=this.fb.nonNullable.group({displayName:[''],email:['',[Validators.required,Validators.email]],password:['',[Validators.required,Validators.minLength(10)]]});

  submit():void{
    if(this.form.invalid || (this.registerMode && this.form.controls.displayName.value.trim().length<2)){this.form.markAllAsTouched();return;}
    this.submitting.set(true); const {email,password,displayName}=this.form.getRawValue();
    const request=this.registerMode?this.auth.register(email,password,displayName):this.auth.login(email,password);
    request.pipe(finalize(()=>this.submitting.set(false))).subscribe({
      next:user=>{this.notifications.success(this.registerMode?`Bienvenido, ${user.displayName}.`:`Hola de nuevo, ${user.displayName}.`);this.router.navigateByUrl(user.passwordChangeRequired?'/account':this.route.snapshot.queryParamMap.get('returnUrl')||'/');},
      error:error=>this.notifications.error(error.error?.message||error.error?.detail||'No se pudo completar el acceso.')
    });
  }
}
