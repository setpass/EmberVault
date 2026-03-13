# EmberVault

> **Forge storage into reputation.** Every vault action is a forge run — build heat, extend combo chains, unlock collectible artifacts, and progress through heat-gated seasonal trials.

---

## What is EmberVault?

EmberVault is a dark-themed identity and vault progression system. Instead of generic CRUD operations, every secure action — linking a wallet, saving a credential, updating permissions — becomes a **forge run** that feeds into a live Heat Chain engine.

The UI reflects actual backend state, not decoration. All heat calculations, combo logic, artifact unlocks, and seasonal trial progress are computed server-side.

```
Action  →  Heat gain (× combo multiplier)
                    →  Rank progression
                    →  Artifact unlock check
                    →  Seasonal trial progress
                    →  Activity log entry

Idle    →  Heat decay (−4/hr)
           Combo reset if outside 30-min window (−5 heat penalty)
```

---

## Stack

| Layer     | Tech                                        |
|-----------|---------------------------------------------|
| Frontend  | React 18, Vite, vanilla CSS (no UI library) |
| Backend   | Node.js, Express                            |
| Storage   | JSON file store (write-locked)              |
| Deploy    | Vercel (frontend) + any Node host (backend) |

---

## Project Structure

```
EmberVault/
├── apps/
│   ├── backend/
│   │   ├── .env.example
│   │   └── src/
│   │       ├── app.js                       ← Express app, CORS, auth middleware
│   │       ├── server.js                    ← Entry point, port binding
│   │       ├── data/store.json              ← Persistent JSON state
│   │       ├── middleware/
│   │       │   ├── auth.js                  ← API key guard (write routes)
│   │       │   └── errorHandler.js
│   │       ├── routes/
│   │       │   ├── forge.js                 ← Heat Chain engine routes
│   │       │   ├── profile.js
│   │       │   ├── achievements.js
│   │       │   ├── leaderboard.js
│   │       │   ├── quests.js
│   │       │   ├── inventory.js
│   │       │   ├── progression.js
│   │       │   ├── collectionFactory.js     ← Generic CRUD factory
│   │       │   └── root.js                  ← /api/dashboard
│   │       ├── services/
│   │       │   ├── forgeEngine.js           ← Heat / combo / artifact / trial logic
│   │       │   ├── dataService.js
│   │       │   ├── achievementsEngine.js
│   │       │   ├── inventoryEngine.js
│   │       │   ├── leaderboardEngine.js
│   │       │   ├── progressionEngine.js
│   │       │   └── questEngine.js
│   │       └── utils/fileStore.js           ← Write-locked JSON persistence
│   └── frontend/
│       ├── vercel.json                      ← Vercel SPA deploy config
│       ├── vite.config.js
│       ├── index.html
│       ├── .env.example
│       └── src/
│           ├── App.jsx                      ← Shell, nav routing, forge state
│           ├── components/
│           │   ├── HeatChain.jsx            ← Live heat engine UI + countdown
│           │   ├── ForgeTimer.jsx           ← Real-time combo countdown, decay
│           │   ├── ForgeControlPanel.jsx    ← Action simulator, result history
│           │   ├── ArtifactPanel.jsx        ← Catalog, progress, modal detail
│           │   ├── AchievementsPanel.jsx
│           │   ├── LeaderboardPanel.jsx
│           │   ├── QuestsPanel.jsx
│           │   ├── InventoryPanel.jsx
│           │   ├── ProgressionPanel.jsx
│           │   ├── ActivityFeed.jsx
│           │   ├── VaultLedger.jsx
│           │   ├── WalletPanel.jsx
│           │   └── PermissionsPanel.jsx
│           ├── lib/
│           │   ├── api.js                   ← Full read/write API client
│           │   └── wallets.js               ← MetaMask / Petra connectors
│           └── styles/app.css               ← Design system, all component styles
```

---

## Local Development

### 1. Install

```bash
# From repo root
cd apps/backend  && npm install
cd ../frontend   && npm install
```

### 2. Configure environment

