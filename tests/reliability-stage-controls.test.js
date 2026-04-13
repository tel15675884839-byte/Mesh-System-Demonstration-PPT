const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const reliabilityHtml = fs.readFileSync(path.join(rootDir, "pages", "reliability.html"), "utf8");
const reliabilityCss = fs.readFileSync(path.join(rootDir, "css", "pages", "reliability.css"), "utf8");
const reliabilityAnimationsCss = fs.readFileSync(path.join(rootDir, "css", "pages", "reliability-animations.css"), "utf8");
const reliabilityScript = fs.readFileSync(
  path.join(rootDir, "js", "pages", "reliability-animations.js"),
  "utf8"
);

test("reliability page removes scene-toggle controls and renders two stacked substages", () => {
  assert.doesNotMatch(
    reliabilityHtml,
    /reliability-stage-controls|btn-scene-response|btn-scene-path|scene-toggle/,
    "Expected High Reliability to remove the old scene-toggle controls."
  );

  assert.match(
    reliabilityHtml,
    /reliability-stage-stack[\s\S]*?reliability-substage-one-way[\s\S]*?ONE-WAY COMMUNICATION[\s\S]*?reli-connection-layer-one-way[\s\S]*?reli-animation-map-one-way[\s\S]*?reliability-substage-two-way[\s\S]*?TWO-WAY COMMUNICATION[\s\S]*?reli-connection-layer-two-way[\s\S]*?reli-animation-map-two-way/,
    "Expected High Reliability to render one-way and two-way substages inside the same stage card."
  );
});

