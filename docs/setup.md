# Setup: NASA key, OpenObserve and Vercel

## 1. NASA API key

1. Sign up at <https://api.nasa.gov> (free, instant).
2. Put the key in `.env.local`:
   ```
   VITE_NASA_API_KEY=your-key
   ```
3. `.env.local` is gitignored; never commit keys. On Vercel, add it as an environment variable.

Without a key the app uses NASA's shared `DEMO_KEY`, which is limited to roughly 30 requests per
hour per IP, and shows a notice in development.

> Vite embeds `VITE_*` values in the browser bundle, so anyone can read the NASA key from the
> deployed site. That's acceptable for a free NASA key. Hiding it would need a server-side proxy.

## 2. OpenObserve Cloud (RUM, replay, logs)

1. Sign in to OpenObserve Cloud and pick the organization for this demo.
2. Go to **Ingestion → Real User Monitoring (RUM)** and create a RUM token / application.
3. Copy the values it shows into `.env.local` (and Vercel):
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

## 3. Vercel

1. **Add New → Project**, import `fireweave-HQ-Demo/nasa`.
2. Framework preset: Vite (already set in `vercel.json`).
3. Environment variables:

   | Name                | Production         | Preview            |
   | ------------------- | ------------------ | ------------------ |
   | `VITE_NASA_API_KEY` | your key           | your key           |
   | `VITE_OO_*`         | OpenObserve values | OpenObserve values |
   | `VITE_APP_ENV`      | `production`       | `preview`          |

4. Deploy. Check that deep links such as `/today/2024-01-01` and `/explore?q=mars` load
   directly (handled by the rewrite in `vercel.json`).
