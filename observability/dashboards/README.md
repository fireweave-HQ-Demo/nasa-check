# NASA Explorer: release 1 baseline dashboard

Create a dashboard named **NASA Explorer · R1 baseline** in OpenObserve and add one panel per
query below (SQL mode, time range "last 24 hours" or "last 7 days").

The OpenObserve browser SDK flattens RUM events into the `_rumdata` stream. Field names below
follow that flattening (`usr.id` → `usr_id`, custom action context → `context_*`). **Check them
against the stream's schema** (Logs → `_rumdata` → field list) after the first sessions arrive,
and adjust if your OpenObserve version names them differently.

Every event is tagged `service = 'nasa-explorer'`, `env`, `version`, and the global context
`context_release = 'r1'`.

## Traffic

**Active devices** (stat)

```sql
SELECT COUNT(DISTINCT usr_id) AS devices
FROM "_rumdata"
WHERE service = 'nasa-explorer' AND type = 'view'
```

**New vs returning devices** (pie)

```sql
SELECT context_device_id_new AS new_device, COUNT(*) AS loads
FROM "_rumdata"
WHERE service = 'nasa-explorer' AND type = 'action' AND action_target_name = 'app_loaded'
GROUP BY new_device
```

**Page views by route** (bar)

```sql
SELECT view_url_path_group AS route, COUNT(*) AS views
FROM "_rumdata"
WHERE service = 'nasa-explorer' AND type = 'view'
GROUP BY route
ORDER BY views DESC
```

## Feature usage

**Custom events over time** (line, one series per event)

```sql
SELECT histogram(_timestamp, '1 hour') AS t, action_target_name AS event, COUNT(*) AS n
FROM "_rumdata"
WHERE service = 'nasa-explorer' AND type = 'action' AND action_type = 'custom'
  AND action_target_name NOT IN ('api_call')
GROUP BY t, event
ORDER BY t
```

**Lightbox opens by source** (bar)

```sql
SELECT context_source AS source, COUNT(*) AS opens
FROM "_rumdata"
WHERE service = 'nasa-explorer' AND action_target_name = 'lightbox_opened'
GROUP BY source
```

**Searches: suggested vs typed, and zero-result rate** (table)

```sql
SELECT context_suggested AS suggested,
       COUNT(*) AS searches,
       SUM(CASE WHEN context_results = 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS zero_result_pct
FROM "_rumdata"
WHERE service = 'nasa-explorer' AND action_target_name = 'search_performed'
GROUP BY suggested
```

## Health

**Error rate (JS errors per 100 views)** (stat)

```sql
SELECT SUM(CASE WHEN type = 'error' THEN 1 ELSE 0 END) * 100.0
       / NULLIF(SUM(CASE WHEN type = 'view' THEN 1 ELSE 0 END), 0) AS errors_per_100_views
FROM "_rumdata"
WHERE service = 'nasa-explorer'
```

**NASA API latency p50 / p95 by endpoint** (table)

```sql
SELECT context_endpoint AS endpoint,
       approx_percentile_cont(context_duration_ms, 0.5) AS p50_ms,
       approx_percentile_cont(context_duration_ms, 0.95) AS p95_ms,
       COUNT(*) AS calls
FROM "_rumdata"
WHERE service = 'nasa-explorer' AND action_target_name = 'api_call'
GROUP BY endpoint
```

**NASA API errors by kind** (bar), including rate limits (`rate_limited`)

```sql
SELECT context_endpoint AS endpoint, context_kind AS kind, COUNT(*) AS errors
FROM "_rumdata"
WHERE service = 'nasa-explorer' AND action_target_name = 'api_error'
GROUP BY endpoint, kind
ORDER BY errors DESC
```

**Core Web Vitals p75 by route** (table)

```sql
SELECT view_url_path_group AS route,
       approx_percentile_cont(view_largest_contentful_paint, 0.75) / 1e6 AS lcp_p75_ms,
       approx_percentile_cont(view_interaction_to_next_paint, 0.75) / 1e6 AS inp_p75_ms,
       approx_percentile_cont(view_cumulative_layout_shift, 0.75) AS cls_p75
FROM "_rumdata"
WHERE service = 'nasa-explorer' AND type = 'view'
GROUP BY route
```

(RUM durations are in nanoseconds, hence `/ 1e6`.)

## Release 2

Release 2 records each Fireweave decision with `addFeatureFlagEvaluation('asteroid-tracker', …)`.
Every panel above can then be split by `feature_flags_asteroid-tracker` to compare visitors with
the feature on and off during the rollout.
