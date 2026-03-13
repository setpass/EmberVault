/**
 * LeaderboardEngine — EmberVault Competitive Rankings
 *
 * Ranks operators across multiple categories:
 * - Overall score (heat + XP + artifacts combined)
 * - Heat masters (peak heat achieved)
 * - Combo kings (max combo chain)
 * - Artifact collectors (most forged)
 * - XP earners (total XP from achievements)
 * - Seasonal (current season performance)
 *
 * In single-player mode, leaderboard shows the real player + AI rivals
 * that update dynamically based on player's own stats.
 */

import { readStore, writeStore } from '../utils/fileStore.js';
import { calculateXP, getLevel } from './achievementsEngine.js';
import { ARTIFACT_CATALOG } from './forgeEngine.js';

// ─── Rival Operators (AI opponents that scale with player) ─────────────────────
const RIVAL_TEMPLATES = [
  {
    id: 'rival-001',
    name: 'Solveg Ironwhisper',
    role: 'Vault Sentinel',
    avatar: 'SI',
    color: '#3b82f6',
    // Multipliers relative to player's stats (adds variance)
    heatMult: 0.82,
    comboMult: 0.75,
    actionsMult: 0.90,
    xpMult: 0.70,
    artifactsMult: 0.60,
    baseOffset: { heat: 8, combo: 1, actions: 5, xp: 40 },
  },
  {
    id: 'rival-002',
    name: 'Thalos Duskforge',
    role: 'Chain Architect',
    avatar: 'TD',
    color: '#8b5cf6',
    heatMult: 1.15,
    comboMult: 1.30,
    actionsMult: 1.10,
    xpMult: 0.95,
    artifactsMult: 0.80,
    baseOffset: { heat: 15, combo: 3, actions: 12, xp: 80 },
  },
  {
    id: 'rival-003',
    name: 'Maren Coldchain',
    role: 'Ember Tactician',
    avatar: 'MC',
    color: '#10b981',
    heatMult: 0.65,
    comboMult: 0.55,
    actionsMult: 0.70,
    xpMult: 1.20,
    artifactsMult: 1.10,
    baseOffset: { heat: 5, combo: 0, actions: 3, xp: 120 },
  },
  {
    id: 'rival-004',
    name: 'Pyreth Vaultborn',
    role: 'Starfire Operator',
    avatar: 'PV',
    color: '#ef4444',
    heatMult: 1.40,
    comboMult: 1.20,
    actionsMult: 1.35,
    xpMult: 1.10,
    artifactsMult: 1.25,
    baseOffset: { heat: 22, combo: 4, actions: 18, xp: 150 },
  },
  {
    id: 'rival-005',
    name: 'Zuri Ashtemper',
    role: 'Forge Initiate',
    avatar: 'ZA',
    color: '#f59e0b',
    heatMult: 0.40,
    comboMult: 0.35,
    actionsMult: 0.45,
    xpMult: 0.30,
    artifactsMult: 0.25,
    baseOffset: { heat: 2, combo: 0, actions: 1, xp: 10 },
  },
  {
    id: 'rival-006',
    name: 'Drevon Scalemark',
    role: 'Heat Warden',
    avatar: 'DS',
    color: '#06b6d4',
    heatMult: 1.05,
    comboMult: 0.95,
    actionsMult: 1.00,
    xpMult: 0.85,
    artifactsMult: 0.90,
    baseOffset: { heat: 11, combo: 2, actions: 8, xp: 60 },
  },
  {
    id: 'rival-007',
    name: 'Ellwyn Cindermark',
    role: 'Artifact Keeper',
    avatar: 'EC',
    color: '#ec4899',
    heatMult: 0.75,
    comboMult: 0.80,
    actionsMult: 0.85,
    xpMult: 1.40,
    artifactsMult: 1.60,
    baseOffset: { heat: 6, combo: 1, actions: 4, xp: 200 },
  },
];

// ─── Score calculation ─────────────────────────────────────────────────────────
function calcOverallScore({ heat, totalActions, xp, artifactCount, maxCombo }) {
  return Math.round(
    (heat * 8) +
    (totalActions * 12) +
    (xp * 0.5) +
    (artifactCount * 60) +
    (maxCombo * 25)
  );
}

