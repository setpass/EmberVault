/**
 * ForgeEngine — EmberVault Heat Chain & Artifact Progression (v3 — cleaned)
 *
 * Bugs fixed vs v2:
 *  1. Chainbreaker unlock: comboWasBroken was checked before forge.comboCount was set
 *     to the rebuilt value, so "comboCount >= 5" on the first action after a break was
 *     always false (comboCount was reset to 1). Fixed: track a separate
 *     pendingRebuildCheck flag that accumulates cross-action.
 *  2. applyDecay: after decay reset comboCount to 0, processAction still read the
 *     pre-decay comboCount from store — fixed by reading the decayed forge object.
 *  3. actionsAtWhiteHeat: checked AFTER heat was potentially reduced by the
 *     combo-reset penalty, so the threshold was undercounted. Fixed: check before
 *     applying penalty.
 *  4. peakHeat: was set before the combo-reset penalty was applied, so it could record
 *     a peak that was immediately walked back. Fixed: set after penalty.
 */

import { readStore, writeStore } from '../utils/fileStore.js';

export const COMBO_WINDOW_MS  = 30 * 60 * 1000; // 30 min
export const DECAY_PER_HOUR   = 4;               // heat lost per idle hour
export const COMBO_RESET_HEAT = 5;               // heat penalty when combo resets
const MAX_HEAT = 100;

export const ACTION_HEAT = {
  vault_save:        12,
  credential_update: 10,
  permission_change:  8,
  wallet_link:       15,
  wallet_sign:       18,
  activity_log:       5,
  season_complete:   25,
};

const RANKS = [
  { threshold: 0,  label: 'Apprentice Ember' },
  { threshold: 20, label: 'Ironsmith' },
  { threshold: 40, label: 'Forge Adept' },
  { threshold: 60, label: 'Temper Knight' },
  { threshold: 75, label: 'Master Temper' },
  { threshold: 90, label: 'Starfire Forgemaster' },
];

