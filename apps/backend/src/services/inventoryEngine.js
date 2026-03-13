/**
 * InventoryEngine — EmberVault Item & Equipment System
 *
 * Item categories:
 *  - artifacts    : Forged collectibles (from forgeEngine)
 *  - titles       : Operator title cosmetics (from quests/achievements)
 *  - tags         : Profile tags (from quests/achievements)
 *  - consumables  : One-time use boosts (heat flasks, XP scrolls, combo anchors)
 *  - materials    : Crafting ingredients dropped from forge actions
 *  - equipment    : Equippable loadout slots (badge, sigil, lacquer, frame)
 *
 * Equipment slots (4):
 *  - badge   : Displayed rank badge
 *  - sigil   : Forge sigil (affects heat color)
 *  - lacquer : Visual finish on artifact cards
 *  - frame   : Profile frame
 */

import { readStore, writeStore } from '../utils/fileStore.js';
import { ARTIFACT_CATALOG } from './forgeEngine.js';

// ─── Item catalog (static definitions) ───────────────────────────────────────
export const ITEM_CATALOG = {

  // ── Titles ─────────────────────────────────────────────────────────────────
  'title-ember-architect': {
    id: 'title-ember-architect', category: 'title', rarity: 'common',
    name: 'Ember Architect', description: 'Default operator title.',
    icon: '🏷', source: 'default', equippable: true, slot: 'title',
  },
  'title-dawnstriker': {
    id: 'title-dawnstriker', category: 'title', rarity: 'uncommon',
    name: 'Dawnstriker', description: 'Awarded for reaching White Heat.',
    icon: '🌅', source: 'quest', equippable: true, slot: 'title',
  },
  'title-chainweaver': {
    id: 'title-chainweaver', category: 'title', rarity: 'rare',
    name: 'Chainweaver', description: 'Awarded for building a 7-strike chain.',
    icon: '🔗', source: 'quest', equippable: true, slot: 'title',
  },
  'title-vault-watcher': {
    id: 'title-vault-watcher', category: 'title', rarity: 'rare',
    name: 'Vault Watcher', description: 'Awarded for 20 total forge actions.',
    icon: '👁', source: 'quest', equippable: true, slot: 'title',
  },
  'title-ember-lord': {
    id: 'title-ember-lord', category: 'title', rarity: 'legendary',
    name: 'Ember Lord', description: 'Awarded upon completing all story chapters.',
    icon: '👑', source: 'quest', equippable: true, slot: 'title',
  },

  // ── Tags ───────────────────────────────────────────────────────────────────
  'tag-first-blood': {
    id: 'tag-first-blood', category: 'tag', rarity: 'common',
    name: 'First Blood', description: 'Fired the first forge action.',
    icon: '⚡', source: 'quest', equippable: true, slot: 'tag',
  },
  'tag-fully-ignited': {
    id: 'tag-fully-ignited', category: 'tag', rarity: 'uncommon',
    name: 'Fully Ignited', description: 'Both wallets linked and signed.',
    icon: '🔥', source: 'quest', equippable: true, slot: 'tag',
  },
  'tag-chain-master': {
    id: 'tag-chain-master', category: 'tag', rarity: 'rare',
    name: 'Chain Master', description: 'Mastered the combo chain system.',
    icon: '⛓', source: 'quest', equippable: true, slot: 'tag',
  },

  // ── Consumables ────────────────────────────────────────────────────────────
  'consumable-heat-flask-s': {
    id: 'consumable-heat-flask-s', category: 'consumable', rarity: 'common',
    name: 'Heat Flask (S)', description: 'Instantly adds 10 heat to the forge.',
    icon: '🧪', source: 'drop', equippable: false, slot: null,
    effect: { type: 'heat', value: 10 },
  },
  'consumable-heat-flask-m': {
    id: 'consumable-heat-flask-m', category: 'consumable', rarity: 'uncommon',
    name: 'Heat Flask (M)', description: 'Instantly adds 20 heat to the forge.',
    icon: '⚗', source: 'drop', equippable: false, slot: null,
    effect: { type: 'heat', value: 20 },
  },
  'consumable-xp-scroll': {
    id: 'consumable-xp-scroll', category: 'consumable', rarity: 'uncommon',
    name: 'XP Scroll', description: 'Grants 75 bonus XP immediately.',
    icon: '📜', source: 'drop', equippable: false, slot: null,
    effect: { type: 'xp', value: 75 },
  },
  'consumable-combo-anchor': {
    id: 'consumable-combo-anchor', category: 'consumable', rarity: 'rare',
    name: 'Combo Anchor', description: 'Extends the current combo window by 15 minutes.',
    icon: '⚓', source: 'drop', equippable: false, slot: null,
    effect: { type: 'combo_extend', value: 15 },
  },
  'consumable-decay-shield': {
    id: 'consumable-decay-shield', category: 'consumable', rarity: 'rare',
    name: 'Decay Shield', description: 'Prevents heat decay for 2 hours.',
    icon: '🛡', source: 'drop', equippable: false, slot: null,
    effect: { type: 'decay_pause', value: 120 },
  },

  // ── Materials (crafting drops) ─────────────────────────────────────────────
  'material-cinder-shard': {
    id: 'material-cinder-shard', category: 'material', rarity: 'common',
    name: 'Cinder Shard', description: 'Residue from high-heat forge runs. Used in crafting.',
    icon: '🪨', source: 'drop', equippable: false, slot: null,
  },
  'material-ember-dust': {
    id: 'material-ember-dust', category: 'material', rarity: 'uncommon',
    name: 'Ember Dust', description: 'Fine particles from Starfire actions. Rare drop.',
    icon: '✨', source: 'drop', equippable: false, slot: null,
  },
  'material-void-crystal': {
    id: 'material-void-crystal', category: 'material', rarity: 'rare',
    name: 'Void Crystal', description: 'Crystallized combo energy. Only drops from 10+ chains.',
    icon: '💠', source: 'drop', equippable: false, slot: null,
  },
  'material-starfire-core': {
    id: 'material-starfire-core', category: 'material', rarity: 'epic',
    name: 'Starfire Core', description: 'The forge\'s most powerful material. Drops rarely at 90%+ heat.',
    icon: '🌟', source: 'drop', equippable: false, slot: null,
  },

  // ── Equipment: Badges ──────────────────────────────────────────────────────
  'equip-badge-iron': {
    id: 'equip-badge-iron', category: 'equipment', rarity: 'common',
    name: 'Iron Badge', description: 'Default rank badge.',
    icon: '🔩', source: 'default', equippable: true, slot: 'badge',
  },
  'equip-badge-flame': {
    id: 'equip-badge-flame', category: 'equipment', rarity: 'uncommon',
    name: 'Flame Badge', description: 'Awarded at Tempered rank.',
    icon: '🔥', source: 'forge', equippable: true, slot: 'badge',
  },
  'equip-badge-starfire': {
    id: 'equip-badge-starfire', category: 'equipment', rarity: 'legendary',
    name: 'Starfire Badge', description: 'Only operators who reach Starfire can equip this.',
    icon: '⭐', source: 'forge', equippable: true, slot: 'badge',
  },

  // ── Equipment: Sigils ──────────────────────────────────────────────────────
  'equip-sigil-ash': {
    id: 'equip-sigil-ash', category: 'equipment', rarity: 'common',
    name: 'Ash Sigil', description: 'Default forge sigil. Understated.',
    icon: '〰', source: 'default', equippable: true, slot: 'sigil',
  },
  'equip-sigil-ember': {
    id: 'equip-sigil-ember', category: 'equipment', rarity: 'uncommon',
    name: 'Ember Sigil', description: 'Orange heat aura on the forge meter.',
    icon: '🌀', source: 'forge', equippable: true, slot: 'sigil',
  },
  'equip-sigil-void': {
    id: 'equip-sigil-void', category: 'equipment', rarity: 'epic',
    name: 'Void Sigil', description: 'Purple aura. Unlocked at Chainbreaker artifact.',
    icon: '🔮', source: 'forge', equippable: true, slot: 'sigil',
  },
};

