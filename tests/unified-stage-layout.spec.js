const { test, expect } = require("@playwright/test");

const pages = [
  "mesh.html",
  "distance.html",
  "battery.html",
  "reliability.html",
  "response.html",
  "installation.html"
];

for (const fileName of pages) {
  test(`${fileName} stacks the title area above the stage area`, async ({ page }) => {
    await page.goto(`http://127.0.0.1:8765/pages/${fileName}`, {
      waitUntil: "networkidle"
    });

    const title = page.locator(".page-copy h2").first();
    const stage = page.locator(".visual-card").first();

    await expect(title).toBeVisible();
    await expect(stage).toBeVisible();

    const titleBox = await title.boundingBox();
    const stageBox = await stage.boundingBox();

    expect(titleBox).not.toBeNull();
    expect(stageBox).not.toBeNull();
    expect(stageBox.y).toBeGreaterThan(titleBox.y + titleBox.height);
  });
}

test("battery.html renders three feature columns inside the main stage", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/pages/battery.html", {
    waitUntil: "networkidle"
  });

  const stage = page.locator(".battery-main-stage");
  const columns = page.locator(".battery-feature-column");
  const titleCards = page.locator(".battery-feature-card");
  const miniStages = page.locator(".battery-mini-stage");

  await expect(stage).toBeVisible();
  await expect(columns).toHaveCount(3);
  await expect(titleCards).toHaveCount(3);
  await expect(miniStages).toHaveCount(3);
});