test("reliability split-stage css defines a two-row stage stack and line variants", () => {
  assert.match(
    reliabilityCss,
    /\.reliability-stage-stack\s*\{[\s\S]*?(grid-template-rows:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)|grid-template-rows:\s*minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\))/,
    "Expected reliability.css to define a two-row stacked stage."
  );

  assert.match(
    reliabilityCss,
    /\.reliability-substage-label\s*\{/,
    "Expected reliability.css to style the per-stage label."
  );

  assert.match(
    reliabilityAnimationsCss,
    /\.reli-link-wired[\s\S]*?stroke-dasharray:\s*none[\s\S]*?\.reli-link-wireless[\s\S]*?stroke-dasharray:\s*[^;]+;[\s\S]*?\.reli-link-wireless-secondary\s*\{/,
    "Expected reliability animation styles to distinguish wired links, primary wireless links, and secondary wireless lanes."
  );
});

test("reliability script is stage-scoped and no longer references scene-toggle controls", () => {
  assert.doesNotMatch(
    reliabilityScript,
    /btn-scene-response|btn-scene-path|reli-animation-map(?!-(one-way|two-way))|reli-connection-layer(?!-(one-way|two-way))/,
    "Expected reliability-animations.js to stop using the removed single-stage scene-toggle wiring."
  );

  assert.match(
    reliabilityScript,
    /reli-animation-map-one-way/,
    "Expected reliability-animations.js to target the one-way animation map."
  );

  assert.match(
    reliabilityScript,
    /reli-animation-map-two-way/,
    "Expected reliability-animations.js to target the two-way animation map."
  );

  assert.match(
    reliabilityScript,
    /reli-connection-layer-one-way/,
    "Expected reliability-animations.js to target the one-way connection layer."
  );

  assert.match(
    reliabilityScript,
    /reli-connection-layer-two-way/,
    "Expected reliability-animations.js to target the two-way connection layer."
  );
});

test("reliability script uses wired snake links for panels and keeps the two-way sounder in the lower-left layout", () => {
  assert.match(
    reliabilityScript,
    /oneway-leader[\s\S]*?oneway-panel[\s\S]*?kind:\s*"wired"/,
    "Expected the one-way leader-to-panel link to be wired."
  );

  assert.match(
    reliabilityScript,
    /twoway-leader[\s\S]*?twoway-panel[\s\S]*?kind:\s*"wired"/,
    "Expected the two-way leader-to-panel link to remain the only wired link in the lower stage."
  );

  assert.match(
    reliabilityScript,
    /id:\s*"twoway-sounder"[\s\S]*?type:\s*"sounder"[\s\S]*?left:\s*"1[46-9]%?"[\s\S]*?top:\s*"7[2-9]%?"/,
    "Expected the two-way layout to keep a sounder device in the lower-left corner."
  );

  assert.match(
    reliabilityScript,
    /from:\s*"twoway-node",\s*to:\s*"twoway-det-top"[\s\S]*?from:\s*"twoway-det-top",\s*to:\s*"twoway-leader"/,
    "Expected the upper middle detector to connect to both the left node and the right leader."
  );

  assert.match(
    reliabilityScript,
    /from:\s*"twoway-node",\s*to:\s*"twoway-det-bottom"[\s\S]*?from:\s*"twoway-det-bottom",\s*to:\s*"twoway-leader"/,
    "Expected the lower middle detector to connect to both the left node and the right leader."
  );

  assert.match(
    reliabilityScript,
    /WIRE(?:D)?_SNAKE_AMPLITUDE|const\s+WIRED_[A-Z_]*AMPLITUDE|link\.kind\s*===\s*"wired"[\s\S]*?path/,
    "Expected wired links to be rendered as larger snake curves."
  );

  assert.doesNotMatch(
    reliabilityScript,
    /kind:\s*"wireless-branch"/,
    "Expected the branch lines in the two-way stage to stop using the previous single-line branch mode."
  );

  assert.match(
    reliabilityScript,
    /const\s+DOUBLE_LANE_OFFSET\s*=\s*[1-9](?:\.\d+)?;/,
    "Expected the two-way double-lane spacing to be defined explicitly."
  );

  assert.match(
    reliabilityScript,
    /phase:\s*"outbound"|nextPhase\s*=\s*"inbound"|secondaryKey[\s\S]*?animation\.onfinish|spawnParticleOnGeometry[\s\S]*?setTimeout|pendingReturn/,
    "Expected the double-lane particle animation to support a sequenced outbound-then-inbound flow."
  );
});

test("reliability animation css narrows the two-way double wireless lanes", () => {
  assert.match(
    reliabilityAnimationsCss,
    /\.reli-link-wired\s*\{[\s\S]*?stroke-width:\s*2(?:\.0)?;/,
    "Expected wired links to keep the full stroke width."
  );

  assert.match(
    reliabilityAnimationsCss,
    /\.reli-link-wireless\s*\{[\s\S]*?stroke-width:\s*1(?:\.0)?;/,
    "Expected the primary two-way wireless lane to be reduced to half width."
  );

  assert.match(
    reliabilityAnimationsCss,
    /\.reli-link-wireless-secondary\s*\{[\s\S]*?stroke-width:\s*1(?:\.0)?;/,
    "Expected the secondary two-way wireless lane to be reduced to half width."
  );

  assert.doesNotMatch(
    reliabilityAnimationsCss,
    /\.reli-link-branch\s*\{[\s\S]*?stroke-dasharray:\s*none/,
    "Expected the former solid branch-line style to be removed."
  );
});

test("reliability animation polish keeps two-way traffic readable without changing travel speed", () => {
  assert.match(
    reliabilityAnimationsCss,
    /\.reli-particle\s*\{[\s\S]*?width:\s*[45](?:\.0)?px;[\s\S]*?height:\s*[45](?:\.0)?px;/,
    "Expected reliability particles to be reduced in size for a cleaner signal effect."
  );

  assert.match(
    reliabilityAnimationsCss,
    /\.reli-link-wireless\s*\{[\s\S]*?stroke:\s*rgba\(0,\s*229,\s*255,[^)]+\);[\s\S]*?\.reli-link-wireless-secondary\s*\{[\s\S]*?stroke:\s*rgba\((?!0,\s*229,\s*255)/,
    "Expected outbound and return wireless lanes to use distinct colors."
  );

  assert.match(
    reliabilityAnimationsCss,
    /\.reliability-device\.signal-flash[\s\S]*?animation:\s*reli-device-signal/,
    "Expected receiving devices to gain a brief signal-flash state."
  );

  assert.match(
    reliabilityScript,
    /duration:\s*PARTICLE_DURATION_MS/,
    "Expected the particle animation to keep a consistent travel duration."
  );

  assert.match(
    reliabilityScript,
    /flashDeviceSignal\(|classList\.add\("signal-flash"\)/,
    "Expected the animation to briefly highlight devices when a signal arrives."
  );

  assert.match(
    reliabilityScript,
    /spawnParticlePair\([\s\S]*?particleKey:\s*`\$\{linkId\}:outbound`[\s\S]*?particleKey:\s*`\$\{linkId\}:inbound`[\s\S]*?reverseGeometry\(|reverseGeometry\([\s\S]*?spawnParticlePair\([\s\S]*?outbound[\s\S]*?inbound/,
    "Expected the two-way animation to use a pair of particles that start from opposite ends and travel in opposite directions."
  );
});
