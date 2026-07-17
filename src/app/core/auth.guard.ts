import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './services/auth.service';

export const authGuard:CanActivateFn = (_,state) => {
  const auth=inject(AuthService); const router=inject(Router);
  return auth.load().pipe(map(user=>user ? true : router.createUrlTree(['/login'],{queryParams:{returnUrl:state.url}})));
};
export const adminGuard:CanActivateFn = () => {
  const auth=inject(AuthService); const router=inject(Router);
  return auth.load().pipe(map(user=>user?.role==='ADMIN' ? true : router.createUrlTree(['/'])));
};
export const guestGuard:CanActivateFn = () => {
  const auth=inject(AuthService); const router=inject(Router);
  return auth.load().pipe(map(user=>user ? router.createUrlTree(['/']) : true));
};
