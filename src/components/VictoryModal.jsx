import React from 'react';

export function VictoryModal({
  stats,
  highScore,
  isNewRecord,
  onRestart,
  onOpenShop,
  onHome
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="menu-overlay daylight-overlay victory-overlay">
      <div className="game-over-card daylight-card three-d-card victory-card">
        {/* Victory Header */}
        <div className="busted-stamp-container victory-header-container">
          <div className="kannada-stamp-tag">ECOSPACE TECH PARK // PUNCH-IN GATE 1</div>
          <div className="victory-stamp three-d-stamp">YOU MADE IT TO OFFICE!</div>
          <div className="busted-subtext daylight-subtext">
            Clocked in at 8:58 AM! Beat the Silk Board & Bellandur traffic just in time for the 9:00 AM standup!
          </div>
        </div>

        {/* Tech Park Commuter Badge */}
        <div className="victory-badge-row">
          <div className="victory-pill three-d-pill">
            <span className="pill-emoji">🏢</span>
            <span className="pill-text">ECOSPACE TECH PARK REACHED (3.0 KM)</span>
          </div>
        </div>

        {/* New Record Banner if high score broken */}
        {isNewRecord && (
          <div className="new-record-banner bangalore-record three-d-record">
            <span className="trophy-bounce">🦄</span>
            <span>NEW UNICORN VALUATION!</span>
          </div>
        )}

        {/* Commute Summary Breakdown */}
        <div className="game-over-stats-grid victory-stats-grid">
          <div className="run-stat-card primary-score daylight-stat-card three-d-stat">
            <span className="stat-label">STARTUP VALUATION</span>
            <span className="stat-value">{stats.score.toLocaleString()}</span>
          </div>

          <div className="run-stat-card daylight-stat-card three-d-stat">
            <span className="stat-label">PUNCH-IN STATUS</span>
            <span className="stat-value on-time-val">8:58 AM (ON TIME!)</span>
          </div>

          <div className="run-stat-card daylight-stat-card three-d-stat">
            <span className="stat-label">RUPEES SAVED</span>
            <span className="stat-value coin-val">₹ +{stats.coins.toLocaleString()}</span>
          </div>

          <div className="run-stat-card daylight-stat-card three-d-stat">
            <span className="stat-label">COMMUTE TIME</span>
            <span className="stat-value">{formatTime(stats.timeTaken || 95)}</span>
          </div>
        </div>

        {/* Performance Rating */}
        <div className="commuter-rating-box">
          <span className="rating-stars">⭐⭐⭐⭐⭐</span>
          <span className="rating-tag">COMMUTER RATING: 10x BANGALORE RIDER</span>
        </div>

        {/* Buttons */}
        <div className="game-over-actions">
          <button
            className="btn-primary-run daylight-run-btn three-d-button"
            onClick={onRestart}
            id="btn-victory-restart"
          >
            <span className="play-triangle">🛵</span>
            <span className="play-text">RIDE AGAIN (TUESDAY COMMUTE)</span>
            <span className="key-hint">SPACEBAR</span>
          </button>

          <div className="secondary-actions-row">
            <button className="menu-secondary-btn daylight-sec-btn three-d-sub-btn" onClick={onOpenShop}>
              <span className="btn-icon">☕</span>
              <span>FILTER KAAPI & SHOP</span>
            </button>
            <button className="menu-secondary-btn daylight-sec-btn three-d-sub-btn" onClick={onHome}>
              <span className="btn-icon">🏠</span>
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
