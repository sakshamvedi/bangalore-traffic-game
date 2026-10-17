import React, { useState, useEffect, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas.jsx';
import { HUD } from './components/HUD.jsx';
import { StartScreen } from './components/StartScreen.jsx';
import { GameOverModal } from './components/GameOverModal.jsx';
import { VictoryModal } from './components/VictoryModal.jsx';
import { PauseModal } from './components/PauseModal.jsx';
import { ShopModal } from './components/ShopModal.jsx';
import { ControlsModal } from './components/ControlsModal.jsx';
import { soundManager } from './game/AudioSynthesizer.js';
import './App.css';

export default function App() {
  const engineRef = useRef(null);

  // Gameplay State
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'paused', 'gameover', 'victory'
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('subway_highscore') || '0', 10);
  });
  const [coins, setCoins] = useState(0);
  const [totalCoins, setTotalCoins] = useState(() => {
    return parseInt(localStorage.getItem('subway_total_coins') || '250', 10); // starter bonus 250 coins
  });
  const [multiplier, setMultiplier] = useState(10);
  const [powerups, setPowerups] = useState({
    magnet: 0,
    sneakers: 0,
    multiplier: 0,
    jetpack: 0
  });

  // Office Mission State
  const [distance, setDistance] = useState(0);
  const [remainingDistance, setRemainingDistance] = useState(3000);
  const [speedKmh, setSpeedKmh] = useState(55);
  const [victoryStats, setVictoryStats] = useState({ score: 0, coins: 0, distance: 3000, timeTaken: 95 });

  // Shop & Inventory
  const [hoverboardStock, setHoverboardStock] = useState(() => {
    return parseInt(localStorage.getItem('subway_hoverboards') || '3', 10);
  });
  const [selectedBoard, setSelectedBoard] = useState(() => {
    return localStorage.getItem('subway_selected_board') || 'cyber';
  });
  const [unlockedBoards, setUnlockedBoards] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('subway_unlocked_boards') || '["cyber"]');
    } catch {
      return ['cyber'];
    }
  });
  const [upgradeLevels, setUpgradeLevels] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('subway_upgrade_levels') || '{"magnet":1,"sneakers":1,"multiplier":1,"jetpack":1}');
    } catch {
      return { magnet: 1, sneakers: 1, multiplier: 1, jetpack: 1 };
    }
  });

  // Modals & Controls
  const [activeModal, setActiveModal] = useState(null); // 'shop', 'controls'
  const [isMuted, setIsMuted] = useState(false);
  const [gameOverStats, setGameOverStats] = useState({ score: 0, coins: 0, distance: 0 });
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Sync engine upgrades and inventory
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.hoverboardStock = hoverboardStock;
      engineRef.current.selectedBoard = selectedBoard;
      engineRef.current.upgradeLevels = upgradeLevels;
    }
  }, [hoverboardStock, selectedBoard, upgradeLevels]);

  const handleStartGame = () => {
    soundManager.ensureContext();
    if (engineRef.current) {
      engineRef.current.hoverboardStock = hoverboardStock;
      engineRef.current.selectedBoard = selectedBoard;
      engineRef.current.upgradeLevels = upgradeLevels;
      engineRef.current.start();
    }
    setGameState('playing');
    setScore(0);
    setCoins(0);
    setDistance(0);
    setRemainingDistance(3000);
    setIsNewRecord(false);
  };

  const handleRestartGame = () => {
    soundManager.ensureContext();
    if (engineRef.current) {
      engineRef.current.start();
    }
    setGameState('playing');
    setScore(0);
    setCoins(0);
    setDistance(0);
    setRemainingDistance(3000);
    setIsNewRecord(false);
  };

  const handlePauseGame = () => {
    if (gameState === 'playing') {
      if (engineRef.current) engineRef.current.pause();
      setGameState('paused');
    }
  };

  const handleResumeGame = () => {
    if (gameState === 'paused') {
      if (engineRef.current) engineRef.current.resume();
      setGameState('playing');
    }
  };

  const handleTogglePause = () => {
    if (gameState === 'playing') {
      handlePauseGame();
    } else if (gameState === 'paused') {
      handleResumeGame();
    }
  };

  const handleHome = () => {
    if (engineRef.current && engineRef.current.resetToReady) {
      engineRef.current.resetToReady();
    }
    setGameState('ready');
  };

  const handleGameOver = (finalStats) => {
    setGameState('gameover');
    setGameOverStats(finalStats);

    const newTotal = totalCoins + finalStats.coins;
    setTotalCoins(newTotal);
    localStorage.setItem('subway_total_coins', newTotal.toString());

    if (finalStats.score > highScore) {
      setHighScore(finalStats.score);
      setIsNewRecord(true);
      localStorage.setItem('subway_highscore', finalStats.score.toString());
    } else {
      setIsNewRecord(false);
    }
  };

  const handleVictory = (finalStats) => {
    setGameState('victory');
    setVictoryStats(finalStats);

    const newTotal = totalCoins + finalStats.coins + 500; // 500 bonus coins for reaching office on time!
    setTotalCoins(newTotal);
    localStorage.setItem('subway_total_coins', newTotal.toString());

    if (finalStats.score > highScore) {
      setHighScore(finalStats.score);
      setIsNewRecord(true);
      localStorage.setItem('subway_highscore', finalStats.score.toString());
    } else {
      setIsNewRecord(false);
    }
  };

  const handleActivateHoverboard = () => {
    soundManager.ensureContext();
    if (engineRef.current && gameState === 'playing') {
      engineRef.current.activateHoverboard();
    }
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Shop Purchases
  const handleBuyHoverboard = () => {
    if (totalCoins < 300) return;
    const newCoins = totalCoins - 300;
    const newStock = hoverboardStock + 1;
    setTotalCoins(newCoins);
    setHoverboardStock(newStock);
    localStorage.setItem('subway_total_coins', newCoins.toString());
    localStorage.setItem('subway_hoverboards', newStock.toString());
    soundManager.playPowerup();
  };

  const handleUpgradePowerup = (type) => {
    const currentLvl = upgradeLevels[type] || 1;
    if (currentLvl >= 5) return;
    const cost = currentLvl * 500;
    if (totalCoins < cost) return;

    const newCoins = totalCoins - cost;
    const newLevels = { ...upgradeLevels, [type]: currentLvl + 1 };
    setTotalCoins(newCoins);
    setUpgradeLevels(newLevels);
    localStorage.setItem('subway_total_coins', newCoins.toString());
    localStorage.setItem('subway_upgrade_levels', JSON.stringify(newLevels));
    soundManager.playPowerup();
  };

  const handleBuyBoard = (id, cost) => {
    if (totalCoins < cost || unlockedBoards.includes(id)) return;
    const newCoins = totalCoins - cost;
    const newUnlocked = [...unlockedBoards, id];
    setTotalCoins(newCoins);
    setUnlockedBoards(newUnlocked);
    setSelectedBoard(id);
    localStorage.setItem('subway_total_coins', newCoins.toString());
    localStorage.setItem('subway_unlocked_boards', JSON.stringify(newUnlocked));
    localStorage.setItem('subway_selected_board', id);
    soundManager.playHoverboard();
  };

  const handleSelectBoard = (id) => {
    setSelectedBoard(id);
    localStorage.setItem('subway_selected_board', id);
    soundManager.playHoverboard();
  };

  return (
    <main className="subway-app-container">
      {/* Background 3D Canvas Viewport */}
      <GameCanvas
        gameState={gameState}
        onScoreUpdate={(s) => setScore(s)}
        onCoinsUpdate={(c) => setCoins(c)}
        onPowerupChange={(type, val) => {
          setPowerups(prev => ({ ...prev, [type]: val }));
        }}
        onGameOver={handleGameOver}
        onVictory={handleVictory}
        onDistanceUpdate={(d, rem, spd) => {
          setDistance(Math.floor(d));
          setRemainingDistance(Math.floor(rem));
          setSpeedKmh(spd);
        }}
        onHoverboardCountChange={(count) => {
          setHoverboardStock(count);
          localStorage.setItem('subway_hoverboards', count.toString());
        }}
        onTogglePause={handleTogglePause}
        engineRef={engineRef}
      />

      {/* In-Game Active HUD */}
      {gameState === 'playing' && (
        <HUD
          score={score}
          highScore={highScore}
          coins={coins}
          multiplier={multiplier}
          powerups={powerups}
          hoverboardStock={hoverboardStock}
          distance={distance}
          remainingDistance={remainingDistance}
          speedKmh={speedKmh}
          onActivateHoverboard={handleActivateHoverboard}
          onPause={handlePauseGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onMoveLeft={() => engineRef.current && engineRef.current.moveLeft()}
          onMoveRight={() => engineRef.current && engineRef.current.moveRight()}
          onJump={() => engineRef.current && engineRef.current.jump()}
          onSlide={() => engineRef.current && engineRef.current.slide()}
        />
      )}

      {/* Start Screen Menu */}
      {gameState === 'ready' && (
        <StartScreen
          highScore={highScore}
          totalCoins={totalCoins}
          hoverboardStock={hoverboardStock}
          onStartGame={handleStartGame}
          onOpenShop={() => setActiveModal('shop')}
          onOpenControls={() => setActiveModal('controls')}
        />
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={gameOverStats}
          highScore={highScore}
          isNewRecord={isNewRecord}
          onRestart={handleRestartGame}
          onOpenShop={() => setActiveModal('shop')}
          onHome={handleHome}
        />
      )}

      {/* Victory Modal: Office Arrival Screen */}
      {gameState === 'victory' && (
        <VictoryModal
          stats={victoryStats}
          highScore={highScore}
          isNewRecord={isNewRecord}
          onRestart={handleRestartGame}
          onOpenShop={() => setActiveModal('shop')}
          onHome={handleHome}
        />
      )}

      {/* Pause Screen */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResumeGame}
          onRestart={handleRestartGame}
          onHome={handleHome}
        />
      )}

      {/* Shop Modal */}
      {activeModal === 'shop' && (
        <ShopModal
          totalCoins={totalCoins}
          hoverboardStock={hoverboardStock}
          upgradeLevels={upgradeLevels}
          selectedBoard={selectedBoard}
          unlockedBoards={unlockedBoards}
          onBuyHoverboard={handleBuyHoverboard}
          onUpgradePowerup={handleUpgradePowerup}
          onSelectBoard={handleSelectBoard}
          onBuyBoard={handleBuyBoard}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Controls & How To Play Modal */}
      {activeModal === 'controls' && (
        <ControlsModal onClose={() => setActiveModal(null)} />
      )}
    </main>
  );
}
