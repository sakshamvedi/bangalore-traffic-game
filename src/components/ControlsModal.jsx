import React from 'react';

export function ControlsModal({ onClose }) {
  const controls = [
    {
      keys: ['←', 'A'],
      touch: 'Swipe Left',
      action: 'Change to Left Lane (Avoid Autos)',
      icon: '⬅️'
    },
    {
      keys: ['→', 'D'],
      touch: 'Swipe Right',
      action: 'Change to Right Lane',
      icon: '➡️'
    },
    {
      keys: ['↑', 'W', 'Space'],
      touch: 'Swipe Up',
      action: 'Jump over Potholes & onto BMTC Bus roofs',
      icon: '⬆️'
    },
    {
      keys: ['↓', 'S'],
      touch: 'Swipe Down',
      action: 'Slide under hanging fiber cables',
      icon: '⬇️'
    },
    {
      keys: ['Double Space'],
      touch: 'Double Tap',
      action: 'Deploy Auto-Rickshaw Shield / Ather Scooter',
      icon: '🛺'
    },
    {
      keys: ['P', 'Esc'],
      touch: 'Pause Button',
      action: 'Take a Chai break / Pause Run',
      icon: '☕'
    }
  ];

  return (
    <div className="modal-backdrop daylight-backdrop">
      <div className="modal-container controls-modal daylight-modal">
        <div className="modal-header">
          <span className="modal-title">ORR SURVIVAL GUIDE</span>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="controls-grid">
          {controls.map((item, idx) => (
            <div className="control-row-card daylight-row-card" key={idx}>
              <div className="control-icon">{item.icon}</div>
              <div className="control-info">
                <div className="control-action daylight-text">{item.action}</div>
                <div className="control-touch-hint daylight-hint-text">📱 {item.touch}</div>
              </div>
              <div className="control-keys">
                {item.keys.map((k, kIdx) => (
                  <span className="key-badge daylight-key" key={kIdx}>{k}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pro-tips-card daylight-pro-tip">
          <span className="tip-title">PEAK BENGALURU PRO TIP:</span>
          <span className="tip-text">
            Running on top of BMTC buses is the fastest way to bypass Outer Ring Road traffic jams!
          </span>
        </div>

        <div className="modal-footer">
          <button className="btn-done daylight-done-btn" onClick={onClose}>
            READY TO HUSTLE!
          </button>
        </div>
      </div>
    </div>
  );
}
