import React from 'react';
import {
  IoArrowBack,
  IoArrowForward,
  IoArrowUp,
  IoArrowDown,
  IoPhonePortraitOutline,
  IoClose,
  IoBulbOutline,
  IoMegaphone
} from 'react-icons/io5';

export function ControlsModal({ onClose }) {
  const controls = [
    {
      keys: ['W', '↑', 'GAS'],
      touch: 'Hold GAS / Swipe Up',
      action: 'Accelerate (Progressive Throttle)',
      icon: <IoArrowUp size={20} color="#10b981" />
    },
    {
      keys: ['S', '↓', 'BRAKE'],
      touch: 'Hold BRAKE / Swipe Down',
      action: 'Brake to complete 0 km/h stop at queues & red lights',
      icon: <IoArrowDown size={20} color="#ef4444" />
    },
    {
      keys: ['A', '←'],
      touch: 'Swipe Left',
      action: 'Steer Left Lane (Weave through Bangalore traffic)',
      icon: <IoArrowBack size={20} color="#38bdf8" />
    },
    {
      keys: ['D', '→'],
      touch: 'Swipe Right',
      action: 'Steer Right Lane',
      icon: <IoArrowForward size={20} color="#38bdf8" />
    },
    {
      keys: ['Space'],
      touch: 'Tap Jump',
      action: 'Jump over Potholes & Barricades (Disabled at Red Light)',
      icon: <IoArrowUp size={20} color="#f59e0b" />
    },
    {
      keys: ['H', 'F'],
      touch: 'Horn Button',
      action: 'Honk Scooty Horn (Nearby vehicles honk back!)',
      icon: <IoMegaphone size={20} color="#eab308" />
    },
    {
      keys: ['C', 'V'],
      touch: 'Camera Button',
      action: 'Toggle 3D Camera Views (Chase / Close-up / Classic)',
      icon: <IoPhonePortraitOutline size={20} color="#8b5cf6" />
    }
  ];

  return (
    <div className="modal-backdrop daylight-backdrop">
      <div className="modal-container controls-modal daylight-modal">
        <div className="modal-header">
          <span className="modal-title">ORR SURVIVAL GUIDE</span>
          <button className="modal-close-btn" onClick={onClose}><IoClose size={22} /></button>
        </div>

        <div className="controls-grid">
          {controls.map((item, idx) => (
            <div className="control-row-card daylight-row-card" key={idx}>
              <div className="control-icon">{item.icon}</div>
              <div className="control-info">
                <div className="control-action daylight-text">{item.action}</div>
                <div className="control-touch-hint daylight-hint-text">
                  <IoPhonePortraitOutline size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  {item.touch}
                </div>
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
          <span className="tip-title">
            <IoBulbOutline size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            PEAK BENGALURU PRO TIP:
          </span>
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
