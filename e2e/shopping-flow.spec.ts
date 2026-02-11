import { test, expect } from '@playwright/test';

/**
 * E2E: Core Shopping Flow
 *
 * Tests the critical user journey: browse → product → cart → checkout.
 * Requires dev server running with test data in Firestore.
 *
 * TODO: Replace selectors with your actual DOM selectors once you run
 * `npx playwright codegen http://localhost:3000` to auto-generate them.
 */

test.describe('Shopping Flow', () => {
  test('homepage loads and displays products', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DYMNDS/i);
    // Verify at least one product card renders
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('can navigate to a product detail page', async ({ page }) => {
    await page.goto('/');
    // Click first product card
    await page.locator('[data-testid="product-card"]').first().click();
    // Should navigate to /products/[slug]
    await expect(page).toHaveURL(/\/products\/.+/);
    // Product title should be visible
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('can add item to cart and see cart drawer', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="product-card"]').first().click();

    // Select a size (adjust selector to match your UI)
    await page.locator('button:has-text("M")').click();

    // Click add to cart
    await page.locator('button:has-text("Add to Cart")').click();

    // Cart drawer should open with the item
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-item"]').first()).toBeVisible();
  });

  test('cart updates quantity correctly', async ({ page }) => {
    // Add an item first
    await page.goto('/');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.locator('button:has-text("M")').click();
    await page.locator('button:has-text("Add to Cart")').click();

    // Increase quantity
    await page.locator('[data-testid="quantity-increase"]').click();
    await expect(page.locator('[data-testid="item-quantity"]').first()).toHaveText('2');
  });

  test('can remove item from cart', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.locator('button:has-text("M")').click();
    await page.locator('button:has-text("Add to Cart")').click();

    // Remove item
    await page.locator('[data-testid="cart-remove"]').first().click();

    // Cart should be empty
    await expect(page.locator('[data-testid="cart-empty"]')).toBeVisible();
  });

  test('currency switcher changes displayed prices', async ({ page }) => {
    await page.goto('/');

    // Get initial price text
    const priceEl = page.locator('[data-testid="product-price"]').first();
    await expect(priceEl).toBeVisible({ timeout: 10000 });
    const initialPrice = await priceEl.textContent();

    // If there's a currency toggle, click it
    const currencyToggle = page.locator('[data-testid="currency-toggle"]');
    if (await currencyToggle.isVisible()) {
      await currencyToggle.click();
      // Price should change (different symbol or value)
      await expect(priceEl).not.toHaveText(initialPrice!);
    }
  });
});
