/**
 * AchievementsEngine — EmberVault Badges & Achievements System
 *
 * Tracks milestones beyond artifact unlocks:
 * - Activity-based badges (actions performed)
 * - Heat-based badges (temperature milestones)
 * - Streak-based badges (consecutive days)
 * - Social badges (wallet connections)
 * - Mastery badges (combo & skill)
 * - Secret/hidden badges (surprise unlocks)
 */

import { readStore, writeStore } from '../utils/fileStore.js';

// ─── Badge Rarity Tiers ───────────────────────────────────────────────────────
export const BADGE_TIERS = {
  BRONZE:    { label: 'Bronze',    color: '#cd7f32', xp: 10  },
  SILVER:    { label: 'Silver',    color: '#c0c0c0', xp: 25  },
  GOLD:      { label: 'Gold',      color: '#ffd700', xp: 50  },
  PLATINUM:  { label: 'Platinum',  color: '#e5e4e2', xp: 100 },
  LEGENDARY: { label: 'Legendary', color: '#ff6b35', xp: 250 },
};

// ─── Achievement Catalog ──────────────────────────────────────────────────────
export const ACHIEVEMENT_CATALOG = [

  // ── Forge Actions ──────────────────────────────────────────────────────────
  {
    id: 'ach-first-strike',
    title: 'First Strike',
    description: 'Fire your very first forge action.',
    icon: '⚡',
    tier: 'BRONZE',
    category: 'forge',
    secret: false,
    xpBonus: 0,
    check: (f, _a) => (f.totalActions ?? 0) >= 1,
    progress: (f, _a) => Math.min(1, (f.totalActions ?? 0) / 1),
    hint: 'Fire any forge action to unlock.',
  },
  {
    id: 'ach-ten-strikes',
    title: 'Tempered Blade',
    description: 'Complete 10 forge actions.',
    icon: '🔨',
    tier: 'BRONZE',
    category: 'forge',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.totalActions ?? 0) >= 10,
    progress: (f) => Math.min(1, (f.totalActions ?? 0) / 10),
    hint: (f) => `${Math.max(0, 10 - (f.totalActions ?? 0))} actions remaining.`,
  },
  {
    id: 'ach-fifty-strikes',
    title: 'Forge Veteran',
    description: 'Complete 50 forge actions.',
    icon: '⚒',
    tier: 'SILVER',
    category: 'forge',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.totalActions ?? 0) >= 50,
    progress: (f) => Math.min(1, (f.totalActions ?? 0) / 50),
    hint: (f) => `${Math.max(0, 50 - (f.totalActions ?? 0))} actions remaining.`,
  },
  {
    id: 'ach-century',
    title: 'Centurion',
    description: 'Complete 100 forge actions. A true operator.',
    icon: '💯',
    tier: 'GOLD',
    category: 'forge',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.totalActions ?? 0) >= 100,
    progress: (f) => Math.min(1, (f.totalActions ?? 0) / 100),
    hint: (f) => `${Math.max(0, 100 - (f.totalActions ?? 0))} actions remaining.`,
  },

  // ── Heat Milestones ────────────────────────────────────────────────────────
  {
    id: 'ach-first-heat',
    title: 'Kindle',
    description: 'Reach 35% heat for the first time.',
    icon: '🔥',
    tier: 'BRONZE',
    category: 'heat',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.peakHeat ?? 0) >= 35,
    progress: (f) => Math.min(1, (f.peakHeat ?? 0) / 35),
    hint: (f) => `${Math.max(0, 35 - (f.peakHeat ?? 0))} heat to Tempered.`,
  },
  {
    id: 'ach-white-heat',
    title: 'White Heat',
    description: 'Reach 65% heat — the forge runs white.',
    icon: '🌡',
    tier: 'SILVER',
    category: 'heat',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.peakHeat ?? 0) >= 65,
    progress: (f) => Math.min(1, (f.peakHeat ?? 0) / 65),
    hint: (f) => `${Math.max(0, 65 - (f.peakHeat ?? 0))} heat to White Heat.`,
  },
  {
    id: 'ach-starfire',
    title: 'Starfire',
    description: 'Push the forge to 90% heat. Few reach this threshold.',
    icon: '⭐',
    tier: 'GOLD',
    category: 'heat',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.peakHeat ?? 0) >= 90,
    progress: (f) => Math.min(1, (f.peakHeat ?? 0) / 90),
    hint: (f) => `${Math.max(0, 90 - (f.peakHeat ?? 0))} heat to Starfire.`,
  },
  {
    id: 'ach-max-heat',
    title: 'Absolute Zero Inverse',
    description: 'Hit 100% heat. The forge is at maximum capacity.',
    icon: '💥',
    tier: 'PLATINUM',
    category: 'heat',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.peakHeat ?? 0) >= 100,
    progress: (f) => Math.min(1, (f.peakHeat ?? 0) / 100),
    hint: (f) => `${Math.max(0, 100 - (f.peakHeat ?? 0))} heat to maximum.`,
  },

  // ── Combo Chain ────────────────────────────────────────────────────────────
  {
    id: 'ach-combo-3',
    title: 'Chain Starter',
    description: 'Build a 3-strike combo chain.',
    icon: '🔗',
    tier: 'BRONZE',
    category: 'combo',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.maxComboReached ?? 0) >= 3,
    progress: (f) => Math.min(1, (f.maxComboReached ?? 0) / 3),
    hint: (f) => `${Math.max(0, 3 - (f.maxComboReached ?? 0))} strikes to chain.`,
  },
  {
    id: 'ach-combo-7',
    title: 'Lucky Sevens',
    description: 'Sustain a 7-strike combo chain.',
    icon: '7️⃣',
    tier: 'SILVER',
    category: 'combo',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.maxComboReached ?? 0) >= 7,
    progress: (f) => Math.min(1, (f.maxComboReached ?? 0) / 7),
    hint: (f) => `${Math.max(0, 7 - (f.maxComboReached ?? 0))} strikes to lucky sevens.`,
  },
  {
    id: 'ach-combo-15',
    title: 'Unstoppable',
    description: 'Build a 15-strike combo chain without breaking.',
    icon: '🌊',
    tier: 'GOLD',
    category: 'combo',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.maxComboReached ?? 0) >= 15,
    progress: (f) => Math.min(1, (f.maxComboReached ?? 0) / 15),
    hint: (f) => `${Math.max(0, 15 - (f.maxComboReached ?? 0))} strikes to Unstoppable.`,
  },
  {
    id: 'ach-phoenix',
    title: 'Phoenix Strike',
    description: 'Rebuild your combo to 10+ after a chain break.',
    icon: '🦅',
    tier: 'GOLD',
    category: 'combo',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.comboRebuilds ?? 0) >= 1 && (f.maxComboReached ?? 0) >= 10,
    progress: (f) => {
      if ((f.comboRebuilds ?? 0) >= 1 && (f.maxComboReached ?? 0) >= 10) return 1;
      if ((f.totalBreaks ?? 0) > 0) return Math.min(0.99, (f.maxComboReached ?? 0) / 10);
      return 0;
    },
    hint: 'Break your combo, then rebuild to 10+ strikes.',
  },

  // ── Wallet & Identity ──────────────────────────────────────────────────────
  {
    id: 'ach-wallet-one',
    title: 'Ignited',
    description: 'Link your first wallet to the forge.',
    icon: '🔑',
    tier: 'BRONZE',
    category: 'identity',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.walletLinks ?? 0) >= 1,
    progress: (f) => Math.min(1, (f.walletLinks ?? 0) / 1),
    hint: 'Link any wallet to unlock.',
  },
  {
    id: 'ach-wallet-dual',
    title: 'Dual Socket',
    description: 'Link both EVM and Aptos wallets.',
    icon: '🔌',
    tier: 'SILVER',
    category: 'identity',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.walletLinks ?? 0) >= 2,
    progress: (f) => Math.min(1, (f.walletLinks ?? 0) / 2),
    hint: (f) => `${Math.max(0, 2 - (f.walletLinks ?? 0))} more wallet links needed.`,
  },

  // ── Vault Saves ───────────────────────────────────────────────────────────
  {
    id: 'ach-vault-first',
    title: 'First Seal',
    description: 'Perform your first vault save.',
    icon: '🔒',
    tier: 'BRONZE',
    category: 'vault',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.vaultSaves ?? 0) >= 1,
    progress: (f) => Math.min(1, (f.vaultSaves ?? 0) / 1),
    hint: 'Perform a vault_save action.',
  },
  {
    id: 'ach-vault-ten',
    title: 'Archivist',
    description: 'Complete 10 vault saves.',
    icon: '🗄',
    tier: 'SILVER',
    category: 'vault',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.vaultSaves ?? 0) >= 10,
    progress: (f) => Math.min(1, (f.vaultSaves ?? 0) / 10),
    hint: (f) => `${Math.max(0, 10 - (f.vaultSaves ?? 0))} more saves needed.`,
  },

  // ── White Heat Endurance ───────────────────────────────────────────────────
  {
    id: 'ach-sustained-heat',
    title: 'Heat Keeper',
    description: 'Perform 5 actions while at White Heat (65%+).',
    icon: '🌟',
    tier: 'SILVER',
    category: 'heat',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.actionsAtWhiteHeat ?? 0) >= 5,
    progress: (f) => Math.min(1, (f.actionsAtWhiteHeat ?? 0) / 5),
    hint: (f) => `${Math.max(0, 5 - (f.actionsAtWhiteHeat ?? 0))} more actions at White Heat.`,
  },
  {
    id: 'ach-white-heat-master',
    title: 'Furnace Mind',
    description: 'Perform 20 actions while at White Heat (65%+).',
    icon: '🧠',
    tier: 'GOLD',
    category: 'heat',
    secret: false,
    xpBonus: 0,
    check: (f) => (f.actionsAtWhiteHeat ?? 0) >= 20,
    progress: (f) => Math.min(1, (f.actionsAtWhiteHeat ?? 0) / 20),
    hint: (f) => `${Math.max(0, 20 - (f.actionsAtWhiteHeat ?? 0))} more actions at White Heat.`,
  },

  // ── Secret / Hidden ────────────────────────────────────────────────────────
  {
    id: 'ach-secret-resilience',
    title: 'Forged in Failure',
    description: 'Let your combo break 5 times and keep going. Resilience is its own reward.',
    icon: '💎',
    tier: 'PLATINUM',
    category: 'secret',
    secret: true,
    xpBonus: 50,
    check: (f) => (f.totalBreaks ?? 0) >= 5,
    progress: (f) => Math.min(1, (f.totalBreaks ?? 0) / 5),
    hint: 'Hidden achievement.',
  },
  {
    id: 'ach-secret-legend',
    title: 'Ember Legend',
    description: 'Unlock every non-secret achievement. The forge remembers.',
    icon: '👑',
    tier: 'LEGENDARY',
    category: 'secret',
    secret: true,
    xpBonus: 100,
    check: (_f, unlockedIds) => {
      const nonSecret = ACHIEVEMENT_CATALOG.filter(a => !a.secret && a.id !== 'ach-secret-legend');
      return nonSecret.every(a => unlockedIds.includes(a.id));
    },
    progress: (_f, unlockedIds) => {
      const nonSecret = ACHIEVEMENT_CATALOG.filter(a => !a.secret && a.id !== 'ach-secret-legend');
      const done = nonSecret.filter(a => unlockedIds.includes(a.id)).length;
      return done / nonSecret.length;
    },
    hint: 'Hidden achievement.',
  },
];

