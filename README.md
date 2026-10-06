# AngrySenechal2

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.2.9.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Production server (`server.js`)

`npm start` serves the built app (`dist/AngrySenechal2`) with Express and helmet (compression is left to the
  reverse proxy: the `compression` package has a known denial-of-service advisory).

- Before `npm run build` copy `src/environments/environment.prod.ts.example` to `src/environments/environment.prod.ts`
  (git-ignored) and set the API address in it.
- Environment variables: `PORT` (8080), `REQUIRE_HTTPS` (`false` turns the https redirect off), `TRUST_PROXY`
  (number of reverse proxies, default 1), `ALLOWED_HOSTS` (comma separated host names for the redirect),
  `DIST_DIR`.
- The Content-Security-Policy is **report-only**: open the app, look for `Content-Security-Policy-Report-Only`
  violations in the browser console, then set `reportOnly: false` in `server.js` to enforce it.
- `npm run test:server` runs the tests of `server.js` (plain node).
- `ng build` now defaults to the production configuration.

## Angular 22 / Node 22

- Needs **Node ≥ 22.22.3** (the Docker images use `node:22-alpine`); use `npm ci`.
- Unit tests: `ng test --watch=false --browsers=ChromeHeadlessNoSandbox` (set `CHROME_BIN` to a Chromium); `npm run test:server` tests `server.js`.
- There is no linter and no e2e suite at the moment (`tslint` and `protractor` no longer exist); ESLint (`ng add angular-eslint`) and a Playwright smoke test are the natural replacements.
- The JSON editor of the character page is `src/app/json-editor` (a wrapper of `jsoneditor`).