const RARITY_ORDER = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
const RARITY_COLORS = {
  common:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)'  },
  uncommon:  { color: '#10b981', bg: 'rgba(16,185,129,0.1)'   },
  rare:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'   },
  epic:      { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  legendary: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
};

// ─── Drop table: what drops after which action type ───────────────────────────
const DROP_TABLE = {
  vault_save:        ['material-cinder-shard', 'consumable-heat-flask-s'],
  credential_update: ['material-cinder-shard', 'material-ember-dust'],
  permission_change: ['material-cinder-shard'],
  wallet_link:       ['consumable-heat-flask-s', 'material-ember-dust'],
  wallet_sign:       ['consumable-xp-scroll', 'material-ember-dust'],
  activity_log:      ['material-cinder-shard'],
  season_complete:   ['material-void-crystal', 'consumable-combo-anchor', 'consumable-decay-shield'],
};

// Drop chances by heat level
function getDropChance(heat) {
  if (heat >= 90) return 0.55;
  if (heat >= 65) return 0.40;
  if (heat >= 35) return 0.25;
  return 0.15;
}

// Bonus rare drop at high combo
function getBonusDropChance(comboCount, heat) {
  if (comboCount >= 10 && heat >= 65) return { id: 'material-void-crystal', chance: 0.20 };
  if (heat >= 90) return { id: 'material-starfire-core', chance: 0.10 };
  return null;
}

