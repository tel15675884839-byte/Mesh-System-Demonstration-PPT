const { test, expect } = require("@playwright/test");

test("reliability page renders two stacked substages in one visual card", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/pages/reliability.html", {
    waitUntil: "networkidle"
  });

  const card = page.locator(".reliability-stage-shell");
  const substages = page.locator(".reliability-substage");
  const oneWayLabel = page.getByText("ONE-WAY COMMUNICATION");
  const twoWayLabel = page.getByText("TWO-WAY COMMUNICATION");

  await expect(card).toBeVisible();
  await expect(substages).toHaveCount(2);
  await expect(oneWayLabel).toBeVisible();
  await expect(twoWayLabel).toBeVisible();

  const topBox = await substages.nth(0).boundingBox();
  const bottomBox = await substages.nth(1).boundingBox();

  expect(topBox).not.toBeNull();
  expect(bottomBox).not.toBeNull();
  expect(bottomBox.y).toBeGreaterThan(topBox.y + topBox.height - 4);
});

test("reliability page renders wired and wireless semantics correctly", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/pages/reliability.html", {
    waitUntil: "networkidle"
  });

  const oneWayDevices = page.locator("#reli-animation-map-one-way .reliability-device");
  const twoWayDevices = page.locator("#reli-animation-map-two-way .reliability-device");
  const oneWayWired = page.locator("#reli-connection-layer-one-way .reli-link-wired");
  const wiredLinks = page.locator("#reli-connection-layer-two-way .reli-link-wired");
  const wirelessLinks = page.locator("#reli-connection-layer-two-way .reli-link-wireless");
  const secondaryWireless = page.locator("#reli-connection-layer-two-way .reli-link-wireless-secondary");
  const lowerLeftSounder = page.locator("#twoway-sounder");

  await expect(oneWayDevices).toHaveCount(5);
  await expect(twoWayDevices).toHaveCount(7);
  await expect(oneWayWired).toHaveCount(1);
  await expect(wiredLinks).toHaveCount(1);
  await expect(wirelessLinks).toHaveCount(7);
  await expect(secondaryWireless).toHaveCount(7);
  await expect(lowerLeftSounder).toBeVisible();
});