// ─── Artifact catalog ─────────────────────────────────────────────────────────
export const ARTIFACT_CATALOG = [
  {
    id: 'artifact-first-flame',
    title: 'First Flame',
    description: 'Minted at the moment of first wallet ignition. Every forge begins with a single spark.',
    tier: 'Common',
    rarity: 1,
    trigger: 'First wallet link',
    effect: '+5 heat on next action',
    unlockHint: 'Link any wallet to ignite.',
    check:    (f) => (f.walletLinks ?? 0) >= 1,
    progress: (f) => Math.min(1, (f.walletLinks ?? 0) / 1),
    hint:     (f) => (f.walletLinks ?? 0) >= 1 ? 'Forged' : 'Link a wallet to unlock',
  },
  {
    id: 'artifact-cinder-sigil',
    title: 'Cinder Sigil',
    description: 'Forged after sustaining a three-step access run without policy drift.',
    tier: 'Rare',
    rarity: 2,
    trigger: '5 total actions',
    effect: '+Heat retention on idle',
    unlockHint: 'Complete 5 forge actions.',
    check:    (f) => (f.totalActions ?? 0) >= 5,
    progress: (f) => Math.min(1, (f.totalActions ?? 0) / 5),
    hint:     (f) => `${Math.max(0, 5 - (f.totalActions ?? 0))} more actions needed`,
  },
  {
    id: 'artifact-anvil-thread',
    title: 'Anvil Thread',
    description: 'Minted when a wallet link, credential update, and ledger save land in one chain.',
    tier: 'Epic',
    rarity: 3,
    trigger: 'Combo chain of 5+',
    effect: '+0.2 combo multiplier bonus',
    unlockHint: 'Build a 5-strike combo chain.',
    check:    (f) => (f.maxComboReached ?? 0) >= 5,
    progress: (f) => Math.min(1, (f.maxComboReached ?? 0) / 5),
    hint:     (f) => `${Math.max(0, 5 - (f.maxComboReached ?? 0))} more strikes to peak combo`,
  },
  {
    id: 'artifact-emberveil',
    title: 'Emberveil',
    description: 'Appears only to operators who sustain White Heat through 8 consecutive actions.',
    tier: 'Epic',
    rarity: 3,
    trigger: '8 actions at White Heat (65%+)',
    effect: '+Decay resistance',
    unlockHint: 'Reach 65% heat and stay there through 8 actions.',
    check:    (f) => (f.actionsAtWhiteHeat ?? 0) >= 8,
    progress: (f) => Math.min(1, (f.actionsAtWhiteHeat ?? 0) / 8),
    hint:     (f) => `${Math.max(0, 8 - (f.actionsAtWhiteHeat ?? 0))} actions at White Heat remaining`,
  },
  {
    id: 'artifact-starcore-latch',
    title: 'Starcore Latch',
    description: 'Awarded to operators who push the forge past Starfire threshold.',
    tier: 'Mythic',
    rarity: 4,
    trigger: 'Reach 90% heat (Starfire)',
    effect: '+Season progress on every action',
    unlockHint: 'Push heat to 90 or above.',
    check:    (f) => (f.peakHeat ?? 0) >= 90,
    progress: (f) => Math.min(1, (f.peakHeat ?? 0) / 90),
    hint:     (f) => `${Math.max(0, 90 - (f.peakHeat ?? 0))} heat to Starfire`,
  },
  {
    id: 'artifact-chainbreaker',
    title: 'Chainbreaker',
    description: 'Born from the discipline of rebuilding a broken chain. Reset and reforged to maximum.',
    tier: 'Mythic',
    rarity: 4,
    trigger: 'Rebuild combo to 5+ after a reset',
    effect: '+Extra heat on combo rebuild',
    unlockHint: 'Let your combo reset, then rebuild to 5+ strikes.',
    // FIX: check comboRebuilds which is persisted across actions (not checked mid-action)
    check:    (f) => (f.comboRebuilds ?? 0) >= 1,
    progress: (f) => {
      // Show partial progress based on how close they are to a rebuild
      if ((f.comboRebuilds ?? 0) >= 1) return 1;
      // If a break has happened, show progress toward 5 strikes
      if ((f.totalBreaks ?? 0) > 0) return Math.min(0.99, (f.maxComboReached ?? 0) / 5);
      return 0;
    },
    hint: (f) => {
      if ((f.comboRebuilds ?? 0) >= 1) return 'Forged';
      if ((f.totalBreaks ?? 0) === 0) return 'Let your combo expire first, then rebuild to 5 strikes';
      return `Chain broken ${f.totalBreaks}×. Rebuild to ${Math.max(0, 5 - (f.maxComboReached ?? 0))} more strikes`;
    },
  },
  {
    id: 'artifact-void-temper',
    title: 'Void Temper',
    description: 'Manifests only after 20 total actions — proof that the operator endures.',
    tier: 'Legendary',
    rarity: 5,
    trigger: '20 total actions',
    effect: '+Permanent combo window extension',
    unlockHint: 'Complete 20 forge actions across any sessions.',
    check:    (f) => (f.totalActions ?? 0) >= 20,
    progress: (f) => Math.min(1, (f.totalActions ?? 0) / 20),
    hint:     (f) => `${Math.max(0, 20 - (f.totalActions ?? 0))} actions to go`,
  },
];