// ─── Resolve drops after a forge action ──────────────────────────────────────
export function resolveDrops(actionType, forge) {
  const pool = DROP_TABLE[actionType] ?? ['material-cinder-shard'];
  const chance = getDropChance(forge.heat ?? 0);
  const drops = [];

  // Roll for main drop
  if (Math.random() < chance) {
    const itemId = pool[Math.floor(Math.random() * pool.length)];
    drops.push(itemId);
  }

  // Roll for bonus rare drop
  const bonus = getBonusDropChance(forge.comboCount ?? 0, forge.heat ?? 0);
  if (bonus && Math.random() < bonus.chance) {
    drops.push(bonus.id);
  }

  return drops;
}

// ─── Apply consumable effect ──────────────────────────────────────────────────
export async function useConsumable(itemId, slotIndex) {
  const store = await readStore();
  const inv   = store.inventory ?? initInventory();
  const slot  = inv.items.find(s => s.id === itemId && s.index === slotIndex && s.quantity > 0);

  if (!slot) throw new Error('Item not found in inventory or quantity is 0.');

  const def = ITEM_CATALOG[itemId];
  if (!def || def.category !== 'consumable') throw new Error('Item is not a consumable.');

  const effect = def.effect;
  let resultMessage = '';

  if (effect.type === 'heat') {
    store.forge.heat = Math.min(100, (store.forge.heat ?? 0) + effect.value);
    resultMessage = `Applied +${effect.value} heat to forge.`;
  } else if (effect.type === 'xp') {
    // XP stored in achievements bonus pool
    store.xpBonus = (store.xpBonus ?? 0) + effect.value;
    resultMessage = `Granted +${effect.value} bonus XP.`;
  } else if (effect.type === 'combo_extend') {
    store.forge.comboWindowExtendMs = (store.forge.comboWindowExtendMs ?? 0) + effect.value * 60 * 1000;
    resultMessage = `Extended combo window by ${effect.value} minutes.`;
  } else if (effect.type === 'decay_pause') {
    store.forge.decayPausedUntil = new Date(Date.now() + effect.value * 60 * 1000).toISOString();
    resultMessage = `Heat decay paused for ${effect.value} minutes.`;
  }

  // Decrement quantity
  slot.quantity -= 1;
  if (slot.quantity <= 0) {
    inv.items = inv.items.filter(s => !(s.id === itemId && s.index === slotIndex));
  }

  store.inventory = inv;
  await writeStore(store);

  return { effect, resultMessage, updatedForge: store.forge };
}

// ─── Equip item ───────────────────────────────────────────────────────────────
export async function equipItem(itemId) {
  const store = await readStore();
  const inv   = store.inventory ?? initInventory();
  const def   = ITEM_CATALOG[itemId];

  if (!def) throw new Error(`Item ${itemId} not found in catalog.`);
  if (!def.equippable) throw new Error('This item cannot be equipped.');

  const owned = inv.items.some(s => s.id === itemId);
  if (!owned) throw new Error('You do not own this item.');

  inv.equipped[def.slot] = itemId;
  store.inventory = inv;
  await writeStore(store);

  return inv.equipped;
}

// ─── Unequip slot ─────────────────────────────────────────────────────────────
export async function unequipSlot(slot) {
  const store = await readStore();
  const inv   = store.inventory ?? initInventory();
  inv.equipped[slot] = null;
  store.inventory = inv;
  await writeStore(store);
  return inv.equipped;
}

// ─── Add items to inventory (called by forge + quest engines) ─────────────────
export async function addItemsToInventory(itemIds) {
  if (!itemIds || itemIds.length === 0) return [];
  const store = await readStore();
  const inv   = store.inventory ?? initInventory();
  const added = [];

  for (const id of itemIds) {
    const def = ITEM_CATALOG[id];
    if (!def) continue;

    const existing = inv.items.find(s => s.id === id);
    if (existing) {
      existing.quantity = (existing.quantity ?? 1) + 1;
    } else {
      inv.items.push({ id, quantity: 1, acquiredAt: new Date().toISOString() });
    }
    added.push({ ...def, ...RARITY_COLORS[def.rarity] });
  }

  inv.totalItems = inv.items.reduce((s, i) => s + (i.quantity ?? 1), 0);
  store.inventory = inv;
  await writeStore(store);
  return added;
}

