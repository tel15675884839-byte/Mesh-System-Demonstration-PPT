const { test, expect } = require("@playwright/test");

test("distance impact labels stay hidden until each active stage is clicked", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/pages/distance.html?reveal=1", {
    waitUntil: "networkidle"
  });

  const openImpact = page.locator(".metric-open-highlight");
  const relayImpact = page.locator(".relay-total-distance");

  await expect(openImpact).toBeHidden();
  await expect(relayImpact).toBeHidden();

  await page.locator("#distance-scene-open").click();
  await expect(openImpact).toBeVisible();
  await expect(relayImpact).toBeHidden();

  await page.locator('.scene-toggle[aria-label="Show mesh relay 16km scene"]').click();
  await expect(openImpact).toBeHidden();
  await expect(relayImpact).toBeHidden();

  await page.locator("#distance-scene-relay").click();
  await expect(relayImpact).toBeVisible();
});

test("distance scene toggles render as arrow controls with accessible labels", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/pages/distance.html?reveal=1", {
    waitUntil: "networkidle"
  });

  await expect(page.locator(".scene-toggle")).toHaveCount(2);
  await expect(page.locator(".scene-toggle-arrow")).toHaveCount(2);
  await expect(page.locator('.scene-toggle[aria-label="Show open area 500m scene"]')).toHaveCount(1);
  await expect(page.locator('.scene-toggle[aria-label="Show mesh relay 16km scene"]')).toHaveCount(1);
});
