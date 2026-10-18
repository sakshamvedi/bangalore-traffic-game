import React, { useState } from 'react';
import {
  IoCafe,
  IoMagnet,
  IoFlash,
  IoRocket,
  IoShieldCheckmark,
  IoClose
} from 'react-icons/io5';
import { FaIndianRupeeSign, FaMotorcycle } from 'react-icons/fa6';

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
      icon: <IoCafe size={24} color="#d97706" />,
      desc: 'Authentic South Indian chicory blend doubles valuation growth.',
      costMultiplier: 500
    },
    {
      id: 'magnet',
      name: 'VC Funding Magnet',
      icon: <IoMagnet size={24} color="#ef4444" />,
      desc: 'Draws all Rupee coins directly to your startup bank account.',
      costMultiplier: 500
    },
    {
      id: 'sneakers',
      name: 'Ather Warp Leap',
      icon: <IoFlash size={24} color="#eab308" />,
      desc: 'Instant torque bounce allowing you to jump onto BMTC bus roofs.',
      costMultiplier: 500
    },
    {
      id: 'jetpack',
      name: 'Namma Metro Sky Flight',
      icon: <IoRocket size={24} color="#3b82f6" />,
      desc: 'Fly above the Silk Board gridlock on the elevated purple line.',
      costMultiplier: 600
    }
  ];

  const boardSkins = [
    {
      id: 'ola_black',
      name: 'Ola S1 Pro (Midnight Black)',
      icon: <FaMotorcycle size={26} color="#38bdf8" />,
      price: 0,
      gradient: 'linear-gradient(90deg, #0f172a, #334155)',
      desc: 'Official 3D Ola Electric Scooter in Midnight Black with digital cockpit & alloy wheels.'
    },
    {
      id: 'auto',
      name: 'Namma Yatri Auto',
      icon: <IoShieldCheckmark size={26} color="#ffcc00" />,
      price: 1200,
      gradient: 'linear-gradient(90deg, #ffcc00, #138808)',
      desc: 'Iconic yellow-green 3-wheeler with meter on demand.'
    },
    {
      id: 'bullet',
      name: 'Royal Enfield Cruiser',
      icon: <FaMotorcycle size={26} color="#94a3b8" />,
      price: 2500,
      gradient: 'linear-gradient(90deg, #334155, #64748b)',
      desc: 'Heavy thump exhaust note turning heads on 100ft road.'
    },
    {
      id: 'ola',
      name: 'Ola S1 Pro Coral',
      icon: <FaMotorcycle size={26} color="#f97316" />,
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
              <span className="coin-icon"><FaIndianRupeeSign size={14} /></span>
              <span>{totalCoins.toLocaleString()}</span>
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}><IoClose size={22} /></button>
        </div>

        {/* Tab Switcher */}
        <div className="shop-tab-bar daylight-tab-bar">
          <button
            className={`shop-tab-btn daylight-tab-btn ${activeTab === 'upgrades' ? 'active' : ''}`}
            onClick={() => setActiveTab('upgrades')}
          >
            <IoCafe size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            HUSTLE UPGRADES
          </button>
          <button
            className={`shop-tab-btn daylight-tab-btn ${activeTab === 'boards' ? 'active' : ''}`}
            onClick={() => setActiveTab('boards')}
          >
            <FaMotorcycle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            SCOOTERS & AUTOS
          </button>
        </div>

        {/* Tab Content: Upgrades */}
        {activeTab === 'upgrades' && (
          <div className="shop-items-list">
            {/* Quick Buy Auto Shield */}
            <div className="shop-item-card featured daylight-item-card">
              <div className="item-icon-col">
                <div className="item-icon-box daylight-icon-box">
                  <IoShieldCheckmark size={24} color="#10b981" />
                </div>
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
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <FaIndianRupeeSign size={11} /> 300
                  </span>
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
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          <FaIndianRupeeSign size={11} /> {upgradeCost}
                        </span>
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
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          <FaIndianRupeeSign size={11} /> {b.price}
                        </span>
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
