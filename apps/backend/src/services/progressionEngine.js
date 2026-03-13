/**
 * ProgressionEngine — EmberVault Rewards & Progression Tiers
 *
 * A seasonal progression pass with 50 tiers.
 * XP earned from all activities (forge actions, achievements, quests) fills the pass.
 * Two tracks per tier:
 *   - Free   : available to all operators
 *   - Forge  : unlocked by reaching Starfire (90% heat) at least once
 *
 * XP sources:
 *   - Forge action       : 5–25 XP (based on action type + heat multiplier)
 *   - Achievement unlock : tier.xp value
 *   - Quest complete     : difficulty XP bonus
 *   - Daily login bonus  : 15 XP
 *   - Combo milestone    : 10 XP per 5-combo increment
 */

import { readStore, writeStore } from '../utils/fileStore.js';

const TOTAL_TIERS    = 50;
const XP_PER_TIER    = 200;   // XP needed per tier
const TOTAL_XP       = TOTAL_TIERS * XP_PER_TIER; // 10,000 XP for full pass

// XP awarded per action type (scales with heat)
export const ACTION_XP = {
  vault_save:        12,
  credential_update: 10,
  permission_change:  8,
  wallet_link:       18,
  wallet_sign:       22,
  activity_log:       5,
  season_complete:   35,
};

