# Cryptic Scratch Pad

A visual scratch pad for working out solutions to cryptic crossword clues — a single-page PWA built with Vite + React, deployed to GitHub Pages.

**Live app:** https://theinsomnolent.github.io/Cryptic-Scratch-Pad/

## How it works

1. **Enter a clue** (and optional letter enumeration).
2. **Highlight sections** of the clue by tapping words, marking each range as *definition*, *wordplay*, or *junk* (connector words).
3. **Tap a highlighted section** to tag its wordplay type (anagram, hidden word, acrostic, …) and jot down partial solutions.
4. **Branch a line of thought** at any point — “what if the other end is the definition?”, “what if it's an anagram, not an acrostic?”. Each branch starts as a copy of its parent that you can rework independently.
5. **Compare branches** in the solution tree and propose answers per branch.

Your working is saved locally in the browser, and the app works offline once installed.

## Development

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests (vitest)
npm run lint     # oxlint
npm run build    # production build in dist/
```

## Deployment

Pushes to `main` trigger the [Deploy to GitHub Pages](.github/workflows/deploy.yml) workflow, which lints, tests, builds, and publishes `dist/` to GitHub Pages.
