# Setup: NASA key, Docker and OpenObserve

## 1. NASA API key

1. Sign up at <https://api.nasa.gov> (free, instant).
2. Put the key in `.env.local` (for `npm run dev`) and `.env.docker` (for Docker):
   ```
   VITE_NASA_API_KEY=your-key
   ```
3. Both files are gitignored; never commit keys.

Without a key the app uses NASA's shared `DEMO_KEY`, which is limited to roughly 30 requests per
hour per IP, and shows a notice in development.

> Vite embeds `VITE_*` values in the browser bundle, so anyone can read the NASA key from the
> deployed site. That's acceptable for a free NASA key. Hiding it would need a server-side proxy.

## 2. OpenObserve Cloud (RUM, replay, logs)

1. Sign in to OpenObserve Cloud and pick the organization for this demo.
2. Go to **Ingestion → Real User Monitoring (RUM)** and create a RUM token / application.
3. Copy the values it shows into `.env.local` (as `VITE_OO_*`) or `.env.docker` (as `OO_*`):
   ```
   VITE_OO_SITE=api.openobserve.ai
   VITE_OO_ORG=<organization identifier>
   VITE_OO_APP_ID=<application id>
   VITE_OO_CLIENT_TOKEN=<rum client token>
   ```
   The RUM client token is designed to be public. Never put an OpenObserve user password or
   ingestion basic-auth credentials in a `VITE_*` variable.
4. Run `npm run dev`, click around, then check in OpenObserve:
   - **RUM → Sessions**: your session, with replay.
   - **Logs**, stream `_rumlog`: logs from `nasa-explorer`.
   - **Logs**, stream `_rumdata`: views, actions (custom events), errors and resources.
5. Build the baseline dashboard from
   [observability/dashboards/README.md](../observability/dashboards/README.md).

If the RUM requests are blocked (ad blockers often block RUM endpoints), the app keeps working;
telemetry is simply lost for that browser.

## 3. Docker (local deployment)

1. Install Docker Desktop (or OrbStack) and start it. Check with `docker version`.
2. Create the runtime config:
   ```bash
   cp .env.docker.example .env.docker
   # set NASA_API_KEY=your-key
   ```
3. Build and start: `npm run docker:up`, then open <http://localhost:8080>.
4. Check:
   - `docker compose ps` shows the container as `healthy`.
   - <http://localhost:8080/config.js> shows your values.
   - Deep links such as <http://localhost:8080/today/1998-07-06> load directly.
5. Changed a key? `docker compose up -d` (restart, no rebuild). Changed the code? `npm run docker:up`.