// Tier reward definitions — 50 tiers, alternating free/forge track rewards
function buildTierRewards() {
  const tiers = [];

  const freeRewards = [
    // Tiers 1-10: starter rewards
    { type: 'xp_bonus',   value: 50,   label: '+50 XP Bonus',         icon: '⭐' },
    { type: 'consumable', value: 'consumable-heat-flask-s', label: 'Heat Flask (S)', icon: '🧪' },
    { type: 'title',      value: 'Ember Initiate',          label: 'Title: Ember Initiate', icon: '🏷' },
    { type: 'xp_bonus',   value: 75,   label: '+75 XP Bonus',         icon: '⭐' },
    { type: 'material',   value: 'material-cinder-shard',   label: 'Cinder Shard ×3', icon: '🪨', qty: 3 },
    { type: 'xp_bonus',   value: 100,  label: '+100 XP Bonus',        icon: '⭐' },
    { type: 'consumable', value: 'consumable-xp-scroll',    label: 'XP Scroll',       icon: '📜' },
    { type: 'title',      value: 'Forge Runner',            label: 'Title: Forge Runner', icon: '🏷' },
    { type: 'xp_bonus',   value: 100,  label: '+100 XP Bonus',        icon: '⭐' },
    { type: 'consumable', value: 'consumable-heat-flask-m', label: 'Heat Flask (M)', icon: '⚗' },
    // Tiers 11-20: mid rewards
    { type: 'xp_bonus',   value: 150,  label: '+150 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-ember-dust',     label: 'Ember Dust ×2',   icon: '✨', qty: 2 },
    { type: 'title',      value: 'Heat Walker',             label: 'Title: Heat Walker', icon: '🏷' },
    { type: 'consumable', value: 'consumable-combo-anchor', label: 'Combo Anchor',    icon: '⚓' },
    { type: 'xp_bonus',   value: 150,  label: '+150 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-void-crystal',   label: 'Void Crystal',    icon: '💠' },
    { type: 'xp_bonus',   value: 200,  label: '+200 XP Bonus',        icon: '⭐' },
    { type: 'title',      value: 'Chain Operator',          label: 'Title: Chain Operator', icon: '🏷' },
    { type: 'consumable', value: 'consumable-decay-shield', label: 'Decay Shield',    icon: '🛡' },
    { type: 'xp_bonus',   value: 200,  label: '+200 XP Bonus',        icon: '⭐' },
    // Tiers 21-30: high-tier rewards
    { type: 'title',      value: 'Starfire Adept',          label: 'Title: Starfire Adept', icon: '🏷' },
    { type: 'material',   value: 'material-starfire-core',  label: 'Starfire Core',   icon: '🌟' },
    { type: 'xp_bonus',   value: 250,  label: '+250 XP Bonus',        icon: '⭐' },
    { type: 'consumable', value: 'consumable-heat-flask-m', label: 'Heat Flask (M) ×2', icon: '⚗', qty: 2 },
    { type: 'xp_bonus',   value: 250,  label: '+250 XP Bonus',        icon: '⭐' },
    { type: 'title',      value: 'Vault Sovereign',         label: 'Title: Vault Sovereign', icon: '🏷' },
    { type: 'consumable', value: 'consumable-combo-anchor', label: 'Combo Anchor ×2', icon: '⚓', qty: 2 },
    { type: 'xp_bonus',   value: 300,  label: '+300 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-starfire-core',  label: 'Starfire Core ×2', icon: '🌟', qty: 2 },
    { type: 'xp_bonus',   value: 300,  label: '+300 XP Bonus',        icon: '⭐' },
    // Tiers 31-40: elite
    { type: 'title',      value: 'Forge Sovereign',         label: 'Title: Forge Sovereign', icon: '👑' },
    { type: 'xp_bonus',   value: 350,  label: '+350 XP Bonus',        icon: '⭐' },
    { type: 'consumable', value: 'consumable-decay-shield', label: 'Decay Shield ×2', icon: '🛡', qty: 2 },
    { type: 'xp_bonus',   value: 350,  label: '+350 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-void-crystal',   label: 'Void Crystal ×3', icon: '💠', qty: 3 },
    { type: 'title',      value: 'Eternal Ember',           label: 'Title: Eternal Ember', icon: '🔥' },
    { type: 'xp_bonus',   value: 400,  label: '+400 XP Bonus',        icon: '⭐' },
    { type: 'consumable', value: 'consumable-combo-anchor', label: 'Combo Anchor ×3', icon: '⚓', qty: 3 },
    { type: 'xp_bonus',   value: 400,  label: '+400 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-starfire-core',  label: 'Starfire Core ×3', icon: '🌟', qty: 3 },
    // Tiers 41-50: legendary endgame
    { type: 'title',      value: 'Void Forger',             label: 'Title: Void Forger', icon: '👑' },
    { type: 'xp_bonus',   value: 500,  label: '+500 XP Bonus',        icon: '⭐' },
    { type: 'consumable', value: 'consumable-heat-flask-m', label: 'Heat Flask (M) ×3', icon: '⚗', qty: 3 },
    { type: 'xp_bonus',   value: 500,  label: '+500 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-starfire-core',  label: 'Starfire Core ×5', icon: '🌟', qty: 5 },
    { type: 'title',      value: 'Apex Operator',           label: 'Title: Apex Operator', icon: '👑' },
    { type: 'xp_bonus',   value: 750,  label: '+750 XP Bonus',        icon: '⭐' },
    { type: 'consumable', value: 'consumable-decay-shield', label: 'Decay Shield ×5', icon: '🛡', qty: 5 },
    { type: 'xp_bonus',   value: 750,  label: '+750 XP Bonus',        icon: '⭐' },
    { type: 'title',      value: 'Forge Legend',            label: 'Title: Forge Legend 👑', icon: '🏆' },
  ];

  const forgeRewards = [
    { type: 'equipment',  value: 'equip-badge-flame',   label: 'Flame Badge',       icon: '🔥' },
    { type: 'xp_bonus',   value: 100,  label: '+100 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-ember-dust',   label: 'Ember Dust ×3',   icon: '✨', qty: 3 },
    { type: 'equipment',  value: 'equip-sigil-ember',    label: 'Ember Sigil',       icon: '🌀' },
    { type: 'xp_bonus',   value: 150,  label: '+150 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-void-crystal', label: 'Void Crystal ×2',  icon: '💠', qty: 2 },
    { type: 'xp_bonus',   value: 200,  label: '+200 XP Bonus',        icon: '⭐' },
    { type: 'equipment',  value: 'equip-sigil-void',     label: 'Void Sigil',        icon: '🔮' },
    { type: 'xp_bonus',   value: 200,  label: '+200 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-starfire-core', label: 'Starfire Core',   icon: '🌟' },
    { type: 'xp_bonus',   value: 250,  label: '+250 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-starfire-core', label: 'Starfire Core ×2', icon: '🌟', qty: 2 },
    { type: 'xp_bonus',   value: 300,  label: '+300 XP Bonus',        icon: '⭐' },
    { type: 'equipment',  value: 'equip-badge-starfire', label: 'Starfire Badge',    icon: '⭐' },
    { type: 'xp_bonus',   value: 300,  label: '+300 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-void-crystal', label: 'Void Crystal ×5',  icon: '💠', qty: 5 },
    { type: 'xp_bonus',   value: 350,  label: '+350 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-starfire-core', label: 'Starfire Core ×3', icon: '🌟', qty: 3 },
    { type: 'xp_bonus',   value: 400,  label: '+400 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-starfire-core', label: 'Starfire Core ×4', icon: '🌟', qty: 4 },
    { type: 'xp_bonus',   value: 500,  label: '+500 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-starfire-core', label: 'Starfire Core ×5', icon: '🌟', qty: 5 },
    { type: 'xp_bonus',   value: 500,  label: '+500 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-void-crystal', label: 'Void Crystal ×8',  icon: '💠', qty: 8 },
    { type: 'xp_bonus',   value: 600,  label: '+600 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-starfire-core', label: 'Starfire Core ×6', icon: '🌟', qty: 6 },
    { type: 'xp_bonus',   value: 600,  label: '+600 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-starfire-core', label: 'Starfire Core ×7', icon: '🌟', qty: 7 },
    { type: 'xp_bonus',   value: 700,  label: '+700 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-starfire-core', label: 'Starfire Core ×8', icon: '🌟', qty: 8 },
    { type: 'xp_bonus',   value: 750,  label: '+750 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-starfire-core', label: 'Starfire Core ×10', icon: '🌟', qty: 10 },
    { type: 'xp_bonus',   value: 800,  label: '+800 XP Bonus',        icon: '⭐' },
    { type: 'material',   value: 'material-void-crystal', label: 'Void Crystal ×10', icon: '💠', qty: 10 },
    { type: 'xp_bonus',   value: 800,  label: '+800 XP Bonus',        icon: '⭐' },
    { type: 'xp_bonus',   value: 1000, label: '+1000 XP Bonus',       icon: '⭐' },
    { type: 'xp_bonus',   value: 1000, label: '+1000 XP Bonus',       icon: '⭐' },
    { type: 'xp_bonus',   value: 1000, label: '+1000 XP Bonus',       icon: '⭐' },
    { type: 'xp_bonus',   value: 1000, label: '+1000 XP Bonus',       icon: '⭐' },
    { type: 'xp_bonus',   value: 1000, label: '+1000 XP Bonus',       icon: '⭐' },
    { type: 'xp_bonus',   value: 1000, label: '+1000 XP Bonus',       icon: '⭐' },
    { type: 'xp_bonus',   value: 1000, label: '+1000 XP Bonus',       icon: '⭐' },
    { type: 'xp_bonus',   value: 1000, label: '+1000 XP Bonus',       icon: '⭐' },
    { type: 'xp_bonus',   value: 1000, label: '+1000 XP Bonus',       icon: '⭐' },
    { type: 'xp_bonus',   value: 1500, label: '+1500 XP Bonus',       icon: '⭐' },
    { type: 'xp_bonus',   value: 1500, label: '+1500 XP Bonus',       icon: '⭐' },
    { type: 'xp_bonus',   value: 1500, label: '+1500 XP Bonus',       icon: '⭐' },
    { type: 'xp_bonus',   value: 1500, label: '+1500 XP Bonus',       icon: '⭐' },
    { type: 'xp_bonus',   value: 2000, label: '+2000 XP Bonus',       icon: '⭐' },
    { type: 'xp_bonus',   value: 2000, label: '+2000 XP Bonus — MAX TIER 🔥', icon: '🏆' },
  ];

  for (let i = 0; i < TOTAL_TIERS; i++) {
    tiers.push({
      tier: i + 1,
      xpRequired: XP_PER_TIER,
      free:  freeRewards[i] ?? { type: 'xp_bonus', value: 100, label: '+100 XP', icon: '⭐' },
      forge: forgeRewards[i] ?? { type: 'xp_bonus', value: 200, label: '+200 XP', icon: '⭐' },
    });
  }
  return tiers;
}

