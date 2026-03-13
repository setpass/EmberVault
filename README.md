# EmberVault

EmberVault is a forge-themed identity and vault progression prototype.

Secure actions are a **forge run**: build heat, extend combo chains, unlock artifacts through real conditions, and progress through heat-gated seasonal trials. Every mechanic is backend-calculated — the UI reflects actual state, not decoration.

## Core product loop

```
Action → Heat gain (×combo multiplier) → Rank progression
                                        → Artifact unlock check
                                        → Seasonal trial progress
                                        → Activity log entry
Idle   → Heat decay (−4/hr)
         Combo reset if outside 30-min window (−5 heat penalty)
```

## Repository structure

```
EmberVault/
├── apps/
│   ├── backend/
│   │   ├── .env.example
│   │   └── src/
│   │       ├── app.js
│   │       ├── server.js
│   │       ├── data/store.json
│   │       ├── middleware/
│   │       │   ├── auth.js              ← API key guard (write routes)
│   │       │   └── errorHandler.js
│   │       ├── routes/
│   │       │   ├── forge.js             ← Heat Chain engine routes
│   │       │   ├── collectionFactory.js
│   │       │   ├── profile.js
│   │       │   └── root.js
│   │       ├── services/
│   │       │   ├── forgeEngine.js       ← Heat / combo / artifact / trial logic
│   │       │   └── dataService.js
│   │       └── utils/fileStore.js       ← Write-locked JSON persistence
│   └── frontend/
│       ├── .env.example
│       └── src/
│           ├── App.jsx                  ← Nav routing, live forge state
│           ├── components/
│           │   ├── HeatChain.jsx        ← Live engine UI + countdown + trials
│           │   ├── ArtifactShelf.jsx    ← Catalog, per-artifact progress, expand
│           │   ├── ActivityFeed.jsx
│           │   ├── VaultLedger.jsx
│           │   ├── WalletPanel.jsx
│           │   └── PermissionsPanel.jsx
│           ├── lib/
│           │   ├── api.js               ← Full read/write client + forgeApi
│           │   └── wallets.js
│           └── styles/app.css
├── package.json
└── README.md
```

## Local development

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp apps/backend/.env.example  apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Both files use the same key — frontend sends `x-api-key`, backend checks it on all write requests.

```
# apps/backend/.env
EMBERVAULT_API_KEY=your-secret-key-here
NODE_ENV=development
PORT=4000

# apps/frontend/.env
VITE_API_KEY=your-secret-key-here
```

In development, if `EMBERVAULT_API_KEY` is unset the backend allows writes with a console warning. In production it rejects all write requests.

### 3. Run

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`

### Build / lint

```bash
npm run build
npm run lint
```

## Heat Chain mechanics

### Heat

| Rule | Value |
|------|-------|
| Max heat | 100 |
| Decay rate | −4 per idle hour |
| Combo reset penalty | −5 heat |

### Combo window

Actions within **30 minutes** of each other extend the combo chain. The combo multiplier scales as `1 + (comboCount − 1) × 0.15`, capped at **×2.5**. When the window expires without a new action, the combo resets and a −5 heat penalty is applied.

### Action heat values

| Action | Base heat |
|--------|-----------|
| `wallet_sign` | 18 |
| `season_complete` | 25 |
| `wallet_link` | 15 |
| `vault_save` | 12 |
| `credential_update` | 10 |
| `permission_change` | 8 |
| `activity_log` | 5 |

### Rank thresholds

| Heat | Rank |
|------|------|
| 0 | Apprentice Ember |
| 20 | Ironsmith |
| 40 | Forge Adept |
| 60 | Temper Knight |
| 75 | Master Temper |
| 90 | Starfire Forgemaster |

## Artifact catalog

| Artifact | Tier | Unlock condition |
|----------|------|-----------------|
| First Flame | Common | Link any wallet |
| Cinder Sigil | Rare | 5 total actions |
| Anvil Thread | Epic | Max combo of 5+ |
| Emberveil | Epic | 8 actions at White Heat (65%+) |
| Starcore Latch | Mythic | Peak heat ≥ 90 |
| Chainbreaker | Mythic | Reset combo, then rebuild to 5+ |
| Void Temper | Legendary | 20 total actions |

The `GET /api/forge/catalog` endpoint returns each artifact's `progress` (0–1 float) and `progressHint` string so the frontend can render per-artifact progress bars without knowing the conditions.

## Seasonal trials

Each trial is **heat-gated** — progress is only counted when the current heat meets the threshold. Trials are evaluated live from forge state on every `GET /api/forge` call.

| Trial | Heat required | Condition |
|-------|--------------|-----------|
| Strike Without Waste | 40% | 4 total actions |
| Twin Wallet Temper | 35% | 2 wallet links |
| Ledger Echo | 65% | 3 vault saves |

## API surface

### Forge engine

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/forge` | Full state: forge, artifacts, catalog (with progress), trials |
| GET | `/api/forge/catalog` | Artifact catalog with per-artifact progress |
| GET | `/api/forge/trials` | Seasonal trials with live progress + heat gate status |
| GET | `/api/forge/actions` | Valid action types + base heat values |
| POST | `/api/forge/action` | Trigger action → updates heat/combo/artifacts/activity |

`POST /api/forge/action` body:
```json
{ "actionType": "vault_save", "title": "Optional label" }
```

