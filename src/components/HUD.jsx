import React from 'react';

export function HUD({
  score,
  highScore,
  coins,
  multiplier,
  powerups,
  hoverboardStock,
  distance = 0,
  remainingDistance = 3000,
  speedKmh = 55,
  onActivateHoverboard,
  onPause,
  isMuted,
  onToggleMute,
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide
}) {
  // Calculate simulated commute clock from 8:44 AM to 9:00 AM
  const totalMeters = 3000;
  const progressRatio = Math.min(1, Math.max(0, distance / totalMeters));
  // 16 minutes from 8:44 to 9:00 AM
  const elapsedMinutes = Math.floor(progressRatio * 15);
  const elapsedSeconds = Math.floor((progressRatio * 15 * 60) % 60);
  const currentMin = 44 + elapsedMinutes;
  const clockText = `8:${currentMin < 10 ? '0' : ''}${currentMin} AM`;

  return (
    <div className="game-hud daylight-hud">
      {/* Top Left: Startup Valuation Score & Peak Record */}
      <div className="hud-top-left">
        <div className="hud-city-badge">
          <span>ನಮ್ಮ BENGALURU</span>
        </div>
        <div className="hud-score-card">
          <span className="hud-label">VALUATION SCORE</span>
          <span className="hud-score-value">{score.toLocaleString()}</span>
        </div>
        <div className="hud-highscore-badge three-d-badge">
          <span className="crown-icon">🏆</span>
          <span className="highscore-text">PEAK: {highScore.toLocaleString()}</span>
        </div>
      </div>

      {/* Top Center: PRIMARY OFFICE MISSION TRACKER */}
      <div className="hud-office-tracker three-d-badge">
        <div className="office-tracker-header">
          <span className="tracker-clock">⏰ {clockText}</span>
          <span className="tracker-target">DESTINATION: ECOSPACE TECH PARK</span>
          <span className="tracker-speed">⚡ {speedKmh} KM/H</span>
        </div>

        {/* Progress Bar from Home to Office */}
        <div className="office-progress-track">
          <div
            className="office-progress-fill"
            style={{ width: `${progressRatio * 100}%` }}
          />
          <div
            className="office-scooter-pin"
            style={{ left: `${progressRatio * 96}%` }}
          >
            🛵
          </div>
          <div className="office-destination-flag">
            🏢
          </div>
        </div>

        <div className="office-tracker-footer">
          <span className="dist-remaining">
            {remainingDistance > 0 ? `${remainingDistance.toLocaleString()}m TO OFFICE` : 'ARRIVED AT ECOSPACE!'}
          </span>
          <span className="punch-in-target">PUNCH-IN BY 9:00 AM</span>
        </div>
      </div>

      {/* Top Right: ₹ Rupee Coins, Filter Kaapi Multiplier, Controls */}
      <div className="hud-top-right">
        {/* Rupee Coin Badge */}
        <div className="hud-coin-badge daylight-badge three-d-badge">
          <span className="rupee-icon">₹</span>
          <span className="coin-count">{coins.toLocaleString()}</span>
        </div>

        {/* Filter Kaapi Multiplier Badge */}
        <div className={`hud-multiplier-badge daylight-badge three-d-badge ${powerups.multiplier > 0 ? 'boosted' : ''}`}>
          <span>{powerups.multiplier > 0 ? `☕ x${multiplier * 2}` : `x${multiplier}`}</span>
        </div>

        {/* Action Buttons */}
        <div className="hud-action-buttons">
          <button
            className="hud-circle-btn three-d-circle"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            className="hud-circle-btn three-d-circle"
            onClick={onPause}
            title="Pause Game (P or Esc)"
          >
            ⏸️
          </button>
        </div>
      </div>

      {/* Left: Active Bangalore Power-ups */}
      <div className="hud-active-powerups">
        {powerups.multiplier > 0 && (
          <div className="powerup-meter kaapi three-d-meter">
            <span className="powerup-icon">☕</span>
            <div className="powerup-info">
              <span className="meter-label">FILTER KAAPI 2X</span>
              <div className="powerup-bar-track">
                <div
                  className="powerup-bar-fill kaapi-fill"
                  style={{ width: `${(powerups.multiplier / 15) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {powerups.magnet > 0 && (
          <div className="powerup-meter magnet three-d-meter">
            <span className="powerup-icon">🧲</span>
            <div className="powerup-info">
              <span className="meter-label">VC FUNDING</span>
              <div className="powerup-bar-track">
                <div
                  className="powerup-bar-fill magnet-fill"
                  style={{ width: `${(powerups.magnet / 15) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {powerups.sneakers > 0 && (
          <div className="powerup-meter warp three-d-meter">
            <span className="powerup-icon">⚡</span>
            <div className="powerup-info">
              <span className="meter-label">ATHER WARP LEAP</span>
              <div className="powerup-bar-track">
                <div
                  className="powerup-bar-fill warp-fill"
                  style={{ width: `${(powerups.sneakers / 15) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {powerups.jetpack > 0 && (
          <div className="powerup-meter jetpack three-d-meter">
            <span className="powerup-icon">🚀</span>
            <div className="powerup-info">
              <span className="meter-label">METRO SKY FLIGHT</span>
              <div className="powerup-bar-track">
                <div
                  className="powerup-bar-fill jetpack-fill"
                  style={{ width: `${(powerups.jetpack / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Center: Quick Auto-Rickshaw Shield */}
      {hoverboardStock > 0 && (
        <div className="hud-hoverboard-quick">
          <button
            className="hoverboard-btn bangalore-btn three-d-board-btn"
            onClick={onActivateHoverboard}
            title="Double-tap screen or Spacebar"
          >
            <span className="board-emoji">🛺</span>
            <span className="board-text">AUTO SHIELD ({hoverboardStock})</span>
          </button>
        </div>
      )}

      {/* On-Screen Mobile Touch Controls (Left/Right & Jump/Slide) */}
      <div className="mobile-touch-controls">
        <div className="touch-group touch-left-group">
          <button
            className="touch-btn touch-left-btn"
            onTouchStart={(e) => { e.preventDefault(); onMoveLeft && onMoveLeft(); }}
            onClick={onMoveLeft}
            aria-label="Move Left"
          >
            ◀
          </button>
          <button
            className="touch-btn touch-right-btn"
            onTouchStart={(e) => { e.preventDefault(); onMoveRight && onMoveRight(); }}
            onClick={onMoveRight}
            aria-label="Move Right"
          >
            ▶
          </button>
        </div>

        <div className="touch-group touch-right-group">
          <button
            className="touch-btn touch-jump-btn"
            onTouchStart={(e) => { e.preventDefault(); onJump && onJump(); }}
            onClick={onJump}
            aria-label="Jump"
          >
            ▲
          </button>
          <button
            className="touch-btn touch-slide-btn"
            onTouchStart={(e) => { e.preventDefault(); onSlide && onSlide(); }}
            onClick={onSlide}
            aria-label="Slide / Duck"
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}
