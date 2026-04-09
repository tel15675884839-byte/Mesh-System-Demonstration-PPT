const { test, expect } = require("@playwright/test");

test("mesh page starts in revealed stage mode", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/pages/mesh.html", {
    waitUntil: "networkidle"
  });

  await expect(page.locator(".page-mesh")).toHaveClass(/is-revealed/);
});

test("distance page starts in revealed stage mode", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/pages/distance.html", {
    waitUntil: "networkidle"
  });

  await expect(page.locator(".page-distance")).toHaveClass(/is-revealed/);
});