export const TIER_REWARDS = buildTierRewards();

// ─── XP sources ───────────────────────────────────────────────────────────────
export function xpForAction(actionType, forge) {
  const base = ACTION_XP[actionType] ?? 5;
  const heatMult = forge.heat >= 90 ? 2.0
    : forge.heat >= 65 ? 1.5
    : forge.heat >= 35 ? 1.2
    : 1.0;
  const comboBonus = Math.min(forge.comboCount ?? 0, 10) * 2;
  return Math.round(base * heatMult + comboBonus);
}

// ─── Award XP and check tier-ups ─────────────────────────────────────────────
export async function awardProgressionXP(amount, source) {
  const store = await readStore();
  const prog  = store.progression ?? initProgression();

  const oldXP    = prog.totalXP;
  const oldTier  = Math.floor(oldXP / XP_PER_TIER) + 1;
  prog.totalXP  += amount;
  prog.xpLog     = [{ amount, source, at: new Date().toISOString() }, ...(prog.xpLog ?? [])].slice(0, 50);

  const newTier  = Math.min(Math.floor(prog.totalXP / XP_PER_TIER) + 1, TOTAL_TIERS);
  const newTiers = [];

  // Check each tier crossed
  for (let t = oldTier; t <= newTier && t <= TOTAL_TIERS; t++) {
    if (!prog.claimedTiers.includes(t)) {
      // Auto-claim free reward
      prog.claimedTiers.push(t);
      const tierDef = TIER_REWARDS[t - 1];
      if (tierDef?.free) newTiers.push({ tier: t, track: 'free', reward: tierDef.free });
      // Auto-claim forge reward if eligible
      if (prog.forgeTrackUnlocked && tierDef?.forge) {
        newTiers.push({ tier: t, track: 'forge', reward: tierDef.forge });
      }
    }
  }

  // Apply XP bonuses from tier rewards
  for (const nt of newTiers) {
    if (nt.reward.type === 'xp_bonus') {
      prog.totalXP += nt.reward.value;
    }
  }

  // Unlock forge track if reached Starfire at any point
  if ((store.forge?.peakHeat ?? 0) >= 90) {
    prog.forgeTrackUnlocked = true;
  }

  store.progression = prog;
  await writeStore(store);

  return { newTiers, totalXP: prog.totalXP, currentTier: Math.min(Math.floor(prog.totalXP / XP_PER_TIER) + 1, TOTAL_TIERS) };
}

