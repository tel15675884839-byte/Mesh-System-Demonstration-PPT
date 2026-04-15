const { test, expect } = require("@playwright/test");

async function readSlideOpacities(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll(".stage-slide")).map((slide) => {
      return Number.parseFloat(getComputedStyle(slide).opacity || "0");
    });
  });
}

test("product showcase background rotates one hero slide at a time", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/index.html?slide=products", {
    waitUntil: "networkidle"
  });

  await page.waitForTimeout(1000);
  const firstWindow = await readSlideOpacities(page);

  expect(firstWindow[0]).toBeGreaterThan(0.5);
  expect(firstWindow[1]).toBeLessThan(0.1);
  expect(firstWindow[2]).toBeLessThan(0.1);

  await page.waitForTimeout(8000);
  const secondWindow = await readSlideOpacities(page);

  expect(secondWindow[0]).toBeLessThan(0.1);
  expect(secondWindow[1]).toBeGreaterThan(0.5);
  expect(secondWindow[2]).toBeLessThan(0.1);
});