Response includes: `forge`, `heatGain`, `comboMultiplier`, `comboBroken`, `newArtifacts`, `catalog`, `trials`, `comboWindowRemainingMs`.

### Collections

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard` | Full dashboard snapshot |
| GET/PUT | `/api/profile` | Operator profile |
| GET/POST/PUT | `/api/credentials` | Credentials |
| GET/POST/PUT | `/api/permissions` | Permissions |
| GET/POST/PUT | `/api/activity` | Activity log |
| GET/POST/PUT | `/api/vault-records` | Vault records |

**Auth:** all write requests require `x-api-key` header.

### Frontend API client

```js
import { forgeApi, vaultRecordsApi } from './lib/api';

// Trigger a forge action
const result = await forgeApi.trigger('vault_save', { title: 'Sealed recovery runbook' });
// result.newArtifacts — any artifacts just unlocked
// result.comboWindowRemainingMs — ms until combo expires
// result.catalog — updated per-artifact progress

// Get full state (forge + catalog + trials)
const state = await forgeApi.state();
// state.forge.comboWindowRemainingMs — countdown to combo reset
// state.catalog[n].progress — 0-1 unlock progress per artifact
// state.trials[n].eligible — whether heat gate is met
```

## Architecture notes

### forgeEngine.js

All Heat Chain logic lives here — no calculations in the frontend. Key functions:

- `processAction(actionType, meta)` — mutates forge state, checks artifact unlocks, logs activity
- `getForgeState()` — reads store, applies decay, builds catalog with live progress, builds trial eligibility
- `applyDecay(forge)` — stateless: takes forge object, returns it with heat and combo decayed

### Write lock (fileStore.js)

Writes are serialised through a Promise chain. Concurrent requests queue rather than corrupt.

### Smart updateCollection (dataService.js)

- Object with `id` → patch single item
- Array body → bulk-replace collection
- Object without `id` → shallow merge (profile)

### Auth middleware (auth.js)

GET requests pass freely. Write requests (POST/PUT/DELETE) require `x-api-key: <EMBERVAULT_API_KEY>`.

### Nav routing (App.jsx)

Each sidebar item renders its own dedicated section. All sections share the same loaded forge state — no extra fetches on tab switch. After each forge action, `handleForgeUpdate` syncs forge + artifacts + catalog back into App state.

## What's not implemented yet

- Real wallet signature verification (needs `ethers.verifyMessage` + backend endpoint)
- Multi-user sessions (JWT or similar)
- Durable database (SQLite / Postgres)
- DELETE endpoints for collection items
- Seasonal state model with cron-based reset

## License

MIT

---

## New in this release

### Part 1 — Forge Timer (`ForgeTimer.jsx`)

Real-time combo countdown, break warning, and live heat decay. Accessible on **Forge Deck** and **Heat Chain** tabs.

- Polls `GET /api/forge/tick` every 10 seconds for authoritative state
- Client-side 1-second interval interpolates countdown and heat decay between syncs
- Yellow warning banner appears when combo has <2 minutes remaining
- Red broken banner + penalty message appear when combo expires
- Heat decay previews live (−4/hr) without waiting for a server round-trip
- SVG arc ring visualises remaining combo window

**To test:** trigger an action in Forge Control Panel, then watch the countdown and heat decay without refreshing.

### Part 2 — Artifact Panel (`ArtifactPanel.jsx`)

Replaces the previous `ArtifactShelf`. Available on **Forge Deck** and **Artifacts** tabs.

- 3-tab layout: **Forged** / **In progress** / **Locked**
- Click any card to open a modal with full detail: tier, rarity stars, description, trigger, effect, unlock progress bar, forge date
- Newly unlocked artifacts animate with an orange flash + "NEW" badge for 5 seconds
- Collection progress bar at top
- In-progress cards show per-artifact progress bar + hint ("X more actions needed")
- Locked cards are greyed and filtered out by default — only visible in the Locked tab

**To test:** fire `vault_save` several times; Cinder Sigil should unlock at 5 actions with the flash animation.

### Part 3 — Forge Control Panel (`ForgeControlPanel.jsx`)

Full action simulator. Available on the **Activity** tab.

- 7 action types listed with base heat, description, icon
- Selecting an action and pressing Fire calls `POST /api/forge/action` with the real API
- Result card shows: heat gain, combo multiplier, total heat, chain count
- If combo was broken, a red penalty alert appears
- Any newly unlocked artifacts appear in an animated "🔥 Artifact unlocked" flash
- Seasonal trial progress bars update inline after each action
- History of last 8 results is retained in session

**To test:** go to **Activity** tab, fire `wallet_link` then immediately fire `wallet_sign` — combo should extend and multiplier should show ×1.15. Fire `season_complete` for a big +25 heat jump.

### New backend endpoint

`GET /api/forge/tick` — lightweight polling endpoint (no auth required, GET only). Returns:

```json
{
  "heat": 42,
  "rank": "Forge Adept",
  "comboCount": 3,
  "comboChain": "3 strike chain",
  "comboActive": true,
  "comboWindowRemainingMs": 1740000,
  "heatHint": "...",
  "comboHint": "...",
  "lastActionAt": "2026-03-13T...",
  "decayPerHour": 4,
  "comboWindowMs": 1800000,
  "comboResetHeat": 5
}
```
