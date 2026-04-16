const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const responseCss = fs.readFileSync(path.join(rootDir, "css", "pages", "response.css"), "utf8");

test("response title uses the shared single-line hero styling", () => {
  assert.match(
    responseCss,
    /\.response-hero-spotlight h2\s*\{[\s\S]*?font-size:\s*clamp\(3\.8rem,\s*5\.3vw,\s*4\.9rem\);[\s\S]*?line-height:\s*0\.96;[\s\S]*?letter-spacing:\s*-0\.055em;[\s\S]*?white-space:\s*nowrap;/,
    "Expected Rapid Response to use the same single-line hero title metrics as the sibling pages."
  );

  assert.doesNotMatch(
    responseCss,
    /\.response-hero-spotlight h2\s*\{[\s\S]*?(background-clip:\s*text|-webkit-text-fill-color:\s*transparent|linear-gradient\(to right, #fff, #94a3b8\))/,
    "Expected Rapid Response to inherit the shared solid battery-style hero title instead of a local gradient text treatment."
  );
});

test("response title keeps the shared responsive hero sizing", () => {
  assert.match(
    responseCss,
    /@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*?\.response-hero-spotlight h2\s*\{[\s\S]*?font-size:\s*clamp\(3rem,\s*8\.2vw,\s*4\.2rem\);/,
    "Expected Rapid Response to use the same tablet hero sizing as the sibling pages."
  );

  assert.match(
    responseCss,
    /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.response-hero-spotlight h2\s*\{[\s\S]*?font-size:\s*clamp\(2\.4rem,\s*10\.2vw,\s*3rem\);[\s\S]*?white-space:\s*nowrap;/,
    "Expected Rapid Response to keep the title on a single line on small screens."
  );
});