```bash
cp apps/backend/.env.example  apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Both files share the same API key — the frontend sends it as `x-api-key`, the backend checks it on all write requests.

```env
# apps/backend/.env
EMBERVAULT_API_KEY=your-secret-key-here
NODE_ENV=development
PORT=4000

# apps/frontend/.env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_API_KEY=your-secret-key-here
```

> In development, if `EMBERVAULT_API_KEY` is unset the backend allows writes with a console warning. In production it rejects all write requests.

### 3. Run

Open two terminals:

```bash
# Terminal 1 — Backend
cd apps/backend && npm run dev

# Terminal 2 — Frontend
cd apps/frontend && npm run dev
```

| Service   | URL                       |
|-----------|---------------------------|
| Frontend  | http://localhost:5173      |
| Backend   | http://localhost:4000/api  |

---

## Deploy

### Frontend → Vercel

1. Import the repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `apps/frontend`
3. Vercel auto-detects Vite — build command `npm run build`, output `dist`
4. Add environment variables:

| Key                  | Value                          |
|----------------------|--------------------------------|
| `VITE_API_BASE_URL`  | Your backend URL + `/api`      |
| `VITE_API_KEY`       | Same key as backend            |

The `vercel.json` in `apps/frontend` handles SPA routing rewrites automatically.

### Backend → Railway / Render / VPS

> ⚠️ The backend writes to `store.json` at runtime. Vercel serverless functions do not support filesystem writes — the backend **must** run on a persistent server.

```bash
# Production start
cd apps/backend && npm run start:prod
```

Set these environment variables on your host:

| Key                    | Value              |
|------------------------|--------------------|
| `EMBERVAULT_API_KEY`   | Secret API key     |
| `NODE_ENV`             | `production`       |
| `PORT`                 | `4000` (or auto)   |
| `CORS_ORIGINS`         | Your Vercel URL    |

---

## Heat Chain Mechanics

### Heat stages

| Range   | Stage       |
|---------|-------------|
| 0–34%   | Cold Start  |
| 35–64%  | Tempered    |
| 65–84%  | White Heat  |
| 85–100% | Starfire    |

### Combo window

Actions within **30 minutes** of each other extend the combo chain. The multiplier scales as:

```
multiplier = 1 + (comboCount − 1) × 0.15   (capped at ×2.5)
```

When the window expires, the combo resets and a **−5 heat penalty** is applied.

### Action heat values

| Action              | Base heat |
|---------------------|-----------|
| `season_complete`   | 25        |
| `wallet_sign`       | 18        |
| `wallet_link`       | 15        |
| `vault_save`        | 12        |
| `credential_update` | 10        |
| `permission_change` | 8         |
| `activity_log`      | 5         |

### Rank thresholds

| Heat | Rank                 |
|------|----------------------|
| 0%   | Apprentice Ember     |
| 20%  | Ironsmith            |
| 40%  | Forge Adept          |
| 60%  | Temper Knight        |
| 75%  | Master Temper        |
| 90%  | Starfire Forgemaster |

---

## Artifact Catalog

| Artifact           | Tier      | Unlock Condition                          |
|--------------------|-----------|-------------------------------------------|
| First Flame        | Common    | Link any wallet                           |
| Cinder Sigil       | Rare      | 5 total actions                           |
| Anvil Thread       | Epic      | Build a combo chain of 5+                 |
| Emberveil          | Epic      | 8 actions while at White Heat (65%+)      |
| Starcore Latch     | Mythic    | Reach peak heat ≥ 90%                     |
| Chainbreaker       | Mythic    | Break a combo, then rebuild to 5+         |
| Void Temper        | Legendary | 20 total actions                          |

---

## Seasonal Trials

Each trial is **heat-gated** — progress only counts when current heat meets the threshold.

| Trial                  | Heat Required | Condition              |
|------------------------|---------------|------------------------|
| Strike Without Waste   | 40%           | 4 total actions        |
| Twin Wallet Temper     | 35%           | 2 wallet links         |
| Ledger Echo            | 65%           | 3 vault saves          |

---

## API Reference

### Forge Engine

| Method | Route                  | Description                                              |
|--------|------------------------|----------------------------------------------------------|
| GET    | `/api/forge`           | Full state: forge, artifacts, catalog, trials            |
| GET    | `/api/forge/tick`      | Lightweight poll — heat, combo countdown, rank           |
| GET    | `/api/forge/catalog`   | Artifact catalog with per-artifact progress (0–1)        |
| GET    | `/api/forge/trials`    | Seasonal trials with live progress + heat gate status    |
| GET    | `/api/forge/actions`   | Valid action types + base heat values                    |
| POST   | `/api/forge/action`    | Trigger an action → updates heat/combo/artifacts         |

**POST `/api/forge/action` body:**
```json
{ "actionType": "vault_save", "title": "Optional label" }
```

**Response includes:**
```json
{
  "forge": { "heat": 42, "rank": "Forge Adept", "comboChain": "3 strike chain" },
  "heatGain": 18,
  "comboMultiplier": 1.3,
  "comboBroken": false,
  "newArtifacts": [],
  "comboWindowRemainingMs": 1740000
}
```

### Collections

| Method      | Route                  | Description         |
|-------------|------------------------|---------------------|
| GET         | `/api/dashboard`       | Full dashboard snapshot |
| GET / PUT   | `/api/profile`         | Operator profile    |
| GET / POST  | `/api/credentials`     | Credentials         |
| GET / POST  | `/api/permissions`     | Permissions         |
| GET / POST  | `/api/activity`        | Activity log        |
| GET / POST  | `/api/vault-records`   | Vault records       |

**Auth:** all `POST`, `PUT`, `DELETE` requests require `x-api-key: <EMBERVAULT_API_KEY>` header.

---

## Frontend API Client

```js
import { forgeApi, vaultRecordsApi } from './lib/api';

