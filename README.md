# Velumix

This is the source for [velumix.github.io](https://velumix.github.io/), my
portfolio as a Roblox gameplay engineer and software engineer.

I built the site to show the work itself instead of filling a page with a long
list of tools. It covers five Roblox experiences I have helped ship, what I
worked on in each one, and how I approach gameplay systems that need to hold up
in production.

## What is on the site

- A rotating showcase of shipped Roblox experiences
- Engineering breakdowns for gameplay, AI, physics, networking, data, and
  performance work
- A closer look at the movement, creature simulation, and discovery systems
  behind Aquatica Observatory
- Live Roblox thumbnails, media, player counts, visits, ratings, and experience
  details
- Direct links to play the games and contact me

The featured work includes Aquatica Observatory, Ranger Emergency, Samurai
DUELS, Paint And SEEK!, and Escape a Garden.

## Built with

- React 19 and TypeScript
- Vinext for local development and the application build
- Vite for the static GitHub Pages build
- Roblox web APIs for current experience data
- GitHub Actions and GitHub Pages for deployment

## Run it locally

```bash
npm install
npm run dev
```

Create the same static build used by GitHub Pages:

```bash
npm run build:pages
```

`build:pages` refreshes the Roblox data first, then writes the finished site to
`pages-dist`.

## Roblox data

The media fetcher lives in `scripts/fetch-roblox-media.mjs`. It collects the
public information used by the portfolio and saves a build-ready snapshot to
`public/data/roblox-media.json`.

The Pages workflow refreshes that data on deployment and on its scheduled
runs. The committed JSON file provides a stable snapshot between refreshes. If
a required Roblox request fails, the deployment stops before replacing the
current live site.

## Deployment

Changes merged into `main` are built and deployed to GitHub Pages
automatically. The live site is available at
[velumix.github.io](https://velumix.github.io/).
