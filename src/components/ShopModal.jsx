import React, { useState } from 'react';

export function ShopModal({
  totalCoins,
  hoverboardStock,
  upgradeLevels,
  selectedBoard,
  unlockedBoards,
  onBuyHoverboard,
  onUpgradePowerup,
  onSelectBoard,
  onBuyBoard,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('upgrades');

  const powerupInfo = [
    {
      id: 'multiplier',
      name: 'Filter Kaapi Boost (2x)',
      icon: '☕',
      desc: 'Authentic South Indian chicory blend doubles valuation growth.',
      costMultiplier: 500
    },
    {
      id: 'magnet',
      name: 'VC Funding Magnet',
      icon: '🧲',
      desc: 'Draws all ₹ Rupee coins directly to your startup bank account.',
      costMultiplier: 500
    },
    {
      id: 'sneakers',
      name: 'Ather Warp Leap',
      icon: '⚡',
      desc: 'Instant torque bounce allowing you to jump onto BMTC bus roofs.',
      costMultiplier: 500
    },
    {
      id: 'jetpack',
      name: 'Namma Metro Sky Flight',
      icon: '🚀',
      desc: 'Fly above the Silk Board gridlock on the elevated purple line.',
      costMultiplier: 600
    }
  ];

  const boardSkins = [
    {
      id: 'ather',
      name: 'Ather 450X Scooter',
      icon: '⚡',
      price: 0,
      gradient: 'linear-gradient(90deg, #00d46a, #0077b6)',
      desc: 'Warp mode electric scooter with aerodynamic cyber chassis.'
    },
    {
      id: 'auto',
      name: 'Namma Yatri Auto',
      icon: '🛺',
      price: 1200,
      gradient: 'linear-gradient(90deg, #ffcc00, #138808)',
      desc: 'Iconic yellow-green 3-wheeler with meter on demand.'
    },
    {
      id: 'bullet',
      name: 'Royal Enfield Cruiser',
      icon: '🏍️',
      price: 2500,
      gradient: 'linear-gradient(90deg, #334155, #64748b)',
      desc: 'Heavy thump exhaust note turning heads on 100ft road.'
    },
    {
      id: 'ola',
      name: 'Ola S1 Pro Coral',
      icon: '🛵',
      price: 4000,
      gradient: 'linear-gradient(90deg, #ef4444, #f97316)',
      desc: 'Hyper-mode sports scooter with built-in speakers.'
    }
  ];

  return (
    <div className="modal-backdrop daylight-backdrop">
      <div className="modal-container shop-modal daylight-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="shop-title-area">
            <span className="modal-title">BENGALURU TECH STORE</span>
            <span className="shop-balance daylight-balance">
              <span className="coin-icon">₹</span>
              <span>{totalCoins.toLocaleString()}</span>
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tab Switcher */}
        <div className="shop-tab-bar daylight-tab-bar">
          <button
            className={`shop-tab-btn daylight-tab-btn ${activeTab === 'upgrades' ? 'active' : ''}`}
            onClick={() => setActiveTab('upgrades')}
          >
            ☕ HUSTLE UPGRADES
          </button>
          <button
            className={`shop-tab-btn daylight-tab-btn ${activeTab === 'boards' ? 'active' : ''}`}
            onClick={() => setActiveTab('boards')}
          >
            🛵 SCOOTERS & AUTOS
          </button>
        </div>

        {/* Tab Content: Upgrades */}
        {activeTab === 'upgrades' && (
          <div className="shop-items-list">
            {/* Quick Buy Auto Shield */}
            <div className="shop-item-card featured daylight-item-card">
              <div className="item-icon-col">
                <div className="item-icon-box daylight-icon-box">🛺</div>
              </div>
              <div className="item-info-col">
                <div className="item-name">Namma Yatri Auto Shield (+1)</div>
                <div className="item-desc">
                  Shields you from 1 crash impact! Owned in garage: <strong>{hoverboardStock}</strong>
                </div>
              </div>
              <div className="item-action-col">
                <button
                  className="buy-btn daylight-buy-btn"
                  onClick={onBuyHoverboard}
                  disabled={totalCoins < 300}
                >
                  <span>₹ 300</span>
                  <span>BUY</span>
                </button>
              </div>
            </div>

            {/* Power-up Tier Upgrades */}
            {powerupInfo.map((p) => {
              const currentLevel = upgradeLevels[p.id] || 1;
              const isMax = currentLevel >= 5;
              const upgradeCost = currentLevel * p.costMultiplier;

              return (
                <div className="shop-item-card daylight-item-card" key={p.id}>
                  <div className="item-icon-col">
                    <div className="item-icon-box daylight-icon-box">{p.icon}</div>
                  </div>
                  <div className="item-info-col">
                    <div className="item-name-row">
                      <span className="item-name">{p.name}</span>
                      <span className="item-level-tag daylight-level-tag">LVL {currentLevel}/5</span>
                    </div>
                    <div className="item-desc">{p.desc}</div>
                    <div className="level-pips-row">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`level-pip daylight-pip ${lvl <= currentLevel ? 'filled' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="item-action-col">
                    {isMax ? (
                      <span className="maxed-tag daylight-maxed">MAXED</span>
                    ) : (
                      <button
                        className="buy-btn daylight-buy-btn"
                        onClick={() => onUpgradePowerup(p.id, upgradeCost)}
                        disabled={totalCoins < upgradeCost}
                      >
                        <span>₹ {upgradeCost}</span>
                        <span>UPGRADE</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Content: Scooters & Autos */}
        {activeTab === 'boards' && (
          <div className="shop-boards-grid">
            {boardSkins.map((b) => {
              const isUnlocked = unlockedBoards.includes(b.id);
              const isSelected = selectedBoard === b.id;

              return (
                <div className={`board-card daylight-board-card ${isSelected ? 'selected' : ''}`} key={b.id}>
                  <div className="board-preview-strip" style={{ background: b.gradient }}>
                    <span className="board-art">{b.icon}</span>
                  </div>
                  <div className="board-details">
                    <div className="board-name">{b.name}</div>
                    <div className="board-desc">{b.desc}</div>
                  </div>
                  <div className="board-action">
                    {isSelected ? (
                      <span className="board-status-badge active daylight-active-badge">EQUIPPED</span>
                    ) : isUnlocked ? (
                      <button className="select-btn daylight-select-btn" onClick={() => onSelectBoard(b.id)}>
                        EQUIP
                      </button>
                    ) : (
                      <button
                        className="buy-btn daylight-buy-btn"
                        onClick={() => onBuyBoard(b.id, b.price)}
                        disabled={totalCoins < b.price}
                      >
                        ₹ {b.price}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-done daylight-done-btn" onClick={onClose}>
            RETURN TO HIGHWAY
          </button>
        </div>
      </div>
    </div>
  );
}
