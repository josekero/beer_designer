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

export const routes: Routes = [
  { path: '', component: Dashboard, title: 'Dashboard cervecero' },
  { path: 'recipes', component: RecipeList, title: 'Recetas' },
  { path: 'recipes/new', component: RecipeEditor, title: 'Nueva receta' },
  { path: 'brew-days', component: BrewDayPlanner, title: 'Día de elaboración' },
  { path: 'ingredients', component: IngredientManager, title: 'Ingredientes' },
  { path: 'styles', component: StyleBrowser, title: 'Estilos BJCP' },
  { path: 'profiles', component: ProfileManager, title: 'Perfiles cerveceros' },
  {
    path: 'breweries',
    loadComponent: () => import('./features/breweries/brewery-manager').then((module) => module.BreweryManager),
    title: 'Breweries',
  },
  { path: 'calculators', component: BrewingCalculators, title: 'Calculadoras cerveceras' },
  {
    path: 'timers',
    loadComponent: () => import('./features/timers/brew-timers').then((module) => module.BrewTimers),
    title: 'Temporizadores de elaboración',
  },
  { path: 'recipes/:id', component: RecipeEditor, title: 'Editar receta' },
  { path: '**', redirectTo: '' },
];
