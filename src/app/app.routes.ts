//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { BrewingCalculators } from './features/calculators/brewing-calculators';
import { IngredientManager } from './features/ingredients/ingredient-manager';
import { RecipeEditor } from './features/recipes/recipe-editor/recipe-editor';
import { RecipeList } from './features/recipes/recipe-list/recipe-list';

export const routes: Routes = [
  { path: '', component: Dashboard, title: 'Dashboard cervecero' },
  { path: 'recipes', component: RecipeList, title: 'Recetas' },
  { path: 'recipes/new', component: RecipeEditor, title: 'Nueva receta' },
  { path: 'ingredients', component: IngredientManager, title: 'Ingredientes' },
  { path: 'calculators', component: BrewingCalculators, title: 'Calculadoras cerveceras' },
  { path: 'recipes/:id', component: RecipeEditor, title: 'Editar receta' },
  { path: '**', redirectTo: '' }
];
