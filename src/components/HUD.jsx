import React from 'react';
import {
  IoSpeedometerOutline,
  IoFlash,
  IoCafe,
  IoMegaphone,
  IoVolumeMute,
  IoVolumeHigh,
  IoPause,
  IoMagnet,
  IoRocket,
  IoVideocamOutline,
  IoChevronForward,
  IoWarningOutline,
  IoCall
} from 'react-icons/io5';
import { FaIndianRupeeSign } from 'react-icons/fa6';

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
  routeInfo = null,
  powerupPopup = null,
  onActivateHoverboard,
  onPause,
  isMuted,
  onToggleMute,
  onHonkHorn,
  onToggleCamera,
  onThrottle,
  onBrake,
  onJump,
  onDismissTeamsCall
}) {
  const totalMeters = 3000;
  const progressRatio = Math.min(1, Math.max(0, distance / totalMeters));
  const elapsedMinutes = Math.floor(progressRatio * 15);
  const currentMin = 44 + elapsedMinutes;
  const clockHour = currentMin >= 60 ? 9 : 8;
  const clockMinDisplay = currentMin >= 60 ? currentMin - 60 : currentMin;
  const clockText = `${clockHour}:${clockMinDisplay < 10 ? '0' : ''}${clockMinDisplay}`;

  const distKm = (distance / 1000).toFixed(1);
  const remKm = (remainingDistance / 1000).toFixed(1);

  // 5 Real Bangalore Route Commute Stages
  const routeStages = [
    { id: 1, label: 'Sobha Sentosa' },
    { id: 2, label: 'Panathur' },
    { id: 3, label: 'Underpass' },
    { id: 4, label: 'ORR Signal' },
    { id: 5, label: 'Ecospace' }
  ];
  const activeSegmentId = routeInfo?.currentSegment?.id || 1;

  return (
    <div className="raw-hud">
      {/* ── Top-left: Score cluster ── */}
      <div className="raw-score-cluster">
        <div className="raw-score-main">{score.toLocaleString()}</div>
        <div className="raw-score-meta">
          <span className="raw-hi">HI {highScore.toLocaleString()}</span>
          <span className="raw-dist">{distKm} km</span>
        </div>
      </div>

      {/* ── Route Milestone Breadcrumbs Strip ── */}
      <div className="raw-breadcrumbs">
        {routeStages.map((stg, i) => {
          const isActive = stg.id === activeSegmentId;
          const isCompleted = stg.id < activeSegmentId;
          return (
            <React.Fragment key={stg.id}>
              <span className={`breadcrumb-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                {stg.label}
              </span>
              {i < routeStages.length - 1 && (
                <span className="breadcrumb-arrow"><IoChevronForward /></span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Dynamic Traffic Signal Alert ── */}
      {routeInfo?.signalStatus && (
        <div className={`raw-signal-alert signal-${routeInfo.signalStatus.state}`}>
          {routeInfo.signalStatus.state === 'red' && (
            <span>
              🔴 RED LIGHT // STOP BEHIND STOP LINE (+500 BONUS) [{routeInfo.signalStatus.distToLine}m]
            </span>
          )}
          {routeInfo.signalStatus.state === 'amber' && (
            <span>🟡 AMBER LIGHT // PREPARE TO ACCELERATE</span>
          )}
          {routeInfo.signalStatus.state === 'green' && (
            <span>🟢 GREEN LIGHT // CLEARED FOR ECOSPACE</span>
          )}
        </div>
      )}

      {/* ── Auto Brake Assist Warning ── */}
      {routeInfo?.autoBrakeAssist && !routeInfo?.signalStatus && (
        <div className="raw-brake-assist-badge">
          <IoWarningOutline />
          <span>BRAKE ASSIST // QUEUE AHEAD</span>
        </div>
      )}

      {/* ── Milestone Toast Notification ── */}
      {routeInfo?.milestone && (
        <div className="raw-milestone-toast">
          <span className="milestone-kannada">{routeInfo.milestone.kannada}</span>
          <span className="milestone-title">{routeInfo.milestone.title}</span>
          <span className="milestone-desc">{routeInfo.milestone.subtitle}</span>
        </div>
      )}

      {/* ── Powerup Activated Popup Notification ── */}
      {powerupPopup && (
        <div
          className="raw-powerup-activated-popup"
          style={{ borderColor: powerupPopup.color || '#38bdf8' }}
        >
          <div
            className="popup-icon-badge"
            style={{ textShadow: `0 0 16px ${powerupPopup.color || '#38bdf8'}` }}
          >
            {powerupPopup.icon}
          </div>
          <div className="popup-text-content">
            <div className="popup-title" style={{ color: powerupPopup.color || '#38bdf8' }}>
              {powerupPopup.title}
            </div>
            <div className="popup-subtitle">
              {powerupPopup.subtitle}
            </div>
          </div>
        </div>
      )}

      {/* ── Top-right: Controls strip ── */}
      <div className="raw-controls-strip">
        <div className="raw-coin-pill">
          <FaIndianRupeeSign size={12} />
          <span>{coins.toLocaleString()}</span>
        </div>
        {powerups.multiplier > 0 && (
          <div className="raw-mult-pill active">
            <IoCafe size={12} />
            <span>x{multiplier * 2}</span>
          </div>
        )}
        <button className="raw-ctrl-btn" onClick={onHonkHorn} aria-label="Horn">
          <IoMegaphone size={14} />
        </button>
        <button className="raw-ctrl-btn" onClick={onToggleCamera} aria-label="Toggle Camera Angle" title="Camera View (C)">
          <IoVideocamOutline size={14} />
        </button>
        <button className="raw-ctrl-btn" onClick={onToggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? <IoVolumeMute size={14} /> : <IoVolumeHigh size={14} />}
        </button>
        <button className="raw-ctrl-btn" onClick={onPause} aria-label="Pause">
          <IoPause size={14} />
        </button>
      </div>

      {/* ── Bottom-left: Speedometer ── */}
      <div className="raw-speedo">
        <IoSpeedometerOutline className="raw-speedo-icon" />
        <div className="raw-speedo-nums">
          <span className="raw-speed-val">{speedKmh}</span>
          <span className="raw-speed-unit">km/h</span>
        </div>
      </div>

      {/* ── Left edge: Active powerup pills ── */}
      {(powerups.multiplier > 0 || powerups.magnet > 0 || powerups.sneakers > 0 || powerups.jetpack > 0) && (
        <div className="raw-powerup-stack">
          {powerups.multiplier > 0 && (
            <div className="raw-pw-pill pw-kaapi">
              <IoCafe size={12} />
              <div className="raw-pw-bar">
                <div className="raw-pw-fill" style={{ width: `${(powerups.multiplier / 15) * 100}%`, background: '#ea580c' }} />
              </div>
            </div>
          )}
          {powerups.magnet > 0 && (
            <div className="raw-pw-pill pw-magnet">
              <IoMagnet size={12} />
              <div className="raw-pw-bar">
                <div className="raw-pw-fill" style={{ width: `${(powerups.magnet / 15) * 100}%`, background: '#a855f7' }} />
              </div>
            </div>
          )}
          {powerups.sneakers > 0 && (
            <div className="raw-pw-pill pw-warp">
              <IoFlash size={12} />
              <div className="raw-pw-bar">
                <div className="raw-pw-fill" style={{ width: `${(powerups.sneakers / 15) * 100}%`, background: '#10b981' }} />
              </div>
            </div>
          )}
          {powerups.jetpack > 0 && (
            <div className="raw-pw-pill pw-jet">
              <IoRocket size={12} />
              <div className="raw-pw-bar">
                <div className="raw-pw-fill" style={{ width: `${(powerups.jetpack / 10) * 100}%`, background: '#0ea5e9' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Teams Incoming Call Toast (Triggered on Pothole) ── */}
      {routeInfo?.teamsCallActive && (
        <div className="raw-teams-call-toast">
          <div className="teams-call-badge">
            <span className="teams-call-pulse-dot" />
            <span className="teams-logo-tag">TEAMS CALL</span>
          </div>

          <button
            className="teams-btn-decline"
            onClick={(e) => {
              e.stopPropagation();
              onDismissTeamsCall && onDismissTeamsCall();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDismissTeamsCall && onDismissTeamsCall();
            }}
            title="Disconnect Teams Call"
            aria-label="Disconnect Teams Call"
          >
            <IoCall size={13} className="teams-hangup-icon" />
            <span>Decline</span>
          </button>
        </div>
      )}

      {/* ── Left Control: Brake (Left Thumb) ── */}
      <div className="raw-pedal-left-zone">
        <button
          className={`raw-pedal-btn pedal-brake ${routeInfo?.isBraking ? 'active' : ''}`}
          onPointerDown={() => onBrake && onBrake(true)}
          onPointerUp={() => onBrake && onBrake(false)}
          onPointerLeave={() => onBrake && onBrake(false)}
          onTouchStart={(e) => { e.preventDefault(); if (onBrake) onBrake(true); }}
          onTouchEnd={(e) => { e.preventDefault(); if (onBrake) onBrake(false); }}
          aria-label="Brake [S / ↓]"
        >
          <span className="pedal-label">BRAKE</span>
          <span className="pedal-sub">[S / ↓]</span>
        </button>
      </div>

      {/* ── Right Control: Accelerator (Right Thumb) ── */}
      <div className="raw-pedal-right-zone">
        <button
          className={`raw-pedal-btn pedal-gas ${routeInfo?.isAccelerating ? 'active' : ''}`}
          onPointerDown={() => onThrottle && onThrottle(true)}
          onPointerUp={() => onThrottle && onThrottle(false)}
          onPointerLeave={() => onThrottle && onThrottle(false)}
          onTouchStart={(e) => { e.preventDefault(); if (onThrottle) onThrottle(true); }}
          onTouchEnd={(e) => { e.preventDefault(); if (onThrottle) onThrottle(false); }}
          aria-label="Accelerator [W / ↑]"
        >
          <span className="pedal-label">ACCEL</span>
          <span className="pedal-sub">[W / ↑]</span>
        </button>
      </div>
    </div>
  );
}
