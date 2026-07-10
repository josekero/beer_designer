//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeStoreService } from '../../../core/services/recipe-store.service';

@Component({
  selector: 'app-recipe-list',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.scss'
})
export class RecipeList {
  private readonly recipes = inject(RecipeStoreService);
  readonly recipes$ = this.recipes.loadInitialRecipes();
}
