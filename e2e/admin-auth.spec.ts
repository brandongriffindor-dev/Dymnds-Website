import { test, expect } from '@playwright/test';

/**
 * E2E: Admin Authentication Flow
 *
 * Tests admin login protection, MFA prompts, and session management.
 * Requires dev server running.
 *
 * NOTE: These tests verify the auth GATE works (redirects, blocks).
 * They do NOT test a real login since that requires Firebase credentials.
 * For full login testing, use a test Firebase project with known credentials.
 */

test.describe('Admin Auth Protection', () => {
  test('unauthenticated user on /admin sees login form', async ({ page }) => {
    await page.goto('/admin');
    // Login form should be visible (not the dashboard)
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('unauthenticated user on /admin/dashboard is redirected to /admin', async ({ page }) => {
    await page.goto('/admin/dashboard');
    // Middleware should redirect to /admin login page
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('unauthenticated user on /admin/products is redirected', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('admin API returns 401 without session cookie', async ({ request }) => {
    const response = await request.get('/api/admin/cleanup');
    expect(response.status()).toBe(401);
    const json = await response.json();
    expect(json.error).toBeTruthy();
  });

  test('login form shows error on invalid credentials', async ({ page }) => {
    await page.goto('/admin');

    await page.fill('input[type="email"]', 'fake@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.locator('button[type="submit"]').click();

    // Should show error message (Firebase will reject)
    await expect(page.locator('[data-testid="login-error"], .text-red-500, [role="alert"]').first())
      .toBeVisible({ timeout: 10000 });
  });

  test('login form has lockout after repeated failures', async ({ page }) => {
    await page.goto('/admin');

    // Submit bad credentials 5 times
    for (let i = 0; i < 5; i++) {
      await page.fill('input[type="email"]', 'fake@test.com');
      await page.fill('input[type="password"]', 'wrong');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(500);
    }

    // After 5 failures, should see lockout message
    await expect(page.locator('text=/locked|too many/i').first())
      .toBeVisible({ timeout: 10000 });
  });
});
