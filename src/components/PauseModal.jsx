import React from 'react';

export function PauseModal({ onResume, onRestart, onHome }) {
  return (
    <div className="menu-overlay pause-overlay">
      <div className="modal-container pause-card">
        <div className="pause-title">RUN PAUSED</div>
        <div className="pause-subtext">Take a breath, surfer!</div>

        <div className="pause-actions-list">
          <button className="btn-primary-run" onClick={onResume}>
            <span className="play-triangle">▶</span>
            <span className="play-text">RESUME RUN</span>
            <span className="key-hint">ESC / P</span>
          </button>
          <button className="menu-secondary-btn" onClick={onRestart}>
            <span className="btn-icon">🔄</span>
            <span>RESTART RUN</span>
          </button>
          <button className="menu-secondary-btn" onClick={onHome}>
            <span className="btn-icon">🏠</span>
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
}