// ─── Grant title/tag from quest/achievement reward ────────────────────────────
export async function grantRewardItem(rewardType, rewardValue) {
  // Map reward value → item id
  const titleMap = {
    'Dawnstriker':   'title-dawnstriker',
    'Chainweaver':   'title-chainweaver',
    'Vault Watcher': 'title-vault-watcher',
    'Ember Lord':    'title-ember-lord',
  };
  const tagMap = {
    'First Blood':    'tag-first-blood',
    'Fully Ignited':  'tag-fully-ignited',
    'Chain Master':   'tag-chain-master',
  };

  let itemId = null;
  if (rewardType === 'title') itemId = titleMap[rewardValue];
  if (rewardType === 'tag')   itemId = tagMap[rewardValue];
  if (!itemId) return null;

  await addItemsToInventory([itemId]);
  return itemId;
}

// ─── Build inventory response ─────────────────────────────────────────────────
function initInventory() {
  return {
    items: [
      { id: 'title-ember-architect', quantity: 1, acquiredAt: new Date().toISOString() },
      { id: 'equip-badge-iron',      quantity: 1, acquiredAt: new Date().toISOString() },
      { id: 'equip-sigil-ash',       quantity: 1, acquiredAt: new Date().toISOString() },
    ],
    equipped: {
      title:  'title-ember-architect',
      badge:  'equip-badge-iron',
      sigil:  'equip-sigil-ash',
      tag:    null,
      lacquer: null,
      frame:  null,
    },
    totalItems: 3,
  };
}

export async function getInventoryState() {
  const store = await readStore();
  let inv = store.inventory;

  // First-time init
  if (!inv) {
    inv = initInventory();
    store.inventory = inv;
    await writeStore(store);
  }

  // Sync artifacts from forge
  const unlockedArtifacts = (store.artifacts ?? []);
  for (const art of unlockedArtifacts) {
    if (!inv.items.some(s => s.id === art.id)) {
      inv.items.push({ id: art.id, quantity: 1, acquiredAt: art.unlockedAt ?? new Date().toISOString(), isArtifact: true });
    }
  }

  // Build full item list with catalog metadata
  const items = inv.items.map(slot => {
    // Check if it's an artifact
    const artifactDef = ARTIFACT_CATALOG.find(a => a.id === slot.id);
    if (artifactDef) {
      const rarity = artifactDef.rarity ?? 1;
      const rarityKey = ['common','uncommon','rare','epic','legendary'][Math.min(rarity - 1, 4)];
      return {
        ...slot,
        category: 'artifact',
        name: artifactDef.title,
        description: artifactDef.description,
        icon: '⚒',
        rarity: rarityKey,
        ...RARITY_COLORS[rarityKey],
        equippable: false,
        slot: null,
        source: 'forge',
      };
    }

    const def = ITEM_CATALOG[slot.id];
    if (!def) return null;
    return {
      ...slot,
      ...def,
      ...RARITY_COLORS[def.rarity],
    };
  }).filter(Boolean);

  // Sort: by category then rarity desc
  const CAT_ORDER = { artifact: 0, equipment: 1, title: 2, tag: 3, consumable: 4, material: 5 };
  items.sort((a, b) => {
    const catDiff = (CAT_ORDER[a.category] ?? 9) - (CAT_ORDER[b.category] ?? 9);
    if (catDiff !== 0) return catDiff;
    return (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0);
  });

  // Category counts
  const counts = {};
  for (const item of items) {
    counts[item.category] = (counts[item.category] ?? 0) + (item.quantity ?? 1);
  }

  // Equipped details
  const equippedDetails = {};
  for (const [slot, id] of Object.entries(inv.equipped)) {
    if (!id) { equippedDetails[slot] = null; continue; }
    const def = ITEM_CATALOG[id] ?? ARTIFACT_CATALOG.find(a => a.id === id);
    equippedDetails[slot] = def ? { id, name: def.name ?? def.title, icon: def.icon ?? '⚒' } : null;
  }

  return {
    items,
    equipped: inv.equipped,
    equippedDetails,
    counts,
    totalItems: items.reduce((s, i) => s + (i.quantity ?? 1), 0),
    totalUnique: items.length,
    categories: Object.keys(CAT_ORDER),
  };
}
