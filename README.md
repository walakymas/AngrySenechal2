# AngrySenechal2

The web frontend of **Senechal**, the companion tool of a *King Arthur Pendragon* tabletop campaign. It talks to the
Senechal backend (aiohttp API + Discord bot, see `../senechal/`) and gives the storyteller and the players a
browser view of the campaign.

## Features

| Route | Page |
|-------|------|
| `/character`, `/character/:name` | Character sheet: traits, passions, skills, belongings, marks; JSON editor; skill and trait rolls |
| `/team` | Overview of the player characters |
| `/feast` | Feast rules and the interactive seating plan |
| `/maps` | Campaign maps |
| `/rolls` | Roll log (latest 10–100 rolls of everybody or of one player, with a text filter) |
| `/chargen/:id` | Character generator |
| `/admin` | Administration, including the map admin |

Rolls made on the web are executed through the user's Discord channel, so the results appear both in Discord and in
the roll log.

## Tech stack

- Angular 22 with Angular Material, RxJS, zone.js
- [`jsoneditor`](https://github.com/josdejong/jsoneditor) for the JSON editor of the character page
  (`src/app/json-editor`)
- Node.js ≥ 22.22.3 (the Docker images use `node:22-alpine`)
- Express + helmet (`server.js`) as the production web server

The API client is `src/app/character.service.ts`; the API address is configured in `src/environments/`.

## Getting started

```sh
npm ci
npm run serve        # ng serve --host 0.0.0.0 --poll=1000, http://localhost:4200
```

The backend must be running as well (`python server.py` in `../senechal/`, or `docker compose up` from the
workspace root). The development API address is set in `src/environments/environment.ts`.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run serve` | Development server with live reload |
| `npm run build` | Production build into `dist/AngrySenechal2` (the default configuration is production) |
| `npm start` | Serve the built app with `server.js` |
| `npm test` | Karma unit tests |
| `npm run test:server` | Tests of `server.js` (plain node) |

Run one spec only: `npx ng test --include='**/rolls.component.spec.ts'`.

Headless unit tests: `ng test --watch=false --browsers=ChromeHeadlessNoSandbox` (set `CHROME_BIN` to a Chromium).

There is no linter and no e2e suite at the moment (`tslint` and `protractor` no longer exist); ESLint
(`ng add angular-eslint`) and a Playwright smoke test would be the natural replacements.

## Production

`npm start` serves the built app (`dist/AngrySenechal2`) with Express and helmet. Compression is left to the reverse
proxy (the `compression` package has a known denial-of-service advisory).

1. Copy `src/environments/environment.prod.ts.example` to `src/environments/environment.prod.ts` (git-ignored) and
   set the API address in it.
2. `npm run build`
3. `npm start`

Environment variables of `server.js`:

| Variable | Meaning |
|----------|---------|
| `PORT` | Listening port (default `8080`) |
| `REQUIRE_HTTPS` | `false` turns the https redirect off (default: on) |
| `TRUST_PROXY` | Number of reverse proxies in front (default `1`) |
| `ALLOWED_HOSTS` | Comma separated host names accepted by the redirect |
| `DIST_DIR` | Directory of the built app |

The Content-Security-Policy is **report-only**: open the app, look for `Content-Security-Policy-Report-Only`
violations in the browser console, then set `reportOnly: false` in `server.js` to enforce it.

### Docker

- `Dockerfile` – multi-stage production image: builds the app, then serves `dist/` with `server.js` as the
  unprivileged `node` user on port 8080. If `environment.prod.ts` is missing, the example file is used, so set the
  API address.
- `Dockerfile.dev` and `docker-compose.yml` – development server on port 4200 with the source mounted.
- The workspace-level `docker-compose.yml` starts the frontend together with the backend and the database.

## Icons

The check result icons (`src/assets/icons/`: laurel-crown, shield-reflect, broken-shield, broken-skull) come from
[game-icons.net](https://game-icons.net) (authors Lorc, Delapouite and contributors), licensed under
[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

The heraldic animals of the coat of arms generator (`src/app/arms/images/`) are Wikimedia Commons SVGs, mostly public
domain or CC0 drawings (A. C. Fox-Davies' *Complete Guide to Heraldry* and others); some are CC BY-SA 3.0/4.0 (the lions, crab,
spider, fly, scorpion, bat, sea-horse, fish, merman, ant). Authors and
licences per file: `src/app/arms/images/README.md`. `arms-images.ts` is generated from them by
`node scripts/build-arms-images.mjs`.
