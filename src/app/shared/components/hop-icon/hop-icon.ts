import { Component, input } from '@angular/core';

@Component({
  selector: 'app-hop-icon',
  standalone: true,
  template: `
    <svg viewBox="0 0 64 76" role="img" [attr.aria-label]="label() || null" [attr.aria-hidden]="label() ? null : 'true'">
      <path class="stem" d="M34 8c-1-4 0-6 3-8" />
      <path d="M32 10C18 12 9 25 11 40c2 17 13 27 21 33 8-6 19-16 21-33 2-15-7-28-21-30Z" />
      <path d="M31 13c-8 5-12 11-13 19 5-1 10-4 14-8M33 13c8 5 12 11 13 19-5-1-10-4-14-8M13 37c5 0 12-3 19-9M51 37c-5 0-12-3-19-9M15 45c6 0 12-3 17-8M49 45c-6 0-12-3-17-8M19 54c5-1 9-3 13-8M45 54c-5-1-9-3-13-8M25 63c3-2 5-5 7-8M39 63c-3-2-5-5-7-8" />
      <path class="heart" d="M32 24c-4 8-4 26 0 37 4-11 4-29 0-37Z" />
    </svg>
  `,
  styles: [`
    :host{display:inline-grid;width:1.35em;height:1.5em;place-items:center;color:inherit}
    svg{display:block;width:100%;height:100%;overflow:visible}
    path{fill:none;stroke:currentColor;stroke-width:3.1;stroke-linecap:round;stroke-linejoin:round}
    .heart{fill:color-mix(in srgb,currentColor 14%,transparent);stroke-width:2.6}
    .stem{stroke-width:3.4}
  `]
})
export class HopIcon { readonly label=input(''); }
