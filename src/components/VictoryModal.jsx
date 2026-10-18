import React from 'react';
import {
  IoBusiness,
  IoTrophy,
  IoStar,
  IoRefresh,
  IoCafe,
  IoHome
} from 'react-icons/io5';
import { FaIndianRupeeSign } from 'react-icons/fa6';

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
          <div className="kannada-stamp-tag">ECOSPACE BUSINESS PARK // BELLANDUR ORR</div>
          <div className="victory-stamp three-d-stamp">YOU MADE IT TO THE OFFICE!</div>
          <div className="busted-subtext daylight-subtext">
            Another Bangalore commute conquered. Beat the Panathur underpass bottleneck and clocked in before 9:00 AM!
          </div>
        </div>

        {/* Tech Park Commuter Badge */}
        <div className="victory-badge-row">
          <div className="victory-pill three-d-pill">
            <span className="pill-vector-icon"><IoBusiness /></span>
            <span className="pill-text">SOBHA SENTOSA ➔ ECOSPACE ARRIVAL (3.0 KM)</span>
          </div>
        </div>

        {/* New Record Banner if high score broken */}
        {isNewRecord && (
          <div className="new-record-banner bangalore-record three-d-record">
            <span className="trophy-bounce"><IoTrophy /></span>
            <span>Udupi Chalein ??? </span>
          </div>
        )}

        {/* Commute Summary Breakdown */}
        <div className="game-over-stats-grid victory-stats-grid">
          <div className="run-stat-card primary-score daylight-stat-card three-d-stat">
            <span className="stat-label">Rapida Taxi Fare</span>
            <span className="stat-value">{stats.score.toLocaleString()}</span>
          </div>

          <div className="run-stat-card daylight-stat-card three-d-stat">
            <span className="stat-label">TOTAL COMMUTE TIME</span>
            <span className="stat-value">{formatTime(stats.timeTaken || 95)}</span>
          </div>

          <div className="run-stat-card daylight-stat-card three-d-stat">
            <span className="stat-label">DISTANCE TRAVELED</span>
            <span className="stat-value">3.0 KM (3,000 M)</span>
          </div>

          <div className="run-stat-card daylight-stat-card three-d-stat">
            <span className="stat-label">TRAFFIC STOPS</span>
            <span className="stat-value on-time-val">{stats.trafficStops ?? 1} STOPS</span>
          </div>

          <div className="run-stat-card daylight-stat-card three-d-stat">
            <span className="stat-label">TRAFFIC-RULE BONUS</span>
            <span className="stat-value on-time-val">+{stats.trafficRuleBonus ?? 500} PTS</span>
          </div>

          <div className="run-stat-card daylight-stat-card three-d-stat">
            <span className="stat-label">RUPEES SAVED</span>
            <span className="stat-value coin-val"><FaIndianRupeeSign /> +{stats.coins.toLocaleString()}</span>
          </div>
        </div>

        {/* Performance Rating */}
        <div className="commuter-rating-box">
          <div className="rating-stars-row">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="star-icon"><IoStar /></span>
            ))}
          </div>
          <span className="rating-tag">COMMUTER RATING: 10x BANGALORE RIDER</span>
        </div>

        {/* Buttons */}
        <div className="game-over-actions">
          <button
            className="btn-primary-run daylight-run-btn three-d-button"
            onClick={onRestart}
            id="btn-victory-restart"
          >
            <span className="play-triangle"><IoRefresh /></span>
            <span className="play-text">RIDE AGAIN (TUESDAY COMMUTE)</span>
            <span className="key-hint">SPACEBAR</span>
          </button>

          <div className="secondary-actions-row">
            <button className="menu-secondary-btn daylight-sec-btn three-d-sub-btn" onClick={onOpenShop}>
              <span className="btn-icon"><IoCafe /></span>
              <span>FILTER KAAPI & SHOP</span>
            </button>
            <button className="menu-secondary-btn daylight-sec-btn three-d-sub-btn" onClick={onHome}>
              <span className="btn-icon"><IoHome /></span>
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
