# AGENTS.md
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for project tasks. Verify repository facts before acting.
|Project:Mesh html |Type:static HTML/CSS/JS presentation repo for Wireless Mesh Fire Alarm System and related demo/preview pages.
|Primary Entry:open `index.html` for the merged landing flow and main deck shell|slides are iframe-loaded from `pages/*.html`.
|Structure:root pages live in `pages/`|shared styles in `css/{style.css,page-base.css,welcome.css}`|runtime scripts in `js/`|branding/media in `assets/`.
|Primary Page Map:`pages/opening.html` `overview.html` `mesh.html` `reliability.html` `response.html` `distance.html` `battery.html` `installation.html` `capacity.html` `product-showcase.html`.
|Standalone Files:root also contains focused preview/demo files such as `animation-preview.html` `demo.html` `test.html` `Battery demo.html`; inspect before assuming they are unused.
|Project Skills:repo-local skills exist in `skills/{discussion-first,presentation-title-morph}/SKILL.md`.
|Preview Command:preferred local launcher is `start-local-server.bat`|it opens `http://127.0.0.1:8765/index.html` and serves repo root with Python `http.server`.
|Preview Fallback:if batch script is unsuitable run `py -m http.server 8765` or `python -m http.server 8765` from repo root then open `/index.html`.
|Test Surface:root `tests/` is split between `*.test.js` files using `node:test` and `*.spec.js` files that require Playwright tooling.
|Test Command:use `node --test tests/*.test.js` for the Node-based root suite|run targeted files first when scope is narrow.
|Playwright Note:only run `*.spec.js` when a Playwright environment is available and verified; do not assume `@playwright/test` exists at repo root.
|Evidence Priority:repo files > existing project docs > local skills > user instruction for unverifiable repo facts.
|Anti Hallucination:never invent pages, scripts, selectors, commands, assets, or test coverage; mark uncertain facts `Unknown` until verified.
|Editing Rule:follow existing static-site patterns|when changing a page inspect its paired JS/CSS before editing|preserve iframe-based slide architecture unless task explicitly changes navigation model.
|Editing Rule:prefer shared styling/hooks in `css/` and `js/` over one-off inline scripts/styles unless the target file is intentionally standalone.
|Change Focus:for slide/content tasks modify the specific `pages/*.html` file plus any coupled `js/*page*.js` or shared shell files used by `index.html`.
|Accessibility Gate:keep semantic labels, button names, iframe titles, and navigation affordances intact or improved; this repo has tests for navigation and decorative-image semantics.
|Verification Gate:after edits run the narrowest relevant `*.test.js` files, and run a local browser check when changing layout, animation, navigation, or iframe behavior; use Playwright specs only when their environment is confirmed.
|Docs:design context currently lives in `DESIGN.md` `DESIGN-voltagent-template-guide.md` and `wireless_mesh_html_presentation_blueprint.md`; read them when the task touches architecture or presentation intent.
|Maintenance Trigger:update this file when entry points, directory layout, launch commands, or verification workflow change.