// ─── XP Calculation ───────────────────────────────────────────────────────────
export function calculateXP(unlockedAchievements) {
  return unlockedAchievements.reduce((total, ach) => {
    const catalog = ACHIEVEMENT_CATALOG.find(a => a.id === ach.id);
    if (!catalog) return total;
    return total + BADGE_TIERS[catalog.tier].xp + (catalog.xpBonus ?? 0);
  }, 0);
}

export function getLevel(xp) {
  // Level thresholds: 0, 100, 250, 500, 1000, 2000, ...
  const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
    else break;
  }
  const currentThreshold = thresholds[Math.min(level - 1, thresholds.length - 1)];
  const nextThreshold = thresholds[Math.min(level, thresholds.length - 1)];
  const progress = nextThreshold === currentThreshold
    ? 1
    : (xp - currentThreshold) / (nextThreshold - currentThreshold);
  return {
    level,
    xp,
    currentThreshold,
    nextThreshold: level >= thresholds.length ? null : nextThreshold,
    progress: Math.min(1, progress),
    label: getLevelLabel(level),
  };
}

function getLevelLabel(level) {
  const labels = [
    'Ember Novice', 'Iron Striker', 'Forge Apprentice', 'Chain Walker',
    'Heat Adept', 'Temper Knight', 'Forge Master', 'Starfire Operator',
    'Vault Legend', 'Eternal Forgekeeper',
  ];
  return labels[Math.min(level - 1, labels.length - 1)];
}