// ─── Claim a specific tier reward manually ────────────────────────────────────
export async function claimTierReward(tier, track) {
  const store = await readStore();
  const prog  = store.progression ?? initProgression();

  const claimKey = `${tier}_${track}`;
  if (prog.manualClaimed?.includes(claimKey)) {
    throw new Error('Reward already claimed.');
  }

  const currentTier = Math.min(Math.floor(prog.totalXP / XP_PER_TIER) + 1, TOTAL_TIERS);
  if (tier > currentTier) throw new Error('Tier not yet reached.');
  if (track === 'forge' && !prog.forgeTrackUnlocked) throw new Error('Forge track not unlocked. Reach Starfire (90% heat) first.');

  const tierDef = TIER_REWARDS[tier - 1];
  const reward  = track === 'free' ? tierDef?.free : tierDef?.forge;
  if (!reward) throw new Error('No reward defined for this tier.');

  prog.manualClaimed = [...(prog.manualClaimed ?? []), claimKey];
  if (reward.type === 'xp_bonus') prog.totalXP += reward.value;

  store.progression = prog;
  await writeStore(store);

  return { tier, track, reward, totalXP: prog.totalXP };
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function initProgression() {
  return {
    totalXP: 0,
    claimedTiers: [],
    manualClaimed: [],
    forgeTrackUnlocked: false,
    xpLog: [],
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function getProgressionState() {
  const store = await readStore();
  let prog    = store.progression ?? initProgression();

  // Sync forge track unlock
  if ((store.forge?.peakHeat ?? 0) >= 90) prog.forgeTrackUnlocked = true;

  const totalXP     = prog.totalXP;
  const currentTier = Math.min(Math.floor(totalXP / XP_PER_TIER) + 1, TOTAL_TIERS);
  const tierXP      = totalXP % XP_PER_TIER;
  const tierPct     = tierXP / XP_PER_TIER;

  // Build tier list with unlock/claim state
  const tiers = TIER_REWARDS.map((t, i) => {
    const tierNum    = i + 1;
    const unlocked   = tierNum <= currentTier;
    const freeClaimed  = prog.claimedTiers.includes(tierNum) || prog.manualClaimed?.includes(`${tierNum}_free`);
    const forgeClaimed = prog.manualClaimed?.includes(`${tierNum}_forge`) || (prog.claimedTiers.includes(tierNum) && prog.forgeTrackUnlocked);
    return {
      tier: tierNum,
      unlocked,
      xpRequired: t.xpRequired,
      free:  { ...t.free,  claimed: freeClaimed  },
      forge: { ...t.forge, claimed: forgeClaimed },
    };
  });

  // XP breakdown stats
  const xpStats = {
    totalXP,
    currentTier,
    tierXP,
    tierPct,
    nextTierXP: XP_PER_TIER - tierXP,
    maxTier: TOTAL_TIERS,
    maxXP: TOTAL_XP,
    passCompletion: Math.min(1, totalXP / TOTAL_XP),
    forgeTrackUnlocked: prog.forgeTrackUnlocked,
  };

  // Recent XP log (last 10)
  const recentXP = (prog.xpLog ?? []).slice(0, 10);

  // Milestones
  const milestones = [
    { xp: 500,  tier: 3,  label: 'Forge Initiate',   icon: '🔨', reached: totalXP >= 500  },
    { xp: 1000, tier: 5,  label: 'Temper Knight',    icon: '⚔',  reached: totalXP >= 1000 },
    { xp: 2000, tier: 10, label: 'Heat Adept',       icon: '🌡',  reached: totalXP >= 2000 },
    { xp: 4000, tier: 20, label: 'Chain Master',     icon: '🔗',  reached: totalXP >= 4000 },
    { xp: 6000, tier: 30, label: 'Starfire Forger',  icon: '⭐',  reached: totalXP >= 6000 },
    { xp: 8000, tier: 40, label: 'Vault Legend',     icon: '👑',  reached: totalXP >= 8000 },
    { xp: 10000,tier: 50, label: 'Eternal Ember',    icon: '🏆',  reached: totalXP >= 10000 },
  ];

  return { tiers, xpStats, recentXP, milestones };
}

// ─── Hook: award XP after forge action ───────────────────────────────────────
export async function awardActionXP(forge, actionType) {
  const xp = xpForAction(actionType, forge);
  return awardProgressionXP(xp, `forge:${actionType}`);
}
