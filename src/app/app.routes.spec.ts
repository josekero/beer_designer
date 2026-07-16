import { describe, expect, it } from 'vitest';
import { appConfig } from './app.config';
import { routes } from './app.routes';

describe('Application routing', () => {
  it('keeps every main workspace reachable and includes a fallback', () => {
    expect(routes.map(route => route.path)).toEqual([
      '', 'recipes', 'recipes/new', 'brew-days', 'ingredients', 'styles', 'profiles',
      'breweries', 'calculators', 'timers', 'recipes/:id', '**'
    ]);
    expect(routes.at(-1)?.redirectTo).toBe('');
    expect(appConfig.providers).toHaveLength(3);
  });

  it('loads the configuration views lazily', async () => {
    const breweries = routes.find(route => route.path === 'breweries');
    const timers = routes.find(route => route.path === 'timers');

    const breweryComponent = await breweries?.loadComponent?.();
    const timerComponent = await timers?.loadComponent?.();
    expect((breweryComponent as { name: string }).name).toContain('BreweryManager');
    expect((timerComponent as { name: string }).name).toContain('BrewTimers');
  });
});
