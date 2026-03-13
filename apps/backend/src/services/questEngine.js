/**
 * QuestEngine — EmberVault Quest & Mission System
 *
 * Quest types:
 *  - daily:   Resets every 24h. Fast objectives. Rewards XP + heat bonus
 *  - weekly:  Resets every 7 days. Higher bar, combo of actions required
 *  - story:   Persistent narrative chain. Complete in order. Unlocks lore + titles
 */

import { readStore, writeStore } from '../utils/fileStore.js';

function reward(type, amount, label) {
  return { type, amount, label };
}

// ─── Daily Quest Pool (3 picked per day) ──────────────────────────────────────
const DAILY_POOL = [
  {
    id: 'daily-strike3',
    title: 'Morning Strike',
    description: 'Fire 3 forge actions today.',
    icon: '⚡',
    difficulty: 'easy',
    rewards: [reward('xp', 30, '+30 XP'), reward('heat', 5, '+5 heat bonus')],
    check: (_f, p) => (p.actionsToday ?? 0) >= 3,
    progress: (_f, p) => Math.min(1, (p.actionsToday ?? 0) / 3),
    hint: (_f, p) => `${Math.max(0, 3 - (p.actionsToday ?? 0))} actions remaining`,
    total: 3,
  },
  {
    id: 'daily-vaultsave',
    title: 'Seal the Vault',
    description: 'Perform 2 vault saves.',
    icon: '🔒',
    difficulty: 'easy',
    rewards: [reward('xp', 25, '+25 XP')],
    check: (_f, p) => (p.vaultSavesToday ?? 0) >= 2,
    progress: (_f, p) => Math.min(1, (p.vaultSavesToday ?? 0) / 2),
    hint: (_f, p) => `${Math.max(0, 2 - (p.vaultSavesToday ?? 0))} vault saves remaining`,
    total: 2,
  },
  {
    id: 'daily-combo5',
    title: 'Chain Rhythm',
    description: 'Build a 5-strike combo chain.',
    icon: '🔗',
    difficulty: 'medium',
    rewards: [reward('xp', 40, '+40 XP'), reward('heat', 8, '+8 heat bonus')],
    check: (f) => (f.maxComboReached ?? 0) >= 5,
    progress: (f) => Math.min(1, (f.maxComboReached ?? 0) / 5),
    hint: (f) => `${Math.max(0, 5 - (f.maxComboReached ?? 0))} strikes to go`,
    total: 5,
  },
  {
    id: 'daily-heat50',
    title: 'Half Forge',
    description: 'Reach 50% heat today.',
    icon: '🔥',
    difficulty: 'medium',
    rewards: [reward('xp', 35, '+35 XP')],
    check: (_f, p) => (p.peakHeatToday ?? 0) >= 50,
    progress: (_f, p) => Math.min(1, (p.peakHeatToday ?? 0) / 50),
    hint: (_f, p) => `${Math.max(0, 50 - (p.peakHeatToday ?? 0))}% heat remaining`,
    total: 50,
  },
  {
    id: 'daily-wallet',
    title: 'Forge Handshake',
    description: 'Perform a wallet link or sign action.',
    icon: '🔑',
    difficulty: 'easy',
    rewards: [reward('xp', 20, '+20 XP')],
    check: (_f, p) => (p.walletActionsToday ?? 0) >= 1,
    progress: (_f, p) => Math.min(1, (p.walletActionsToday ?? 0)),
    hint: () => 'Link a wallet or sign to complete',
    total: 1,
  },
  {
    id: 'daily-5actions',
    title: 'Full Session',
    description: 'Complete 5 forge actions today.',
    icon: '⚒',
    difficulty: 'medium',
    rewards: [reward('xp', 50, '+50 XP'), reward('heat', 10, '+10 heat bonus')],
    check: (_f, p) => (p.actionsToday ?? 0) >= 5,
    progress: (_f, p) => Math.min(1, (p.actionsToday ?? 0) / 5),
    hint: (_f, p) => `${Math.max(0, 5 - (p.actionsToday ?? 0))} actions remaining`,
    total: 5,
  },
  {
    id: 'daily-whiteheat',
    title: 'White Hot Run',
    description: 'Perform 3 actions while at White Heat (65%+).',
    icon: '🌟',
    difficulty: 'hard',
    rewards: [reward('xp', 60, '+60 XP'), reward('heat', 12, '+12 heat bonus')],
    check: (_f, p) => (p.whiteHeatActionsToday ?? 0) >= 3,
    progress: (_f, p) => Math.min(1, (p.whiteHeatActionsToday ?? 0) / 3),
    hint: (_f, p) => `${Math.max(0, 3 - (p.whiteHeatActionsToday ?? 0))} actions at White Heat remaining`,
    total: 3,
  },
  {
    id: 'daily-credential',
    title: 'Identity Refresh',
    description: 'Perform a credential update.',
    icon: '🪪',
    difficulty: 'easy',
    rewards: [reward('xp', 20, '+20 XP')],
    check: (_f, p) => (p.credentialUpdatesToday ?? 0) >= 1,
    progress: (_f, p) => Math.min(1, p.credentialUpdatesToday ?? 0),
    hint: () => 'Perform a credential_update action',
    total: 1,
  },
];

