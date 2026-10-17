import React from 'react';

export function GameOverModal({
  stats,
  highScore,
  isNewRecord,
  onRestart,
  onOpenShop,
  onHome
}) {
  return (
    <div className="menu-overlay daylight-overlay">
      <div className="game-over-card daylight-card three-d-card">
        {/* Busted Header */}
        <div className="busted-stamp-container">
          <div className="kannada-stamp-tag">ನಮ್ಮ BENGALURU TRAFFIC POLICE</div>
          <div className="busted-stamp bangalore-stamp three-d-stamp">CHALLAN ISSUED!</div>
          <div className="busted-subtext daylight-subtext">
            Stuck at Silk Board! Traffic Mama caught you without a helmet.
          </div>
        </div>

        {/* Scooter Runner Avatar Thumbnail */}
        <div className="game-over-avatar-row">
          <img
            src="/runner_scooter.png"
            alt="Challaned Rider"
            className="game-over-scooter-thumb"
          />
        </div>

        {/* New Record Banner */}
        {isNewRecord && (
          <div className="new-record-banner bangalore-record three-d-record">
            <span className="trophy-bounce">🦄</span>
            <span>NEW UNICORN VALUATION!</span>
          </div>
        )}

        {/* Score & Run Breakdown */}
        <div className="game-over-stats-grid">
          <div className="run-stat-card primary-score daylight-stat-card three-d-stat">
            <span className="stat-label">FINAL STARTUP VALUATION</span>
            <span className="stat-value">{stats.score.toLocaleString()}</span>
          </div>

          <div className="run-stat-card daylight-stat-card three-d-stat">
            <span className="stat-label">RECORD VALUATION</span>
            <span className="stat-value">{highScore.toLocaleString()}</span>
          </div>

          <div className="run-stat-card daylight-stat-card three-d-stat">
            <span className="stat-label">RUPEES SAVED</span>
            <span className="stat-value coin-val">₹ +{stats.coins.toLocaleString()}</span>
          </div>

          <div className="run-stat-card daylight-stat-card three-d-stat">
            <span className="stat-label">ORR DISTANCE</span>
            <span className="stat-value">{(stats.distance / 100).toFixed(1)} km</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="game-over-actions">
          <button
            className="btn-primary-run daylight-run-btn three-d-button"
            onClick={onRestart}
            id="btn-restart-run"
          >
            <span className="play-triangle">🔄</span>
            <span className="play-text">RIDE AGAIN</span>
            <span className="key-hint">SPACEBAR</span>
          </button>

          <div className="secondary-actions-row">
            <button className="menu-secondary-btn daylight-sec-btn three-d-sub-btn" onClick={onOpenShop}>
              <span className="btn-icon">🛒</span>
              <span>SHOP</span>
            </button>
            <button className="menu-secondary-btn daylight-sec-btn three-d-sub-btn" onClick={onHome}>
              <span className="btn-icon">🏠</span>
              <span>MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