// ─── Check for new unlocks ────────────────────────────────────────────────────
export function checkAchievementUnlocks(forge, currentUnlockedIds) {
  return ACHIEVEMENT_CATALOG
    .filter(a => !currentUnlockedIds.includes(a.id) && a.check(forge, currentUnlockedIds))
    .map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      tier: a.tier,
      category: a.category,
      secret: a.secret,
      xpBonus: a.xpBonus ?? 0,
      unlockedAt: new Date().toISOString(),
    }));
}

// ─── Build catalog entry ──────────────────────────────────────────────────────
function buildEntry(ach, unlockedMap, forge, unlockedIds) {
  const unlocked = unlockedMap.has(ach.id);
  const hint = typeof ach.hint === 'function' ? ach.hint(forge, unlockedIds) : ach.hint;
  return {
    id: ach.id,
    title: ach.title,
    description: ach.description,
    icon: ach.icon,
    tier: ach.tier,
    tierMeta: BADGE_TIERS[ach.tier],
    category: ach.category,
    secret: ach.secret,
    unlocked,
    unlockedAt: unlockedMap.get(ach.id)?.unlockedAt ?? null,
    progress: unlocked ? 1 : ach.progress(forge, unlockedIds),
    hint: (ach.secret && !unlocked) ? 'Hidden achievement — keep forging.' : hint,
    xp: BADGE_TIERS[ach.tier].xp + (ach.xpBonus ?? 0),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function getAchievementsState() {
  const store = await readStore();
  const forge = store.forge ?? {};
  const achievements = store.achievements ?? [];
  const unlockedIds = achievements.map(a => a.id);
  const unlockedMap = new Map(achievements.map(a => [a.id, a]));

  const catalog = ACHIEVEMENT_CATALOG.map(a => buildEntry(a, unlockedMap, forge, unlockedIds));
  const xp = calculateXP(achievements);
  const levelInfo = getLevel(xp);

  return {
    catalog,
    achievements,
    totalUnlocked: achievements.length,
    totalAchievements: ACHIEVEMENT_CATALOG.length,
    xp,
    level: levelInfo,
    categories: [...new Set(ACHIEVEMENT_CATALOG.map(a => a.category))],
  };
}

export async function processAchievementsAfterAction(forge) {
  const store = await readStore();
  const achievements = store.achievements ?? [];
  const unlockedIds = achievements.map(a => a.id);

  const newAchievements = checkAchievementUnlocks(forge, unlockedIds);
  if (newAchievements.length > 0) {
    store.achievements = [...newAchievements, ...achievements];
    await writeStore(store);
  }

  return newAchievements;
}
