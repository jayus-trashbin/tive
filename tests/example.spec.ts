import { test, expect } from '@playwright/test';

test('has title and loads dashboard', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Adaptive Strength/);

    // Check for main heading
    await expect(page.getByRole('heading', { name: 'ROUTINES' })).toBeVisible();
});
