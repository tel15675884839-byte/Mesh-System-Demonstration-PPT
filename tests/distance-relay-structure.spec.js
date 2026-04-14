const { test, expect } = require("@playwright/test");

test("distance relay scene includes panel entry and wireless end devices", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/pages/distance.html?reveal=1", {
    waitUntil: "networkidle"
  });

  await page.locator('.scene-toggle[aria-label="Show mesh relay 16km scene"]').click();

  await expect(page.locator(".relay-entry-panel")).toHaveCount(1);
  await expect(page.locator(".relay-entry-link")).toHaveCount(1);
  await expect(page.locator(".relay-end-device")).toHaveCount(2);
  await expect(page.locator(".relay-end-wireless")).toHaveCount(2);
  await expect(page.locator(".relay-side-node")).toHaveCount(0);
});
