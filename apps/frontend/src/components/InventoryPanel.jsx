/**
 * InventoryPanel — Item & Equipment Management UI
 * Features: category filter, rarity filter, equipment loadout slots,
 *           item detail modal, use consumables, equip/unequip, drop feed
 */
import { useEffect, useState } from 'react';
import './inventory.css';

const API_BASE = '/api';

async function fetchInventory() {
  const res = await fetch(`${API_BASE}/inventory`);
  if (!res.ok) throw new Error('Failed');
  return res.json();
}
async function postEquip(itemId) {
  const res = await fetch(`${API_BASE}/inventory/equip`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId }),
  });
  return res.json();
}
async function postUnequip(slot) {
  const res = await fetch(`${API_BASE}/inventory/unequip`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slot }),
  });
  return res.json();
}
async function postUse(itemId) {
  const res = await fetch(`${API_BASE}/inventory/use`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId }),
  });
  return res.json();
}

const RARITY_LABEL = { common:'Common', uncommon:'Uncommon', rare:'Rare', epic:'Epic', legendary:'Legendary' };
const CAT_META = {
  artifact:   { label: 'Artifacts',   icon: '⚒'  },
  equipment:  { label: 'Equipment',   icon: '🛡'  },
  title:      { label: 'Titles',      icon: '👑'  },
  tag:        { label: 'Tags',        icon: '🏷'  },
  consumable: { label: 'Consumables', icon: '🧪'  },
  material:   { label: 'Materials',   icon: '🪨'  },
};

const EQUIPMENT_SLOTS = [
  { slot: 'badge',   label: 'Badge',   icon: '🔩' },
  { slot: 'sigil',   label: 'Sigil',   icon: '〰' },
  { slot: 'title',   label: 'Title',   icon: '🏷' },
  { slot: 'tag',     label: 'Tag',     icon: '⚡' },
];

function RarityPill({ rarity, color, bg }) {
  return (
    <span className="inv-rarity-pill" style={{ color, background: bg, borderColor: color + '44' }}>
      {RARITY_LABEL[rarity] ?? rarity}
    </span>
  );
}