// ─── Weekly Quest Pool (2 picked per week) ────────────────────────────────────
const WEEKLY_POOL = [
  {
    id: 'weekly-20actions',
    title: 'The Long Run',
    description: 'Complete 20 forge actions this week.',
    icon: '🏃',
    difficulty: 'medium',
    rewards: [reward('xp', 200, '+200 XP'), reward('title', 0, 'Title: Forge Veteran')],
    check: (_f, p) => (p.actionsThisWeek ?? 0) >= 20,
    progress: (_f, p) => Math.min(1, (p.actionsThisWeek ?? 0) / 20),
    hint: (_f, p) => `${Math.max(0, 20 - (p.actionsThisWeek ?? 0))} actions remaining this week`,
    total: 20,
  },
  {
    id: 'weekly-starfire',
    title: 'Touch the Sun',
    description: 'Reach Starfire heat (90%+) this week.',
    icon: '⭐',
    difficulty: 'hard',
    rewards: [reward('xp', 300, '+300 XP'), reward('heat', 20, '+20 heat bonus')],
    check: (f) => (f.peakHeat ?? 0) >= 90,
    progress: (f) => Math.min(1, (f.peakHeat ?? 0) / 90),
    hint: (f) => `${Math.max(0, 90 - (f.peakHeat ?? 0))}% heat to Starfire`,
    total: 90,
  },
  {
    id: 'weekly-combo10',
    title: 'Decade Chain',
    description: 'Build a 10-strike combo chain this week.',
    icon: '🔟',
    difficulty: 'hard',
    rewards: [reward('xp', 250, '+250 XP'), reward('title', 0, 'Title: Chain Keeper')],
    check: (f) => (f.maxComboReached ?? 0) >= 10,
    progress: (f) => Math.min(1, (f.maxComboReached ?? 0) / 10),
    hint: (f) => `${Math.max(0, 10 - (f.maxComboReached ?? 0))} strikes to peak combo`,
    total: 10,
  },
  {
    id: 'weekly-vault5',
    title: 'Archive Week',
    description: 'Perform 5 vault saves this week.',
    icon: '🗄',
    difficulty: 'medium',
    rewards: [reward('xp', 180, '+180 XP')],
    check: (_f, p) => (p.vaultSavesThisWeek ?? 0) >= 5,
    progress: (_f, p) => Math.min(1, (p.vaultSavesThisWeek ?? 0) / 5),
    hint: (_f, p) => `${Math.max(0, 5 - (p.vaultSavesThisWeek ?? 0))} vault saves remaining`,
    total: 5,
  },
  {
    id: 'weekly-wallets',
    title: 'Dual Ignition',
    description: 'Link both EVM and Aptos wallets this week.',
    icon: '🔌',
    difficulty: 'medium',
    rewards: [reward('xp', 220, '+220 XP'), reward('title', 0, 'Title: Dual Socket')],
    check: (f) => (f.walletLinks ?? 0) >= 2,
    progress: (f) => Math.min(1, (f.walletLinks ?? 0) / 2),
    hint: (f) => `${Math.max(0, 2 - (f.walletLinks ?? 0))} more wallet links needed`,
    total: 2,
  },
];

