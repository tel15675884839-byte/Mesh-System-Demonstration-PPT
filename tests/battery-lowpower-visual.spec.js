const { test, expect } = require("@playwright/test");

test("battery low-power graphic keeps a visible square canvas", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/pages/battery.html", {
    waitUntil: "networkidle"
  });

  const graphic = page.locator(".battery-feature-lowpower .circuit-area");
  const stage = page.locator(".battery-feature-lowpower .battery-mini-stage");
  const title = page.locator(".battery-feature-lowpower .demo-text-bottom");

  await expect(graphic).toBeVisible();
  await expect(stage).toBeVisible();
  await expect(title).toBeVisible();

  const box = await graphic.boundingBox();
  const stageBox = await stage.boundingBox();
  const titleBox = await title.boundingBox();

  expect(box).not.toBeNull();
  expect(stageBox).not.toBeNull();
  expect(titleBox).not.toBeNull();
  expect(box.width).toBeGreaterThanOrEqual(160);
  expect(box.height).toBeGreaterThanOrEqual(160);
  expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(24);
  expect(titleBox.y + titleBox.height).toBeLessThanOrEqual(stageBox.y + stageBox.height);
});

test("battery maintenance demo fits fully inside its stage without a floating title card", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/pages/battery.html", {
    waitUntil: "networkidle"
  });

  const titleCards = page.locator(".battery-feature-card");
  const heading = page.locator(".battery-feature-maintenance .battery-feature-heading");
  const stage = page.locator(".battery-feature-maintenance .battery-mini-stage");
  const demo = page.locator(".battery-feature-maintenance .waste-demo");

  await expect(titleCards).toHaveCount(0);
  await expect(heading).toBeVisible();
  await expect(stage).toBeVisible();
  await expect(demo).toBeVisible();

  const stageBox = await stage.boundingBox();
  const demoBox = await demo.boundingBox();

  expect(stageBox).not.toBeNull();
  expect(demoBox).not.toBeNull();
  expect(demoBox.y + demoBox.height).toBeLessThanOrEqual(stageBox.y + stageBox.height);
});
