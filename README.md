# just a blogspot wrapper

A minimalist React SPA for https://pakyinwww.blogspot.com. A white sky, solid grey entries, black outline balloons you can pop, and two sparse outline clouds drifting slowly from left to right.

## Run locally

```sh
npm install
npm run dev
```

`npm run build` creates a static site in `dist/`. `npm run preview` serves that production build locally.

## GitHub Pages deployment

`.github/workflows/deploy-pages.yml` runs on pushes to `main` or manually from the Actions tab. It builds with Node.js 24, checks out and pulls `pakyinwww/pakyinwww.github.io` on `master`, replaces all destination files with `dist/` while preserving `.git`, commits the changes, and pushes normally without rewriting history. `.nojekyll` tells GitHub Pages to serve the Vite build directly.

Deployment requires an SSH key pair dedicated to the destination repository:

- Add the public key to `pakyinwww/pakyinwww.github.io` under **Settings → Deploy keys**, with **Allow write access** enabled.
- Store the private key in `pakyinwww/personal-website` under **Settings → Secrets and variables → Actions**, named `PAGES_DEPLOY_KEY`.
- In the destination's **Settings → Pages**, choose **Deploy from a branch**, **master**, **/(root)**.

The published site is https://pakyinwww.github.io/. No Blogger API key is needed. Hash routes work on GitHub Pages without rewrite rules.

Until `PAGES_DEPLOY_KEY` is configured, the workflow builds the app and skips publishing with a setup notice. Once the key is configured, run the workflow manually or push a change to `main` to deploy.

## Blogger integration

Live posts come from the blog's public JSONP feed (no API key required), five at a time. Post HTML is sanitized with DOMPurify. Hash routes let individual entries and the contact page work on static hosting without rewrite rules. Publishing stays on Blogspot.

The contact page links to Blogspot until an actual contact address is supplied. No contact form or email address is invented. The page title lives in the HTML head; it isn't shown on the page.

The layout stops growing at 1000px. Solid grey cards cover the balloons and clouds behind them. Balloons respond to click/tap outside the cards, and sky animations stop when reduced motion is enabled.

## Icons

The home, menu, and close SVGs are from [Lucide](https://lucide.dev/icons/house), stored locally in `public/icons/`. Their ISC and applicable Feather MIT licence notices are retained in `public/icons/LICENSE.txt`.

Below 768px, navigation shows the home icon and hamburger menu. At 768px and above, it shows Blog and Contact as direct text links.
