import React from 'react';
import {
  IoPlay,
  IoStorefront,
  IoGameControllerOutline,
  IoTrophy
} from 'react-icons/io5';
import { FaIndianRupeeSign } from 'react-icons/fa6';

export function StartScreen({
  highScore,
  totalCoins,
  hoverboardStock,
  onStartGame,
  onOpenShop,
  onOpenControls,
  assetsProgress = 0,
  isAssetsReady = false
}) {
  return (
    <div className="start-screen-overlay blr-theme">
      {/* 1. Sleek Floating Top Bar */}
      <header className="blr-top-bar">
        {/* Namma Bengaluru City Emblem */}
        <div className="blr-kannada-badge">
          <div className="kannada-flag-bar" />
          <span className="kannada-text">NAMMA BENGALURU</span>
        </div>

        {/* Currency & Record Glass Pills */}
        <div className="blr-top-stats">
          <div className="blr-stat-pill coin-pill">
            <span className="pill-icon gold"><FaIndianRupeeSign /></span>
            <span className="pill-val">{totalCoins.toLocaleString()}</span>
          </div>
          <div className="blr-stat-pill trophy-pill">
            <span className="pill-icon amber"><IoTrophy /></span>
            <span className="pill-val">{highScore.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* 2. Hero Centerpiece (Pure Bangalore Local Arcade Vibe) */}
      <main className="blr-hero-center">
        {/* Arcade Tag */}
        <div className="blr-arcade-tag">ORR RUNNER</div>

        {/* 3D Extruded Title Header */}
        <div className="blr-title-stack">
          <div className="blr-title-word top">BENGALURU</div>
          <div className="blr-title-word bottom">ORR RUSH</div>
        </div>

        {/* Minimal Route Chip */}
        <div className="blr-route-chip">
          <span>PANATHUR</span>
          <span className="chip-sep">⚡</span>
          <span>SILK BOARD</span>
          <span className="chip-sep">⚡</span>
          <span>ECOSPACE</span>
        </div>
      </main>

      {/* 3. Action Center & Abstract Loader */}
      <footer className="blr-bottom-center">
        {/* Abstract Minimalist Loader (NO model names, NO technical clutter) */}
        {!isAssetsReady && (
          <div className="blr-abstract-loader">
            <div className="abstract-loader-bar">
              <div
                className="abstract-loader-fill"
                style={{ width: `${Math.max(8, assetsProgress)}%` }}
              />
              <div
                className="abstract-loader-spark"
                style={{ left: `${Math.max(8, assetsProgress)}%` }}
              />
            </div>
          </div>
        )}

        {/* Big Bangalore Golden 3D Arcade RIDE Button */}
        <button
          className={`blr-btn-ride ${!isAssetsReady ? 'loading-locked' : 'ready-active'}`}
          onClick={() => {
            if (isAssetsReady) onStartGame();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            if (isAssetsReady) onStartGame();
          }}
          disabled={!isAssetsReady}
          id="btn-start-run"
          aria-label="Start Ride"
        >
          {isAssetsReady ? (
            <>
              <span className="ride-play-icon"><IoPlay /></span>
              <span className="ride-text">RIDE</span>
              <span className="ride-key-hint">SPACE</span>
            </>
          ) : (
            <>
              <span className="ride-spinner" />
              <span className="ride-text loading">STARTING ENGINE...</span>
            </>
          )}
        </button>

        {/* Clean Secondary Action Bar */}
        <nav className="blr-actions-bar">
          <button className="blr-action-btn" onClick={onOpenShop} title="Garage & Boards">
            <span className="action-icon"><IoStorefront /></span>
            <span className="action-label">GARAGE</span>
          </button>

          <button className="blr-action-btn" onClick={onOpenControls} title="Game Controls">
            <span className="action-icon"><IoGameControllerOutline /></span>
            <span className="action-label">CONTROLS</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}
