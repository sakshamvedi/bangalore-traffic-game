import React, { useState, useEffect } from 'react';

export function StartScreen({
  highScore,
  totalCoins,
  hoverboardStock,
  onStartGame,
  onOpenShop,
  onOpenControls
}) {
  const [tickerIndex, setTickerIndex] = useState(0);

  const tickerMessages = [
    '🏢 EcoSpace Tech Park: Monday Morning Standup at 9:00 AM sharp!',
    '🤖 Sarvam AI: Building Indic LLMs while waiting at Silk Board junction',
    'ಮಾರತ್ತಹಳ್ಳಿ ➔ ಸಿಲ್ಕ್ ಬೋರ್ಡ್: ORR Traffic High alert! Dodge BMTC buses & autos!',
    '⚡ Krutrim AI: 100 Billion Parameters, 0 Bangalore Parking Spots',
    '☕ ಶ್ರೀ ಕೃಷ್ಣ ಟೀ ಸ್ಟಾಲ್: 100% Pure Chicory Filter Kaapi & Bun Maska',
    '🚀 OpenAI BLR: AGI will arrive before Silk Board Flyover completes',
    'வணக்கம் பெங்களூரு: சென்னை To சில்க் போர்டு Express!'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerMessages.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="menu-overlay daylight-overlay">
      <div className="start-content-card daylight-card three-d-card">
        {/* Namma Bengaluru 3D Extruded Header */}
        <div className="logo-container">
          <div className="kannada-tag">ನಮ್ಮ BENGALURU</div>
          <div className="graffiti-subway three-d-title-top">NAMMA</div>
          <div className="graffiti-surfers three-d-title-bottom">BENGALURU</div>
          <div className="logo-subline daylight-subline">
            <span>TRAFFIC SURFER // SILICON VALLEY OF INDIA</span>
          </div>
        </div>

        {/* Primary Mission Card: Monday Morning 9:00 AM */}
        <div className="mission-briefing-card three-d-card">
          <div className="mission-badge">🚨 PRIMARY MISSION</div>
          <h2 className="mission-headline">"Monday Morning. 9:00 AM. Your office is waiting. Beat the Bangalore traffic!"</h2>
          <div className="mission-details-grid">
            <div className="mission-stat">
              <span className="ms-label">DESTINATION</span>
              <span className="ms-val">EcoSpace Tech Park</span>
            </div>
            <div className="mission-stat">
              <span className="ms-label">DISTANCE</span>
              <span className="ms-val">3,000 Meters</span>
            </div>
            <div className="mission-stat">
              <span className="ms-label">STANDUP TIME</span>
              <span className="ms-val punch-time">9:00 AM Sharp</span>
            </div>
          </div>
        </div>

        {/* Live Ticker: Tamil & AI Startup Boards */}
        <div className="live-ticker-bar">
          <span className="ticker-badge">LIVE ORR</span>
          <span className="ticker-text">{tickerMessages[tickerIndex]}</span>
        </div>

        {/* High Score & Rupees Pill */}
        <div className="start-stats-row">
          <div className="stat-pill daylight-pill three-d-pill">
            <span className="pill-icon">🏆</span>
            <span className="pill-label">HIGHEST VALUATION</span>
            <span className="pill-val">{highScore.toLocaleString()}</span>
          </div>
          <div className="stat-pill daylight-pill three-d-pill">
            <span className="pill-icon">₹</span>
            <span className="pill-label">BANK BALANCE</span>
            <span className="pill-val">₹{totalCoins.toLocaleString()}</span>
          </div>
        </div>

        {/* 3D Commuter Avatar & Modern Bangalore Scooty Showcase */}
        <div className="character-preview-box daylight-preview">
          <div className="character-avatar-stage scooter-stage">
            <div className="stage-platform-3d"></div>
            <div className="three-d-character-card">
              <div className="commuter-avatar-icon">🛵💨</div>
              <div className="commuter-meta">
                <span className="commuter-title">BANGALORE TECH COMMUTER (Age 25)</span>
                <span className="commuter-specs">
                  Office Polo • Blue Denim • Office Backpack • Fitted Helmet • Modern Indian Scooty
                </span>
              </div>
            </div>
          </div>
          <div className="character-tag daylight-char-tag">
            <span>RIDING POSTURE: HANDS ON HANDLEBARS • FEET ON FOOTBOARD</span>
          </div>
        </div>

        {/* 3D Primary Hustle Button */}
        <button
          className="btn-primary-run daylight-run-btn three-d-button"
          onClick={onStartGame}
          id="btn-start-run"
        >
          <span className="play-triangle">🛵</span>
          <span className="play-text">RIDE TO OFFICE (BEAT 9:00 AM)</span>
          <span className="key-hint">SPACEBAR</span>
        </button>

        {/* Secondary Navigation */}
        <div className="start-menu-actions">
          <button className="menu-secondary-btn daylight-sec-btn three-d-sub-btn" onClick={onOpenShop}>
            <span className="btn-icon">☕</span>
            <span>FILTER KAAPI & SHOP</span>
          </button>
          <button className="menu-secondary-btn daylight-sec-btn three-d-sub-btn" onClick={onOpenControls}>
            <span className="btn-icon">🗺️</span>
            <span>TRAFFIC GUIDE</span>
          </button>
        </div>

        {/* Footer */}
        <div className="start-footer-hint daylight-hint">
          <span>⚠️ Dodge blue-and-white BMTC electric buses, oncoming scooters, autos & potholes!</span>
        </div>
      </div>
    </div>
  );
}
