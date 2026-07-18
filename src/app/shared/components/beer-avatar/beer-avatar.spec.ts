import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BeerAvatar } from './beer-avatar';

describe('BeerAvatar', () => {
  let fixture: ComponentFixture<BeerAvatar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BeerAvatar] }).compileComponents();
    fixture = TestBed.createComponent(BeerAvatar);
  });

  it('renders a stable local SVG reference and accessible name', () => {
    fixture.componentRef.setInput('avatarId', 'brew-wizard');
    fixture.componentRef.setInput('label', 'Avatar de Elena');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('aria-label')).toBe('Avatar de Elena');
    expect(fixture.nativeElement.querySelector('use').getAttribute('href')).toBe(
      '/assets/avatars/beer-avatars.svg?v=20260718-3#brew-wizard',
    );
  });

  it('falls back safely when a persisted identifier is unknown', () => {
    fixture.componentRef.setInput('avatarId', 'unknown-avatar');
    fixture.detectChanges();

    expect(fixture.componentInstance.resolvedId()).toBe('hop-pirate');
    expect(fixture.componentInstance.accessibleName()).toBe('Hop Pirate');
  });
});
