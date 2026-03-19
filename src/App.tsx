/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Settings, 
  HelpCircle, 
  RotateCcw, 
  Undo2, 
  BarChart3,
  Play,
  User,
  Grid3X3,
  Trophy,
  Zap,
  Users,
  Star,
  Rocket,
  Share2,
  Info,
  LayoutGrid,
  Square
} from 'lucide-react';

// --- Types ---

type Player = 1 | 2;
type View = 'play' | 'lobby' | 'leaderboard';

interface LeaderboardEntry {
  name: string;
  score: number;
  date: number;
  gridSize: number;
}

interface GameState {
  gridSize: number; // Number of dots (e.g., 5 for 5x5 dots)
  playerNames: { 1: string; 2: string };
  horizontalLines: boolean[][];
  verticalLines: boolean[][];
  boxes: (Player | null)[][];
  currentPlayer: Player;
  scores: { 1: number; 2: number };
  history: { id: number; text: string }[];
  movesMade: number;
  startTime: number;
}

// --- Mock Data ---

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { name: 'Sarah "The Box"', score: 25, date: Date.now() - 100000, gridSize: 5 },
  { name: 'Alex Chen', score: 12, date: Date.now() - 200000, gridSize: 5 },
  { name: 'Marcus V.', score: 9, date: Date.now() - 300000, gridSize: 5 },
];

const getLeaderboard = (): LeaderboardEntry[] => {
  const saved = localStorage.getItem('dots_boxes_leaderboard');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_LEADERBOARD;
    }
  }
  return DEFAULT_LEADERBOARD;
};