// ─── Seasonal trials ──────────────────────────────────────────────────────────
export const SEASONAL_TRIALS = [
  {
    id: 'season-1',
    title: 'Strike Without Waste',
    description: 'Complete 4 forge actions in a single session while heat stays above 40%.',
    reward: 'Unlock Cinder lacquer',
    heatRequired: 40,
    actionsRequired: 4,
    progress: (f) => Math.min(1, (f.totalActions ?? 0) / 4),
    eligible: (f) => (f.heat ?? 0) >= 40,
  },
  {
    id: 'season-2',
    title: 'Twin Wallet Temper',
    description: 'Link both EVM and Aptos wallets while heat is at Tempered (35%+) or higher.',
    reward: '+12 seasonal heat',
    heatRequired: 35,
    actionsRequired: 2,
    progress: (f) => Math.min(1, (f.walletLinks ?? 0) / 2),
    eligible: (f) => (f.heat ?? 0) >= 35,
  },
  {
    id: 'season-3',
    title: 'Ledger Echo',
    description: 'Save 3 vault records while the forge is at White Heat (65%+).',
    reward: 'Artifact catalyst',
    heatRequired: 65,
    actionsRequired: 3,
    progress: (f) => Math.min(1, (f.vaultSaves ?? 0) / 3),
    eligible: (f) => (f.heat ?? 0) >= 65,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRank(heat) {
  return [...RANKS].reverse().find((r) => heat >= r.threshold)?.label ?? 'Apprentice Ember';
}

export function applyDecay(forge) {
  if (!forge.lastActionAt) return forge;
  const msSince    = Date.now() - new Date(forge.lastActionAt).getTime();
  const hoursSince = msSince / (1000 * 60 * 60);
  const decayed    = Math.max(0, forge.heat - Math.floor(hoursSince * DECAY_PER_HOUR));
  const comboStillActive = msSince < COMBO_WINDOW_MS;
  return {
    ...forge,
    heat: decayed,
    // FIX: reset comboCount to 0 (not undefined) when window expired
    comboCount:  comboStillActive ? (forge.comboCount ?? 0) : 0,
    comboActive: comboStillActive,
  };
}

function checkArtifactUnlocks(forge, unlockedIds) {
  return ARTIFACT_CATALOG
    .filter((a) => !unlockedIds.includes(a.id) && a.check(forge))
    .map((a) => ({
      id:          a.id,
      title:       a.title,
      description: a.description,
      tier:        `${a.tier} Artifact`,
      rarity:      a.rarity,
      trigger:     a.trigger,
      effect:      a.effect,
      unlockedAt:  new Date().toISOString(),
    }));
}

function buildCatalogEntry(artifact, unlockedMap, forge) {
  const unlocked = unlockedMap.has(artifact.id);
  return {
    id:           artifact.id,
    title:        artifact.title,
    description:  artifact.description,
    tier:         `${artifact.tier} Artifact`,
    rarity:       artifact.rarity,
    trigger:      artifact.trigger,
    effect:       artifact.effect,
    unlockHint:   artifact.unlockHint,
    unlocked,
    progress:     artifact.progress(forge),
    progressHint: unlocked ? 'Forged' : artifact.hint(forge),
    unlockedAt:   unlockedMap.get(artifact.id)?.unlockedAt ?? null,
  };
}

function buildTrialEntry(trial, forge) {
  return {
    id:               trial.id,
    title:            trial.title,
    description:      trial.description,
    reward:           trial.reward,
    heatRequired:     trial.heatRequired,
    actionsRequired:  trial.actionsRequired,
    progress:         trial.progress(forge),
    eligible:         trial.eligible(forge),
  };
}

function buildHints(forge, withinWindow, multiplier) {
  const remaining = 90 - forge.heat;
  const heatHint = forge.heat >= 90
    ? 'Maximum forge temperature — Starfire achieved.'
    : `${Math.max(0, remaining)} heat to Starfire.`;

  const comboHint = withinWindow && forge.comboCount > 1
    ? `Combo ×${multiplier.toFixed(2)} active — keep striking within 30 min.`
    : forge.comboCount >= 1
      ? 'Chain active. Strike again to extend.'
      : 'No active chain. Fire an action to start.';

  return { heatHint, comboHint };
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function processAction(actionType, metadata = {}) {
  const store      = await readStore();
  // FIX: apply decay BEFORE reading comboCount so decayed state is used
  let forge        = applyDecay({ ...store.forge });
  const artifacts  = store.artifacts ?? [];
  const unlockedIds = artifacts.map((a) => a.id);

  // 2. Combo logic
  const now  = Date.now();
  const lastAt = forge.lastActionAt ? new Date(forge.lastActionAt).getTime() : 0;
  // withinWindow uses the already-decayed forge (comboCount may be 0 after decay)
  const withinWindow    = lastAt > 0 && (now - lastAt) < COMBO_WINDOW_MS;
  // comboWasBroken: only true if there WAS a chain (decayed comboCount > 0 means window
  // was still active at last action but the pre-decay stored value was nonzero).
  // We use stored comboCount (before decay) to detect a break.
  const storedComboCount = store.forge?.comboCount ?? 0;
  const comboWasBroken   = !withinWindow && storedComboCount > 0 && lastAt > 0;

  if (withinWindow) {
    forge.comboCount = (forge.comboCount ?? 0) + 1;
  } else {
    forge.comboCount = 1;
  }

  // FIX: track total breaks for Chainbreaker progress hint
  if (comboWasBroken) {
    forge.totalBreaks = (forge.totalBreaks ?? 0) + 1;
  }

  // FIX: Chainbreaker — track comboRebuilds persistently.
  // A "rebuild" = this action pushed comboCount to 5+ AND a break happened before.
  // We check against totalBreaks > 0 (persisted) instead of comboWasBroken (this action only).
  if ((forge.totalBreaks ?? 0) > 0 && forge.comboCount >= 5) {
    // Only increment once — check that previous value was < 5
    const prevCombo = withinWindow ? (forge.comboCount - 1) : 0;
    if (prevCombo < 5) {
      forge.comboRebuilds = (forge.comboRebuilds ?? 0) + 1;
    }
  }

  forge.maxComboReached = Math.max(forge.maxComboReached ?? 0, forge.comboCount);

  // 3. Heat gain
  const baseHeat   = ACTION_HEAT[actionType] ?? 5;
  const multiplier = Math.min(1 + (forge.comboCount - 1) * 0.15, 2.5);
  const heatGain   = Math.round(baseHeat * multiplier);
  forge.heat       = Math.min(MAX_HEAT, (forge.heat ?? 0) + heatGain);

  // 4. Counters — check actionsAtWhiteHeat BEFORE applying combo-reset penalty
  forge.totalActions = (forge.totalActions ?? 0) + 1;
  forge.lastActionAt = new Date(now).toISOString();
  forge.lastActionType = actionType;

  // FIX: check White Heat BEFORE penalty deduction so it reflects actual heat during action
  if (forge.heat >= 65) {
    forge.actionsAtWhiteHeat = (forge.actionsAtWhiteHeat ?? 0) + 1;
  }
  if (actionType === 'wallet_link') forge.walletLinks = (forge.walletLinks ?? 0) + 1;
  if (actionType === 'vault_save')  forge.vaultSaves  = (forge.vaultSaves ?? 0) + 1;

  // Combo reset heat penalty (applied after white-heat check)
  if (comboWasBroken) {
    forge.heat = Math.max(0, forge.heat - COMBO_RESET_HEAT);
  }

  // FIX: peakHeat recorded AFTER penalty so it is accurate
  forge.peakHeat = Math.max(forge.peakHeat ?? 0, forge.heat);

  // 5. Rank + hints
  forge.rank       = getRank(forge.heat);
  forge.comboChain = `${forge.comboCount} strike chain`;
  const { heatHint, comboHint } = buildHints(forge, withinWindow, multiplier);
  forge.heatHint  = heatHint;
  forge.comboHint = comboHint;

  // 6. Artifact unlocks
  const newArtifacts = checkArtifactUnlocks(forge, unlockedIds);
  store.artifacts    = [...newArtifacts, ...artifacts];

  // 7. Activity log
  store.activity = [
    {
      id:             `activity-${now}`,
      title:          metadata.title || `${actionType.replace(/_/g, ' ')} completed`,
      description:    metadata.description
        || `Heat +${heatGain}${comboWasBroken ? ` (combo reset −${COMBO_RESET_HEAT})` : ''} — ×${multiplier.toFixed(2)} combo. Chain: ${forge.comboChain}.`,
      timestamp:      new Date(now).toISOString(),
      actionType,
      heatGain,
      comboMultiplier: multiplier,
      comboBroken:    comboWasBroken,
    },
    ...(store.activity ?? []).slice(0, 49),
  ];

  store.forge = forge;
  await writeStore(store);

  return {
    forge,
    heatGain,
    comboMultiplier: multiplier,
    comboBroken:     comboWasBroken,
    newArtifacts,
    actionType,
  };
}

export async function getForgeState() {
  const store    = await readStore();
  const forge    = applyDecay({ ...store.forge });
  const artifacts = store.artifacts ?? [];

  const unlockedMap = new Map(artifacts.map((a) => [a.id, a]));
  const catalog     = ARTIFACT_CATALOG.map((a) => buildCatalogEntry(a, unlockedMap, forge));
  const trials      = SEASONAL_TRIALS.map((t) => buildTrialEntry(t, forge));

  const lastAt = forge.lastActionAt ? new Date(forge.lastActionAt).getTime() : 0;
  const msSinceAction = lastAt ? Date.now() - lastAt : null;
  const comboWindowRemaining = msSinceAction !== null
    ? Math.max(0, COMBO_WINDOW_MS - msSinceAction)
    : 0;

  return {
    forge: {
      ...forge,
      comboWindowRemainingMs: comboWindowRemaining,
      comboActive: comboWindowRemaining > 0 && (forge.comboCount ?? 0) > 0,
    },
    artifacts,
    catalog,
    trials,
    totalUnlocked:   artifacts.length,
    totalArtifacts:  ARTIFACT_CATALOG.length,
  };
}
