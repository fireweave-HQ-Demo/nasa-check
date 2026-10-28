<!-- fireweave:begin role=agents-core format=1 sha256=a3339ae59def143e41d8f0d8037562c1f421c320d07e2e4056d3c4828949d72f -->
## FireWeave — rollout contract

FireWeave ships every behaviour change behind a control point, so the change can be ramped up and rolled back after it ships.

**What you need.** Steps 1, 3 and 4 need FireWeave's MCP tools `upsert_rollout_manifest` and `assert_dev_checklist` (the FireWeave plugin); no `fw` command authors a manifest. If those tools are not available here (a cloud agent, CI, a code reviewer, an editor without FireWeave), do not stop: do step 2, open the pull request, and end your summary or the pull request description with the pending line below. Never write a manifest file and never invent `chg_`/`stmp_` ids. That hand-off is not a forbidden backfill.

**Classify first, in one line:** `change` (observable behaviour moves) · `inquiry` · `brainstorm` · `infra-only` (config, docs, formatting, tests with no behaviour delta). Only `change` runs the order below; when unclear, it is a `change`.

### HARD ORDER — every change

1. **Manifest first.** `upsert_rollout_manifest` `{ feature, manifest, baseContentHash }`: `null` means no row yet; on `conflict`, re-apply your change on `current` and retry. FireWeave stores the manifest: do not write a manifest file. Mint `chg_<ULID>` and one `stmp_<ULID>` per surface, and append each stamp to its surface's `FW_STAMPS`.
2. **A control point, anchored.** Gate the new behaviour behind a control point read with default `false`, and put `// @fireweave-controlpoint <key>` at every evaluation site as you write it. To try it locally, give the key the local value `true` in the surface's control-points file.
   - web: `fw.controlPoints.getBooleanValue('<key>', false)` from `@fireweaveai/web-sdk/start` (no per-call context); local values in `src/fireweave/control-points.ts`
3. **Signals at each control point.** Reuse a metric the app already emits, add one in the same edit, or record `noSignalNeeded` with a reason. Amend the manifest with the same tool, `baseContentHash` set to the row you wrote.
4. **Check.** `assert_dev_checklist` `{ feature }` must pass; stop on any block.
5. **Open a pull request.** Your work ends there.

**Pending line** (when steps 1, 3 and 4 could not run): `FireWeave rollout package pending: control point <key> is anchored on this branch; a developer with FireWeave tools completes steps 1, 3 and 4 here.`

**Reviewing a pull request:** point out behaviour changes that have no control point. Do not ask for manifest files.

**Absence has names.** Only `never-authored` means author a manifest. `not-fetched` → `fw sync`; `not-authorized` → withheld, not absent; `server-unavailable` → retry; `queued` → drain `.fireweave/.queue/`.

**Apps:** `.` (web). Each app's FireWeave files are listed under Rollout-ready layout in `.fireweave/agent-instructions.md`.

**When you need more,** read `.fireweave/agent-instructions.md`: Manifest contract · Deriving metrics · Cohort identity · How to emit a metric (per app) · FireWeave SDK configuration (per language).
<!-- fireweave:end role=agents-core -->
