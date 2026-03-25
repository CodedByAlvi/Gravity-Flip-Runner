/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Home, Pause, Volume2, VolumeX, Trophy, User, Settings2, ChevronLeft, ChevronRight, Zap, Shield, Info, Layers, Gamepad2, Smartphone, Maximize, BarChart3, MousePointer2, ShieldAlert, RotateCw } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GameState, Player, Obstacle, Particle, Character, Difficulty, BackgroundObject } from './types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const PLAYER_SIZE = 30;
const SPRING_STIFFNESS = 0.25;
const SPRING_DAMPING = 0.7;

const CHARACTERS: Character[] = [
  { id: 'neon-blue', name: 'NEON BLUE', color: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.5)', eyeColor: '#fff' },
  { id: 'cyber-red', name: 'CYBER RED', color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.5)', eyeColor: '#fff' },
  { id: 'toxic-green', name: 'TOXIC GREEN', color: '#22c55e', glowColor: 'rgba(34, 197, 94, 0.5)', eyeColor: '#000' },
  { id: 'plasma-purple', name: 'PLASMA PURPLE', color: '#a855f7', glowColor: 'rgba(168, 85, 247, 0.5)', eyeColor: '#fff' },
  { id: 'solar-gold', name: 'SOLAR GOLD', color: '#facc15', glowColor: 'rgba(250, 204, 21, 0.5)', eyeColor: '#000' },
  { id: 'void-white', name: 'VOID WHITE', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.5)', eyeColor: '#000' },
  { id: 'shadow-black', name: 'SHADOW BLACK', color: '#18181b', glowColor: 'rgba(24, 24, 27, 0.8)', eyeColor: '#ef4444' },
  { id: 'glitch-cyan', name: 'GLITCH CYAN', color: '#06b6d4', glowColor: 'rgba(6, 182, 212, 0.5)', eyeColor: '#fff' },
];

const DIFFICULTY_SETTINGS: Record<Difficulty, { 
  speed: number; 
  spawnInterval: number; 
  increment: number; 
  speedIncrease: number;
  multiplier: number;
  adaptiveRampUp: number;
  adaptiveRampDown: number;
  minSpawnInterval: number;
  maxSpeed: number;
}> = {
  EASY: { 
    speed: 4.0, 
    spawnInterval: 2600, 
    increment: 0.00015, 
    speedIncrease: 0.00008,
    multiplier: 1.0,
    adaptiveRampUp: 0.01,
    adaptiveRampDown: 0.15,
    minSpawnInterval: 1200,
    maxSpeed: 8.0
  },
  HARD: { 
    speed: 6.5, 
    spawnInterval: 1800, 
    increment: 0.0004, 
    speedIncrease: 0.00025,
    multiplier: 1.5,
    adaptiveRampUp: 0.02,
    adaptiveRampDown: 0.25,
    minSpawnInterval: 800,
    maxSpeed: 14.0
  },
  ULTIMATE: { 
    speed: 9.5, 
    spawnInterval: 1300, 
    increment: 0.001, 
    speedIncrease: 0.0005,
    multiplier: 2.5,
    adaptiveRampUp: 0.04,
    adaptiveRampDown: 0.4,
    minSpawnInterval: 600,
    maxSpeed: 22.0
  },
  INSANE: { 
    speed: 13.0, 
    spawnInterval: 950, 
    increment: 0.002, 
    speedIncrease: 0.001,
    multiplier: 4.0,
    adaptiveRampUp: 0.08,
    adaptiveRampDown: 0.6,
    minSpawnInterval: 450,
    maxSpeed: 35.0
  },
};

const NEBULA_COLORS = [
  'rgba(120, 0, 255, 0.15)',
  'rgba(0, 100, 255, 0.12)',
  'rgba(0, 255, 180, 0.08)',
  'rgba(255, 0, 100, 0.1)',
  'rgba(255, 100, 0, 0.1)',
];

const PLANET_COLORS = [
  '#3b82f6', // Earth-like
  '#ef4444', // Mars-like
  '#facc15', // Gas giant
  '#a855f7', // Exotic
  '#22c55e', // Jungle
  '#94a3b8', // Rocky
];

const BACKGROUND_OBJECT_TYPES: BackgroundObject['type'][] = [
  'NEBULA', 'GALAXY', 'STAR_CLUSTER', 'ASTEROID', 'PLANET', 'SUN', 'COMET', 'BLACK_HOLE', 'WORMHOLE', 'SUPERNOVA'
];

