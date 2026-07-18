import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export const BEER_AVATARS = [
  { id: 'hop-pirate', name: 'Hop Pirate' },
  { id: 'hop-viking', name: 'Hop Viking' },
  { id: 'hop-astronaut', name: 'Hop Astronaut' },
  { id: 'mad-brewer', name: 'Mad Brewer' },
  { id: 'brew-wizard', name: 'Brew Wizard' },
  { id: 'beer-robot', name: 'Beer Robot' },
  { id: 'hop-monster', name: 'Hop Monster' },
  { id: 'beer-skull', name: 'Beer Skull' },
  { id: 'brewmaster', name: 'Brewmaster' },
  { id: 'homebrewer', name: 'Homebrewer' },
  { id: 'barrel-brewer', name: 'Barrel Brewer' },
  { id: 'water-alchemist', name: 'Water Alchemist' },
  { id: 'co2-bubble', name: 'CO₂ Bubble' },
  { id: 'golden-striker', name: 'Golden Striker' },
  { id: 'stout-keeper', name: 'Stout Keeper' },
] as const;

export type BeerAvatarId = (typeof BEER_AVATARS)[number]['id'];

const avatarIds = new Set<string>(BEER_AVATARS.map((avatar) => avatar.id));
const DEFAULT_AVATAR: BeerAvatarId = 'hop-pirate';
const AVATAR_ASSET_VERSION = '20260718-3';

@Component({
  selector: 'app-beer-avatar',
  template: `
    <svg viewBox="0 0 128 128" role="img" [attr.aria-label]="accessibleName()">
      <use [attr.href]="assetReference()"></use>
    </svg>
  `,
  styles: `
    :host { display: block; overflow: hidden; }
    svg { display: block; width: 100%; height: 100%; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BeerAvatar {
  readonly avatarId = input<string>(DEFAULT_AVATAR);
  readonly label = input<string>('');
  readonly resolvedId = computed<BeerAvatarId>(() => {
    const value = this.avatarId();
    return avatarIds.has(value) ? (value as BeerAvatarId) : DEFAULT_AVATAR;
  });
  readonly accessibleName = computed(
    () => this.label() || BEER_AVATARS.find((avatar) => avatar.id === this.resolvedId())?.name || 'Beer avatar',
  );
  readonly assetReference = computed(
    () => `/assets/avatars/beer-avatars.svg?v=${AVATAR_ASSET_VERSION}#${this.resolvedId()}`,
  );
}
