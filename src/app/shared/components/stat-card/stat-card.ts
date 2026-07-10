//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  template: `
    <article class="stat-card">
      <span>{{ label() }}</span>
      <strong>{{ value() }}</strong>
      <small>{{ detail() }}</small>
    </article>
  `,
  styleUrl: './stat-card.scss'
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly detail = input('');
}
