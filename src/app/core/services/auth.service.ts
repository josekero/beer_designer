import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { ApplicationUser } from '../../models/brewing.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly user = signal<ApplicationUser | null>(null);
  readonly ready = signal(false);
  private loading?: Observable<ApplicationUser | null>;

  load(): Observable<ApplicationUser | null> {
    if (this.ready()) return of(this.user());
    if (!this.loading) {
      this.loading = this.http.get<ApplicationUser>('/api/auth/me').pipe(
        tap(user => this.user.set(user)),
        map(user => user as ApplicationUser | null),
        catchError(() => { this.user.set(null); return of(null); }),
        finalize(() => this.ready.set(true)),
        shareReplay(1)
      );
    }
    return this.loading;
  }

  login(email:string,password:string):Observable<ApplicationUser>{
    return this.http.post<ApplicationUser>('/api/auth/login',{email,password}).pipe(tap(user=>{this.user.set(user);this.ready.set(true);}));
  }
  register(email:string,password:string,displayName:string):Observable<ApplicationUser>{
    return this.http.post<ApplicationUser>('/api/auth/register',{email,password,displayName}).pipe(tap(user=>{this.user.set(user);this.ready.set(true);}));
  }
  logout():Observable<void>{return this.http.post<void>('/api/auth/logout',{}).pipe(tap(()=>this.user.set(null)));}
  updateProfile(displayName:string,avatarKind:'gallery'|'upload',avatarValue:string):Observable<ApplicationUser>{
    return this.http.put<ApplicationUser>('/api/auth/profile',{displayName,avatarKind,avatarValue}).pipe(tap(user=>this.user.set(user)));
  }
  changePassword(currentPassword:string,newPassword:string):Observable<void>{return this.http.put<void>('/api/auth/password',{currentPassword,newPassword});}
  avatars():Observable<string[]>{return this.http.get<string[]>('/api/auth/avatars');}
  uploadAvatar(file:File):Observable<ApplicationUser>{const data=new FormData();data.append('file',file);return this.http.post<ApplicationUser>('/api/auth/avatar',data).pipe(tap(user=>this.user.set(user)));}
}