const saveToLeaderboard = (entry: LeaderboardEntry) => {
  const current = getLeaderboard();
  const updated = [...current, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  localStorage.setItem('dots_boxes_leaderboard', JSON.stringify(updated));
};

// --- Components ---

const Header = ({ currentView, setView }: { currentView: View, setView: (v: View) => void }) => (
  <header className="bg-background sticky top-0 z-50 border-b border-outline-variant/10">
    <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
      <div className="text-2xl font-black text-primary tracking-tighter font-headline cursor-pointer" onClick={() => setView('lobby')}>
        Dots & Boxes
      </div>
      <nav className="hidden md:flex items-center gap-8 font-medium tracking-tight">
        <button 
          onClick={() => setView('play')}
          className={`${currentView === 'play' ? 'text-primary font-bold border-b-4 border-primary' : 'text-on-surface-variant'} pb-1 transition-all duration-300`}
        >
          Play
        </button>
        <button 
          onClick={() => setView('lobby')}
          className={`${currentView === 'lobby' ? 'text-primary font-bold border-b-4 border-primary' : 'text-on-surface-variant'} pb-1 transition-all duration-300`}
        >
          Lobby
        </button>
        <button 
          onClick={() => setView('leaderboard')}
          className={`${currentView === 'leaderboard' ? 'text-primary font-bold border-b-4 border-primary' : 'text-on-surface-variant'} pb-1 transition-all duration-300`}
        >
          Leaderboard
        </button>
      </nav>
      <div className="flex items-center gap-4">
        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-high">
          <Settings size={20} />
        </button>
        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-high">
          <HelpCircle size={20} />
        </button>
      </div>
    </div>
  </header>
);

const PlayerCard = ({ 
  playerNum, 
  name, 
  score, 
  isActive 
}: { 
  playerNum: Player; 
  name: string; 
  score: number; 
  isActive: boolean 
}) => {
  const isPlayer1 = playerNum === 1;
  const colorClass = isPlayer1 ? 'text-primary' : 'text-secondary';
  const bgClass = isPlayer1 ? 'bg-primary' : 'bg-secondary';
  const shadowClass = isPlayer1 ? 'shadow-[0_0_12px_rgba(8,70,237,0.4)]' : 'shadow-[0_0_12px_rgba(150,67,0,0.4)]';

  return (
    <div className={`bg-surface-container-lowest p-8 rounded-lg transition-all duration-500 ${isActive ? 'ring-4 ring-primary ring-opacity-10 scale-105 shadow-xl' : 'opacity-60 grayscale-[0.5] scale-100'}`}>
      {isActive && (
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-3 h-3 rounded-full ${bgClass} ${shadowClass}`}></div>
          <span className={`text-sm font-bold uppercase tracking-widest ${colorClass}`}>Active Turn</span>
        </div>
      )}
      <h2 className="text-on-surface-variant text-sm font-semibold mb-1">Player {playerNum}</h2>
      <div className="text-4xl font-extrabold text-on-surface font-headline truncate">{name}</div>
      <div className="mt-6 flex flex-col">
        <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Score</span>
        <span className={`text-6xl font-black ${colorClass}`}>{score.toString().padStart(2, '0')}</span>
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="bg-background border-t border-outline-variant/15 py-12 mt-auto">
    <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto text-sm text-on-surface-variant">
      <div className="mb-4 md:mb-0">
        <span className="font-bold text-on-surface">Dots & Boxes</span>
        <p className="mt-1">© 2024 Kinetic Playground. All rights reserved.</p>
      </div>
      <div className="flex gap-8">
        <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
        <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
        <a className="hover:text-primary transition-colors" href="#">Support</a>
      </div>
    </div>
  </footer>
);

// --- View Components ---

const LobbyView = ({ setupData, setSetupData, startGame }: { 
  setupData: any, 
  setSetupData: React.Dispatch<React.SetStateAction<any>>, 
  startGame: () => void 
}) => (
  <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-7xl mx-auto w-full">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-12"
    >
      <h1 className="text-6xl md:text-8xl font-black text-on-surface font-headline tracking-tighter mb-4">
        READY TO <span className="text-primary italic">PLAY?</span>
      </h1>
      <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
        Set your names, pick your battlefield size, and prepare for strategic dominance.
      </p>
    </motion.div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
      <div className="lg:col-span-2 bg-surface-container-low p-12 rounded-lg relative overflow-hidden">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
              <User size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Player One</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Player Two</span>
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white">
              <User size={20} />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2">Enter Name</label>
            <input 
              type="text"
              value={setupData.player1Name}
              onChange={e => setSetupData((p: any) => ({ ...p, player1Name: e.target.value }))}
              className="w-full px-6 py-5 bg-surface-container-lowest border-none rounded-xl focus:ring-2 focus:ring-primary font-bold text-xl text-primary"
              placeholder="Electric Blue"
            />
            <div className="h-1 w-full bg-primary mt-4 rounded-full"></div>
          </div>

          <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-on-surface-variant font-bold italic text-sm">
            VS
          </div>

          <div className="flex-1 w-full text-right">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2">Enter Name</label>
            <input 
              type="text"
              value={setupData.player2Name}
              onChange={e => setSetupData((p: any) => ({ ...p, player2Name: e.target.value }))}
              className="w-full px-6 py-5 bg-surface-container-lowest border-none rounded-xl focus:ring-2 focus:ring-secondary font-bold text-xl text-secondary text-right"
              placeholder="Sunset Orange"
            />
            <div className="h-1 w-full bg-secondary mt-4 rounded-full"></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest/50 p-6 rounded-xl border border-dashed border-outline-variant flex items-center gap-4">
          <div className="w-8 h-8 bg-on-surface-variant/10 rounded-full flex items-center justify-center text-on-surface-variant">
            <Info size={16} />
          </div>
          <p className="text-sm text-on-surface-variant font-medium">
            Names will be displayed during the match and on the leaderboard.
          </p>
        </div>
      </div>

      <div className="bg-surface-container-low p-8 rounded-lg flex flex-col">
        <h2 className="text-xs font-bold text-on-surface uppercase tracking-[0.2em] mb-8">Select Arena</h2>
        
        <div className="space-y-4 flex-1">
          {[
            { id: 4, name: 'Quick Match', size: '4x4 Grid', icon: <LayoutGrid size={20} /> },
            { id: 5, name: 'Standard', size: '5x5 Grid', icon: <Grid3X3 size={20} /> },
            { id: 6, name: 'Grand Duel', size: '6x6 Grid', icon: <Square size={20} /> },
            { id: 7, name: 'Expert', size: '7x7 Grid', icon: <Grid3X3 size={20} /> },
            { id: 8, name: 'Master', size: '8x8 Grid', icon: <LayoutGrid size={20} /> },
          ].map(arena => (
            <button
              key={arena.id}
              onClick={() => setSetupData((p: any) => ({ ...p, gridSize: arena.id }))}
              className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${setupData.gridSize === arena.id ? 'bg-surface-container-lowest ring-2 ring-primary shadow-lg' : 'bg-surface-container-lowest/50 hover:bg-surface-container-lowest'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${setupData.gridSize === arena.id ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  {arena.icon}
                </div>
                <div className="text-left">
                  <div className="font-bold text-on-surface">{arena.name}</div>
                  <div className="text-xs text-on-surface-variant">{arena.size}</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${setupData.gridSize === arena.id ? 'border-primary' : 'border-outline-variant'}`}>
                {setupData.gridSize === arena.id && <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>}
              </div>
            </button>
          ))}
        </div>

        <button 
          onClick={startGame}
          className="w-full py-5 bg-primary text-on-primary rounded-xl font-black text-lg flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary/20 mt-8"
        >
          START GAME
          <Rocket size={20} />
        </button>
      </div>
    </div>

    <div className="mt-16 flex gap-12">
      <div className="flex flex-col items-center gap-2">
        <Star className="text-outline-variant" size={32} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-outline-variant">Tactical</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Zap className="text-outline-variant" size={32} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-outline-variant">Fast</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Users className="text-outline-variant" size={32} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-outline-variant">Social</span>
      </div>
    </div>
  </main>
);

