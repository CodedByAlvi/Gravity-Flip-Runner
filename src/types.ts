export type Difficulty = 'EASY' | 'HARD' | 'ULTIMATE' | 'INSANE';

export interface Character {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  eyeColor: string;
}

export interface GameState {
  score: number;
  highScore: number;
  status: 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'CHAR_SELECT' | 'DIFF_SELECT' | 'POWERUPS_INFO' | 'CONTROLS_INFO' | 'STATS' | 'TUTORIAL';
  speed: number;
  distance: number;
  difficulty: Difficulty;
  selectedCharacter: Character;
  adaptiveIntensity: number;
  performanceScore: number;
  nearMissCount: number;
  combo: number;
  multiplier: number;
  totalDistance: number;
  totalNearMisses: number;
  gamesPlayed: number;
  tutorialCompleted: boolean;
}

export interface Player {
  x?: number;
  y: number;
  targetY: number;
  vy: number;
  width: number;
  height: number;
  isUpsideDown: boolean;
  rotation: number;
  squashX: number;
  squashY: number;
  idleOffset: number;
  isLanding: boolean;
  landingTimer: number;
  isMoving: boolean;
  shieldTimer: number;
  shieldActive: boolean;
  invincibilityTimer?: number;
  grazeTimer?: number;
  hitTimer?: number;
  lastHitObstacleId?: number;
  leanAmount: number;
}

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'FLOOR_SPIKE' | 'CEILING_SPIKE' | 'BARRIER' | 'ROTATING_BLADE' | 'DRONE' | 'LASER' | 'SHIELD' | 'PENDULUM' | 'HOMING_MISSILE' | 'GRAVITY_WELL' | 'BLACK_HOLE' | 'VOID_GATE' | 'ENERGY_CONDUIT' | 'CHRONO_SPHERE' | 'PULSE_WAVE' | 'NEBULA_STORM';
  speedX?: number;
  warningTime?: number;
  speedY?: number;
  angle?: number;
  rotationSpeed?: number;
  amplitude?: number;
  frequency?: number;
  baseY?: number;
  timer?: number;
  isTriggered?: boolean;
  seed: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface BackgroundObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  layer: 1 | 2 | 3 | 4; // Added layer 4 for foreground dust
  type: 'NEBULA' | 'GALAXY' | 'STAR_CLUSTER' | 'ASTEROID' | 'PLANET' | 'SUN' | 'COMET' | 'BLACK_HOLE' | 'WORMHOLE' | 'SUPERNOVA' | 'SPACE_DUST' | 'MOON';
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  opacity: number;
  seed: number;
  pulse?: number;
  pulseSpeed?: number;
  isRare?: boolean;
  planetType?: number; // 0: Rocky, 1: Gas Giant, 2: Ice, 3: Earth-like, 4: Volcanic
  nebulaType?: number;
  galaxyType?: number; // 0: Spiral, 1: Elliptical, 2: Barred Spiral, 3: Irregular
  hasRings?: boolean;
  starType?: 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M'; // Star classification
}
