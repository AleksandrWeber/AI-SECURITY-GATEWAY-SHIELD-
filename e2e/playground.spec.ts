import { expect, test } from '@playwright/test';

test.describe('SHIELD playground', () => {
  test('demo jailbreak shows malicious result with explanation', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');

    await page.getByTestId('demo-jailbreak').click();
    await page.getByTestId('analyze-button').click();

    await expect(page.getByTestId('result-panel')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('risk-badge')).toHaveText('Malicious');
    await expect(page.getByTestId('explanation')).not.toBeEmpty();

    const safeAlt = page.getByTestId('safe-alternative');
    await expect(safeAlt).toBeVisible();
    const alternativeText = (await safeAlt.textContent()) ?? '';

    await page.getByTestId('copy-safe-alternative').click();
    await expect(page.getByTestId('copy-safe-alternative')).toHaveText('Copied!');

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe(alternativeText);
  });

  test('uk language switch updates UI labels', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('language-select').selectOption('uk');

    await expect(page.getByTestId('analyze-button')).toHaveText('Аналізувати');
    await expect(page.getByText('Демо атаки')).toBeVisible();
  });
});
