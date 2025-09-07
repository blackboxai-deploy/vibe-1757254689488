export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export enum UnitType {
  INFANTRY = 'infantry',
  TANK_SHERMAN = 'tank_sherman',
  TANK_T34 = 'tank_t34',
  ARTILLERY = 'artillery',
  ANTI_TANK = 'anti_tank',
  ENGINEER = 'engineer',
  // Enemy units
  PANZER_IV = 'panzer_iv',
  GERMAN_INFANTRY = 'german_infantry',
  STUKA = 'stuka'
}

export enum UnitFaction {
  ALLIED = 'allied',
  AXIS = 'axis'
}

export interface UnitStats {
  health: number;
  maxHealth: number;
  armor: number;
  damage: number;
  range: number;
  speed: number;
  cost: number;
  accuracy: number;
}

export interface Unit {
  id: string;
  type: UnitType;
  faction: UnitFaction;
  position: Position;
  targetPosition?: Position;
  rotation: number;
  stats: UnitStats;
  isSelected: boolean;
  isMoving: boolean;
  isAttacking: boolean;
  targetEnemy?: Unit;
  lastAttack: number;
  experienceLevel: number;
  killCount: number;
  morale: number;
  ammunition: number;
  fuel: number;
  speed: number;
}

export interface Building {
  id: string;
  type: 'headquarters' | 'factory' | 'depot' | 'bunker' | 'objective';
  position: Position;
  size: Size;
  health: number;
  maxHealth: number;
  faction: UnitFaction;
  isObjective: boolean;
  isControlled: boolean;
  controlProgress: number;
}

export interface Projectile {
  id: string;
  position: Position;
  velocity: { x: number; y: number };
  damage: number;
  range: number;
  distanceTraveled: number;
  source: Unit;
  target?: Unit;
  type: 'bullet' | 'shell' | 'rocket';
}

export interface Explosion {
  id: string;
  position: Position;
  radius: number;
  damage: number;
  duration: number;
  elapsed: number;
  type: 'small' | 'medium' | 'large';
}

export interface GameState {
  isPaused: boolean;
  isGameOver: boolean;
  victory: boolean;
  currentWave: number;
  enemiesRemaining: number;
  score: number;
  timeElapsed?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
}

export interface Resources {
  money: number;
  fuel: number;
  ammunition: number;
  reinforcements: number;
  supply: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  targetX?: number;
  targetY?: number;
  isFollowing?: boolean;
  followTarget?: Unit;
}

export interface Viewport {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export interface AudioConfig {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  isMuted: boolean;
}

export interface GameSettings {
  graphics: {
    quality: 'low' | 'medium' | 'high';
    showHealthBars: boolean;
    showRange: boolean;
    showTrajectories: boolean;
  };
  audio: AudioConfig;
  controls: {
    cameraSpeed: number;
    edgeScrolling: boolean;
    rightClickMove: boolean;
  };
}

export interface CombatEvent {
  id: string;
  type: 'hit' | 'miss' | 'destroy' | 'critical';
  attacker: Unit;
  target: Unit;
  damage: number;
  position: Position;
  timestamp: number;
}

export interface ObjectiveStatus {
  id: string;
  type: 'capture' | 'destroy' | 'defend' | 'survive';
  description: string;
  completed: boolean;
  progress: number;
  required: number;
  timeLimit?: number;
  timeRemaining?: number;
}

export interface ScenarioData {
  id: number;
  name: string;
  description: string;
  location: string;
  date: string;
  objective: string;
  difficulty: string;
  mapSize: Size;
  initialUnits: {
    player: Array<{ type: UnitType; position: Position; count?: number }>;
    enemy: Array<{ type: UnitType; position: Position; count?: number }>;
  };
  objectives: ObjectiveStatus[];
  resources: Resources;
  timeLimit?: number;
  victoryCOnditions: string[];
  defeatConditions: string[];
}

// Utility type for game events
export type GameEvent = 
  | { type: 'UNIT_CREATED'; unit: Unit }
  | { type: 'UNIT_DESTROYED'; unit: Unit }
  | { type: 'UNIT_DAMAGED'; unit: Unit; damage: number }
  | { type: 'BUILDING_CAPTURED'; building: Building }
  | { type: 'OBJECTIVE_COMPLETED'; objective: ObjectiveStatus }
  | { type: 'WAVE_COMPLETE'; wave: number }
  | { type: 'GAME_OVER'; victory: boolean };

// AI states
export enum AIState {
  IDLE = 'idle',
  PATROLLING = 'patrolling',
  ATTACKING = 'attacking',
  RETREATING = 'retreating',
  DEFENDING = 'defending',
  REGROUPING = 'regrouping'
}

export interface AIUnitData {
  state: AIState;
  lastDecision: number;
  target?: Unit | Building;
  patrolPoints?: Position[];
  currentPatrolIndex: number;
  alertLevel: number;
  lastKnownEnemyPosition?: Position;
}

export interface TerrainData {
  type: 'grass' | 'forest' | 'water' | 'road' | 'building' | 'trench';
  movementCost: number;
  coverBonus: number;
  concealment: number;
  passable: boolean;
}

export interface WeatherCondition {
  type: 'clear' | 'rain' | 'fog' | 'snow';
  visibility: number; // 0-1
  accuracyModifier: number; // 0-1
  movementModifier: number; // 0-1
}

export interface Formation {
  type: 'line' | 'column' | 'wedge' | 'box';
  units: Unit[];
  leader: Unit;
  spacing: number;
  facing: number;
}