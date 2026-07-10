import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { RecipeEditor } from './features/recipes/recipe-editor/recipe-editor';
import { RecipeList } from './features/recipes/recipe-list/recipe-list';

export const routes: Routes = [
  { path: '', component: Dashboard, title: 'Dashboard cervecero' },
  { path: 'recipes', component: RecipeList, title: 'Recetas' },
  { path: 'recipes/new', component: RecipeEditor, title: 'Nueva receta' },
  { path: 'recipes/:id', component: RecipeEditor, title: 'Editar receta' },
  { path: '**', redirectTo: '' }
];