// Trigger a forge action
const result = await forgeApi.trigger('vault_save', { title: 'Sealed recovery runbook' });
// result.newArtifacts        — any artifacts just unlocked
// result.comboWindowRemainingMs — ms until combo expires

// Get full forge state
const state = await forgeApi.state();
// state.forge.heat           — current heat %
// state.catalog[n].progress  — 0–1 unlock progress per artifact
// state.trials[n].eligible   — whether heat gate is met
```

---

## Architecture Notes

### `forgeEngine.js`
All Heat Chain logic lives here — zero calculations in the frontend.

- `processAction(actionType, meta)` — mutates forge state, checks artifact unlocks, logs activity
- `getForgeState()` — reads store, applies decay, builds catalog with live progress, builds trial eligibility
- `applyDecay(forge)` — stateless: takes forge object, returns it with heat and combo decayed

### Write lock (`fileStore.js`)
All writes are serialised through a Promise chain. Concurrent requests queue rather than corrupt `store.json`.

### Auth middleware
GET requests pass freely. Write requests require the `x-api-key` header. In `NODE_ENV=production`, a missing key returns `500`.

---

## Dashboard Sections

| Section        | Description                                          |
|----------------|------------------------------------------------------|
| Forge Deck     | Main dashboard — hero card, stats, season, activity  |
| Heat Chain     | Live heat engine, action trigger, artifact progress  |
| Artifacts      | Full catalog with 3-tab view and detail modal        |
| Season         | Current season progress and challenge list           |
| Achievements   | Unlock tracker with tier badges                      |
| Quests         | Active and completed quest list                      |
| Inventory      | Item drops from forge actions                        |
| Progression    | XP and level progression panel                       |
| Leaderboard    | Operator rankings                                    |
| Vault Ledger   | Protected records + permissions                      |
| Activity       | Forge control panel + recent action history          |

---

## Known Limitations

- No real wallet signature verification (scaffold only — needs `ethers.verifyMessage`)
- Single-user — no JWT or session management
- File-based storage — not suitable for multi-instance deploys
- No DELETE endpoints on collections
- No cron-based seasonal reset

---

## License

MIT