// ─── Build player entry ────────────────────────────────────────────────────────
function buildPlayerEntry(forge, achievements, artifactCount) {
  const xp = calculateXP(achievements);
  const levelInfo = getLevel(xp);
  const score = calcOverallScore({
    heat: forge.peakHeat ?? forge.heat ?? 0,
    totalActions: forge.totalActions ?? 0,
    xp,
    artifactCount,
    maxCombo: forge.maxComboReached ?? 0,
  });

  return {
    id: 'player',
    name: 'You',
    role: forge.rank ?? 'Apprentice Ember',
    avatar: 'YO',
    color: '#f59e0b',
    isPlayer: true,
    stats: {
      heat: forge.peakHeat ?? forge.heat ?? 0,
      totalActions: forge.totalActions ?? 0,
      maxCombo: forge.maxComboReached ?? 0,
      artifactCount,
      xp,
      level: levelInfo.level,
      levelLabel: levelInfo.label,
    },
    score,
    // Seasonal: use seasonProgress
    seasonScore: Math.round((forge.seasonProgress ?? 0) * 10 + (forge.totalActions ?? 0) * 5),
  };
}

// ─── Build rival entry ─────────────────────────────────────────────────────────
function buildRivalEntry(template, playerStats) {
  const heat        = Math.min(100, Math.max(0, Math.round(playerStats.heat * template.heatMult + template.baseOffset.heat)));
  const maxCombo    = Math.max(0, Math.round(playerStats.maxCombo * template.comboMult + template.baseOffset.combo));
  const totalActions = Math.max(0, Math.round(playerStats.totalActions * template.actionsMult + template.baseOffset.actions));
  const xp          = Math.max(0, Math.round(playerStats.xp * template.xpMult + template.baseOffset.xp));
  const artifactCount = Math.max(0, Math.round(playerStats.artifactCount * template.artifactsMult));
  const level       = getLevel(xp);
  const score       = calcOverallScore({ heat, totalActions, xp, artifactCount, maxCombo });
  const seasonScore = Math.round(heat * 0.8 + totalActions * 4);

  return {
    id: template.id,
    name: template.name,
    role: template.role,
    avatar: template.avatar,
    color: template.color,
    isPlayer: false,
    stats: { heat, totalActions, maxCombo, artifactCount, xp, level: level.level, levelLabel: level.label },
    score,
    seasonScore,
  };
}

// ─── Sort & rank helpers ───────────────────────────────────────────────────────
function rankBy(entries, key) {
  return [...entries]
    .sort((a, b) => {
      const av = key === 'score' ? b.score : b.stats[key];
      const bv = key === 'score' ? a.score : a.stats[key];
      return av - bv;
    })
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function getLeaderboardState() {
  const store       = await readStore();
  const forge       = store.forge ?? {};
  const artifacts   = store.artifacts ?? [];
  const achievements = store.achievements ?? [];

  const playerXP    = calculateXP(achievements);
  const playerStats = {
    heat:         forge.peakHeat ?? forge.heat ?? 0,
    maxCombo:     forge.maxComboReached ?? 0,
    totalActions: forge.totalActions ?? 0,
    xp:           playerXP,
    artifactCount: artifacts.length,
  };

  const player  = buildPlayerEntry(forge, achievements, artifacts.length);
  const rivals  = RIVAL_TEMPLATES.map(t => buildRivalEntry(t, playerStats));
  const all     = [player, ...rivals];

  // Build leaderboard categories
  const overall   = rankBy(all, 'score');
  const heatBoard = rankBy(all, 'heat');
  const comboBoard = rankBy(all, 'maxCombo');
  const artifactBoard = rankBy(all, 'artifactCount');
  const xpBoard   = rankBy(all, 'xp');
  const seasonBoard = [...all]
    .sort((a, b) => b.seasonScore - a.seasonScore)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  // Player's rank across all boards
  const playerRanks = {
    overall:   overall.find(e => e.id === 'player')?.rank,
    heat:      heatBoard.find(e => e.id === 'player')?.rank,
    combo:     comboBoard.find(e => e.id === 'player')?.rank,
    artifacts: artifactBoard.find(e => e.id === 'player')?.rank,
    xp:        xpBoard.find(e => e.id === 'player')?.rank,
    season:    seasonBoard.find(e => e.id === 'player')?.rank,
  };

  // Save snapshot for history
  const snapshot = {
    timestamp: new Date().toISOString(),
    overallRank: playerRanks.overall,
    score: player.score,
  };
  const history = store.leaderboardHistory ?? [];
  // Only append if score changed from last entry
  const lastSnap = history[0];
  if (!lastSnap || lastSnap.score !== snapshot.score) {
    store.leaderboardHistory = [snapshot, ...history].slice(0, 30);
    await writeStore(store);
  }

  return {
    boards: { overall, heat: heatBoard, combo: comboBoard, artifacts: artifactBoard, xp: xpBoard, season: seasonBoard },
    playerRanks,
    totalOperators: all.length,
    history: store.leaderboardHistory ?? [],
    player,
  };
}