// ─── Story Quest Chain ────────────────────────────────────────────────────────
export const STORY_QUESTS = [
  {
    id: 'story-01', chapter: 1,
    title: 'The First Ember',
    lore: 'Every forge begins cold. A single action is all it takes to ignite the chain.',
    description: 'Fire your first forge action to light the Ember.',
    icon: '🕯', difficulty: 'easy',
    rewards: [reward('xp', 50, '+50 XP'), reward('title', 0, 'Title: Ember Initiate')],
    check: (f) => (f.totalActions ?? 0) >= 1,
    progress: (f) => Math.min(1, f.totalActions ?? 0),
    hint: () => 'Fire any forge action to begin.',
    nextId: 'story-02',
  },
  {
    id: 'story-02', chapter: 2,
    title: 'Chain of Momentum',
    lore: 'The forge rewards rhythm. Strike again before the ember fades.',
    description: 'Build your first 3-strike combo chain.',
    icon: '🔗', difficulty: 'easy',
    rewards: [reward('xp', 80, '+80 XP'), reward('title', 0, 'Title: Chain Forger')],
    check: (f) => (f.maxComboReached ?? 0) >= 3,
    progress: (f) => Math.min(1, (f.maxComboReached ?? 0) / 3),
    hint: (f) => `${Math.max(0, 3 - (f.maxComboReached ?? 0))} strikes to chain`,
    nextId: 'story-03',
  },
  {
    id: 'story-03', chapter: 3,
    title: 'The White Threshold',
    lore: 'White Heat is where operators are separated. The forge shifts. The output changes.',
    description: 'Push the forge to White Heat — reach 65% heat.',
    icon: '🌡', difficulty: 'medium',
    rewards: [reward('xp', 120, '+120 XP'), reward('title', 0, 'Title: White Heat Operator')],
    check: (f) => (f.peakHeat ?? 0) >= 65,
    progress: (f) => Math.min(1, (f.peakHeat ?? 0) / 65),
    hint: (f) => `${Math.max(0, 65 - (f.peakHeat ?? 0))}% heat to White threshold`,
    nextId: 'story-04',
  },
  {
    id: 'story-04', chapter: 4,
    title: 'Seal Your Identity',
    lore: 'An operator without a wallet is anonymous. Sign your name in fire.',
    description: 'Link a wallet to the forge.',
    icon: '🔑', difficulty: 'medium',
    rewards: [reward('xp', 150, '+150 XP'), reward('title', 0, 'Title: Vault-Bound Operator')],
    check: (f) => (f.walletLinks ?? 0) >= 1,
    progress: (f) => Math.min(1, f.walletLinks ?? 0),
    hint: () => 'Link any wallet to advance.',
    nextId: 'story-05',
  },
  {
    id: 'story-05', chapter: 5,
    title: 'The Artifact Emerges',
    lore: 'Artifacts are earned through sustained pressure. The forge remembers what you do.',
    description: 'Unlock your first artifact.',
    icon: '⚒', difficulty: 'medium',
    rewards: [reward('xp', 180, '+180 XP'), reward('title', 0, 'Title: Artifact Bearer')],
    check: (_f, _p, artifacts) => (artifacts?.length ?? 0) >= 1,
    progress: (_f, _p, artifacts) => Math.min(1, artifacts?.length ?? 0),
    hint: () => 'Complete enough actions to mint your first artifact.',
    nextId: 'story-06',
  },
  {
    id: 'story-06', chapter: 6,
    title: 'Starfire Trial',
    lore: 'The highest threshold. Starfire is not a place — it is a state of absolute commitment.',
    description: 'Reach Starfire heat — push the forge to 90%.',
    icon: '⭐', difficulty: 'hard',
    rewards: [reward('xp', 300, '+300 XP'), reward('title', 0, 'Title: Starfire Forgemaster')],
    check: (f) => (f.peakHeat ?? 0) >= 90,
    progress: (f) => Math.min(1, (f.peakHeat ?? 0) / 90),
    hint: (f) => `${Math.max(0, 90 - (f.peakHeat ?? 0))}% heat to Starfire`,
    nextId: 'story-07',
  },
  {
    id: 'story-07', chapter: 7,
    title: 'Legacy of the Chain',
    lore: 'You have forged through cold starts, broken chains, white heat, and starfire. What remains is your mark.',
    description: 'Complete 20 total actions and maintain a 7-strike combo.',
    icon: '👑', difficulty: 'legendary',
    rewards: [reward('xp', 500, '+500 XP'), reward('title', 0, 'Title: Eternal Forgekeeper')],
    check: (f) => (f.totalActions ?? 0) >= 20 && (f.maxComboReached ?? 0) >= 7,
    progress: (f) => Math.min(1, ((f.totalActions ?? 0) / 20 + (f.maxComboReached ?? 0) / 7) / 2),
    hint: (f) => {
      const a = Math.max(0, 20 - (f.totalActions ?? 0));
      const c = Math.max(0, 7 - (f.maxComboReached ?? 0));
      if (a > 0 && c > 0) return `${a} actions + ${c} combo strikes remaining`;
      if (a > 0) return `${a} more actions needed`;
      if (c > 0) return `${c} more combo strikes needed`;
      return 'All conditions met!';
    },
    nextId: null,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeekKey(d = new Date()) {
  const n = new Date(d);
  n.setHours(0,0,0,0);
  n.setDate(n.getDate() - n.getDay());
  return `week-${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}

function pickFromPool(pool, seed, count) {
  const indices = [];
  let s = seed;
  while (indices.length < Math.min(count, pool.length)) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const idx = s % pool.length;
    if (!indices.includes(idx)) indices.push(idx);
  }
  return indices.map(i => pool[i]);
}

function daySeed(key) { return key.split('-').reduce((a, n) => a + parseInt(n), 0); }
function weekSeed(key) { return key.replace('week-','').split('-').reduce((a,n) => a + parseInt(n), 0); }

function buildEntry(template, forge, progressTracker, artifacts, completedIds) {
  const done = completedIds.includes(template.id);
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    lore: template.lore ?? null,
    icon: template.icon,
    difficulty: template.difficulty,
    chapter: template.chapter ?? null,
    rewards: template.rewards,
    completed: done,
    progress: done ? 1 : template.progress(forge, progressTracker, artifacts),
    hint: done ? 'Completed!' : (typeof template.hint === 'function' ? template.hint(forge, progressTracker, artifacts) : template.hint),
    total: template.total ?? null,
    nextId: template.nextId ?? null,
  };
}

function makeTracker(daily, weekly) {
  return {
    actionsToday:           daily.actionsToday ?? 0,
    vaultSavesToday:        daily.vaultSavesToday ?? 0,
    walletActionsToday:     daily.walletActionsToday ?? 0,
    credentialUpdatesToday: daily.credentialUpdatesToday ?? 0,
    whiteHeatActionsToday:  daily.whiteHeatActionsToday ?? 0,
    peakHeatToday:          daily.peakHeatToday ?? 0,
    actionsThisWeek:        weekly.actionsThisWeek ?? 0,
    vaultSavesThisWeek:     weekly.vaultSavesThisWeek ?? 0,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function getQuestState() {
  const store    = await readStore();
  const forge    = store.forge ?? {};
  const artifacts = store.artifacts ?? [];
  let quests     = store.quests ?? {};

  const today   = getDayKey();
  const weekKey = getWeekKey();

  if (quests.currentDay !== today)   { quests.currentDay = today;   quests.dailyProgress = {};  quests.dailyCompleted = []; }
  if (quests.currentWeek !== weekKey){ quests.currentWeek = weekKey; quests.weeklyProgress = {}; quests.weeklyCompleted = []; }
  quests.storyCompleted = quests.storyCompleted ?? [];

  const tracker = makeTracker(quests.dailyProgress ?? {}, quests.weeklyProgress ?? {});
  const dailyTemplates  = pickFromPool(DAILY_POOL,  daySeed(today),   3);
  const weeklyTemplates = pickFromPool(WEEKLY_POOL, weekSeed(weekKey), 2);

  const nextStoryIdx = STORY_QUESTS.findIndex(q => !quests.storyCompleted.includes(q.id));
  const visibleStory = STORY_QUESTS.slice(Math.max(0, nextStoryIdx), Math.min(STORY_QUESTS.length, Math.max(0, nextStoryIdx) + 3));

  const daily  = dailyTemplates.map(t  => buildEntry(t, forge, tracker, artifacts, quests.dailyCompleted ?? []));
  const weekly = weeklyTemplates.map(t => buildEntry(t, forge, tracker, artifacts, quests.weeklyCompleted ?? []));
  const story  = visibleStory.map(t    => buildEntry(t, forge, tracker, artifacts, quests.storyCompleted));

  store.quests = quests;
  await writeStore(store);

  const now  = new Date();
  const next = new Date(now); next.setUTCHours(24,0,0,0);

  return {
    daily, weekly, story,
    meta: {
      today, weekKey,
      dailyCompleted:  quests.dailyCompleted?.length  ?? 0,
      dailyTotal:      dailyTemplates.length,
      weeklyCompleted: quests.weeklyCompleted?.length ?? 0,
      weeklyTotal:     weeklyTemplates.length,
      storyCompleted:  quests.storyCompleted.length,
      storyTotal:      STORY_QUESTS.length,
      totalCompleted:  (quests.dailyCompleted?.length ?? 0) + (quests.weeklyCompleted?.length ?? 0) + quests.storyCompleted.length,
      dailyResetMs:    next.getTime() - now.getTime(),
    },
  };
}

export async function updateQuestProgress(forge, actionType) {
  const store    = await readStore();
  let quests     = store.quests ?? {};
  const artifacts = store.artifacts ?? [];

  const today   = getDayKey();
  const weekKey = getWeekKey();

  if (quests.currentDay !== today)    { quests.currentDay = today;   quests.dailyProgress = {};  quests.dailyCompleted = []; }
  if (quests.currentWeek !== weekKey) { quests.currentWeek = weekKey; quests.weeklyProgress = {}; quests.weeklyCompleted = []; }
  quests.storyCompleted = quests.storyCompleted ?? [];

  const dp = quests.dailyProgress  ?? {};
  const wp = quests.weeklyProgress ?? {};

  dp.actionsToday      = (dp.actionsToday ?? 0) + 1;
  wp.actionsThisWeek   = (wp.actionsThisWeek ?? 0) + 1;
  dp.peakHeatToday     = Math.max(dp.peakHeatToday ?? 0, forge.heat ?? 0);

  if (actionType === 'vault_save')       { dp.vaultSavesToday = (dp.vaultSavesToday ?? 0) + 1; wp.vaultSavesThisWeek = (wp.vaultSavesThisWeek ?? 0) + 1; }
  if (actionType === 'wallet_link' || actionType === 'wallet_sign') dp.walletActionsToday = (dp.walletActionsToday ?? 0) + 1;
  if (actionType === 'credential_update') dp.credentialUpdatesToday = (dp.credentialUpdatesToday ?? 0) + 1;
  if ((forge.heat ?? 0) >= 65)            dp.whiteHeatActionsToday  = (dp.whiteHeatActionsToday ?? 0) + 1;

  quests.dailyProgress  = dp;
  quests.weeklyProgress = wp;

  const tracker = makeTracker(dp, wp);
  const dailyTemplates  = pickFromPool(DAILY_POOL,  daySeed(today),   3);
  const weeklyTemplates = pickFromPool(WEEKLY_POOL, weekSeed(weekKey), 2);
  const newlyCompleted  = [];

  for (const t of dailyTemplates) {
    if (!(quests.dailyCompleted ?? []).includes(t.id) && t.check(forge, tracker, artifacts)) {
      quests.dailyCompleted = [...(quests.dailyCompleted ?? []), t.id];
      newlyCompleted.push({ ...buildEntry(t, forge, tracker, artifacts, quests.dailyCompleted), questType: 'daily' });
    }
  }
  for (const t of weeklyTemplates) {
    if (!(quests.weeklyCompleted ?? []).includes(t.id) && t.check(forge, tracker, artifacts)) {
      quests.weeklyCompleted = [...(quests.weeklyCompleted ?? []), t.id];
      newlyCompleted.push({ ...buildEntry(t, forge, tracker, artifacts, quests.weeklyCompleted), questType: 'weekly' });
    }
  }
  for (const t of STORY_QUESTS) {
    if (!quests.storyCompleted.includes(t.id) && t.check(forge, tracker, artifacts)) {
      quests.storyCompleted = [...quests.storyCompleted, t.id];
      newlyCompleted.push({ ...buildEntry(t, forge, tracker, artifacts, quests.storyCompleted), questType: 'story' });
    }
  }

  store.quests = quests;
  await writeStore(store);
  return newlyCompleted;
}
