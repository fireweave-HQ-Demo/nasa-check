# NASA Explorer

A small React app for exploring NASA imagery, built as a rollout demo for
[Fireweave](https://fireweave.ai).

- **Today:** the Astronomy Picture of the Day (APOD) for any date since 16 June 1995, with
  previous/next, a date picker, "Surprise me", video embeds and a full-screen viewer.
- **Gallery:** APOD in 30-day pages, newest first.
- **Explore:** search the NASA Image and Video Library.

Release 1 has an anonymous device id and OpenObserve monitoring (RUM, session replay, logs and
custom events), which provides the baseline metrics for the release 2 rollout. Release 2 adds an
asteroid tracker behind a Fireweave control point.

## Quick start

```bash
npm ci
cp .env.example .env.local   # add your NASA key (and OpenObserve values, optional)
npm run dev                  # http://localhost:5173
```

No network or keys? `npm run dev:mock` runs the whole app on generated sample data.

## Scripts

| Script             | What it does                                    |
| ------------------ | ----------------------------------------------- |
| `npm run dev`      | Dev server against the live NASA APIs           |
| `npm run dev:mock` | Dev server with mocked NASA APIs (offline demo) |
| `npm run build`    | Type-check, then production build into `dist/`  |
| `npm run preview`  | Serve the production build locally              |
| `npm test`         | Unit and component tests (Vitest, mocked APIs)  |
| `npm run lint`     | ESLint, including the layering rules below      |
| `npm run format`   | Prettier                                        |

## Configuration

For `npm run dev`, configuration comes from build-time `VITE_*` variables in `.env.local`, read in
`src/lib/config.ts`. In Docker the same settings come from runtime env vars instead (see
[Run with Docker](#run-with-docker)). Either way they reach the browser, so only browser-safe values
belong here.

| Variable               | Required | Notes                                                                                                                    |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `VITE_NASA_API_KEY`    | No       | Personal key from [api.nasa.gov](https://api.nasa.gov) (about 1,000 requests/hour). Falls back to the shared `DEMO_KEY`. |
| `VITE_OO_SITE`         | No       | OpenObserve ingestion host. Default `api.openobserve.ai`.                                                                |
| `VITE_OO_ORG`          | No       | OpenObserve organization identifier.                                                                                     |
| `VITE_OO_APP_ID`       | No       | RUM application id.                                                                                                      |
| `VITE_OO_CLIENT_TOKEN` | No       | RUM client token (browser-safe).                                                                                         |
| `VITE_APP_ENV`         | No       | `development`, `preview` or `production`. Tags all telemetry.                                                            |

Observability turns on only when the org, app id and client token are all set; otherwise it is a
no-op. Setup steps: [docs/setup.md](docs/setup.md).

## Project structure

```
src/
├── main.tsx              bootstrap: mocks (dev:mock only) → observability → identity → render
├── app/                  wiring: providers, routes, layout, identity (device id → telemetry)
├── features/             today/, gallery/, explore/ (pages, hooks, tests)
├── lib/
│   ├── config.ts         validated env
│   ├── nasa/             API client, APOD, Image Library, types
│   ├── identity/         anonymous device id
│   └── observability/    OpenObserve sink, typed event catalog, API timing
├── components/           shared UI: media, gallery grid, ui primitives
├── styles/               design tokens and global styles
├── utils/                dates, formatting
└── test/                 test setup, MSW handlers, sample data
```

Import rules (enforced by ESLint): `app` → `features` → `lib`/`components`. Features never
import each other, and `lib/nasa` never imports observability (it exposes a timing hook that
`lib/observability/apiTiming.ts` subscribes to).

## APOD data source

APOD moved from apod.nasa.gov to science.nasa.gov, and NASA's `api.nasa.gov` APOD service still
reads the old pages, so it returns a generic "NASA Science" placeholder for every date. The app
calls `api.nasa.gov` first, and when it gets the placeholder (or an error) it reads the
entry from science.nasa.gov's public WordPress API instead
(`src/lib/nasa/scienceApod.ts`). Once the placeholder is detected the app skips `api.nasa.gov` for
6 hours, so it doesn't wait ~6 s on every load. When NASA fixes their API, the app switches back on its own.

## Identity

Each browser gets an anonymous `dev_<uuid>` id, stored in localStorage under
`fireweave.device-id`, the same key and format the Fireweave web SDK uses, so visitors keep their
rollout bucket when release 2 arrives. The footer shows the short id. Add `?reset-id=1` to any
URL to simulate a brand-new visitor.

## Observability

Events are defined in `src/lib/observability/events.ts` (the only place event names live):

| Event                 | Properties                                                |
| --------------------- | --------------------------------------------------------- |
| `app_loaded`          | `device_id_new`, `storage_persisted`                      |
| `apod_viewed`         | `date`, `media_type`, `source`                            |
| `apod_random_clicked` | —                                                         |
| `apod_date_changed`   | `via` (`picker`, `prev`, `next`, `latest`)                |
| `gallery_page_loaded` | `range_days`, `count`, `page`                             |
| `lightbox_opened`     | `source` (`today`, `gallery`, `explore`)                  |
| `search_performed`    | `query_len`, `results`, `suggested` (never the raw query) |
| `search_more_loaded`  | `page`                                                    |
| `api_call`            | `endpoint`, `status`, `duration_ms`                       |
| `api_error`           | `endpoint`, `status`, `kind`                              |

Every event also carries `release=r1`, `app_version`, `env`, and the device id as the RUM user.
Session replay masks text typed into inputs. Dashboard queries:
[observability/dashboards](observability/dashboards/README.md).

## Run with Docker

The app ships as a small nginx image. Keys are **not** baked in at build time: when the container
starts, `docker/40-runtime-config.sh` writes `/config.js` from an allowlist of environment
variables, and the app reads it before falling back to build-time `VITE_*` values. One image works
with any keys; changing a key only needs a restart.

```bash
cp .env.docker.example .env.docker   # add NASA_API_KEY
npm run docker:up                    # build + start → http://localhost:8080
npm run docker:logs                  # follow logs
npm run docker:down                  # stop
```

| Variable (`.env.docker`)                            | Notes                                               |
| --------------------------------------------------- | --------------------------------------------------- |
| `NASA_API_KEY`                                      | Personal NASA key; falls back to `DEMO_KEY`.        |
| `APP_ENV`                                           | `production` (default), `preview` or `development`. |
| `FIREWEAVE_BROWSER_KEY`                             | Release 2. Public `fw_public_…` key.                |
| `OO_SITE`, `OO_ORG`, `OO_APP_ID`, `OO_CLIENT_TOKEN` | Later: OpenObserve RUM.                             |

Everything in `.env.docker` is served to browsers in `/config.js`, so only public keys belong
there. The script ignores values with unexpected characters.

The nginx config (`docker/nginx.conf`) serves deep links such as `/today/1998-07-06` with the app
shell, caches hashed assets for a year, never caches `index.html` or `config.js`, and answers
`/healthz` for the container health check.

## Credits

Imagery and data from [NASA Open APIs](https://api.nasa.gov) and the
[NASA Image and Video Library](https://images.nasa.gov). This project is not affiliated with or
endorsed by NASA.
