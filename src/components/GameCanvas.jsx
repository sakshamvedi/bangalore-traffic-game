import React, { useRef, useEffect } from 'react';
import { ThreeEngine } from '../game/ThreeEngine.js';
import { soundManager } from '../game/AudioSynthesizer.js';

export function GameCanvas({
  gameState,
  onScoreUpdate,
  onCoinsUpdate,
  onPowerupChange,
  onGameOver,
  onHoverboardCountChange,
  onDistanceUpdate,
  onVictory,
  onTogglePause,
  onStartGame,
  onAssetsProgress,
  onPowerupCollected,
  engineRef
}) {
  const containerRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const lastTapRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Instantiate True 3D Three.js WebGL Engine!
    const engine = new ThreeEngine(container, {
      onScoreUpdate,
      onCoinsUpdate,
      onPowerupChange,
      onGameOver,
      onHoverboardCountChange,
      onDistanceUpdate,
      onVictory,
      onAssetsProgress,
      onPowerupCollected
    });

    if (engineRef) {
      engineRef.current = engine;
    }

    // Keyboard controls
    let lastSpaceTime = 0;
    const handleKeyDown = (e) => {
      soundManager.ensureContext();

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        onTogglePause();
        return;
      }

      if (engine.gameState !== 'playing') {
        if (e.code === 'Space' && (engine.gameState === 'ready' || engine.gameState === 'gameover' || engine.gameState === 'victory')) {
          e.preventDefault();
          if (engine.gameState === 'ready' && !engine.isAssetsReady) {
            console.log('3D Fleet assets are preloading...');
            return;
          }
          if (onStartGame) {
            onStartGame();
          } else {
            engine.start();
          }
        }
        return;
      }

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          engine.moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          engine.moveRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          engine.setThrottle(true);
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          engine.setBrake(true);
          break;
        case 'KeyH':
        case 'KeyF':
          e.preventDefault();
          engine.honkHorn();
          break;
        case 'KeyC':
        case 'KeyV':
          e.preventDefault();
          if (engine.toggleCameraView) {
            engine.toggleCameraView();
          }
          break;
        case 'Space':
          e.preventDefault();
          const now = performance.now();
          if (now - lastSpaceTime < 320) {
            engine.activateHoverboard();
          } else {
            engine.jump();
          }
          lastSpaceTime = now;
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          engine.setThrottle(false);
          break;
        case 'ArrowDown':
        case 'KeyS':
          engine.setBrake(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Touch Swipe & Double Tap Gestures
    const handleTouchStart = (e) => {
      soundManager.ensureContext();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const now = performance.now();

        if (now - lastTapRef.current < 320 && engine.gameState === 'playing') {
          engine.activateHoverboard();
        }
        lastTapRef.current = now;

        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: now
        };
      }
    };

    const handleTouchEnd = (e) => {
      if (engine.gameState !== 'playing') return;
      if (e.changedTouches.length === 0) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const minSwipeDistance = 25;

      if (Math.max(absX, absY) > minSwipeDistance) {
        if (absX > absY) {
          if (dx > 0) engine.moveRight();
          else engine.moveLeft();
        } else {
          if (dy > 0) {
            engine.setBrake(true);
            setTimeout(() => engine.setBrake(false), 900);
            engine.slide();
          } else {
            engine.jump();
          }
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      engine.destroy();
    };
  }, []);

  return (
    <div className="canvas-wrapper" ref={containerRef} id="three-container" />
  );
}
