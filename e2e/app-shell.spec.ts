import { expect, Page, test } from '@playwright/test';

async function mockApi(page: Page): Promise<void> {
  await page.route('**/api/**', async route => {
    const request = route.request();
    if (request.method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      return;
    }
    await route.fulfill({ status: 204, body: '' });
  });
}

test.beforeEach(async ({ page }) => mockApi(page));

test('loads the dashboard and navigates to the recipe library', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Buenas recetas empiezan con un buen plan.' })).toBeVisible();
  await page.getByRole('link', { name: 'Recetas', exact: true }).click();

  await expect(page).toHaveURL(/\/recipes$/);
  await expect(page.getByRole('heading', { name: 'Biblioteca local' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nueva receta' })).toBeVisible();
});

test('changes the application language and keeps navigation usable', async ({ page }) => {
  await page.goto('/ingredients');
  await page.getByRole('button', { name: /menú de aplicación/i }).click();
  await page.getByRole('button', { name: /EN English/i }).click();

  await expect(page.getByRole('link', { name: 'Recipes', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ingredients' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New ingredient' })).toBeVisible();
});