const LeaderboardView = ({ setView }: { setView: (v: View) => void }) => {
  const leaderboard = getLeaderboard();
  const top3 = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3);

  return (
    <main className="flex-1 flex flex-col items-center py-12 px-8 max-w-7xl mx-auto w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-6xl md:text-8xl font-black text-on-surface font-headline tracking-tighter mb-4">
          Hall of <span className="text-primary italic">Champions</span>
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
          The most strategic minds in the Kinetic Playground. Will you be the next one to claim the grid?
        </p>
      </motion.div>

      {top3.length > 0 && (
        <div className="flex flex-col md:flex-row items-end justify-center gap-8 mb-24 w-full">
          {/* Rank 2 */}
          {top3[1] && (
            <div className="flex flex-col items-center gap-4 w-full md:w-64">
              <div className="relative">
                <img src={`https://picsum.photos/seed/${top3[1].name}/200`} alt="" className="w-24 h-24 rounded-full border-4 border-white shadow-lg" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">2</div>
              </div>
              <div className="bg-surface-container-low p-8 rounded-lg w-full text-center">
                <div className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-2">SILVER STRATEGIST</div>
                <div className="text-xl font-bold text-on-surface mb-1">{top3[1].name}</div>
                <div className="text-2xl font-black text-on-surface">{top3[1].score.toLocaleString()} <span className="text-xs font-bold text-on-surface-variant">PTS</span></div>
              </div>
            </div>
          )}

          {/* Rank 1 */}
          {top3[0] && (
            <div className="flex flex-col items-center gap-4 w-full md:w-80 order-first md:order-none">
              <div className="relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                  <Star size={10} fill="currentColor" /> First
                </div>
                <div className="w-32 h-32 rounded-full border-4 border-primary p-1 shadow-2xl shadow-primary/20">
                  <img src={`https://picsum.photos/seed/${top3[0].name}/200`} alt="" className="w-full h-full rounded-full border-4 border-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-lg shadow-md border-2 border-primary/10">1</div>
              </div>
              <div className="bg-surface-container-lowest p-10 rounded-lg w-full text-center shadow-2xl ring-1 ring-primary/5">
                <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">GRID MASTER</div>
                <div className="text-2xl font-black text-on-surface mb-1">{top3[0].name}</div>
                <div className="text-4xl font-black text-on-surface">{top3[0].score.toLocaleString()} <span className="text-sm font-bold text-on-surface-variant">PTS</span></div>
                <div className="flex justify-center gap-1 mt-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
                </div>
              </div>
            </div>
          )}

          {/* Rank 3 */}
          {top3[2] && (
            <div className="flex flex-col items-center gap-4 w-full md:w-64">
              <div className="relative">
                <img src={`https://picsum.photos/seed/${top3[2].name}/200`} alt="" className="w-24 h-24 rounded-full border-4 border-white shadow-lg" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">3</div>
              </div>
              <div className="bg-surface-container-low p-8 rounded-lg w-full text-center">
                <div className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em] mb-2">BRONZE TACTICIAN</div>
                <div className="text-xl font-bold text-on-surface mb-1">{top3[2].name}</div>
                <div className="text-2xl font-black text-on-surface">{top3[2].score.toLocaleString()} <span className="text-xs font-bold text-on-surface-variant">PTS</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="w-full max-w-4xl bg-surface-container-low rounded-2xl overflow-hidden">
        <div className="grid grid-cols-4 p-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/10">
          <div className="text-center">#</div>
          <div>Player</div>
          <div className="text-center">Grid Size</div>
          <div className="text-right">Score</div>
        </div>
        <div className="divide-y divide-outline-variant/5">
          {others.map((player, idx) => (
            <div key={`${player.name}-${player.date}`} className="grid grid-cols-4 p-6 items-center hover:bg-surface-container-high transition-colors">
              <div className="text-center font-bold text-on-surface-variant">{idx + 4}</div>
              <div className="flex items-center gap-4">
                <img src={`https://picsum.photos/seed/${player.name}/200`} alt="" className="w-10 h-10 rounded-full" />
                <span className="font-bold text-on-surface">{player.name}</span>
              </div>
              <div className="text-center font-medium text-on-surface-variant">{player.gridSize}x{player.gridSize}</div>
              <div className="text-right font-black text-on-surface">{player.score}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-6">
        <button 
          onClick={() => setView('lobby')}
          className="px-12 py-5 bg-primary text-on-primary rounded-xl font-black text-lg flex items-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
        >
          <Play fill="currentColor" size={20} />
          Play Again
        </button>
      </div>
    </main>
  );
};

const GameView = ({ 
  gameState, 
  showGameOver, 
  handleLineClick, 
  restartGame, 
  setView, 
  elapsedTime, 
  formatTime, 
  winner 
}: {
  gameState: GameState,
  showGameOver: boolean,
  handleLineClick: (type: 'h' | 'v', r: number, c: number) => void,
  restartGame: () => void,
  setView: (v: View) => void,
  elapsedTime: number,
  formatTime: (s: number) => string,
  winner: number | null
}) => {
  const boxSize = gameState.gridSize - 1;
  const boardSize = 400; // Fixed visual size
  const cellSize = boardSize / boxSize;
  const lineThickness = 6;
  const dotSize = 12;

  return (
    <main className="max-w-7xl mx-auto px-8 py-12 flex flex-col lg:flex-row gap-16 items-start justify-center flex-1 w-full">
      {/* Left Sidebar: Player 1 */}
      <aside className="w-full lg:w-64 flex flex-col gap-8 order-2 lg:order-1">
        <PlayerCard 
          playerNum={1} 
          name={gameState.playerNames[1]} 
          score={gameState.scores[1]} 
          isActive={gameState.currentPlayer === 1} 
        />
        
        <div className="bg-surface-container-low p-6 rounded-lg">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase mb-4 tracking-widest">History</h3>
          <ul className="space-y-3">
            <AnimatePresence mode="popLayout">
              {gameState.history.length > 0 ? (
                gameState.history.map((item) => (
                  <motion.li 
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-2 text-sm font-medium text-on-surface-variant"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.text.includes(gameState.playerNames[1]) ? 'bg-primary' : 'bg-secondary'}`}></span>
                    <span className="truncate">{item.text.split(' ').slice(1).join(' ')}</span>
                  </motion.li>
                ))
              ) : (
                <li className="text-sm text-on-surface-variant/50 italic">No moves yet</li>
              )}
            </AnimatePresence>
          </ul>
        </div>
      </aside>

      {/* Central Game Area */}
      <section className="flex-1 flex flex-col items-center order-1 lg:order-2">
        <div className="bg-surface-container-low p-12 rounded-lg relative overflow-hidden shadow-inner">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>
          
          <div className="relative" style={{ width: boardSize, height: boardSize }}>
            {/* Boxes */}
            {gameState.boxes.map((row, r) => 
              row.map((boxOwner, c) => (
                <AnimatePresence key={`box-anim-${r}-${c}`}>
                  {boxOwner && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.2 }}
                      className={`absolute rounded-sm pointer-events-none ${boxOwner === 1 ? 'bg-gradient-to-br from-primary to-primary-container' : 'bg-gradient-to-br from-secondary to-secondary-container'}`}
                      style={{ 
                        top: r * cellSize + 2, 
                        left: c * cellSize + 2,
                        width: cellSize - 4,
                        height: cellSize - 4
                      }}
                    />
                  )}
                </AnimatePresence>
              ))
            )}

            {/* Horizontal Lines */}
            {gameState.horizontalLines.map((row, r) => 
              row.map((active, c) => (
                <div 
                  key={`h-line-${r}-${c}`}
                  onClick={() => handleLineClick('h', r, c)}
                  className={`absolute rounded-full cursor-pointer transition-all duration-300 z-10 ${active ? 'bg-primary' : 'bg-surface-container-highest hover:bg-primary/30'}`}
                  style={{ 
                    top: r * cellSize - (lineThickness / 2), 
                    left: c * cellSize + (dotSize / 2) + 2, 
                    width: cellSize - dotSize - 4,
                    height: lineThickness,
                    backgroundColor: active ? (gameState.currentPlayer === 1 ? 'var(--color-primary)' : 'var(--color-secondary)') : undefined
                  }}
                />
              ))
            )}

            {/* Vertical Lines */}
            {gameState.verticalLines.map((row, r) => 
              row.map((active, c) => (
                <div 
                  key={`v-line-${r}-${c}`}
                  onClick={() => handleLineClick('v', r, c)}
                  className={`absolute rounded-full cursor-pointer transition-all duration-300 z-10 ${active ? 'bg-primary' : 'bg-surface-container-highest hover:bg-primary/30'}`}
                  style={{ 
                    top: r * cellSize + (dotSize / 2) + 2, 
                    left: c * cellSize - (lineThickness / 2), 
                    height: cellSize - dotSize - 4,
                    width: lineThickness,
                    backgroundColor: active ? (gameState.currentPlayer === 1 ? 'var(--color-primary)' : 'var(--color-secondary)') : undefined
                  }}
                />
              ))
            )}

            {/* Dots */}
            {Array.from({ length: gameState.gridSize }).map((_, r) =>
              Array.from({ length: gameState.gridSize }).map((_, c) => (
                <div 
                  key={`dot-${r}-${c}`}
                  className="absolute rounded-full bg-primary-container ring-4 ring-background shadow-sm z-20"
                  style={{ 
                    top: r * cellSize - (dotSize / 2), 
                    left: c * cellSize - (dotSize / 2),
                    width: dotSize,
                    height: dotSize
                  }}
                />
              ))
            )}

            {/* Game Over Overlay */}
            <AnimatePresence>
              {showGameOver && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md rounded-lg flex flex-col items-center justify-center p-8 text-center"
                >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trophy size={40} />
                    </div>
                    <h2 className="text-4xl font-black text-on-surface font-headline mb-2">
                      {winner === 0 ? "It's a Draw!" : `${gameState.playerNames[winner as Player]} Wins!`}
                    </h2>
                    <p className="text-on-surface-variant font-medium mb-8">
                      Final Score: {gameState.scores[1]} - {gameState.scores[2]}
                    </p>
                    <div className="flex gap-4">
                      <button 
                        onClick={restartGame}
                        className="px-8 py-4 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                      >
                        <RotateCcw size={18} />
                        Play Again
                      </button>
                      <button 
                        onClick={() => setView('leaderboard')}
                        className="px-8 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold flex items-center gap-2"
                      >
                        <BarChart3 size={18} />
                        Leaderboard
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Game Controls */}
        <div className="mt-12 flex gap-4">
          <button 
            onClick={restartGame}
            className="px-10 py-4 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <RotateCcw size={20} />
            Restart
          </button>
          <button 
            className="px-10 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold flex items-center gap-2 hover:bg-surface-container-highest active:scale-95 transition-all"
          >
            <Undo2 size={20} />
            Undo
          </button>
        </div>
      </section>

      {/* Right Sidebar: Player 2 */}
      <aside className="w-full lg:w-64 flex flex-col gap-8 order-3">
        <PlayerCard 
          playerNum={2} 
          name={gameState.playerNames[2]} 
          score={gameState.scores[2]} 
          isActive={gameState.currentPlayer === 2} 
        />

        <div className="bg-surface-container-low p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Stats</h3>
            <BarChart3 size={16} className="text-outline" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant">Moves Made</span>
              <span className="font-bold">{gameState.movesMade}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant">Time Elapsed</span>
              <span className="font-bold">{formatTime(elapsedTime)}</span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<View>('lobby');
  const [setupData, setSetupData] = useState({
    gridSize: 5,
    player1Name: 'Electric Blue',
    player2Name: 'Sunset Orange'
  });

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showGameOver, setShowGameOver] = useState(false);

  // Initialize game when setup is complete
  const startGame = () => {
    const { gridSize, player1Name, player2Name } = setupData;
    const boxSize = gridSize - 1;
    setGameState({
      gridSize,
      playerNames: { 1: player1Name || 'Player 1', 2: player2Name || 'Player 2' },
      horizontalLines: Array(gridSize).fill(null).map(() => Array(boxSize).fill(false)),
      verticalLines: Array(boxSize).fill(null).map(() => Array(gridSize).fill(false)),
      boxes: Array(boxSize).fill(null).map(() => Array(boxSize).fill(null)),
      currentPlayer: 1,
      scores: { 1: 0, 2: 0 },
      history: [],
      movesMade: 0,
      startTime: Date.now(),
    });
    setView('play');
    setShowGameOver(false);
    setElapsedTime(0);
  };

  useEffect(() => {
    if (!gameState || showGameOver) return;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - gameState.startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState?.startTime, showGameOver]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLineClick = useCallback((type: 'h' | 'v', r: number, c: number) => {
    if (!gameState || showGameOver) return;
    if (type === 'h' && gameState.horizontalLines[r][c]) return;
    if (type === 'v' && gameState.verticalLines[r][c]) return;

    setGameState(prev => {
      if (!prev) return null;
      const boxSize = prev.gridSize - 1;
      const newH = prev.horizontalLines.map(row => [...row]);
      const newV = prev.verticalLines.map(row => [...row]);
      const newBoxes = prev.boxes.map(row => [...row]);
      let boxesCompletedInThisTurn = 0;

      if (type === 'h') newH[r][c] = true;
      else newV[r][c] = true;

      for (let br = 0; br < boxSize; br++) {
        for (let bc = 0; bc < boxSize; bc++) {
          if (newBoxes[br][bc] === null) {
            if (newH[br][bc] && newH[br + 1][bc] && newV[br][bc] && newV[br][bc + 1]) {
              newBoxes[br][bc] = prev.currentPlayer;
              boxesCompletedInThisTurn++;
            }
          }
        }
      }

      const nextPlayer = boxesCompletedInThisTurn > 0 ? prev.currentPlayer : (prev.currentPlayer === 1 ? 2 : 1);
      const newScores = { ...prev.scores };
      newScores[prev.currentPlayer] += boxesCompletedInThisTurn;

      const playerName = prev.playerNames[prev.currentPlayer];
      const moveDesc = `${playerName} ${type === 'h' ? 'Horizontal' : 'Vertical'} line at ${r},${c}`;
      const newHistory = [{ id: Date.now(), text: moveDesc }, ...prev.history].slice(0, 5);

      // Check if game is over
      const totalBoxes = boxSize * boxSize;
      const filledBoxes = newBoxes.flat().filter(b => b !== null).length;
      if (filledBoxes === totalBoxes) {
        setShowGameOver(true);
        // Save to leaderboard
        const winnerNum = newScores[1] > newScores[2] ? 1 : (newScores[2] > newScores[1] ? 2 : 0);
        
        if (winnerNum !== 0) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: winnerNum === 1 ? ['#0846ed', '#ffffff'] : ['#964300', '#ffffff']
          });

          saveToLeaderboard({
            name: prev.playerNames[winnerNum as Player],
            score: newScores[winnerNum as Player],
            date: Date.now(),
            gridSize: prev.gridSize
          });
        }
      }

      return {
        ...prev,
        horizontalLines: newH,
        verticalLines: newV,
        boxes: newBoxes,
        currentPlayer: nextPlayer,
        scores: newScores,
        history: newHistory,
        movesMade: prev.movesMade + 1,
      };
    });
  }, [gameState, showGameOver]);

  const restartGame = () => {
    startGame();
  };

  const winner = useMemo(() => {
    if (!gameState) return null;
    if (gameState.scores[1] > gameState.scores[2]) return 1;
    if (gameState.scores[2] > gameState.scores[1]) return 2;
    return 0; // Draw
  }, [gameState]);

  // --- Views ---

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header currentView={view} setView={setView} />

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          {view === 'lobby' && (
            <LobbyView 
              setupData={setupData} 
              setSetupData={setSetupData} 
              startGame={startGame} 
            />
          )}
          {view === 'play' && gameState && (
            <GameView 
              gameState={gameState}
              showGameOver={showGameOver}
              handleLineClick={handleLineClick}
              restartGame={restartGame}
              setView={setView}
              elapsedTime={elapsedTime}
              formatTime={formatTime}
              winner={winner}
            />
          )}
          {view === 'leaderboard' && <LeaderboardView setView={setView} />}
        </motion.div>
      </AnimatePresence>

      <Footer />
    </div>
  );
}
