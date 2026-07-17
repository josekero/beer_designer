//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { BrewDayPlanner } from './features/brew-days/brew-day-planner';
import { BrewingCalculators } from './features/calculators/brewing-calculators';
import { IngredientManager } from './features/ingredients/ingredient-manager';
import { RecipeEditor } from './features/recipes/recipe-editor/recipe-editor';
import { RecipeList } from './features/recipes/recipe-list/recipe-list';
import { StyleBrowser } from './features/styles/style-browser';
import { ProfileManager } from './features/profiles/profile-manager';
import { authGuard, adminGuard, guestGuard } from './core/auth.guard';
import { AuthPage } from './features/auth/auth-page';
import { AccountProfile } from './features/account/account-profile';
import { AdminDashboard } from './features/admin/admin-dashboard';
import { CommunityPage } from './features/community/community-page';

export const routes: Routes = [
  { path: 'login', component: AuthPage, canActivate:[guestGuard], title:'Entrar · Beer Designer' },
  { path: 'register', component: AuthPage, canActivate:[guestGuard], data:{mode:'register'}, title:'Crear cuenta · Beer Designer' },
  { path: '', component: Dashboard, canActivate:[authGuard], title: 'Dashboard cervecero' },
  { path: 'community', component: CommunityPage, canActivate:[authGuard], title: 'Community · Beer Designer' },
  { path: 'recipes', component: RecipeList, canActivate:[authGuard], title: 'Recetas' },
  { path: 'recipes/new', component: RecipeEditor, canActivate:[authGuard], title: 'Nueva receta' },
  { path: 'brew-days', component: BrewDayPlanner, canActivate:[authGuard], title: 'Día de elaboración' },
  { path: 'ingredients', component: IngredientManager, canActivate:[authGuard], title: 'Ingredientes' },
  { path: 'styles', component: StyleBrowser, canActivate:[authGuard], title: 'Estilos BJCP' },
  { path: 'profiles', component: ProfileManager, canActivate:[authGuard], title: 'Perfiles cerveceros' },
  { path: 'account', component: AccountProfile, canActivate:[authGuard], title:'Mi cuenta' },
  { path: 'admin', component: AdminDashboard, canActivate:[adminGuard], title:'Administración' },
  {
    path: 'breweries',
    loadComponent: () => import('./features/breweries/brewery-manager').then((module) => module.BreweryManager),
    canActivate:[authGuard],
    title: 'Breweries',
  },
  { path: 'calculators', component: BrewingCalculators, canActivate:[authGuard], title: 'Calculadoras cerveceras' },
  {
    path: 'timers',
    loadComponent: () => import('./features/timers/brew-timers').then((module) => module.BrewTimers),
    canActivate:[authGuard],
    title: 'Temporizadores de elaboración',
  },
  { path: 'recipes/:id', component: RecipeEditor, canActivate:[authGuard], title: 'Editar receta' },
  { path: '**', redirectTo: '' },
];