const PowerUpPreview = ({ type }: { type: 'SHIELD' | 'ENERGY_CONDUIT' | 'VOID_GATE' | 'CHRONO_SPHERE' | 'PULSE_WAVE' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = 100;
    const h = 100;
    ctx.clearRect(0, 0, w, h);
    
    const obs = {
      x: 20,
      y: 20,
      width: 60,
      height: 60,
      isTriggered: true,
      timer: 60,
    };

    if (type === 'SHIELD') {
      const pulse = Math.sin(Date.now() * 0.01) * 5;
      const shieldGrad = ctx.createRadialGradient(
        obs.x + obs.width / 2, obs.y + obs.height / 2, 0,
        obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2 + pulse
      );
      shieldGrad.addColorStop(0, '#fff');
      shieldGrad.addColorStop(0.4, '#00f2ff');
      shieldGrad.addColorStop(1, 'rgba(0, 242, 255, 0)');
      
      ctx.fillStyle = shieldGrad;
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#00f2ff';
      ctx.beginPath();
      ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2 + pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Hexagonal pattern overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        ctx.moveTo(obs.x + obs.width / 2, obs.y + obs.height / 2);
        ctx.lineTo(
          obs.x + obs.width / 2 + Math.cos(angle) * (obs.width / 2 + pulse),
          obs.y + obs.height / 2 + Math.sin(angle) * (obs.width / 2 + pulse)
        );
      }
      ctx.stroke();
      
      // Inner icon (Shield shape)
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(obs.x + obs.width / 2, obs.y + obs.height * 0.3);
      ctx.lineTo(obs.x + obs.width * 0.7, obs.y + obs.height * 0.4);
      ctx.lineTo(obs.x + obs.width * 0.7, obs.y + obs.height * 0.6);
      ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height * 0.8);
      ctx.lineTo(obs.x + obs.width * 0.3, obs.y + obs.height * 0.6);
      ctx.lineTo(obs.x + obs.width * 0.3, obs.y + obs.height * 0.4);
      ctx.closePath();
      ctx.stroke();
    } else if (type === 'VOID_GATE') {
      const centerX = 50;
      const centerY = 50;
      const rotation = Date.now() * 0.005;
      const pulse = Math.sin(Date.now() * 0.01) * 5;
      
      ctx.save();
      ctx.translate(centerX, centerY);
      
      // Background nebula glow
      const nebulaGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 45 + pulse);
      nebulaGrad.addColorStop(0, 'rgba(168, 85, 247, 0.5)');
      nebulaGrad.addColorStop(0.6, 'rgba(88, 28, 135, 0.3)');
      nebulaGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 45 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(rotation);
      
      // Outer glowing rings
      for (let i = 0; i < 4; i++) {
        const r = 30 + i * 4 + pulse;
        const alpha = 1 - (i * 0.2);
        ctx.strokeStyle = i % 2 === 0 ? `rgba(168, 85, 247, ${alpha})` : `rgba(216, 180, 254, ${alpha})`;
        ctx.lineWidth = 2 + i;
        ctx.shadowBlur = 15 + i * 5;
        ctx.shadowColor = '#a855f7';
        
        ctx.beginPath();
        const startAngle = rotation * (i + 1) * 0.5;
        ctx.arc(0, 0, r, startAngle, startAngle + Math.PI * 1.5);
        ctx.stroke();
      }
      
      // Swirling core
      const coreRotation = Date.now() * -0.008;
      ctx.rotate(coreRotation);
      
      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 20 + pulse);
      coreGrad.addColorStop(0, '#fff');
      coreGrad.addColorStop(0.3, '#d8b4fe');
      coreGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = coreGrad;
      
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const r = (i % 2 === 0 ? 20 : 10) + pulse;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      
      // Center singularity
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(0, 0, 4 + pulse * 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    } else if (type === 'ENERGY_CONDUIT') {
      const pulse = Math.sin(Date.now() * 0.01) * 5;
      const centerX = 50;
      const centerY = 50;
      
      const conduitGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30 + pulse);
      conduitGrad.addColorStop(0, '#fff');
      conduitGrad.addColorStop(0.4, '#facc15');
      conduitGrad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = conduitGrad;
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#facc15';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30 + pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Branching lightning effect
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fff';
      
      for (let i = 0; i < 4; i++) {
        let curX = centerX;
        let curY = centerY;
        const targetAngle = (i * Math.PI * 2) / 4 + Date.now() * 0.01;
        const r = 35 + pulse;
        
        ctx.beginPath();
        ctx.moveTo(curX, curY);
        
        const segments = 4;
        for (let j = 0; j < segments; j++) {
          const segR = (r / segments) * (j + 1);
          const jitter = (Math.random() - 0.5) * 10;
          const nextX = centerX + Math.cos(targetAngle) * segR + jitter;
          const nextY = centerY + Math.sin(targetAngle) * segR + jitter;
          ctx.lineTo(nextX, nextY);
        }
        ctx.stroke();
      }
    } else if (type === 'CHRONO_SPHERE') {
      const centerX = 50;
      const centerY = 50;
      const pulse = Math.sin(Date.now() * 0.01) * 5;
      
      // Time distortion ripples
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const r = (30 + pulse + i * 10) % 50;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30 + pulse);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.5, '#3b82f6');
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#3b82f6';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30 + pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Clock hands effect (Mechanical)
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      const angle = Date.now() * 0.005;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * 15, centerY + Math.sin(angle) * 15);
      ctx.stroke();
      
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle * 0.5) * 10, centerY + Math.sin(angle * 0.5) * 10);
      ctx.stroke();
    } else if (type === 'PULSE_WAVE') {
      const centerX = 50;
      const centerY = 50;
      const pulse = Math.sin(Date.now() * 0.02) * 8;
      
      // Core glow
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 25);
      coreGrad.addColorStop(0, '#fff');
      coreGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)');
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#fff';
      
      for (let i = 0; i < 3; i++) {
        const radius = (25 - i * 8) + pulse;
        if (radius > 0) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    
    ctx.shadowBlur = 0;
  }, [type]);

  const animate = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx);
    requestRef.current = requestAnimationFrame(animate);
  }, [draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  return <canvas ref={canvasRef} width={100} height={100} className="w-24 h-24" />;
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelRatioRef = useRef(window.devicePixelRatio || 1);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLowPerformance, setIsLowPerformance] = useState(() => {
    // Initial guess based on hardware
    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency;
    return (memory && memory <= 4) || (cores && cores <= 4);
  });
  const frameTimesRef = useRef<number[]>([]);

  const requestFullscreen = useCallback(async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if ((docEl as any).webkitRequestFullscreen) {
        await (docEl as any).webkitRequestFullscreen();
      } else if ((docEl as any).msRequestFullscreen) {
        await (docEl as any).msRequestFullscreen();
      }
      
      const screenAny = screen as any;
      if (screenAny.orientation && screenAny.orientation.lock) {
        await screenAny.orientation.lock('landscape').catch(() => {});
      }
    } catch (err) {
      console.error('Fullscreen/Orientation error:', err);
    }
  }, []);

  useEffect(() => {
    const checkState = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastTimeRef.current = 0; // Reset time to prevent delta jump
        if (isFullscreen) {
          const screenAny = screen as any;
          if (screenAny.orientation && screenAny.orientation.lock) {
            screenAny.orientation.lock('landscape').catch(() => {});
          }
        }
      } else {
        // Auto-pause when hidden
        if (gameState.status === 'PLAYING') {
          setGameState(prev => ({ ...prev, status: 'PAUSED' }));
        }
      }
    };

    const handleBlur = () => {
      if (gameState.status === 'PLAYING') {
        setGameState(prev => ({ ...prev, status: 'PAUSED' }));
      }
    };

    checkState();
    window.addEventListener('resize', checkState);
    window.addEventListener('orientationchange', checkState);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', checkState);
    document.addEventListener('webkitfullscreenchange', checkState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('resize', checkState);
      window.removeEventListener('orientationchange', checkState);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', checkState);
      document.removeEventListener('webkitfullscreenchange', checkState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isFullscreen]);

  const safeStorage = {
    getItem: (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch (e) {}
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    }
  };

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    highScore: parseInt(safeStorage.getItem('highScore') || '0'),
    status: 'MENU',
    speed: DIFFICULTY_SETTINGS.EASY.speed,
    distance: 0,
    difficulty: 'EASY',
    selectedCharacter: CHARACTERS[0],
    adaptiveIntensity: 1.0,
    performanceScore: 0,
    nearMissCount: 0,
    combo: 0,
    multiplier: 1,
    totalDistance: parseInt(safeStorage.getItem('totalDistance') || '0'),
    totalNearMisses: parseInt(safeStorage.getItem('totalNearMisses') || '0'),
    gamesPlayed: parseInt(safeStorage.getItem('gamesPlayed') || '0'),
    tutorialCompleted: safeStorage.getItem('tutorialCompleted') === 'true',
  });

  // Engine State Refs (High-frequency data)
  const engineRef = useRef({
    score: 0,
    distance: 0,
    speed: DIFFICULTY_SETTINGS.EASY.speed,
    combo: 0,
    multiplier: 1,
    adaptiveIntensity: 1.0,
    nearMissCount: 0,
    sessionNearMisses: 0,
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const timeScaleRef = useRef<number>(1);
  const timeScaleTimerRef = useRef<number>(0);
  const pulseActiveRef = useRef<boolean>(false);
  const pulseTimerRef = useRef<number>(0);
  const adaptiveIntensityRef = useRef<number>(1.0);
  const lastAdjustmentDistanceRef = useRef<number>(0);
  const backgroundObjectsRef = useRef<BackgroundObject[]>([]);
  const backgroundObjectPoolRef = useRef<BackgroundObject[]>([]);
  const lastBackgroundSpawnDistanceRef = useRef<number>(0);
  
  const gameTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  // UI Sync Ref
  const lastUiSyncRef = useRef<number>(0);
  
  // Refs for stable game loop to access latest functions
  const updateRef = useRef<(time: number) => void>(() => {});
  const drawRef = useRef<(ctx: CanvasRenderingContext2D) => void>(() => {});

  // Game engine refs
  const playerRef = useRef<Player>({
    y: CANVAS_HEIGHT - PLAYER_SIZE - 20,
    targetY: CANVAS_HEIGHT - PLAYER_SIZE - 20,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    isUpsideDown: false,
    rotation: 0,
    squashX: 1,
    squashY: 1,
    idleOffset: 0,
    isLanding: false,
    landingTimer: 0,
    isMoving: false,
    shieldTimer: 0,
    shieldActive: false,
    grazeTimer: 0,
    hitTimer: 0,
    leanAmount: 0,
  });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<{x: number, y: number, r: number, alpha: number}[]>([]);
  const lastSpawnTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const shakeRef = useRef<number>(0);
  const backgroundXRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gamepadRef = useRef<{ lastButtonState: boolean[]; lastAxisY: number }>({
    lastButtonState: [],
    lastAxisY: 0
  });

  const playSound = useCallback((type: 'flip' | 'death' | 'shield' | 'laser' | 'drone' | 'missile' | 'well' | 'pendulum' | 'blackhole' | 'crumble' | 'boost' | 'nearMiss') => {
    if (!soundEnabled || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    const playTone = (freq: number, type: OscillatorType, duration: number, volume: number, rampFreq?: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (rampFreq) {
        osc.frequency.exponentialRampToValueAtTime(rampFreq, ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    };

    switch (type) {
      case 'flip':
        playTone(440, 'sine', 0.1, 0.1, 880);
        playTone(220, 'triangle', 0.1, 0.05, 440);
        break;
      case 'death':
        playTone(220, 'sawtooth', 0.5, 0.2, 20);
        playTone(110, 'square', 0.5, 0.1, 10);
        break;
      case 'shield':
        playTone(660, 'sine', 0.3, 0.15, 1320);
        playTone(330, 'sine', 0.3, 0.1, 660);
        break;
      case 'laser':
        playTone(880, 'square', 0.15, 0.05, 220);
        break;
      case 'drone':
        playTone(150, 'sawtooth', 0.2, 0.08, 300);
        break;
      case 'missile':
        playTone(300, 'sawtooth', 0.3, 0.05, 900);
        break;
      case 'well':
        playTone(60, 'sine', 0.6, 0.15, 240);
        break;
      case 'pendulum':
        playTone(150, 'triangle', 0.4, 0.1, 450);
        break;
      case 'blackhole':
        playTone(100, 'sine', 0.8, 0.2, 10);
        break;
      case 'crumble':
        playTone(100, 'sawtooth', 0.3, 0.1, 20);
        break;
      case 'boost':
        playTone(880, 'sine', 0.4, 0.1, 1760);
        playTone(440, 'sine', 0.4, 0.05, 880);
        break;
      case 'nearMiss':
        playTone(1200, 'sine', 0.1, 0.06, 2400);
        break;
    }
  }, [soundEnabled]);

  // Initialize Audio Context on first interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };
    window.addEventListener('mousedown', initAudio);
    window.addEventListener('keydown', initAudio);
    window.addEventListener('touchstart', initAudio);
    return () => {
      window.removeEventListener('mousedown', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, [gameState.status]);

  const spawnObstacle = useCallback((time: number) => {
    const settings = DIFFICULTY_SETTINGS[gameState.difficulty];
    // Adaptive intensity scales the spawn rate
    const baseInterval = settings.spawnInterval / engineRef.current.adaptiveIntensity;
    // Speed also scales the spawn rate (faster speed = faster spawns)
    const speedFactor = (engineRef.current.speed - settings.speed) * 120;
    const minInterval = Math.max(settings.minSpawnInterval, baseInterval - speedFactor);
    
    if (time - lastSpawnTimeRef.current > minInterval) {
      const rand = Math.random();
      let type: 'FLOOR_SPIKE' | 'CEILING_SPIKE' | 'BARRIER' | 'ROTATING_BLADE' | 'DRONE' | 'LASER' | 'SHIELD' | 'PENDULUM' | 'HOMING_MISSILE' | 'GRAVITY_WELL' | 'BLACK_HOLE' | 'VOID_GATE' | 'ENERGY_CONDUIT' | 'CHRONO_SPHERE' | 'PULSE_WAVE' | 'NEBULA_STORM';
      
      // Difficulty based spawning logic with refined probabilities
      if (gameState.difficulty === 'EASY') {
        if (rand < 0.25) type = 'FLOOR_SPIKE';
        else if (rand < 0.50) type = 'CEILING_SPIKE';
        else if (rand < 0.70) type = 'DRONE';
        else if (rand < 0.80) type = 'BARRIER';
        else if (rand < 0.85) type = 'SHIELD';
        else if (rand < 0.90) type = 'ENERGY_CONDUIT';
        else if (rand < 0.95) type = 'CHRONO_SPHERE';
        else type = 'PULSE_WAVE';
      } else if (gameState.difficulty === 'HARD') {
        if (rand < 0.12) type = 'FLOOR_SPIKE';
        else if (rand < 0.24) type = 'CEILING_SPIKE';
        else if (rand < 0.38) type = 'BARRIER';
        else if (rand < 0.50) type = 'DRONE';
        else if (rand < 0.62) type = 'LASER';
        else if (rand < 0.72) type = 'ROTATING_BLADE';
        else if (rand < 0.78) type = 'SHIELD';
        else if (rand < 0.85) type = 'VOID_GATE';
        else if (rand < 0.92) type = 'ENERGY_CONDUIT';
        else type = 'CHRONO_SPHERE';
      } else if (gameState.difficulty === 'ULTIMATE') {
        if (rand < 0.08) type = 'FLOOR_SPIKE';
        else if (rand < 0.16) type = 'CEILING_SPIKE';
        else if (rand < 0.24) type = 'BARRIER';
        else if (rand < 0.32 && gameState.distance > 2000) type = 'HOMING_MISSILE';
        else if (rand < 0.40) type = 'GRAVITY_WELL';
        else if (rand < 0.48) type = 'LASER';
        else if (rand < 0.56) type = 'ROTATING_BLADE';
        else if (rand < 0.64) type = 'PENDULUM';
        else if (rand < 0.70) type = 'SHIELD';
        else if (rand < 0.78) type = 'NEBULA_STORM';
        else if (rand < 0.85) type = 'VOID_GATE';
        else if (rand < 0.92) type = 'ENERGY_CONDUIT';
        else type = 'PULSE_WAVE';
      } else {
        // INSANE: Pure chaos
        if (rand < 0.05) type = 'FLOOR_SPIKE';
        else if (rand < 0.10) type = 'CEILING_SPIKE';
        else if (rand < 0.15) type = 'BARRIER';
        else if (rand < 0.20) type = 'DRONE';
        else if (rand < 0.25) type = 'ROTATING_BLADE';
        else if (rand < 0.30) type = 'LASER';
        else if (rand < 0.35) type = 'PENDULUM';
        else if (rand < 0.40) type = 'HOMING_MISSILE';
        else if (rand < 0.45) type = 'GRAVITY_WELL';
        else if (rand < 0.50) type = 'BLACK_HOLE';
        else if (rand < 0.55) type = 'NEBULA_STORM';
        else if (rand < 0.60) type = 'SHIELD';
        else if (rand < 0.70) type = 'VOID_GATE';
        else if (rand < 0.80) type = 'ENERGY_CONDUIT';
        else if (rand < 0.90) type = 'CHRONO_SPHERE';
        else type = 'PULSE_WAVE';
      }

      // Fallback if distance requirement not met
      if (!type) type = 'BARRIER';

      const width = type === 'BARRIER' ? 20 : (type === 'DRONE' ? 50 : (type === 'ROTATING_BLADE' ? 60 : (type === 'LASER' ? 120 : (type === 'SHIELD' ? 40 : (type === 'PENDULUM' ? 40 : (type === 'HOMING_MISSILE' ? 50 : (type === 'GRAVITY_WELL' ? 60 : (type === 'BLACK_HOLE' ? 80 : (type === 'VOID_GATE' ? 80 : (type === 'ENERGY_CONDUIT' ? 30 : (type === 'CHRONO_SPHERE' ? 40 : (type === 'PULSE_WAVE' ? 50 : (type === 'NEBULA_STORM' ? 150 : 30 + Math.random() * 20)))))))))))));
      const height = type === 'BARRIER' ? 120 : (type === 'DRONE' ? 25 : (type === 'ROTATING_BLADE' ? 60 : (type === 'LASER' ? 10 : (type === 'SHIELD' ? 40 : (type === 'PENDULUM' ? 150 : (type === 'HOMING_MISSILE' ? 20 : (type === 'GRAVITY_WELL' ? 60 : (type === 'BLACK_HOLE' ? 80 : (type === 'VOID_GATE' ? 80 : (type === 'ENERGY_CONDUIT' ? 30 : (type === 'CHRONO_SPHERE' ? 40 : (type === 'PULSE_WAVE' ? 50 : (type === 'NEBULA_STORM' ? 150 : 40 + Math.random() * 40)))))))))))));
      
      let y = 0;
      if (type === 'FLOOR_SPIKE') y = CANVAS_HEIGHT - height - 20;
      else if (type === 'CEILING_SPIKE') y = 20;
      else if (type === 'BARRIER') y = (CANVAS_HEIGHT / 2) - (height / 2);
      else if (type === 'DRONE') y = 60 + Math.random() * (CANVAS_HEIGHT - 120);
      else if (type === 'LASER') {
        const isTop = playerRef.current.isUpsideDown;
        if (isTop) {
          y = 20 + (playerRef.current.height / 2) - (height / 2);
        } else {
          y = (CANVAS_HEIGHT - 20 - (playerRef.current.height / 2)) - (height / 2);
        }
      }
      else if (type === 'SHIELD') {
        y = 60 + Math.random() * (CANVAS_HEIGHT - 120);
      }
      else if (type === 'PENDULUM') {
        y = Math.random() > 0.5 ? 20 : CANVAS_HEIGHT - height - 20;
      }
      else if (type === 'HOMING_MISSILE') {
        y = playerRef.current.y + playerRef.current.height / 2 - height / 2;
      }
      else if (type === 'GRAVITY_WELL' || type === 'BLACK_HOLE') {
        y = 100 + Math.random() * (CANVAS_HEIGHT - 200);
      }
      else if (type === 'VOID_GATE') {
        y = 100 + Math.random() * (CANVAS_HEIGHT - 200);
      }
      else if (type === 'NEBULA_STORM') {
        y = 50 + Math.random() * (CANVAS_HEIGHT - 200);
      }
      else if (type === 'ENERGY_CONDUIT' || type === 'CHRONO_SPHERE' || type === 'PULSE_WAVE') {
        y = 60 + Math.random() * (CANVAS_HEIGHT - 120);
      }
      else y = (CANVAS_HEIGHT / 2) - (height / 2); 
      
      const newObstacle: Obstacle = {
        id: Date.now(),
        x: CANVAS_WIDTH + 100,
        y,
        width,
        height,
        type,
        speedY: type === 'BARRIER' ? (Math.random() - 0.5) * 4 : 0,
        speedX: type === 'LASER' ? engineRef.current.speed * 2 : (type === 'HOMING_MISSILE' ? engineRef.current.speed * 2 : engineRef.current.speed),
        warningTime: type === 'LASER' ? 80 : 0, // Increased warning time for lasers
        angle: 0,
        rotationSpeed: type === 'ROTATING_BLADE' ? 0.1 : (type === 'PENDULUM' ? 0.05 : 0),
        amplitude: type === 'DRONE' ? 15 + Math.random() * 15 : (type === 'PENDULUM' ? 1 : 0),
        frequency: type === 'DRONE' ? 0.003 + Math.random() * 0.002 : (type === 'PENDULUM' ? 0.002 : 0),
        baseY: y,
        timer: 0,
        isTriggered: false,
        seed: Math.random(),
      };
      
    if (type === 'DRONE') playSound('drone');
    if (type === 'HOMING_MISSILE') playSound('missile');
    if (type === 'GRAVITY_WELL') playSound('well');
    if (type === 'BLACK_HOLE') playSound('blackhole');
    if (type === 'NEBULA_STORM') playSound('well');
    if (type === 'PENDULUM') playSound('pendulum');
    if (type === 'VOID_GATE') playSound('shield');
    if (type === 'CHRONO_SPHERE') playSound('well');
    if (type === 'PULSE_WAVE') playSound('boost');
      
      obstaclesRef.current.push(newObstacle);
      lastSpawnTimeRef.current = time;
    }
  }, [gameState.speed]);

  const createParticles = (x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color,
      });
    }
  };

  const handleFlip = useCallback(() => {
    if (gameState.status !== 'PLAYING' && gameState.status !== 'TUTORIAL') return;

    if (gameState.status === 'TUTORIAL' && tutorialStep === 0) {
      setTutorialStep(1);
    }

    const player = playerRef.current;
    player.isUpsideDown = !player.isUpsideDown;
    player.targetY = player.isUpsideDown ? 20 : CANVAS_HEIGHT - player.height - 20;
    player.isMoving = true;
    player.isLanding = false;
    
    // Stretch on flip
    player.squashX = 0.7;
    player.squashY = 1.3;
    
    playSound('flip');
    
    // Add an initial velocity boost for more dynamic feel
    player.vy += (player.targetY - player.y) * 0.1;
    
    // Visual feedback - Flip particles
    createParticles(100 + player.width / 2, player.y + player.height / 2, gameState.selectedCharacter.color, 15);
    
    // Add some "energy" particles that fly out horizontally
    for (let i = 0; i < 10; i++) {
      particlesRef.current.push({
        x: 100 + player.width / 2,
        y: player.y + player.height / 2,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 5,
        life: 0.8,
        color: '#fff',
      });
    }
  }, [gameState.status, gameState.selectedCharacter.color]);

  const handleGameOver = (playerX: number, player: Player) => {
    shakeRef.current = 20;
    playSound('death');
    createParticles(playerX + player.width / 2, player.y + player.height / 2, '#ef4444', 30);
    
    const currentScore = Math.floor(engineRef.current.score);
    const newHighScore = Math.max(gameState.highScore, currentScore);
    const newTotalDistance = gameState.totalDistance + Math.floor(engineRef.current.distance);
    const newTotalNearMisses = gameState.totalNearMisses + engineRef.current.sessionNearMisses;
    const newGamesPlayed = gameState.gamesPlayed + 1;

    // Adaptive intensity reset/reduction on death
    const settings = DIFFICULTY_SETTINGS[gameState.difficulty];
    const newIntensity = Math.max(1.0, engineRef.current.adaptiveIntensity - settings.adaptiveRampDown);
    engineRef.current.adaptiveIntensity = newIntensity;

    safeStorage.setItem('highScore', newHighScore.toString());
    safeStorage.setItem('totalDistance', newTotalDistance.toString());
    safeStorage.setItem('totalNearMisses', newTotalNearMisses.toString());
    safeStorage.setItem('gamesPlayed', newGamesPlayed.toString());

    setGameState(prev => ({
      ...prev,
      status: 'GAMEOVER',
      highScore: newHighScore,
      score: currentScore,
      totalDistance: newTotalDistance,
      totalNearMisses: newTotalNearMisses,
      gamesPlayed: newGamesPlayed,
      combo: 0,
      multiplier: settings.multiplier,
      adaptiveIntensity: newIntensity,
      distance: engineRef.current.distance
    }));
  };

  const spawnBackgroundObject = (layer: 1 | 2 | 3 | 4, initial: boolean = false, forcedType?: BackgroundObject['type'], forcedY?: number) => {
    const distance = gameState.distance;
    let type: BackgroundObject['type'] = forcedType || 'STAR_CLUSTER';
    let isRare = false;

    // Determine type based on distance and layer if not forced
    if (!forcedType) {
      if (layer === 1 || layer === 2) {
        type = 'STAR_CLUSTER'; // Mostly stars for background
      } else if (layer === 3) {
        const rand = Math.random();
        if (rand > 0.97) {
          type = 'SUN';
        } else if (rand > 0.92) {
          type = 'MOON';
        } else if (rand > 0.85) {
          type = 'PLANET';
        } else {
          type = 'STAR_CLUSTER';
        }
      } else if (layer === 4) {
        type = 'SPACE_DUST';
      }
    }

    const id = Date.now() + Math.random();
    const x = initial ? Math.random() * CANVAS_WIDTH : CANVAS_WIDTH + 200;
    const y = forcedY !== undefined ? forcedY : Math.random() * CANVAS_HEIGHT;
    
    let width = 0;
    let height = 0;
    let speedX = 0;
    let color = '#fff';
    let opacity = 1;
    let starType: BackgroundObject['starType'] = 'G';
    const starTypes: BackgroundObject['starType'][] = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
    const starColors = {
      'O': '#9bb0ff', 'B': '#aabfff', 'A': '#cad7ff', 'F': '#f8f7ff',
      'G': '#fff4ea', 'K': '#ffd2a1', 'M': '#ffcc6f'
    };

    switch (type) {
      case 'STAR_CLUSTER':
        width = 1 + Math.random() * 3; // Varied star sizes
        height = width;
        speedX = 0.1 + Math.random() * 0.2;
        opacity = 0.3 + Math.random() * 0.7;
        starType = starTypes[Math.floor(Math.random() * starTypes.length)];
        color = starColors[starType];
        break;
      case 'PLANET':
        width = 30 + Math.random() * 50;
        height = width;
        speedX = 0.6 + Math.random() * 0.4;
        color = PLANET_COLORS[Math.floor(Math.random() * PLANET_COLORS.length)];
        break;
      case 'SUN':
        width = 80 + Math.random() * 100;
        height = width;
        speedX = 0.4 + Math.random() * 0.3;
        starType = 'G';
        color = ['#ffcc00', '#ff6600', '#ff3300', '#ffffff'][Math.floor(Math.random() * 4)];
        
        // System Logic: Spawn a planet or moon near the sun
        if (!initial && Math.random() > 0.5) {
          setTimeout(() => {
            spawnBackgroundObject(3, false, Math.random() > 0.5 ? 'PLANET' : 'MOON', y + (Math.random() - 0.5) * 200);
          }, 500 + Math.random() * 1000);
        }
        break;
      case 'MOON':
        width = 15 + Math.random() * 15;
        height = width;
        speedX = 0.5 + Math.random() * 0.4;
        color = '#cbd5e1';
        break;
      case 'NEBULA':
        width = 200 + Math.random() * 300;
        height = width * (0.6 + Math.random() * 0.4);
        speedX = 0.05 + Math.random() * 0.1;
        color = NEBULA_COLORS[Math.floor(Math.random() * NEBULA_COLORS.length)];
        opacity = 0.1 + Math.random() * 0.2;
        break;
      case 'GALAXY':
        width = 150 + Math.random() * 200;
        height = width * (0.4 + Math.random() * 0.4);
        speedX = 0.02 + Math.random() * 0.05;
        color = ['#a855f7', '#3b82f6', '#f472b6', '#fff'][Math.floor(Math.random() * 4)];
        opacity = 0.2 + Math.random() * 0.3;
        break;
      case 'SPACE_DUST':
        width = 1 + Math.random() * 2;
        height = 1;
        speedX = 12 + Math.random() * 6;
        color = 'rgba(255, 255, 255, 0.05)';
        opacity = 0.05 + Math.random() * 0.1;
        break;
      default:
        width = 2;
        height = 2;
        speedX = 0.2;
        color = '#fff';
    }

    // Apply layer speed multiplier for deep parallax
    if (layer === 1) speedX *= 0.1;
    else if (layer === 2) speedX *= 0.3;
    else if (layer === 3) speedX *= 0.8;
    else if (layer === 4) speedX *= 2.0;

    let newObj: BackgroundObject;
    if (backgroundObjectPoolRef.current.length > 0) {
      newObj = backgroundObjectPoolRef.current.pop()!;
      // Re-initialize properties
      newObj.id = id;
      newObj.x = x;
      newObj.y = y;
      newObj.width = width;
      newObj.height = height;
      newObj.layer = layer;
      newObj.type = type;
      newObj.speedX = speedX;
      newObj.rotation = Math.random() * Math.PI * 2;
      newObj.rotationSpeed = (Math.random() - 0.5) * 0.015;
      newObj.color = color;
      newObj.opacity = opacity;
      newObj.seed = Math.random();
      newObj.pulse = 0;
      newObj.pulseSpeed = 0.01 + Math.random() * 0.02;
      newObj.isRare = isRare;
      newObj.planetType = Math.floor(Math.random() * 5);
      newObj.nebulaType = Math.floor(Math.random() * 4);
      newObj.galaxyType = Math.floor(Math.random() * 4);
      newObj.hasRings = type === 'PLANET' && Math.random() > 0.7;
      newObj.starType = starType;
    } else {
      newObj = {
        id,
        x,
        y,
        width,
        height,
        layer,
        type,
        speedX,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
        color,
        opacity,
        seed: Math.random(),
        pulse: 0,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        isRare,
        planetType: Math.floor(Math.random() * 5),
        nebulaType: Math.floor(Math.random() * 4),
        galaxyType: Math.floor(Math.random() * 4),
        hasRings: type === 'PLANET' && Math.random() > 0.7,
        starType
      };
    }
    backgroundObjectsRef.current.push(newObj);
  };

  const resetGame = () => {
    const settings = DIFFICULTY_SETTINGS[gameState.difficulty];
    
    // Reset Engine Refs
    engineRef.current = {
      score: 0,
      distance: 0,
      speed: settings.speed,
      combo: 0,
      multiplier: settings.multiplier,
      adaptiveIntensity: 1.0,
      nearMissCount: 0,
      sessionNearMisses: 0,
    };

    playerRef.current = {
      y: CANVAS_HEIGHT - PLAYER_SIZE - 20,
      targetY: CANVAS_HEIGHT - PLAYER_SIZE - 20,
      vy: 0,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      isUpsideDown: false,
      rotation: 0,
      squashX: 1,
      squashY: 1,
      idleOffset: 0,
      isLanding: false,
      landingTimer: 0,
      isMoving: false,
      shieldTimer: 0,
      shieldActive: false,
      grazeTimer: 0,
      hitTimer: 0,
      leanAmount: 0,
      x: 100,
    };
    obstaclesRef.current = [];
    particlesRef.current = [];
    shockwavesRef.current = [];
    backgroundObjectsRef.current = [];
    lastSpawnTimeRef.current = 0;
    shakeRef.current = 0;
    lastAdjustmentDistanceRef.current = 0;
    lastUiSyncRef.current = 0;
    
    const isFirstTime = !gameState.tutorialCompleted;
    
    setGameState(prev => ({
      ...prev,
      score: 0,
      status: isFirstTime ? 'TUTORIAL' : 'PLAYING',
      speed: settings.speed,
      distance: 0,
      adaptiveIntensity: 1.0,
      performanceScore: 0,
      nearMissCount: 0,
      combo: 0,
      multiplier: settings.multiplier,
    }));

    if (isFirstTime) {
      setTutorialStep(0);
    }

    // Initial background population
    for (let i = 0; i < 60; i++) {
      spawnBackgroundObject(1, true);
      if (i < 40) spawnBackgroundObject(2, true);
    }
    
    // Explicitly spawn celestial bodies to ensure they are present from the start
    spawnBackgroundObject(3, true, 'SUN');
    spawnBackgroundObject(3, true, 'MOON');
    for (let i = 0; i < 5; i++) {
      spawnBackgroundObject(3, true, 'PLANET');
    }
  };

  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log("Gamepad connected:", e.gamepad);
    };
    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log("Gamepad disconnected:", e.gamepad);
    };

    window.addEventListener("gamepadconnected", handleGamepadConnected);
    window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("gamepadconnected", handleGamepadConnected);
      window.removeEventListener("gamepaddisconnected", handleGamepadDisconnected);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleFlip]);

  const pollGamepad = useCallback(() => {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0]; // Use the first connected gamepad
    if (!gamepad) return;

    const { lastButtonState, lastAxisY } = gamepadRef.current;

    // Start game from menu with any button
    if (gameState.status === 'MENU' || gameState.status === 'GAMEOVER') {
      const anyButtonPressed = gamepad.buttons.some(b => b.pressed);
      if (anyButtonPressed) {
        if (gameState.status === 'MENU') {
          setGameState(prev => ({ ...prev, status: 'DIFF_SELECT' }));
        } else if (gameState.status === 'GAMEOVER') {
          resetGame();
        }
      }
      return;
    }

    if (gameState.status !== 'PLAYING') return;

    // Button 0 (A/Cross) for flipping
    const button0 = gamepad.buttons[0].pressed;
    if (button0 && !lastButtonState[0]) {
      handleFlip();
    }
    lastButtonState[0] = button0;

    // D-Pad Up (12) and Down (13) for flipping
    const dpadUp = gamepad.buttons[12]?.pressed;
    const dpadDown = gamepad.buttons[13]?.pressed;

    if (dpadUp && !lastButtonState[12]) {
      if (!playerRef.current.isUpsideDown) handleFlip();
    }
    if (dpadDown && !lastButtonState[13]) {
      if (playerRef.current.isUpsideDown) handleFlip();
    }
    lastButtonState[12] = dpadUp;
    lastButtonState[13] = dpadDown;

    // Analog Stick (Axis 1 is vertical)
    const axisY = gamepad.axes[1];
    const threshold = 0.2;

    if (Math.abs(axisY) > threshold) {
      // Manual control of targetY
      // Map axisY (-1 to 1) to (20 to CANVAS_HEIGHT - height - 20)
      const player = playerRef.current;
      const minY = 20;
      const maxY = CANVAS_HEIGHT - player.height - 20;
      const range = maxY - minY;
      
      // If pushing up, targetY should be towards minY. If pushing down, towards maxY.
      // axisY is -1 at top, 1 at bottom.
      const normalizedAxis = (axisY + 1) / 2; // 0 at top, 1 at bottom
      player.targetY = minY + normalizedAxis * range;
      player.isMoving = true;
    } else if (Math.abs(lastAxisY) > threshold) {
      // Stick released, snap back to gravity side
      const player = playerRef.current;
      player.targetY = player.isUpsideDown ? 20 : CANVAS_HEIGHT - player.height - 20;
    }
    
    gamepadRef.current.lastAxisY = axisY;
  }, [gameState.status, handleFlip, resetGame]);

  function update(time: number) {
    pollGamepad();

    if (gameState.status !== 'PLAYING' && gameState.status !== 'TUTORIAL') {
      lastTimeRef.current = 0;
      return;
    }

    const settings = DIFFICULTY_SETTINGS[gameState.difficulty] || DIFFICULTY_SETTINGS['EASY'];
    
    // Impact freeze/slowdown
    if (playerRef.current.hitTimer && playerRef.current.hitTimer > 0) {
      playerRef.current.hitTimer--;
      
      // Impact physics: push player back and away
      playerRef.current.x = (playerRef.current.x || 100) - 2; 
      playerRef.current.y += playerRef.current.vy;
      playerRef.current.vy *= 0.9;
      
      if (playerRef.current.hitTimer === 0) {
        handleGameOver(playerRef.current.x || 100, playerRef.current);
        playerRef.current.x = 100; // Reset for next game
      }
      
      // Still draw but don't update game logic
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) draw(ctx);
      return;
    }

    // Update game time for consistent slowing of obstacles
    if (lastTimeRef.current === 0) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    gameTimeRef.current += deltaTime * timeScaleRef.current;
    const gameTime = gameTimeRef.current;
    
    // Tutorial logic overrides
    let currentSpeed = 0;
    if (gameState.status === 'TUTORIAL') {
      if (tutorialStep === 0) {
        currentSpeed = 0;
      } else {
        currentSpeed = (settings.speed * 0.6) / 60;
        
        // Step 1: Just moving, wait for some distance
        if (tutorialStep === 1 && gameState.distance > 400) {
          // Spawn a simple barrier
          obstaclesRef.current.push({
            id: 'tutorial-barrier',
            x: CANVAS_WIDTH,
            y: CANVAS_HEIGHT - 100 - 20,
            width: 30,
            height: 100,
            type: 'BARRIER',
            speed: currentSpeed * 60,
            isTriggered: false
          });
          setTutorialStep(2);
        }
        
        // Step 2: Avoided the barrier
        if (tutorialStep === 2 && gameState.distance > 1200) {
          setTutorialStep(3);
          safeStorage.setItem('tutorialCompleted', 'true');
          setGameState(prev => ({ ...prev, status: 'PLAYING', tutorialCompleted: true }));
        }
      }
    } else {
      const adaptiveSpeedMultiplier = 1 + (engineRef.current.adaptiveIntensity - 1) * 0.15;
      currentSpeed = (engineRef.current.speed * timeScaleRef.current * adaptiveSpeedMultiplier) / 60;
    }

    // Update player position (smooth flip with spring physics)
    const player = playerRef.current;
    
    // Spring physics for overshoot and return
    const force = (player.targetY - player.y) * SPRING_STIFFNESS;
    player.vy += force; // Removed timeScaleRef.current so player speed is unaffected by Chrono Sphere
    player.vy *= SPRING_DAMPING;
    player.y += player.vy;

    // Leaning physics based on vertical velocity
    player.leanAmount += (player.vy * 0.08 - player.leanAmount) * 0.15;

    player.rotation += ( (player.isUpsideDown ? 180 : 0) - player.rotation ) * 0.2;

    // Idle animation (subtle bobbing)
    player.idleOffset = Math.sin(time * 0.005) * 2;

    // Squash and stretch recovery
    player.squashX += (1 - player.squashX) * 0.15;
    player.squashY += (1 - player.squashY) * 0.15;

    // Landing detection
    if (player.isMoving && Math.abs(player.targetY - player.y) < 2) {
      player.isMoving = false;
      player.isLanding = true;
      player.landingTimer = 15;
      
      // Squash on landing
      player.squashX = 1.4;
      player.squashY = 0.6;
      
      // Landing particles
      createParticles(100 + player.width / 2, player.y + (player.isUpsideDown ? 0 : player.height), gameState.selectedCharacter.color, 12);
      
      // Multiple shockwave rings for a more dynamic effect
      shockwavesRef.current.push({
        x: 100 + player.width / 2,
        y: player.targetY + (player.isUpsideDown ? 0 : player.height),
        r: 0,
        alpha: 0.6
      });
      shockwavesRef.current.push({
        x: 100 + player.width / 2,
        y: player.targetY + (player.isUpsideDown ? 0 : player.height),
        r: -10, // Starts slightly later
        alpha: 0.4
      });
      
      shakeRef.current = 4;
    }

    if (player.isLanding) {
      player.landingTimer--;
      if (player.landingTimer <= 0) {
        player.isLanding = false;
      }
    }

    // Player trail
    if (Math.random() > 0.5) {
      createParticles(100 + player.width / 2, player.y + player.height / 2, gameState.selectedCharacter.color, 1);
    }

    // Update speed
    const newSpeed = Math.min(settings.maxSpeed, engineRef.current.speed + settings.increment * timeScaleRef.current);
    engineRef.current.speed = newSpeed;
    
    // Update shield timer
    if (player.shieldActive) {
      player.shieldTimer--;
      if (player.shieldTimer <= 0) {
        player.shieldActive = false;
      }
    }

    // Update invincibility timer
    if (player.invincibilityTimer && player.invincibilityTimer > 0) {
      player.invincibilityTimer--;
    }

    // Update pulse wave timer
    if (pulseActiveRef.current) {
      pulseTimerRef.current -= timeScaleRef.current;
      if (pulseTimerRef.current <= 0) {
        pulseActiveRef.current = false;
      }
    }

    // Update time scale timer
    if (timeScaleRef.current !== 1) {
      timeScaleTimerRef.current -= 1;
      if (timeScaleTimerRef.current <= 0) {
        timeScaleRef.current = 1;
      }
    }
    
    // Update background
    backgroundXRef.current = (backgroundXRef.current - newSpeed * 0.5) % CANVAS_WIDTH;

    // Adaptive Difficulty Logic - Adjust every 1000 distance units
    let newIntensity = engineRef.current.adaptiveIntensity;
    if (Math.floor(engineRef.current.distance) % 1000 < 5 && Math.floor(engineRef.current.distance) > 0) {
      const currentDistance = Math.floor(engineRef.current.distance);
      const adjustmentInterval = Math.floor(currentDistance / 1000);
      
      if (lastAdjustmentDistanceRef.current !== adjustmentInterval) {
        lastAdjustmentDistanceRef.current = adjustmentInterval;
        
        if (engineRef.current.nearMissCount < 3) {
          // Doing exceptionally well (few near misses)
          newIntensity = Math.min(3.5, newIntensity + settings.adaptiveRampUp * 5);
        } else if (engineRef.current.nearMissCount > 8) {
          // Struggling (many near misses)
          newIntensity = Math.max(1.0, newIntensity - settings.adaptiveRampDown * 0.5);
        }
        
        engineRef.current.adaptiveIntensity = newIntensity;
        engineRef.current.nearMissCount = 0; // Reset for next interval
      }
    }

    // Update engine values
    engineRef.current.distance += currentSpeed;
    engineRef.current.score += (currentSpeed * engineRef.current.multiplier * 0.1);

    // UI Synchronization (Throttled to ~20Hz for performance)
    if (time - lastUiSyncRef.current > 50) {
      lastUiSyncRef.current = time;
      setGameState(prev => ({
        ...prev,
        speed: engineRef.current.speed,
        distance: engineRef.current.distance,
        score: engineRef.current.score,
        adaptiveIntensity: engineRef.current.adaptiveIntensity,
        nearMissCount: engineRef.current.nearMissCount,
        combo: engineRef.current.combo,
        multiplier: engineRef.current.multiplier
      }));
    }

    // Spawn obstacles
    if (gameState.status === 'PLAYING') {
      spawnObstacle(time);
    }

    // Update obstacles
    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      if (obs.warningTime && obs.warningTime > 0) {
        obs.warningTime -= timeScaleRef.current;
        if (obs.warningTime <= 0) playSound('laser');
        return true;
      }

      obs.x -= (obs.speedX || currentSpeed) * timeScaleRef.current;
      
      if (obs.type === 'BARRIER' && obs.speedY) {
        obs.y += obs.speedY * timeScaleRef.current;
        if (obs.y < 40 || obs.y + obs.height > CANVAS_HEIGHT - 40) {
          obs.speedY *= -1;
        }
      }

      if (obs.type === 'DRONE' && obs.amplitude && obs.frequency && obs.baseY !== undefined) {
        obs.y = obs.baseY + Math.sin(time * obs.frequency) * obs.amplitude;
      }

      if (obs.type === 'ROTATING_BLADE' && obs.rotationSpeed !== undefined && obs.angle !== undefined) {
        obs.angle += obs.rotationSpeed * timeScaleRef.current;
      }

      if (obs.type === 'PENDULUM' && obs.amplitude && obs.frequency && obs.angle !== undefined) {
        obs.angle = Math.sin(gameTime * obs.frequency) * (Math.PI / 3);
      }

      if (obs.type === 'HOMING_MISSILE') {
        const targetY = player.y + player.height / 2 - obs.height / 2;
        obs.y += (targetY - obs.y) * 0.065 * timeScaleRef.current; // Buffed tracking speed slightly from previous nerf
      }

      if (obs.type === 'GRAVITY_WELL' || obs.type === 'BLACK_HOLE') {
        const dx = (100 + player.width / 2) - (obs.x + obs.width / 2);
        const dy = (player.y + player.height / 2) - (obs.y + obs.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pullRadius = obs.type === 'BLACK_HOLE' ? 350 : 200; // Reduced black hole pull radius
        const pullStrength = obs.type === 'BLACK_HOLE' ? 0.025 : 0.005; // Reduced black hole pull strength
        
        if (dist < pullRadius) {
          player.vy += (obs.y + obs.height / 2 - (player.y + player.height / 2)) * pullStrength * timeScaleRef.current;
          if (Math.random() > 0.8) {
            createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.type === 'BLACK_HOLE' ? '#ff00ff' : '#00f2ff', 1);
          }
        }
      }
      
      // Magnetic effect for powerups
      const isPowerup = ['SHIELD', 'ENERGY_CONDUIT', 'VOID_GATE', 'CHRONO_SPHERE', 'PULSE_WAVE'].includes(obs.type);
      if (isPowerup && gameState.status === 'PLAYING') {
        const dx = (100 + player.width / 2) - (obs.x + obs.width / 2);
        const dy = (player.y + player.height / 2) - (obs.y + obs.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Magnetic pull
        if (dist < 180) {
          const pullStrength = 0.2 * timeScaleRef.current;
          obs.x += dx * pullStrength;
          obs.y += dy * pullStrength;
          
          // Visual trail for magnetic pull
          if (Math.random() > 0.7) {
            createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#fff', 1);
          }
        }
      }

      // Collision detection with refined hitboxes
      const playerX = 100;
      
      // Dynamic margin based on obstacle type for "fairer" feel
      let margin = 14; 
      let grazeMargin = 22; // Threshold for "grazing" (visual sparks, minor penalty)
      
      if (isPowerup) {
        margin = -30; 
        grazeMargin = -30;
      }
      if (obs.type === 'FLOOR_SPIKE' || obs.type === 'CEILING_SPIKE') {
        margin = 20;
        grazeMargin = 28;
      }
      if (obs.type === 'LASER') {
        margin = 2;
        grazeMargin = 8;
      }
      if (obs.type === 'DRONE') {
        margin = 12;
        grazeMargin = 20;
      }
      if (obs.type === 'HOMING_MISSILE') {
        margin = 10;
        grazeMargin = 18;
      }
      if (obs.type === 'ROTATING_BLADE') {
        margin = 15;
        grazeMargin = 25;
      }
      if (obs.type === 'BARRIER') {
        margin = 18;
        grazeMargin = 26;
      }
      
      let isColliding = false;
      let isGrazing = false;
      const pCenterX = playerX + player.width / 2;
      const pCenterY = player.y + player.height / 2;

      if (obs.type === 'ROTATING_BLADE') {
        const dist = Math.sqrt(Math.pow(pCenterX - (obs.x + obs.width / 2), 2) + Math.pow(pCenterY - (obs.y + obs.height / 2), 2));
        isColliding = dist < (obs.width / 2 + player.width / 2) - margin;
        isGrazing = !isColliding && dist < (obs.width / 2 + player.width / 2) - (margin - 8);
      } else if (obs.type === 'NEBULA_STORM') {
        const dist = Math.sqrt(Math.pow(pCenterX - (obs.x + obs.width / 2), 2) + Math.pow(pCenterY - (obs.y + obs.height / 2), 2));
        isColliding = dist < (obs.width / 2) - margin;
        isGrazing = !isColliding && dist < (obs.width / 2) - (margin - 10);
      } else {
        isColliding = (
          playerX + margin < obs.x + obs.width &&
          playerX + player.width - margin > obs.x &&
          player.y + margin < obs.y + obs.height &&
          player.y + player.height - margin > obs.y
        );
        
        if (!isColliding) {
          isGrazing = (
            playerX + (margin - 8) < obs.x + obs.width &&
            playerX + player.width - (margin - 8) > obs.x &&
            player.y + (margin - 8) < obs.y + obs.height &&
            player.y + player.height - (margin - 8) > obs.y
          );
        }
      }

      // Handle Grazing (Near-collision that doesn't kill)
      if (isGrazing && !isPowerup && !player.shieldActive && (!player.invincibilityTimer || player.invincibilityTimer <= 0)) {
        if (player.grazeTimer === 0 || obs.id !== player.lastHitObstacleId) {
          player.grazeTimer = 10;
          player.lastHitObstacleId = obs.id;
          
          // Visual feedback for graze
          shakeRef.current = 2;
          playSound('nearMiss');
          
          // Spark particles at the point of contact
          const sparkX = Math.max(playerX, Math.min(playerX + player.width, obs.x));
          const sparkY = Math.max(player.y, Math.min(player.y + player.height, obs.y));
          createParticles(sparkX, sparkY, '#fff', 5);
          
          // Slight speed penalty
          engineRef.current.speed = Math.max(DIFFICULTY_SETTINGS[gameState.difficulty].speed, engineRef.current.speed - 0.1);
          engineRef.current.combo = Math.max(0, engineRef.current.combo - 1);
        }
      }

      if (player.grazeTimer && player.grazeTimer > 0) player.grazeTimer--;

      // Near miss detection
      if (!isColliding && !obs.isTriggered && obs.x < playerX + player.width && obs.x > playerX - 50) {
        const dx = (playerX + player.width / 2) - (obs.x + obs.width / 2);
        const dy = (player.y + player.height / 2) - (obs.y + obs.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Near miss threshold
        if (dist < 75 && obs.type !== 'SHIELD' && obs.type !== 'ENERGY_CONDUIT' && obs.type !== 'VOID_GATE' && obs.type !== 'CHRONO_SPHERE' && obs.type !== 'PULSE_WAVE') {
          obs.isTriggered = true;
          engineRef.current.nearMissCount++;
          engineRef.current.sessionNearMisses++;
          
          // Perfect dodge threshold (even closer)
          const isPerfect = dist < 50;
          
          // Combo system
          const newCombo = engineRef.current.combo + (isPerfect ? 2 : 1);
          engineRef.current.combo = newCombo;
          
          // Difficulty multiplier affects the base combo multiplier
          const baseMultiplier = settings.multiplier;
          const comboMultiplier = Math.min(5, 1 + Math.floor(newCombo / 5) * 0.5);
          engineRef.current.multiplier = baseMultiplier * comboMultiplier;
          
          // Increase adaptive intensity based on difficulty settings
          const intensityGain = isPerfect ? settings.adaptiveRampUp * 2 : settings.adaptiveRampUp;
          engineRef.current.adaptiveIntensity = Math.min(3.5, engineRef.current.adaptiveIntensity + intensityGain);
          
          playSound(isPerfect ? 'boost' : 'nearMiss');
          createParticles(playerX + player.width, player.y + player.height / 2, isPerfect ? '#facc15' : '#fff', isPerfect ? 15 : 5);
          shakeRef.current = isPerfect ? 6 : 3; 

          // Visual text for near miss
          const textX = playerX + player.width + 10;
          const textY = player.y + player.height / 2;
          particlesRef.current.push({
            x: textX,
            y: textY,
            vx: 1,
            vy: -2,
            life: 50,
            color: isPerfect ? '#facc15' : '#fff',
            size: isPerfect ? 16 : 12,
            isText: true,
            text: isPerfect ? 'PERFECT DODGE!' : 'NEAR MISS!'
          } as any);
        }
      }

      if (isColliding) {
        if (isPowerup) {
          // Brief invincibility after collecting powerup to prevent immediate death from overlapping obstacles
          player.invincibilityTimer = 15; 
          
          if (obs.type === 'SHIELD') {
            player.shieldActive = true;
            player.shieldTimer = 400; // Slightly longer shield
            playSound('shield');
            createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#00f2ff', 30);
            return false;
          } else if (obs.type === 'ENERGY_CONDUIT') {
            engineRef.current.speed += 5;
            playSound('boost');
            createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#facc15', 30);
            return false;
          } else if (obs.type === 'VOID_GATE') {
            engineRef.current.distance += 2000; // More distance boost
            playSound('shield');
            createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#a855f7', 40);
            shakeRef.current = 20;
            obstaclesRef.current = obstaclesRef.current.filter(o => o.x > obs.x + 600 || o.type === 'SHIELD' || o.type === 'ENERGY_CONDUIT' || o.type === 'VOID_GATE' || o.type === 'CHRONO_SPHERE' || o.type === 'PULSE_WAVE');
            return false;
          } else if (obs.type === 'CHRONO_SPHERE') {
            timeScaleRef.current = 0.35; // Slower time
            timeScaleTimerRef.current = 400; // Longer duration
            playSound('well');
            createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#3b82f6', 30);
            return false;
          } else if (obs.type === 'PULSE_WAVE') {
            pulseActiveRef.current = true;
            pulseTimerRef.current = 150; // Longer pulse
            playSound('boost');
            createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#ffffff', 35);
            shakeRef.current = 15;
            return false;
          }
        } else if (!player.shieldActive && (!player.invincibilityTimer || player.invincibilityTimer <= 0)) {
          // Enhanced Hit Response: Impact Physics
          if (!player.hitTimer || player.hitTimer <= 0) {
            player.hitTimer = 25; // Impact frames
            
            // Calculate push direction
            const dx = (100 + player.width / 2) - (obs.x + obs.width / 2);
            const dy = (player.y + player.height / 2) - (obs.y + obs.height / 2);
            player.vy = dy * 0.15; // Push vertically away from center of obstacle
            
            shakeRef.current = 20;
            playSound('death');
            createParticles(playerX + player.width / 2, player.y + player.height / 2, '#ef4444', 20);
            
            // Slow down the game temporarily for impact feel
            timeScaleRef.current = 0.1;
            timeScaleTimerRef.current = 25;

            // Reset combo on death
            setGameState(prev => {
              const newIntensity = Math.max(0.6, prev.adaptiveIntensity - 0.25);
              adaptiveIntensityRef.current = newIntensity;
              return { ...prev, combo: 0, multiplier: 1, adaptiveIntensity: newIntensity };
            });
          }
          return false;
        } else {
          // Shield or invincibility is active, destroy obstacle with effect
          // Reset combo on shield break if it was a shield
          if (player.shieldActive) {
            setGameState(prev => {
              // Decrease adaptive intensity on shield break
              const newIntensity = Math.max(0.6, prev.adaptiveIntensity - 0.1);
              adaptiveIntensityRef.current = newIntensity;
              return { ...prev, combo: 0, multiplier: 1, adaptiveIntensity: newIntensity };
            });
          }
          createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, player.shieldActive ? '#00f2ff' : '#fff', 10);
          shakeRef.current = 5;
          return false;
        }
      }

      // Pulse wave clearing logic
      if (pulseActiveRef.current && obs.type !== 'SHIELD' && obs.type !== 'ENERGY_CONDUIT' && obs.type !== 'VOID_GATE' && obs.type !== 'CHRONO_SPHERE' && obs.type !== 'PULSE_WAVE') {
        const dx = (100 + player.width / 2) - (obs.x + obs.width / 2);
        const dy = (player.y + player.height / 2) - (obs.y + obs.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 300) {
          createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#ffffff', 5);
          return false;
        }
      }
      
      return obs.x > -200; 
    });

    // Decay speed boost
    const baseSpeed = DIFFICULTY_SETTINGS[gameState.difficulty].speed;
    if (gameState.speed > baseSpeed) {
      setGameState(prev => ({ ...prev, speed: Math.max(baseSpeed, prev.speed - 0.02) }));
    }

    // Update background objects
    const removedObjects: BackgroundObject[] = [];
    backgroundObjectsRef.current = backgroundObjectsRef.current.filter(obj => {
      obj.x -= obj.speedX * timeScaleRef.current * (gameState.speed / 5);
      obj.rotation += obj.rotationSpeed * timeScaleRef.current;
      if (obj.pulseSpeed) {
        obj.pulse = (obj.pulse || 0) + obj.pulseSpeed * timeScaleRef.current;
      }
      
      const isCelestialBody = ['SUN', 'PLANET', 'MOON'].includes(obj.type);
      
      if (obj.x < -obj.width - 200) {
        if (isCelestialBody) {
          // Respawn celestial bodies after a while in a different position
          // Move them far to the right to create a "reappear after a while" effect
          obj.x = CANVAS_WIDTH + 1000 + Math.random() * 3000;
          obj.y = Math.random() * CANVAS_HEIGHT;
          obj.rotation = Math.random() * Math.PI * 2;
          
          // Give them a new random speed and size for variety
          if (obj.type === 'PLANET') {
            obj.color = PLANET_COLORS[Math.floor(Math.random() * PLANET_COLORS.length)];
            obj.width = 30 + Math.random() * 50;
            obj.height = obj.width;
            obj.speedX = (0.6 + Math.random() * 0.4) * 0.8; // Layer 3 multiplier
          } else if (obj.type === 'SUN') {
            obj.width = 80 + Math.random() * 100;
            obj.height = obj.width;
            obj.speedX = (0.4 + Math.random() * 0.3) * 0.8;
          } else if (obj.type === 'MOON') {
            obj.width = 15 + Math.random() * 15;
            obj.height = obj.width;
            obj.speedX = (0.5 + Math.random() * 0.4) * 0.8;
          }
          return true;
        }
        removedObjects.push(obj);
        return false;
      }
      return true;
    });
    backgroundObjectPoolRef.current.push(...removedObjects);

    // Spawn background objects based on distance
    if (gameState.status === 'PLAYING' && gameState.distance - lastBackgroundSpawnDistanceRef.current > 80) {
      lastBackgroundSpawnDistanceRef.current = gameState.distance;
      
      // Randomly spawn in different layers
      if (Math.random() > 0.5) spawnBackgroundObject(1);
      if (Math.random() > 0.6) spawnBackgroundObject(2);
      if (Math.random() > 0.9) spawnBackgroundObject(3); // Less frequent planets/suns/moons
      if (Math.random() > 0.95) spawnBackgroundObject(4); // Very rare foreground dust
    }

    // Update particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      return p.life > 0;
    });

    // Particle Limit to prevent memory bloat on low-end devices
    if (particlesRef.current.length > 300) {
      particlesRef.current = particlesRef.current.slice(-300);
    }

    // Update shockwaves
    shockwavesRef.current = shockwavesRef.current.filter(s => {
      s.r += 6;
      s.alpha -= 0.025;
      return s.alpha > 0;
    });

    // Update distance and score
    if (gameState.status === 'PLAYING') {
      const currentDifficulty = DIFFICULTY_SETTINGS[gameState.difficulty];
      const speedIncrease = (currentDifficulty.speedIncrease || 0.0001) * timeScaleRef.current;
      const newSpeed = gameState.speed + speedIncrease;
      const distanceGain = (newSpeed / 60) * timeScaleRef.current;
      const scoreGain = distanceGain * gameState.multiplier;
      
      setGameState(prev => ({
        ...prev,
        speed: newSpeed,
        distance: prev.distance + distanceGain,
        score: prev.score + scoreGain,
      }));
    }

    if (shakeRef.current > 0) shakeRef.current *= 0.9;
  };

  // Update refs on every render
  useEffect(() => {
    updateRef.current = update;
    drawRef.current = draw;
  });

  function draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply screen shake
    if (shakeRef.current > 0.1) {
      const sx = (Math.random() - 0.5) * shakeRef.current;
      const sy = (Math.random() - 0.5) * shakeRef.current;
      ctx.translate(sx, sy);
    }

    // Draw background (parallax)
    // 0. Base background
    const bgGrad = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(0.6, '#020205');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const time = Date.now() * 0.001;

    // 0.5 Atmospheric Fog Layer (Subtle depth)
    const fogSpeed = 0.03;
    for (let i = 0; i < 4; i++) {
      const x = (i * 300 + backgroundXRef.current * fogSpeed) % (CANVAS_WIDTH + 600) - 300;
      const y = (Math.sin(i * 2 + time * 0.2) * 80) + CANVAS_HEIGHT / 2;
      const fogGrad = ctx.createRadialGradient(x, y, 0, x, y, 400);
      const fogColor = i % 2 === 0 ? 'rgba(20, 10, 45, 0.12)' : 'rgba(10, 25, 50, 0.1)';
      fogGrad.addColorStop(0, fogColor);
      fogGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = fogGrad;
      ctx.beginPath();
      ctx.arc(x, y, 400, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 1. Far background stars (twinkling)
    const starCount = isLowPerformance ? 50 : 150;
    for (let i = 0; i < starCount; i++) {
      const x = (Math.sin(i * 123.45) * 2000 + backgroundXRef.current * 0.05) % CANVAS_WIDTH;
      const y = (Math.cos(i * 678.9) * 2000) % CANVAS_HEIGHT;
      const twinkle = Math.sin(Date.now() * 0.002 + i) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.3})`;
      ctx.beginPath();
      ctx.arc(x < 0 ? x + CANVAS_WIDTH : x, y < 0 ? y + CANVAS_HEIGHT : y, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Dynamic Background Objects (Parallax Layers)
    const maxBgObjects = isLowPerformance ? 10 : 40;
    if (backgroundObjectsRef.current.length > maxBgObjects) {
      backgroundObjectsRef.current = backgroundObjectsRef.current.slice(-maxBgObjects);
    }

    [1, 2, 3, 4].forEach(layer => {
      backgroundObjectsRef.current.filter(obj => obj.layer === layer).forEach(obj => {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.rotation);
        ctx.globalAlpha = obj.opacity;

        const time = Date.now() / 1000;
        switch (obj.type) {
          case 'STAR_CLUSTER':
            const twinkle = Math.sin(time * (obj.pulseSpeed || 1) * 5 + obj.seed * 10) * 0.3 + 0.7;
            ctx.fillStyle = obj.color;
            ctx.globalAlpha = obj.opacity * twinkle;
            ctx.beginPath();
            ctx.arc(0, 0, obj.width / 2, 0, Math.PI * 2);
            ctx.fill();
            // Subtle glow for brighter stars
            if (obj.width > 3) {
              const starGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, obj.width);
              starGlow.addColorStop(0, obj.color);
              starGlow.addColorStop(1, 'transparent');
              ctx.fillStyle = starGlow;
              ctx.globalAlpha = obj.opacity * 0.3 * twinkle;
              ctx.beginPath();
              ctx.arc(0, 0, obj.width, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          case 'PLANET':
            // Atmosphere glow
            const atmoGrad = ctx.createRadialGradient(0, 0, obj.width / 2, 0, 0, obj.width / 2 + 5);
            atmoGrad.addColorStop(0, obj.color);
            atmoGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = atmoGrad;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, obj.width / 2 + 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Planet body
            const planetGrad = ctx.createRadialGradient(-obj.width/4, -obj.width/4, 0, 0, 0, obj.width/2);
            planetGrad.addColorStop(0, obj.color);
            planetGrad.addColorStop(0.8, obj.color);
            planetGrad.addColorStop(1, '#000');
            ctx.fillStyle = planetGrad;
            ctx.beginPath();
            ctx.arc(0, 0, obj.width / 2, 0, Math.PI * 2);
            ctx.fill();

            // Rings
            if (obj.hasRings) {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.ellipse(0, 0, obj.width * 0.9, obj.width * 0.2, Math.PI / 6, 0, Math.PI * 2);
              ctx.stroke();
            }
            break;
          case 'SUN':
            // Corona glow
            const coronaPulse = Math.sin(time * 2) * 0.05 + 1;
            const coronaGrad = ctx.createRadialGradient(0, 0, obj.width / 3, 0, 0, obj.width * 0.8 * coronaPulse);
            coronaGrad.addColorStop(0, obj.color);
            coronaGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = coronaGrad;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(0, 0, obj.width * 0.8 * coronaPulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Sun core
            const sunGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, obj.width / 2);
            sunGrad.addColorStop(0, '#fff');
            sunGrad.addColorStop(0.4, obj.color);
            sunGrad.addColorStop(1, obj.color);
            ctx.fillStyle = sunGrad;
            ctx.beginPath();
            ctx.arc(0, 0, obj.width / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'MOON':
            // Moon body
            ctx.fillStyle = obj.color;
            ctx.beginPath();
            ctx.arc(0, 0, obj.width / 2, 0, Math.PI * 2);
            ctx.fill();

            // Craters
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            for (let i = 0; i < 3; i++) {
              const cx = Math.sin(i * 10 + obj.seed) * (obj.width / 4);
              const cy = Math.cos(i * 10 + obj.seed) * (obj.width / 4);
              const cr = (obj.width / 8);
              ctx.beginPath();
              ctx.arc(cx, cy, cr, 0, Math.PI * 2);
              ctx.fill();
            }

            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(obj.width / 4, 0, obj.width / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'NEBULA':
            const nebulaGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, obj.width / 2);
            nebulaGrad.addColorStop(0, obj.color);
            nebulaGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = nebulaGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, obj.width / 2, obj.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'GALAXY':
            const galaxyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, obj.width / 2);
            galaxyGrad.addColorStop(0, obj.color);
            galaxyGrad.addColorStop(0.5, obj.color);
            galaxyGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = galaxyGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, obj.width / 2, obj.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Core
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'SPACE_DUST':
            ctx.fillStyle = obj.color;
            ctx.globalAlpha = obj.opacity;
            ctx.fillRect(0, 0, obj.width, obj.height);
            break;
        }
        ctx.restore();
      });
    });

    // 3. (Grid removed for minimal look)

    // 4. Warp Speed Lines (Only when moving fast)
    if (gameState.speed > 10) {
      ctx.lineWidth = 2;
      for (let i = 0; i < 15; i++) {
        const speed = 25 + Math.abs(Math.sin(i * 99)) * 40;
        const x = (backgroundXRef.current * speed + i * 300) % (CANVAS_WIDTH + 600) - 300;
        const y = (Math.abs(Math.cos(i * 77)) * (CANVAS_HEIGHT - 100)) + 50;
        const length = 200 + Math.abs(Math.sin(i)) * 300;
        
        const warpGrad = ctx.createLinearGradient(x, y, x + length, y);
        warpGrad.addColorStop(0, 'transparent');
        warpGrad.addColorStop(0.8, 'rgba(0, 255, 255, 0.1)');
        warpGrad.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = warpGrad;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + length, y);
        ctx.stroke();
      }
    }

    // Draw floor and ceiling with subtle glow
    const boundaryGrad = ctx.createLinearGradient(0, 0, 0, 40);
    boundaryGrad.addColorStop(0, 'rgba(10, 10, 20, 0.8)');
    boundaryGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = boundaryGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 40); // Top fade
    
    const bottomGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT - 40, 0, CANVAS_HEIGHT);
    bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bottomGrad.addColorStop(1, 'rgba(10, 10, 20, 0.8)');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40); // Bottom fade
    
    // Floor/Ceiling edge glow (very subtle)
    ctx.strokeStyle = `rgba(0, 242, 255, 0.1)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(CANVAS_WIDTH, 20);
    ctx.moveTo(0, CANVAS_HEIGHT - 20);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 20);
    ctx.stroke();

    // Draw Pulse Wave
    if (pulseActiveRef.current) {
      const pulseR = (180 - pulseTimerRef.current) * 2;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#fff';
      ctx.beginPath();
      const radius = Math.max(0.1, (180 - pulseTimerRef.current) * 2);
      ctx.arc(100 + playerRef.current.width / 2, playerRef.current.y + playerRef.current.height / 2, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw obstacles
    obstaclesRef.current.forEach(obs => {
      ctx.save();
      if (obs.type === 'BARRIER') {
        const time = Date.now();
        const pulse = Math.sin(time * 0.005 + obs.seed * 10) * 0.2 + 0.8;
        const scanPos = (time * 0.1) % obs.height;
        
        // 1. Main body with metallic gradient and panel lines
        const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.width, obs.y);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.2, '#1e293b');
        grad.addColorStop(0.5, '#334155');
        grad.addColorStop(0.8, '#1e293b');
        grad.addColorStop(1, '#0f172a');
        
        ctx.fillStyle = grad;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        
        // Panel lines (Mechanical detail)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 20; i < obs.height; i += 40) {
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y + i);
          ctx.lineTo(obs.x + obs.width, obs.y + i);
          ctx.stroke();
        }
        
        // 2. Glowing side panels (Emissive lighting)
        ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#facc15';
        ctx.fillRect(obs.x, obs.y, 3, obs.height);
        ctx.fillRect(obs.x + obs.width - 3, obs.y, 3, obs.height);
        
        // 3. Internal animated energy core (Subtle animation)
        ctx.shadowBlur = 0;
        const coreWidth = obs.width - 12;
        const coreX = obs.x + 6;
        
        // Energy background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(coreX, obs.y + 10, coreWidth, obs.height - 20);
        
        // Animated energy pulses
        ctx.strokeStyle = `rgba(250, 204, 21, ${0.3 * pulse})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const yOffset = (time * 0.02 + i * 20) % (obs.height - 20);
          ctx.beginPath();
          ctx.moveTo(coreX, obs.y + 10 + yOffset);
          ctx.lineTo(coreX + coreWidth, obs.y + 10 + yOffset);
          ctx.stroke();
        }
        
        // 4. Scanning beam (Subtle animation)
        const scanGrad = ctx.createLinearGradient(obs.x, obs.y + scanPos - 15, obs.x, obs.y + scanPos + 15);
        scanGrad.addColorStop(0, 'transparent');
        scanGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.6)');
        scanGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(obs.x, obs.y + scanPos - 15, obs.width, 30);
        
        // 4.5 Extra detail: Blinking warning lights
        if (Math.floor(time / 500) % 2 === 0) {
          ctx.fillStyle = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ef4444';
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y + 15, 3, 0, Math.PI * 2);
          ctx.arc(obs.x + obs.width / 2, obs.y + obs.height - 15, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        
        // 5. Warning stripes (Mechanical detail)
        ctx.save();
        ctx.beginPath();
        ctx.rect(obs.x, obs.y, obs.width, obs.height);
        ctx.clip();
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        for (let i = -20; i < obs.height + 20; i += 30) {
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y + i);
          ctx.lineTo(obs.x + obs.width, obs.y + i + 15);
          ctx.lineTo(obs.x + obs.width, obs.y + i + 25);
          ctx.lineTo(obs.x, obs.y + i + 10);
          ctx.fill();
        }
        ctx.restore();

        // 6. Mechanical Bolts (Mechanical detail)
        ctx.fillStyle = '#475569';
        const boltSize = 2;
        [5, obs.width - 5].forEach(bx => {
          for (let by = 5; by < obs.height; by += 20) {
            ctx.beginPath();
            ctx.arc(obs.x + bx, obs.y + by, boltSize, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // 7. Top and Bottom heavy caps
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        
        // Top cap
        ctx.fillRect(obs.x - 3, obs.y - 6, obs.width + 6, 12);
        ctx.strokeRect(obs.x - 3, obs.y - 6, obs.width + 6, 12);
        
        // Bottom cap
        ctx.fillRect(obs.x - 3, obs.y + obs.height - 6, obs.width + 6, 12);
        ctx.strokeRect(obs.x - 3, obs.y + obs.height - 6, obs.width + 6, 12);
      } else if (obs.type === 'DRONE') {
        const time = Date.now();
        const eyePulse = Math.abs(Math.sin(time * 0.01 + obs.seed * 5)) * 0.5 + 0.5;
        const hoverOffset = Math.sin(time * 0.005 + obs.seed * 10) * 8;
        
        ctx.save();
        ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2 + hoverOffset);
        
        // Drone body (Layered mechanical look)
        const bodyGrad = ctx.createLinearGradient(-obs.width/2, 0, obs.width/2, 0);
        bodyGrad.addColorStop(0, '#0f172a');
        bodyGrad.addColorStop(0.5, '#1e293b');
        bodyGrad.addColorStop(1, '#0f172a');
        
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        
        // Main Chassis
        ctx.beginPath();
        ctx.roundRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height, 4);
        ctx.fill();
        ctx.stroke();

        // Mechanical Vents
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        for(let i = -15; i <= 15; i += 10) {
          ctx.fillRect(i - 2, -obs.height/2 + 4, 4, obs.height - 8);
        }

        // Spinning blades (Improved motion blur)
        const bladeAngle = time * 0.03;
        for (let i = 0; i < 2; i++) {
          const by = i === 0 ? -obs.height / 2 - 2 : obs.height / 2 + 2;
          ctx.save();
          ctx.translate(0, by);
          ctx.rotate(bladeAngle);
          
          // Blade blur
          const blurGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 20);
          blurGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          blurGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = blurGrad;
          ctx.beginPath();
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
          ctx.fill();
          
          // Solid blade
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(18, 0);
          ctx.stroke();
          ctx.restore();
        }
        
        // Glowing eye (Searchlight effect)
        const eyeX = obs.width * 0.25;
        const beamGrad = ctx.createRadialGradient(eyeX, 0, 0, eyeX, 0, 40);
        beamGrad.addColorStop(0, `rgba(239, 68, 68, ${0.4 * eyePulse})`);
        beamGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(eyeX, 0);
        ctx.arc(eyeX, 0, 40, -0.5, 0.5);
        ctx.fill();

        ctx.fillStyle = `rgba(239, 68, 68, ${0.6 + eyePulse * 0.4})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ef4444';
        ctx.beginPath();
        ctx.arc(eyeX, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Thruster (Dynamic flame)
        const thrusterPulse = Math.abs(Math.sin(time * 0.02)) * 0.5 + 0.5;
        const flameLen = 15 + thrusterPulse * 20;
        const flameGrad = ctx.createLinearGradient(-obs.width / 2, 0, -obs.width / 2 - flameLen, 0);
        flameGrad.addColorStop(0, '#00ffff');
        flameGrad.addColorStop(0.4, 'rgba(0, 255, 255, 0.8)');
        flameGrad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = flameGrad;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(-obs.width / 2, -6);
        ctx.lineTo(-obs.width / 2 - flameLen, 0);
        ctx.lineTo(-obs.width / 2, 6);
        ctx.fill();

        // Thruster particles
        if (Math.random() > 0.5) {
          const pSize = Math.random() * 3;
          ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
          ctx.fillRect(-obs.width / 2 - flameLen * Math.random(), (Math.random() - 0.5) * 10, pSize, pSize);
        }
        
        ctx.restore();
      } else if (obs.type === 'ROTATING_BLADE') {
        ctx.save();
        ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
        ctx.rotate(obs.angle || 0);
        
        const time = Date.now();
        const pulse = Math.sin(time * 0.01) * 0.3 + 0.7;
        
        // 1. Motion blur trail (Improved arc)
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(0, 0, obs.width / 2 - 5, -1.5, 0);
        ctx.stroke();

        // 2. Hub Gear Mechanism (Mechanical detail)
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        
        // Outer hub ring
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Gear teeth on hub
        ctx.save();
        for (let i = 0; i < 12; i++) {
          ctx.rotate(Math.PI / 6);
          ctx.fillRect(16, -2, 4, 4);
        }
        ctx.restore();

        // 3. Hub core (Glowing / Emissive)
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
        coreGrad.addColorStop(0, '#fff');
        coreGrad.addColorStop(0.4, '#06b6d4');
        coreGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = coreGrad;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#06b6d4';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // 4. Blades (Enhanced design with emissive edges)
        const bladeCount = 6;
        for (let i = 0; i < bladeCount; i++) {
          ctx.save();
          ctx.rotate((Math.PI * 2 / bladeCount) * i);
          
          // Blade arm (Mechanical detail)
          const armGrad = ctx.createLinearGradient(10, 0, obs.width / 2 - 5, 0);
          armGrad.addColorStop(0, '#334155');
          armGrad.addColorStop(1, '#1e293b');
          ctx.fillStyle = armGrad;
          ctx.fillRect(10, -3, obs.width / 2 - 15, 6);

          // Glowing edge (Emissive)
          ctx.strokeStyle = `rgba(6, 182, 212, ${pulse})`;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#06b6d4';
          ctx.beginPath();
          ctx.moveTo(obs.width / 2 - 15, -3);
          ctx.lineTo(obs.width / 2 - 5, 0);
          ctx.lineTo(obs.width / 2 - 15, 3);
          ctx.stroke();
          ctx.shadowBlur = 0;
          
          ctx.restore();
        }
        ctx.restore();
      } else if (obs.type === 'HOMING_MISSILE' && obs.x > CANVAS_WIDTH) {
        // Warning for incoming missile
        const alpha = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        ctx.save();
        ctx.translate(CANVAS_WIDTH - 40, obs.y + obs.height / 2);
        
        // Warning icon
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(10, 0);
        ctx.lineTo(0, 10);
        ctx.lineTo(-10, 0);
        ctx.closePath();
        ctx.fill();
        
        // Warning text
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('INCOMING', -15, 3);
        
        ctx.restore();
      } else if (obs.type === 'LASER') {
        if (obs.warningTime && obs.warningTime > 0) {
          // Improved Warning indicator (Charging effect)
          const chargeProgress = 1 - (obs.warningTime / 60);
          
          // Pulse frequency increases as it charges
          const pulseFreq = 0.03 + chargeProgress * 0.15;
          const alpha = Math.sin(Date.now() * pulseFreq) * 0.4 + 0.6;
          
          // Charging beam (thin pulsing line that gets thicker and brighter)
          ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
          ctx.lineWidth = 1 + chargeProgress * 5;
          ctx.shadowBlur = 5 + chargeProgress * 15;
          ctx.shadowColor = '#ff0000';
          
          ctx.beginPath();
          ctx.moveTo(0, obs.y + obs.height / 2);
          ctx.lineTo(CANVAS_WIDTH, obs.y + obs.height / 2);
          ctx.stroke();
          
          // Scanning particles (more frequent as it charges)
          if (Math.random() > 0.7 - chargeProgress * 0.5) {
            const sparkX = Math.random() * CANVAS_WIDTH;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(sparkX, obs.y + obs.height / 2 - 1, 6, 2);
          }

          // High-tech Warning UI
          ctx.save();
          ctx.translate(CANVAS_WIDTH - 180, obs.y + obs.height / 2);
          
          // Warning box
          ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.3})`;
          ctx.fillRect(0, -25, 160, 20);
          ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(0, -25, 160, 20);
          
          // Warning text (flashes faster)
          const textAlpha = Math.sin(Date.now() * pulseFreq * 2) > 0 ? 1 : 0.3;
          ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.fillText('CRITICAL: LASER CHARGING', 10, -11);
          
          // Charge bar
          ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
          ctx.fillRect(0, -5, 160, 4);
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(0, -5, 160 * chargeProgress, 4);
          
          ctx.restore();
        } else {
          // Active laser beam
          const time = Date.now();
          const flicker = Math.random() * 0.2 + 0.8;
          const beamWidth = obs.width * flicker;
          
          // Source glow (Top and Bottom)
          const sourceGlow = ctx.createRadialGradient(obs.x + obs.width / 2, obs.y, 0, obs.x + obs.width / 2, obs.y, 20);
          sourceGlow.addColorStop(0, '#fff');
          sourceGlow.addColorStop(0.5, 'rgba(255, 0, 0, 0.5)');
          sourceGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = sourceGlow;
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y, 15, 0, Math.PI * 2);
          ctx.fill();
          
          const sourceGlowBottom = ctx.createRadialGradient(obs.x + obs.width / 2, obs.y + obs.height, 0, obs.x + obs.width / 2, obs.y + obs.height, 20);
          sourceGlowBottom.addColorStop(0, '#fff');
          sourceGlowBottom.addColorStop(0.5, 'rgba(255, 0, 0, 0.5)');
          sourceGlowBottom.addColorStop(1, 'transparent');
          ctx.fillStyle = sourceGlowBottom;
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y + obs.height, 15, 0, Math.PI * 2);
          ctx.fill();
          
          const beamGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x + beamWidth, obs.y);
          beamGrad.addColorStop(0, 'rgba(255, 0, 0, 0.2)');
          beamGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
          beamGrad.addColorStop(1, 'rgba(255, 0, 0, 0.2)');
          
          ctx.fillStyle = beamGrad;
          ctx.shadowBlur = 30;
          ctx.shadowColor = '#ff0000';
          
          // Main beam with flicker
          ctx.fillRect(obs.x, obs.y, beamWidth, obs.height);
          
          // Core beam (Plasma effect)
          ctx.fillStyle = '#fff';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#fff';
          ctx.fillRect(obs.x + beamWidth / 2 - 1.5, obs.y, 3, obs.height);

          // Plasma sparks traveling along the beam
          const sparkCount = 5;
          for (let i = 0; i < sparkCount; i++) {
            const sparkY = (time * 0.5 + i * (obs.height / sparkCount)) % obs.height;
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 10;
            ctx.fillRect(obs.x + beamWidth / 2 - 2, obs.y + sparkY, 4, 10);
          }
          ctx.shadowBlur = 0;
          for(let i = 0; i < beamWidth; i += 20) {
            const arcY = (Math.random() - 0.5) * obs.height;
            ctx.lineTo(obs.x + i, obs.y + obs.height / 2 + arcY);
          }
          ctx.stroke();

          // Particle sparks at the front
          if (Math.random() > 0.5) {
            createParticles(obs.x, obs.y + obs.height / 2, '#ff0000', 1);
          }
        }
      } else if (obs.type === 'SHIELD') {
        const pulse = Math.sin(Date.now() * 0.01) * 5;
        const shieldGrad = ctx.createRadialGradient(
          obs.x + obs.width / 2, obs.y + obs.height / 2, 0,
          obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2 + pulse
        );
        shieldGrad.addColorStop(0, '#fff');
        shieldGrad.addColorStop(0.4, '#00f2ff');
        shieldGrad.addColorStop(1, 'rgba(0, 242, 255, 0)');
        
        ctx.fillStyle = shieldGrad;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00f2ff';
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2 + pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Hexagonal pattern overlay
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI * 2) / 6;
          ctx.moveTo(obs.x + obs.width / 2, obs.y + obs.height / 2);
          ctx.lineTo(
            obs.x + obs.width / 2 + Math.cos(angle) * (obs.width / 2 + pulse),
            obs.y + obs.height / 2 + Math.sin(angle) * (obs.width / 2 + pulse)
          );
        }
        ctx.stroke();
        
        // Floating shards
        for (let i = 0; i < 3; i++) {
          const shardAngle = Date.now() * 0.002 + (i * Math.PI * 2) / 3;
          const shardDist = obs.width / 2 + 10 + Math.sin(Date.now() * 0.005) * 5;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(
            obs.x + obs.width / 2 + Math.cos(shardAngle) * shardDist,
            obs.y + obs.height / 2 + Math.sin(shardAngle) * shardDist,
            2, 0, Math.PI * 2
          );
          ctx.fill();
        }
        
        // Inner icon (Shield shape)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obs.x + obs.width / 2, obs.y + obs.height * 0.3);
        ctx.lineTo(obs.x + obs.width * 0.7, obs.y + obs.height * 0.4);
        ctx.lineTo(obs.x + obs.width * 0.7, obs.y + obs.height * 0.6);
        ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height * 0.8);
        ctx.lineTo(obs.x + obs.width * 0.3, obs.y + obs.height * 0.6);
        ctx.lineTo(obs.x + obs.width * 0.3, obs.y + obs.height * 0.4);
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (obs.type === 'PENDULUM') {
        const pivotY = obs.y < CANVAS_HEIGHT / 2 ? 20 : CANVAS_HEIGHT - 20;
        ctx.save();
        ctx.translate(obs.x + obs.width / 2, pivotY);
        ctx.rotate(obs.angle || 0);
        
        // Chain (Mechanical links)
        const linkCount = 8;
        const totalLen = obs.y < CANVAS_HEIGHT / 2 ? obs.height : -obs.height;
        const linkLen = totalLen / linkCount;
        
        ctx.strokeStyle = '#64748b';
        ctx.fillStyle = '#475569';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < linkCount; i++) {
          const y = i * linkLen;
          ctx.strokeRect(-3, y, 6, linkLen);
          ctx.fillRect(-2, y + 2, 4, linkLen - 4);
          
          // Joint
          ctx.beginPath();
          ctx.arc(0, y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        
        // Blade
        const bladeY = totalLen;
        ctx.translate(0, bladeY);
        
        const bladeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, obs.width);
        bladeGrad.addColorStop(0, '#ef4444');
        bladeGrad.addColorStop(0.6, '#b91c1c');
        bladeGrad.addColorStop(1, '#7f1d1d');
        
        ctx.fillStyle = bladeGrad;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ef4444';
        
        ctx.beginPath();
        ctx.arc(0, 0, obs.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Glowing edge
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.sin(Date.now() * 0.02) * 0.3 + 0.7})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, obs.width / 2 - 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Mechanical hub
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
        ctx.shadowBlur = 0;
      } else if (obs.type === 'HOMING_MISSILE') {
        ctx.save();
        ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
        
        // Fire
        const fireSize = 10 + Math.random() * 10;
        const fireGrad = ctx.createRadialGradient(-obs.width / 2, 0, 0, -obs.width / 2, 0, fireSize);
        fireGrad.addColorStop(0, '#fff');
        fireGrad.addColorStop(0.5, '#f97316');
        fireGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(-obs.width / 2, 0, fireSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = '#475569';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
        
        // Mechanical details on missile
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-obs.width / 4, -obs.height / 2, 2, obs.height);
        ctx.fillRect(obs.width / 8, -obs.height / 2, 2, obs.height);

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(obs.width / 2, -obs.height / 2);
        ctx.lineTo(obs.width / 2 + 15, 0);
        ctx.lineTo(obs.width / 2, obs.height / 2);
        ctx.closePath();
        ctx.fill();

        // Blinking nose light
        if (Math.floor(Date.now() / 200) % 2 === 0) {
          ctx.fillStyle = '#fff';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#fff';
          ctx.beginPath();
          ctx.arc(obs.width / 2 + 5, 0, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.restore();
      } else if (obs.type === 'GRAVITY_WELL' || obs.type === 'BLACK_HOLE') {
        const centerX = obs.x + obs.width / 2;
        const centerY = obs.y + obs.height / 2;
        const pulse = Math.sin(Date.now() * 0.01) * 8;
        const baseRadius = obs.width / 2;
        
        // 1. Outer Glow / Atmosphere
        const glowGrad = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, baseRadius * 1.5 + pulse);
        if (obs.type === 'BLACK_HOLE') {
          glowGrad.addColorStop(0, 'rgba(255, 0, 255, 0.2)');
          glowGrad.addColorStop(0.5, 'rgba(128, 0, 128, 0.1)');
          glowGrad.addColorStop(1, 'transparent');
        } else {
          glowGrad.addColorStop(0, 'rgba(0, 242, 255, 0.2)');
          glowGrad.addColorStop(0.5, 'rgba(0, 100, 200, 0.1)');
          glowGrad.addColorStop(1, 'transparent');
        }
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 1.5 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // 2. Core Singularity
        const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius + pulse);
        if (obs.type === 'BLACK_HOLE') {
          coreGrad.addColorStop(0, '#000');
          coreGrad.addColorStop(0.4, '#000');
          coreGrad.addColorStop(0.7, '#ff00ff');
          coreGrad.addColorStop(1, 'transparent');
        } else {
          coreGrad.addColorStop(0, '#000');
          coreGrad.addColorStop(0.4, '#000');
          coreGrad.addColorStop(0.8, '#00f2ff');
          coreGrad.addColorStop(1, 'transparent');
        }
        
        ctx.fillStyle = coreGrad;
        ctx.shadowBlur = obs.type === 'BLACK_HOLE' ? 40 : 25;
        ctx.shadowColor = obs.type === 'BLACK_HOLE' ? '#ff00ff' : '#00f2ff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // 3. Swirling Accretion Disk (Rotating Arcs)
        const rotation = Date.now() * (obs.type === 'BLACK_HOLE' ? 0.005 : 0.003);
        ctx.strokeStyle = obs.type === 'BLACK_HOLE' ? 'rgba(255, 0, 255, 0.6)' : 'rgba(0, 242, 255, 0.6)';
        ctx.lineWidth = obs.type === 'BLACK_HOLE' ? 3 : 2;
        
        const numRings = obs.type === 'BLACK_HOLE' ? 6 : 4;
        for (let i = 0; i < numRings; i++) {
          const r = (baseRadius * 0.4) + (i * (baseRadius * 0.2)) + (Math.sin(Date.now() * 0.002 + i) * 5);
          const startAngle = rotation + i * (Math.PI / 2);
          const endAngle = startAngle + Math.PI * 0.8;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, r, startAngle, endAngle);
          ctx.stroke();
        }

        // 4. Energy Sparks / Accretion Particles
        if (Math.random() > 0.5) {
          const angle = Math.random() * Math.PI * 2;
          const dist = baseRadius * (0.8 + Math.random() * 0.7);
          const sx = centerX + Math.cos(angle) * dist;
          const sy = centerY + Math.sin(angle) * dist;
          ctx.fillStyle = obs.type === 'BLACK_HOLE' ? '#ff00ff' : '#00f2ff';
          ctx.fillRect(sx, sy, 2, 2);
        }
      } else if (obs.type === 'VOID_GATE') {
        const centerX = obs.x + obs.width / 2;
        const centerY = obs.y + obs.height / 2;
        const rotation = Date.now() * 0.005;
        const pulse = Math.sin(Date.now() * 0.01) * 8;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Background nebula glow
        const nebulaGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, obs.width * 0.8 + pulse);
        nebulaGrad.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
        nebulaGrad.addColorStop(0.6, 'rgba(88, 28, 135, 0.2)');
        nebulaGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = nebulaGrad;
        ctx.beginPath();
        ctx.arc(0, 0, obs.width * 0.8 + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(rotation);
        
        // Outer glowing rings with varying thickness and color
        for (let i = 0; i < 4; i++) {
          const r = (obs.width / 2) + i * 6 + pulse;
          const alpha = 1 - (i * 0.2);
          ctx.strokeStyle = i % 2 === 0 ? `rgba(168, 85, 247, ${alpha})` : `rgba(216, 180, 254, ${alpha})`;
          ctx.lineWidth = 2 + i;
          ctx.shadowBlur = 15 + i * 5;
          ctx.shadowColor = '#a855f7';
          
          ctx.beginPath();
          const startAngle = rotation * (i + 1) * 0.5;
          ctx.arc(0, 0, r, startAngle, startAngle + Math.PI * 1.5);
          ctx.stroke();
        }
        
        // Swirling core with star-like points
        const coreRotation = Date.now() * -0.008;
        ctx.rotate(coreRotation);
        
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, obs.width / 3 + pulse);
        coreGrad.addColorStop(0, '#fff');
        coreGrad.addColorStop(0.3, '#d8b4fe');
        coreGrad.addColorStop(0.7, '#a855f7');
        coreGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = coreGrad;
        
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI * 2) / 12;
          const r = (i % 2 === 0 ? obs.width / 3 : obs.width / 5) + pulse;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Extra swirling arcs in the core
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, (obs.width / 4) * (i + 1) / 3, time * 0.01 + i, time * 0.01 + i + Math.PI);
          ctx.stroke();
        }
        
        // Center singularity (Dark hole)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, 0, 5 + pulse * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Floating energy particles
        for (let i = 0; i < 5; i++) {
          const pAngle = (Date.now() * 0.002 + i * Math.PI * 0.4) % (Math.PI * 2);
          const pDist = obs.width / 2 + Math.sin(Date.now() * 0.005 + i) * 10;
          const px = Math.cos(pAngle) * pDist;
          const py = Math.sin(pAngle) * pDist;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      } else if (obs.type === 'NEBULA_STORM') {
        const centerX = obs.x + obs.width / 2;
        const centerY = obs.y + obs.height / 2;
        const time = Date.now();
        const pulse = Math.sin(time * 0.005) * 12;
        
        // Layered nebula effect
        for (let i = 0; i < 3; i++) {
          const r = (obs.width / 2 + pulse) * (1 - i * 0.2);
          const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, r);
          grad.addColorStop(0, i === 0 ? 'rgba(168, 85, 247, 0.4)' : 'rgba(6, 182, 212, 0.2)');
          grad.addColorStop(1, 'transparent');
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Internal lightning (More frequent and detailed)
        if (Math.random() > 0.7) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#fff';
          ctx.beginPath();
          let lx = centerX + (Math.random() - 0.5) * 60;
          let ly = centerY + (Math.random() - 0.5) * 60;
          ctx.moveTo(lx, ly);
          for (let j = 0; j < 4; j++) {
            lx += (Math.random() - 0.5) * 40;
            ly += (Math.random() - 0.5) * 40;
            ctx.lineTo(lx, ly);
          }
          ctx.stroke();
        }
      } else if (obs.type === 'CHRONO_SPHERE') {
        const centerX = obs.x + obs.width / 2;
        const centerY = obs.y + obs.height / 2;
        const pulse = Math.sin(Date.now() * 0.01) * 5;
        
        // Time distortion ripples
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const r = (obs.width / 2 + pulse + i * 10) % 50;
          ctx.beginPath();
          ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, obs.width / 2 + pulse);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.5, '#3b82f6');
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#3b82f6';
        ctx.beginPath();
        ctx.arc(centerX, centerY, obs.width / 2 + pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Clock hands effect (Mechanical)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        const angle = Date.now() * 0.005;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * 15, centerY + Math.sin(angle) * 15);
        ctx.stroke();
        
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle * 0.5) * 10, centerY + Math.sin(angle * 0.5) * 10);
        ctx.stroke();
        
        // Center pin
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (obs.type === 'PULSE_WAVE') {
        const centerX = obs.x + obs.width / 2;
        const centerY = obs.y + obs.height / 2;
        const pulse = Math.sin(Date.now() * 0.02) * 8;
        
        // Core glow
        const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, obs.width / 2);
        coreGrad.addColorStop(0, '#fff');
        coreGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)');
        coreGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, obs.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fff';
        
        for (let i = 0; i < 3; i++) {
          const radius = (obs.width / 2 - i * 10) + pulse;
          if (radius > 0) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.shadowBlur = 0;
      } else if (obs.type === 'ENERGY_CONDUIT') {
        const pulse = Math.sin(Date.now() * 0.01) * 5;
        const centerX = obs.x + obs.width / 2;
        const centerY = obs.y + obs.height / 2;
        
        const conduitGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, obs.width / 2 + pulse);
        conduitGrad.addColorStop(0, '#fff');
        conduitGrad.addColorStop(0.4, '#facc15');
        conduitGrad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = conduitGrad;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#facc15';
        ctx.beginPath();
        ctx.arc(centerX, centerY, obs.width / 2 + pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Branching lightning effect
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';
        
        for (let i = 0; i < 4; i++) {
          let curX = centerX;
          let curY = centerY;
          const targetAngle = (i * Math.PI * 2) / 4 + Date.now() * 0.01;
          const r = obs.width / 2 + pulse + 5;
          
          ctx.beginPath();
          ctx.moveTo(curX, curY);
          
          const segments = 4;
          for (let j = 0; j < segments; j++) {
            const segR = (r / segments) * (j + 1);
            const jitter = (Math.random() - 0.5) * 15;
            const nextX = centerX + Math.cos(targetAngle) * segR + jitter;
            const nextY = centerY + Math.sin(targetAngle) * segR + jitter;
            ctx.lineTo(nextX, nextY);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else {
        const time = Date.now();
        const pulse = Math.sin(time * 0.01 + obs.seed * 10) * 0.2 + 0.8;
        
        // Spike Base (Mechanical mount)
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        if (obs.type === 'FLOOR_SPIKE') {
          ctx.fillRect(obs.x - 5, obs.y + obs.height - 8, obs.width + 10, 12);
          ctx.strokeRect(obs.x - 5, obs.y + obs.height - 8, obs.width + 10, 12);
          
          // Bolts
          ctx.fillStyle = '#475569';
          ctx.fillRect(obs.x - 2, obs.y + obs.height - 5, 4, 4);
          ctx.fillRect(obs.x + obs.width - 2, obs.y + obs.height - 5, 4, 4);
        } else {
          ctx.fillRect(obs.x - 5, obs.y - 4, obs.width + 10, 12);
          ctx.strokeRect(obs.x - 5, obs.y - 4, obs.width + 10, 12);
          
          // Bolts
          ctx.fillStyle = '#475569';
          ctx.fillRect(obs.x - 2, obs.y, 4, 4);
          ctx.fillRect(obs.x + obs.width - 2, obs.y, 4, 4);
        }

        const spikeGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
        if (obs.type === 'FLOOR_SPIKE') {
          spikeGrad.addColorStop(0, '#ef4444');
          spikeGrad.addColorStop(0.5, '#b91c1c');
          spikeGrad.addColorStop(1, '#1e293b'); // Blend into base
        } else {
          spikeGrad.addColorStop(0, '#1e293b'); // Blend into base
          spikeGrad.addColorStop(0.5, '#b91c1c');
          spikeGrad.addColorStop(1, '#ef4444');
        }
        
        ctx.fillStyle = spikeGrad;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ef4444';
        
        // Main Spike Shape
        ctx.beginPath();
        if (obs.type === 'FLOOR_SPIKE') {
          ctx.moveTo(obs.x, obs.y + obs.height - 8);
          ctx.lineTo(obs.x + obs.width / 2, obs.y);
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height - 8);
        } else {
          ctx.moveTo(obs.x, obs.y + 8);
          ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
          ctx.lineTo(obs.x + obs.width, obs.y + 8);
        }
        ctx.closePath();
        ctx.fill();

        // Heat glow at base
        const heatGrad = ctx.createRadialGradient(
          obs.x + obs.width / 2, 
          obs.type === 'FLOOR_SPIKE' ? obs.y + obs.height : obs.y,
          0,
          obs.x + obs.width / 2,
          obs.type === 'FLOOR_SPIKE' ? obs.y + obs.height : obs.y,
          20
        );
        heatGrad.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        heatGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = heatGrad;
        ctx.beginPath();
        if (obs.type === 'FLOOR_SPIKE') {
          ctx.arc(obs.x + obs.width / 2, obs.y + obs.height, 20, Math.PI, 0);
        } else {
          ctx.arc(obs.x + obs.width / 2, obs.y, 20, 0, Math.PI);
        }
        ctx.fill();

        // Energy Core (Glowing line)
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';
        ctx.beginPath();
        if (obs.type === 'FLOOR_SPIKE') {
          ctx.moveTo(obs.x + obs.width / 2, obs.y + obs.height - 8);
          ctx.lineTo(obs.x + obs.width / 2, obs.y + 5);
        } else {
          ctx.moveTo(obs.x + obs.width / 2, obs.y + 8);
          ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height - 5);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Heat particles at tip
        if (Math.random() > 0.8) {
          const tipX = obs.x + obs.width / 2;
          const tipY = obs.type === 'FLOOR_SPIKE' ? obs.y : obs.y + obs.height;
          particlesRef.current.push({
            x: tipX,
            y: tipY,
            vx: (Math.random() - 0.5) * 2,
            vy: obs.type === 'FLOOR_SPIKE' ? -Math.random() * 3 : Math.random() * 3,
            life: 0.5,
            color: '#ef4444'
          });
        }
      }
      ctx.restore();
      ctx.shadowBlur = 0;
    });

    // Draw player
    const player = playerRef.current;
    const char = gameState.selectedCharacter;
    ctx.save();
    
    // Apply idle bobbing and squash/stretch
    const drawX = player.x !== undefined ? player.x : 100;
    const drawY = player.y + (player.isMoving ? 0 : player.idleOffset);
    ctx.translate(drawX + player.width / 2, drawY + player.height / 2);
    
    // Combine base rotation with dynamic leaning physics
    const leanRotation = (player.leanAmount * 180) / Math.PI;
    ctx.rotate(((player.rotation + leanRotation) * Math.PI) / 180);
    
    ctx.scale(player.squashX, player.squashY);
    
    // Player body
    const isInvincible = (player.invincibilityTimer && player.invincibilityTimer > 0);
    const isHit = (player.hitTimer && player.hitTimer > 0);
    const isGrazing = (player.grazeTimer && player.grazeTimer > 0);
    
    // Flicker on invincibility or hit
    const flicker = (isInvincible || isHit) ? (Math.floor(Date.now() / 50) % 2 === 0) : true;
    
    if (flicker) {
      const glowPulse = player.isMoving ? 20 : 20 + Math.sin(Date.now() * 0.01) * 5;
      
      // Change color on hit or graze
      let bodyColor = char.color;
      if (isHit) bodyColor = '#ef4444';
      else if (isGrazing) bodyColor = '#fff';
      
      ctx.fillStyle = bodyColor;
      ctx.shadowBlur = glowPulse + (isGrazing ? 10 : 0);
      ctx.shadowColor = bodyColor;
      ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
      
      // Graze sparks overlay
      if (isGrazing) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.strokeRect(-player.width / 2 - 2, -player.height / 2 - 2, player.width + 4, player.height + 4);
      }
      
      // Inner detail
      ctx.strokeStyle = isHit ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-player.width / 2 + 4, -player.height / 2 + 4, player.width - 8, player.height - 8);
      
      // Player eye
      ctx.fillStyle = isHit ? '#000' : char.eyeColor;
      // Eye reacts to movement/hit
      const eyeSize = isHit ? 12 : 10;
      ctx.fillRect(5, -10, eyeSize, eyeSize);
    }
    
    ctx.restore();

    // Draw active shield around player
    if (player.shieldActive) {
      ctx.save();
      const shieldPulse = Math.sin(Date.now() * 0.02) * 5;
      const shieldAlpha = player.shieldTimer < 60 ? (player.shieldTimer % 10 < 5 ? 0.2 : 0.5) : 0.4;
      
      ctx.translate(drawX + player.width / 2, drawY + player.height / 2);
      ctx.strokeStyle = `rgba(0, 242, 255, ${shieldAlpha})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f2ff';
      
      // Hexagon shield
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const r = player.width * 0.9 + shieldPulse;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      
      // Inner glow
      ctx.fillStyle = `rgba(0, 242, 255, ${shieldAlpha * 0.3})`;
      ctx.fill();
      
      ctx.restore();

      // Shield Timer UI (In-game)
      ctx.save();
      ctx.translate(drawX + player.width / 2 - 25, drawY - 30);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, 50, 4);
      ctx.fillStyle = '#00f2ff';
      ctx.fillRect(0, 0, 50 * (player.shieldTimer / 300), 4);
      ctx.restore();
    }
    
    ctx.shadowBlur = 0;

    // Draw particles
    const maxParticles = isLowPerformance ? 30 : 150;
    if (particlesRef.current.length > maxParticles) {
      particlesRef.current = particlesRef.current.slice(-maxParticles);
    }

    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      
      if ((p as any).isText) {
        ctx.font = `bold ${(p as any).size || 10}px "JetBrains Mono", monospace`;
        ctx.fillText((p as any).text, p.x, p.y);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw shockwaves
    shockwavesRef.current.forEach(s => {
      if (s.r < 0) return; // Don't draw if radius is negative (delayed start)
      ctx.globalAlpha = s.alpha;
      ctx.strokeStyle = char.color;
      ctx.lineWidth = 2;
      
      // Outer glow for shockwave
      ctx.shadowBlur = 10;
      ctx.shadowColor = char.color;
      
      ctx.beginPath();
      // Side-scroller perspective: elliptical shockwave looks better
      ctx.ellipse(s.x, s.y, s.r * 1.5, s.r * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // Inner dashed ring for digital feel
      ctx.setLineDash([5, 10]);
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r * 1.2, s.r * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;

    // Reset transform after shake or any other transforms
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  const gameLoop = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Performance monitoring
      const now = performance.now();
      frameTimesRef.current.push(now);
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
        const fps = 1000 / ((frameTimesRef.current[59] - frameTimesRef.current[0]) / 60);
        if (fps < 45 && !isLowPerformance) setIsLowPerformance(true);
        else if (fps > 55 && isLowPerformance) setIsLowPerformance(false);
      }

      updateRef.current(time);
      
      ctx.save();
      ctx.scale(canvas.width / CANVAS_WIDTH, canvas.height / CANVAS_HEIGHT);
      drawRef.current(ctx);
      ctx.restore();
    }
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [isLowPerformance]); // Stable game loop

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameLoop]);

  // Responsive Canvas Scaling
  useEffect(() => {
    const container = canvasRef.current?.parentElement;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      pixelRatioRef.current = dpr;
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-950 overflow-hidden font-sans select-none touch-none" 
         onClick={handleFlip}>
      {/* Immersive Overlays */}
      <AnimatePresence>
        {isPortrait && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="portrait-warning"
          >
            <RotateCw className="rotate-icon text-white" />
            <h2 className="text-2xl font-display font-bold text-white mb-2 uppercase tracking-tighter">Landscape Mode Required</h2>
            <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase max-w-[240px]">Please rotate your device to play</p>
          </motion.div>
        )}

        {!isFullscreen && gameState.status === 'MENU' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="mb-8">
              <Maximize size={64} className="text-white mb-4 mx-auto animate-pulse" />
              <h2 className="text-3xl font-display font-bold text-white mb-2 uppercase tracking-tighter">Immersive Mode</h2>
              <p className="text-zinc-400 font-mono text-xs tracking-widest uppercase max-w-[300px]">Tap below to enter full-screen landscape mode for the best experience</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                requestFullscreen();
              }}
              className="bg-white text-black px-10 py-5 rounded-2xl font-bold text-xl flex items-center gap-3 hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95"
            >
              <Smartphone size={24} />
              START GAME
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Canvas Container */}
      <div className={`relative w-full h-full flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-2 md:p-4 lg:p-8'}`}>
        <div 
          className={`relative shadow-2xl shadow-blue-900/20 overflow-hidden transition-all duration-500 ${
            isFullscreen 
              ? '' 
              : 'md:border md:border-zinc-800 md:rounded-lg'
          }`}
          style={{
            width: isFullscreen 
              ? 'min(100dvw, calc(100dvh * 16/9))' 
              : 'min(calc(100dvw - 2rem), calc((100dvh - 2rem) * 16/9))',
            height: isFullscreen 
              ? 'min(100dvh, calc(100dvw * 9/16))' 
              : 'min(calc(100dvh - 2rem), calc((100dvw - 2rem) * 9/16))',
            aspectRatio: '16/9'
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full game-canvas object-contain bg-black"
          />

        {/* In-Game HUD */}
        {(gameState.status === 'PLAYING' || gameState.status === 'TUTORIAL') && (
          <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
            <div className="flex gap-8">
              <div className="flex flex-col">
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Distance</span>
                <span className="text-3xl font-display font-bold text-white tabular-nums">
                  {Math.floor(gameState.distance / 10)}m
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <button 
                className="pointer-events-auto p-2 bg-zinc-900/50 backdrop-blur-md border border-zinc-700 rounded-full hover:bg-zinc-800 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setGameState(prev => ({ ...prev, status: 'PAUSED' }));
                }}
              >
                <Pause size={20} className="text-zinc-300" />
              </button>
            </div>
          </div>
        )}

        {/* Tutorial Overlay */}
        <AnimatePresence>
          {gameState.status === 'TUTORIAL' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-8 rounded-[2.5rem] max-w-xs text-center shadow-2xl shadow-black/50"
              >
                {tutorialStep === 0 && (
                  <>
                    <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse border border-blue-500/30">
                      <MousePointer2 className="text-blue-400" size={32} />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-tighter">FLIP GRAVITY</h3>
                    <p className="text-zinc-400 font-mono text-[10px] leading-relaxed uppercase tracking-widest">Tap or click anywhere to flip gravity and switch sides.</p>
                  </>
                )}
                {tutorialStep === 1 && (
                  <>
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                      <Zap className="text-emerald-400" size={32} />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-tighter">GOOD JOB!</h3>
                    <p className="text-zinc-400 font-mono text-[10px] leading-relaxed uppercase tracking-widest">Now, keep moving and prepare for obstacles.</p>
                  </>
                )}
                {tutorialStep === 2 && (
                  <>
                    <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                      <ShieldAlert className="text-red-400" size={32} />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-tighter">AVOID HAZARDS</h3>
                    <p className="text-zinc-400 font-mono text-[10px] leading-relaxed uppercase tracking-widest">Flip gravity to avoid colliding with barriers and other hazards.</p>
                  </>
                )}
                
                <div className="mt-8 pt-6 border-t border-zinc-800/50 flex justify-center">
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       safeStorage.setItem('tutorialCompleted', 'true');
                       setGameState(prev => ({ ...prev, status: 'PLAYING', tutorialCompleted: true }));
                     }}
                     className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all hover:scale-105 pointer-events-auto flex items-center gap-2"
                   >
                     Skip Tutorial
                   </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlays */}
        <AnimatePresence mode="wait">
          {gameState.status === 'MENU' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md flex flex-col items-center overflow-y-auto scrollbar-hide p-4 md:p-6 text-center"
            >
              <div className="min-h-full flex flex-col items-center justify-center w-full py-4">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="mb-2 md:mb-4"
              >
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-black tracking-tighter text-white leading-[0.85]">
                  GRAVITY<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">FLIP</span>
                </h1>
                <p className="text-zinc-500 font-mono text-[8px] md:text-[10px] mt-2 tracking-[0.4em] uppercase opacity-80">VOID-RUNNER INITIATED // SECTOR 7 BYPASS</p>
              </motion.div>
              
              <div className="flex flex-col gap-2 w-full max-w-[280px] md:max-w-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setGameState(prev => ({ ...prev, status: 'DIFF_SELECT' }));
                  }}
                  className="group relative flex items-center justify-center gap-3 bg-white text-black py-3 md:py-4 px-8 rounded-xl md:rounded-2xl font-bold text-lg md:text-xl lg:text-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Play size={20} className="md:w-6 md:h-6" fill="currentColor" />
                  INITIATE RUN
                </button>
                
                <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGameState(prev => ({ ...prev, status: 'CHAR_SELECT' }));
                    }}
                    className="flex flex-col items-center justify-center gap-1 bg-zinc-900/80 border border-zinc-800 text-zinc-300 py-2 md:py-3 rounded-xl md:rounded-2xl hover:bg-zinc-800 transition-all hover:border-zinc-600 group"
                  >
                    <User size={16} className="md:w-[18px] md:h-[18px] group-hover:text-cyan-400 transition-colors" />
                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider">Avatar</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGameState(prev => ({ ...prev, status: 'POWERUPS_INFO' }));
                    }}
                    className="flex flex-col items-center justify-center gap-1 bg-zinc-900/80 border border-zinc-800 text-zinc-300 py-2 md:py-3 rounded-xl md:rounded-2xl hover:bg-zinc-800 transition-all hover:border-zinc-600 group"
                  >
                    <Zap size={16} className="md:w-[18px] md:h-[18px] group-hover:text-blue-400 transition-colors" />
                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider">Powerups</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGameState(prev => ({ ...prev, status: 'CONTROLS_INFO' }));
                    }}
                    className="flex flex-col items-center justify-center gap-1 bg-zinc-900/80 border border-zinc-800 text-zinc-300 py-2 md:py-3 rounded-xl md:rounded-2xl hover:bg-zinc-800 transition-all hover:border-zinc-600 group"
                  >
                    <Gamepad2 size={16} className="md:w-[18px] md:h-[18px] group-hover:text-orange-400 transition-colors" />
                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider">Controls</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullScreen();
                    }}
                    className="flex flex-col items-center justify-center gap-1 bg-zinc-900/80 border border-zinc-800 text-zinc-300 py-2 md:py-3 rounded-xl md:rounded-2xl hover:bg-zinc-800 transition-all hover:border-zinc-600 group"
                  >
                    <Maximize size={16} className="md:w-[18px] md:h-[18px] group-hover:text-emerald-400 transition-colors" />
                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider">Full</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGameState(prev => ({ ...prev, status: 'STATS' }));
                    }}
                    className="flex flex-col items-center justify-center gap-1 bg-zinc-900/80 border border-zinc-800 text-zinc-300 py-2 md:py-3 rounded-xl md:rounded-2xl hover:bg-zinc-800 transition-all hover:border-zinc-600 group"
                  >
                    <BarChart3 size={16} className="md:w-[18px] md:h-[18px] group-hover:text-yellow-400 transition-colors" />
                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider">Stats</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSoundEnabled(!soundEnabled);
                    }}
                    className="flex flex-col items-center justify-center gap-1 bg-zinc-900/80 border border-zinc-800 text-zinc-300 py-2 md:py-3 rounded-xl md:rounded-2xl hover:bg-zinc-800 transition-all hover:border-zinc-600 group"
                  >
                    {soundEnabled ? <Volume2 size={16} className="md:w-[18px] md:h-[18px] group-hover:text-purple-400 transition-colors" /> : <VolumeX size={16} className="md:w-[18px] md:h-[18px] text-zinc-600" />}
                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider">Audio</span>
                  </button>
                </div>

                {showResetConfirm ? (
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        safeStorage.removeItem('highScore');
                        safeStorage.removeItem('totalDistance');
                        safeStorage.removeItem('totalNearMisses');
                        safeStorage.removeItem('gamesPlayed');
                        setGameState(prev => ({ 
                          ...prev, 
                          highScore: 0, 
                          totalDistance: 0, 
                          totalNearMisses: 0,
                          gamesPlayed: 0 
                        }));
                        setShowResetConfirm(false);
                      }}
                      className="flex-1 bg-red-500/80 text-white py-2.5 rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-red-600 transition-colors"
                    >
                      Confirm Reset
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowResetConfirm(false);
                      }}
                      className="flex-1 bg-zinc-800 text-zinc-300 py-2.5 rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-zinc-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowResetConfirm(true);
                    }}
                    className="w-full mt-1 flex items-center justify-center gap-2 bg-zinc-900/40 border border-zinc-800/50 text-zinc-500 py-2.5 rounded-xl hover:bg-zinc-800 transition-all font-bold text-[9px] uppercase tracking-widest group hover:border-red-500/30 hover:text-red-400"
                  >
                    <RotateCcw size={12} className="group-hover:rotate-[-90deg] transition-transform" />
                    Reset High Scores
                  </button>
                )}

                <div className="bg-zinc-900/40 border border-zinc-800/50 p-2.5 md:p-3 rounded-xl md:rounded-2xl flex items-center justify-between group hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                      <Trophy size={16} className="md:w-[18px] md:h-[18px] text-yellow-500" />
                    </div>
                    <div className="text-left">
                      <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Personal Best</span>
                      <span className="text-base md:text-lg font-display font-bold text-white tracking-tight">{gameState.highScore}m</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Mode</span>
                    <span className="text-[10px] md:text-[11px] font-bold text-blue-400 uppercase tracking-tight">{gameState.difficulty}</span>
                  </div>
                </div>
              </div>
            </div>

              <div className="absolute bottom-6 flex items-center gap-4 text-zinc-700 text-[8px] font-mono uppercase tracking-[0.3em]">
              </div>
            </motion.div>
          )}

          {gameState.status === 'POWERUPS_INFO' && (
            <motion.div
              key="powerups-info"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center overflow-y-auto scrollbar-hide p-4 md:p-8"
            >
              <div className="min-h-full flex flex-col items-center justify-center w-full py-8">
              <div className="mb-8 text-center">
                <h2 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-tighter">Powerups</h2>
                <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase">Enhance your unit</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full max-w-6xl mb-12">
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-3xl flex flex-col items-center text-center gap-3">
                  <div className="w-20 h-20 flex items-center justify-center">
                    <PowerUpPreview type="SHIELD" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">VOID SHIELD</h3>
                    <p className="text-zinc-500 text-[10px] leading-tight uppercase tracking-wider">Invulnerability</p>
                    <p className="text-zinc-400 text-xs mt-2">
                      Smash through any obstacle without taking damage.
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-3xl flex flex-col items-center text-center gap-3">
                  <div className="w-20 h-20 flex items-center justify-center">
                    <PowerUpPreview type="ENERGY_CONDUIT" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">ENERGY CONDUIT</h3>
                    <p className="text-zinc-500 text-[10px] leading-tight uppercase tracking-wider">Speed Surge</p>
                    <p className="text-zinc-400 text-xs mt-2">
                      Provides a massive speed surge that decays over time.
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-3xl flex flex-col items-center text-center gap-3">
                  <div className="w-20 h-20 flex items-center justify-center">
                    <PowerUpPreview type="VOID_GATE" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">VOID GATE</h3>
                    <p className="text-zinc-500 text-[10px] leading-tight uppercase tracking-wider">Teleportation</p>
                    <p className="text-zinc-400 text-xs mt-2">
                      Instantly warp forward and clear all obstacles in your path.
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-3xl flex flex-col items-center text-center gap-3">
                  <div className="w-20 h-20 flex items-center justify-center">
                    <PowerUpPreview type="CHRONO_SPHERE" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">CHRONO SPHERE</h3>
                    <p className="text-zinc-500 text-[10px] leading-tight uppercase tracking-wider">Time Dilation</p>
                    <p className="text-zinc-400 text-xs mt-2">
                      Slows down the flow of time, making obstacles easier to dodge.
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-3xl flex flex-col items-center text-center gap-3">
                  <div className="w-20 h-20 flex items-center justify-center">
                    <PowerUpPreview type="PULSE_WAVE" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">PULSE WAVE</h3>
                    <p className="text-zinc-500 text-[10px] leading-tight uppercase tracking-wider">Area Clear</p>
                    <p className="text-zinc-400 text-xs mt-2">
                      Emits a powerful wave that disintegrates nearby hazards.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setGameState(prev => ({ ...prev, status: 'MENU' }));
                }}
                className="flex items-center justify-center gap-2 bg-white text-black py-4 px-12 rounded-2xl font-bold text-lg hover:scale-105 transition-all active:scale-95"
              >
                <ChevronLeft size={20} />
                BACK TO MENU
              </button>
              </div>
            </motion.div>
          )}

          {gameState.status === 'STATS' && (
            <motion.div
              key="stats-screen"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center overflow-y-auto scrollbar-hide p-4 md:p-8"
            >
              <div className="min-h-full flex flex-col items-center justify-center w-full py-8">
              <div className="mb-12 text-center">
                <h2 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-tighter">Lifetime Stats</h2>
                <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase">Your neural history</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-12">
                <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center text-center gap-4 group hover:border-zinc-600 transition-all">
                  <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
                    <Maximize size={32} className="text-blue-400" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Total Distance</span>
                    <span className="text-3xl font-display font-bold text-white tracking-tight">{(gameState.totalDistance / 1000).toFixed(1)}km</span>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center text-center gap-4 group hover:border-zinc-600 transition-all">
                  <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
                    <Zap size={32} className="text-emerald-400" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Near Misses</span>
                    <span className="text-3xl font-display font-bold text-white tracking-tight">{gameState.totalNearMisses}</span>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center text-center gap-4 group hover:border-zinc-600 transition-all">
                  <div className="p-4 bg-purple-500/10 rounded-2xl group-hover:bg-purple-500/20 transition-colors">
                    <Play size={32} className="text-purple-400" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Games Played</span>
                    <span className="text-3xl font-display font-bold text-white tracking-tight">{gameState.gamesPlayed}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setGameState(prev => ({ ...prev, status: 'MENU' }));
                }}
                className="flex items-center justify-center gap-2 bg-white text-black py-4 px-12 rounded-2xl font-bold text-lg hover:scale-105 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                <ChevronLeft size={20} />
                BACK TO MENU
              </button>
              </div>
            </motion.div>
          )}
          {gameState.status === 'CONTROLS_INFO' && (
            <motion.div
              key="controls-info"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center overflow-y-auto scrollbar-hide p-4 md:p-8"
            >
              <div className="min-h-full flex flex-col items-center justify-center w-full py-8">
              <div className="mb-8 text-center">
                <h2 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-tighter">Controls</h2>
                <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase">Master the neural link</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-6xl mb-8">
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Settings2 size={20} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest">Keyboard & Mouse</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-500 uppercase font-bold">Action</span>
                      <span className="text-white">Flip Gravity</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-500 uppercase font-bold">Input</span>
                      <span className="text-white">Click / Space / Up / Down</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Gamepad2 size={20} className="text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest">Gamepad</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-500 uppercase font-bold">Flip Gravity</span>
                      <span className="text-white">Button A / D-Pad</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-500 uppercase font-bold">Manual Move</span>
                      <span className="text-white">Left Analog Stick</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Smartphone size={20} className="text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest">Mobile / Touch</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-500 uppercase font-bold">Action</span>
                      <span className="text-white">Flip Gravity</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-500 uppercase font-bold">Input</span>
                      <span className="text-white">Tap Anywhere</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setGameState(prev => ({ ...prev, status: 'MENU' }));
                }}
                className="flex items-center justify-center gap-2 bg-white text-black py-4 px-12 rounded-2xl font-bold text-lg hover:scale-105 transition-all active:scale-95"
              >
                <ChevronLeft size={20} />
                BACK TO MENU
              </button>
              </div>
            </motion.div>
          )}

          {gameState.status === 'CHAR_SELECT' && (
            <motion.div
              key="char-select"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center overflow-y-auto scrollbar-hide p-4 md:p-8"
            >
              <div className="min-h-full flex flex-col items-center justify-center w-full py-8">
              <div className="mb-6 md:mb-8 text-center">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-1">SELECT AVATAR</h2>
                <p className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase">Choose your runner unit</p>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-4 w-full max-w-2xl mb-8 md:mb-10">
                {CHARACTERS.map(char => (
                  <button
                    key={char.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setGameState(prev => ({ ...prev, selectedCharacter: char }));
                    }}
                    className={`relative p-3 md:p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 md:gap-3 ${
                      gameState.selectedCharacter.id === char.id 
                        ? 'bg-zinc-900 border-white shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-105 z-10' 
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 grayscale opacity-40 hover:opacity-70'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 md:w-14 md:h-14 rounded-lg shadow-lg"
                      style={{ 
                        backgroundColor: char.color,
                        boxShadow: `0 0 20px ${char.glowColor}`
                      }}
                    />
                    <span className="font-mono text-[8px] md:text-[10px] font-bold tracking-tighter truncate w-full">{char.name}</span>
                    {gameState.selectedCharacter.id === char.id && (
                      <motion.div layoutId="active-char" className="absolute -top-1.5 -right-1.5 bg-white text-black p-1 rounded-full shadow-lg">
                        <Play size={10} fill="currentColor" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setGameState(prev => ({ ...prev, status: 'MENU' }));
                }}
                className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest group"
              >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Menu
              </button>
              </div>
            </motion.div>
          )}

          {gameState.status === 'DIFF_SELECT' && (
            <motion.div
              key="diff-select"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center overflow-y-auto scrollbar-hide p-4 md:p-8"
            >
              <div className="min-h-full flex flex-col items-center justify-center w-full py-8">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setGameState(prev => ({ ...prev, status: 'MENU' }));
                }}
                className="absolute top-8 left-8 flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 text-white px-4 py-2 rounded-full border border-zinc-700 transition-all font-mono text-xs uppercase tracking-widest group z-20 shadow-lg"
              >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Menu
              </button>

              <div className="mb-6 md:mb-8 text-center">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-1">DIFFICULTY</h2>
                <p className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase">Select challenge level</p>
              </div>

              <div className="flex flex-col gap-3 w-full max-w-[320px] md:max-w-sm mb-8 md:mb-10">
                {(['EASY', 'HARD', 'ULTIMATE', 'INSANE'] as Difficulty[]).map(diff => (
                  <button
                    key={diff}
                    onClick={(e) => {
                      e.stopPropagation();
                      setGameState(prev => ({ ...prev, difficulty: diff }));
                      resetGame();
                    }}
                    className={`group relative p-4 md:p-5 rounded-2xl border-2 transition-all text-left overflow-hidden ${
                      gameState.difficulty === diff 
                        ? 'bg-white border-white text-black scale-105 z-10 shadow-xl shadow-white/5' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="block text-xl md:text-2xl font-display font-bold tracking-tight">{diff}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                            gameState.difficulty === diff 
                              ? 'bg-black text-white border-black' 
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            {DIFFICULTY_SETTINGS[diff].multiplier}x
                          </span>
                        </div>
                        <span className="text-[9px] font-mono uppercase tracking-widest opacity-60">
                          {diff === 'EASY' ? 'Standard Protocol' : diff === 'HARD' ? 'Advanced Hazards' : diff === 'ULTIMATE' ? 'Maximum Lethality' : 'Pure Chaos'}
                        </span>
                      </div>
                      {gameState.difficulty === diff && (
                        <Zap size={20} fill="currentColor" className="text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              </div>
            </motion.div>
          )}

          {gameState.status === 'PAUSED' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center"
            >
              <h2 className="text-5xl font-display font-bold text-white mb-8">PAUSED</h2>
              <div className="flex gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setGameState(prev => ({ ...prev, status: 'PLAYING' }));
                  }}
                  className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all hover:scale-110"
                >
                  <Play size={32} fill="currentColor" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setGameState(prev => ({ ...prev, status: 'MENU' }));
                  }}
                  className="p-4 bg-zinc-800 text-white rounded-2xl hover:bg-zinc-700 transition-all hover:scale-110"
                >
                  <Home size={32} />
                </button>
              </div>
            </motion.div>
          )}

          {gameState.status === 'GAMEOVER' && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/98 backdrop-blur-2xl flex flex-col items-center overflow-y-auto scrollbar-hide p-4 md:p-8"
            >
              <div className="min-h-full flex flex-col items-center justify-center w-full py-8">
              {/* Animated Background Loop */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full blur-[100px]"
                    style={{
                      width: Math.random() * 400 + 200,
                      height: Math.random() * 400 + 200,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      background: i % 2 === 0 ? 'rgba(6, 182, 212, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                    }}
                    animate={{
                      x: [0, Math.random() * 150 - 75, 0],
                      y: [0, Math.random() * 150 - 75, 0],
                      scale: [1, 1.15, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: Math.random() * 15 + 15,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>

              <motion.div 
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-10 md:mb-12 text-center relative z-10"
              >
                <h2 className="text-6xl md:text-8xl font-display font-black text-white mb-2 tracking-tighter italic uppercase">
                  Mission <span className="text-red-500">Failed</span>
                </h2>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em]">Unit Decommissioned</span>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 md:mb-12 w-full max-w-sm md:max-w-3xl relative z-10">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="group relative bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2rem] text-center overflow-hidden hover:border-cyan-500/30 transition-all duration-500"
                >
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 group-hover:scale-110 transition-transform duration-500">
                      <Zap size={22} />
                    </div>
                  </div>
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-1">Distance</span>
                  <span className="text-4xl font-display font-bold text-white tabular-nums tracking-tight">
                    {Math.floor(gameState.distance / 10)}<span className="text-lg text-zinc-600 ml-1">m</span>
                  </span>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="group relative bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2rem] text-center overflow-hidden hover:border-yellow-500/30 transition-all duration-500"
                >
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-400 group-hover:scale-110 transition-transform duration-500">
                      <BarChart3 size={22} />
                    </div>
                  </div>
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-1">Final Score</span>
                  <span className="text-4xl font-display font-bold text-white tabular-nums tracking-tight">
                    {Math.floor(gameState.score)}
                  </span>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="group relative bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2rem] text-center overflow-hidden hover:border-emerald-500/30 transition-all duration-500"
                >
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform duration-500">
                      <Trophy size={22} />
                    </div>
                  </div>
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-1">Personal Best</span>
                  <span className="text-4xl font-display font-bold text-white tabular-nums tracking-tight">
                    {gameState.highScore}
                  </span>
                </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col gap-3 w-full max-w-[280px] md:max-w-xs relative z-10"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetGame();
                  }}
                  className="group flex items-center justify-center gap-3 bg-white text-black py-4 md:py-5 rounded-2xl font-bold text-lg md:text-xl hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5"
                >
                  <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                  REDEPLOY UNIT
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setGameState(prev => ({ ...prev, status: 'MENU' }));
                  }}
                  className="flex items-center justify-center gap-3 bg-zinc-900/50 backdrop-blur-md text-white py-4 md:py-5 rounded-2xl font-bold text-lg md:text-xl hover:bg-zinc-800 transition-all border border-zinc-800/50"
                >
                  <Home size={20} />
                  RETURN TO BASE
                </button>
              </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