function EquipmentLoadout({ equipped, equippedDetails, onUnequip }) {
  return (
    <div className="inv-loadout">
      <p className="inv-loadout-title">Equipped Loadout</p>
      <div className="inv-loadout-slots">
        {EQUIPMENT_SLOTS.map(({ slot, label, icon }) => {
          const detail = equippedDetails?.[slot];
          return (
            <div
              key={slot}
              className={`inv-slot ${detail ? 'inv-slot-filled' : 'inv-slot-empty'}`}
              onClick={() => detail && onUnequip(slot)}
              title={detail ? `Unequip ${detail.name}` : `${label} slot empty`}
            >
              <span className="inv-slot-icon">{detail ? detail.icon : icon}</span>
              <span className="inv-slot-label">{detail ? detail.name : label}</span>
              {detail && <span className="inv-slot-unequip">✕</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ItemModal({ item, equipped, onClose, onEquip, onUnequip, onUse, useResult }) {
  const isEquipped = equipped && Object.values(equipped).includes(item.id);
  const isConsumable = item.category === 'consumable';
  const canEquip = item.equippable && !isEquipped;

  return (
    <div className="inv-modal-overlay" onClick={onClose}>
      <div
        className="inv-modal"
        style={{ borderColor: item.color + '44', boxShadow: `0 0 48px ${item.bg}` }}
        onClick={e => e.stopPropagation()}
      >
        <button className="inv-modal-close" onClick={onClose}>✕</button>

        <div className="inv-modal-header">
          <span className="inv-modal-icon">{item.icon}</span>
          <div>
            <RarityPill rarity={item.rarity} color={item.color} bg={item.bg} />
            <h2 className="inv-modal-name">{item.name}</h2>
            <p className="inv-modal-cat">{CAT_META[item.category]?.label ?? item.category}</p>
          </div>
          {item.quantity > 1 && (
            <span className="inv-modal-qty" style={{ color: item.color }}>×{item.quantity}</span>
          )}
        </div>

        <p className="inv-modal-desc">{item.description}</p>

        {item.effect && (
          <div className="inv-modal-effect" style={{ borderColor: item.color + '44', background: item.bg }}>
            <span className="inv-effect-label">Effect</span>
            <span className="inv-effect-val" style={{ color: item.color }}>
              {item.effect.type === 'heat' && `+${item.effect.value} heat`}
              {item.effect.type === 'xp' && `+${item.effect.value} XP`}
              {item.effect.type === 'combo_extend' && `+${item.effect.value} min combo window`}
              {item.effect.type === 'decay_pause' && `Pause decay ${item.effect.value} min`}
            </span>
          </div>
        )}

        {item.slot && (
          <p className="inv-modal-slot">Slot: <strong>{item.slot}</strong></p>
        )}

        {useResult && (
          <div className="inv-use-result" style={{ color: item.color }}>
            ✓ {useResult}
          </div>
        )}

        <div className="inv-modal-actions">
          {isEquipped && (
            <button className="ghost-button" onClick={() => onUnequip(item.slot)}>Unequip</button>
          )}
          {canEquip && (
            <button className="primary-button" onClick={() => onEquip(item.id)}>Equip</button>
          )}
          {isConsumable && item.quantity > 0 && (
            <button className="primary-button" onClick={() => onUse(item.id)}>
              Use {item.icon}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemCard({ item, isEquipped, onClick }) {
  return (
    <div
      className={`inv-card ${isEquipped ? 'inv-card-equipped' : ''}`}
      style={isEquipped ? { borderColor: item.color + '55', background: item.bg } : {}}
      onClick={onClick}
      title={item.name}
    >
      {isEquipped && <div className="inv-equipped-ribbon" style={{ background: item.color }}>ON</div>}
      {item.quantity > 1 && (
        <span className="inv-qty-badge" style={{ background: item.color + '22', color: item.color }}>
          ×{item.quantity}
        </span>
      )}

      <div className="inv-card-icon-wrap" style={{ borderColor: item.color + '33', background: item.color + '11' }}>
        <span className="inv-card-icon">{item.icon}</span>
      </div>

      <div className="inv-card-body">
        <span className="inv-card-rarity" style={{ color: item.color }}>{RARITY_LABEL[item.rarity]}</span>
        <p className="inv-card-name">{item.name}</p>
      </div>
    </div>
  );
}

export function InventoryPanel({ droppedItems = [] }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('all');
  const [selected, setSelected]   = useState(null);
  const [useResult, setUseResult] = useState('');
  const [dropFeed, setDropFeed]   = useState([]);

  const load = () =>
    fetchInventory().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // Show drop feed when new items arrive
  useEffect(() => {
    if (droppedItems.length > 0) {
      setDropFeed(droppedItems);
      load();
      setTimeout(() => setDropFeed([]), 4000);
    }
  }, [droppedItems]);

  const handleEquip = async (itemId) => {
    await postEquip(itemId);
    load();
    setSelected(null);
  };

  const handleUnequip = async (slot) => {
    await postUnequip(slot);
    load();
    setSelected(null);
  };

  const handleUse = async (itemId) => {
    const res = await postUse(itemId);
    if (res.resultMessage) {
      setUseResult(res.resultMessage);
      setTimeout(() => setUseResult(''), 3000);
    }
    load();
  };

  if (loading) return (
    <article className="panel inv-root">
      <div className="panel-header"><div><p className="eyebrow">Inventory</p><h3>Loading...</h3></div></div>
    </article>
  );
  if (!data) return null;

  const { items, equipped, equippedDetails, counts, totalItems, totalUnique } = data;

  const cats = ['all', ...Object.keys(CAT_META)];
  const filtered = catFilter === 'all' ? items : items.filter(i => i.category === catFilter);
  const selectedItem = selected ? items.find(i => i.id === selected) : null;

  return (
    <article className="panel inv-root">
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          equipped={equipped}
          onClose={() => { setSelected(null); setUseResult(''); }}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
          onUse={handleUse}
          useResult={useResult}
        />
      )}

      {/* Drop feed */}
      {dropFeed.length > 0 && (
        <div className="inv-drop-feed">
          {dropFeed.map((item, i) => (
            <div key={i} className="inv-drop-toast" style={{ borderColor: item.color + '55' }}>
              <span>{item.icon}</span>
              <span className="inv-drop-name" style={{ color: item.color }}>{item.name}</span>
              <span className="inv-drop-label">dropped!</span>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="panel-header">
        <div>
          <p className="eyebrow">Inventory</p>
          <h3>Items &amp; equipment</h3>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge blue">{totalUnique} unique</span>
          <span className="badge">{totalItems} total</span>
        </div>
      </div>

      {/* Equipment loadout */}
      <EquipmentLoadout equipped={equipped} equippedDetails={equippedDetails} onUnequip={handleUnequip} />

      {/* Category filter */}
      <div className="inv-cat-tabs">
        {cats.map(cat => {
          const meta = CAT_META[cat];
          const count = cat === 'all' ? totalItems : (counts[cat] ?? 0);
          return (
            <button
              key={cat}
              className={`inv-cat-tab ${catFilter === cat ? 'active' : ''}`}
              onClick={() => setCatFilter(cat)}
            >
              {cat === 'all' ? 'All' : `${meta.icon} ${meta.label}`}
              <span className="inv-cat-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Item grid */}
      {filtered.length === 0 ? (
        <div className="inv-empty">
          <p>No items in this category yet. Fire forge actions to earn drops!</p>
        </div>
      ) : (
        <div className="inv-grid">
          {filtered.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              isEquipped={equipped && Object.values(equipped).includes(item.id)}
              onClick={() => setSelected(item.id)}
            />
          ))}
        </div>
      )}
    </article>
  );
}
