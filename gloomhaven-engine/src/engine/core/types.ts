/**
 * Core type definitions for the Gloomhaven game engine
 * Includes interfaces for game state, hexes, characters, monsters, and game flow
 */

// ===== HEX COORDINATE SYSTEM =====

/**
 * Axial coordinate system for hexagonal grid
 * Uses q (column) and r (row) coordinates
 */
export interface Hex {
  q: number;  // Column coordinate
  r: number;  // Row coordinate
}

/**
 * Extended hex with additional properties for game state
 */
export interface GameHex extends Hex {
  id: string;
  terrain?: TerrainType;
  overlay?: OverlayType;
  occupant?: string; // Figure ID
  items?: string[]; // Item IDs
  tokens?: TokenType[];
}

/**
 * Terrain types that affect movement and line of sight
 */
export enum TerrainType {
  NORMAL = 'normal',
  DIFFICULT = 'difficult',
  HAZARD = 'hazard',
  OBSTACLE = 'obstacle',
  WALL = 'wall',
  WATER = 'water',
  ICE = 'ice',
  LAVA = 'lava'
}

/**
 * Overlay types for special hex effects
 */
export enum OverlayType {
  TRAP = 'trap',
  TREASURE = 'treasure',
  DOOR = 'door',
  PRESSURE_PLATE = 'pressure_plate',
  ALTAR = 'altar',
  STAIRS = 'stairs'
}

/**
 * Token types that can be placed on hexes
 */
export enum TokenType {
  COIN = 'coin',
  LUMBER = 'lumber',
  METAL = 'metal',
  HIDE = 'hide',
  ARROWVINE = 'arrowvine',
  AXENUT = 'axenut',
  CORPSECAP = 'corpsecap',
  FLAMEFRUIT = 'flamefruit',
  ROCKROOT = 'rockroot',
  SNOWTHISTLE = 'snowthistle'
}

// ===== GAME STATE STRUCTURE =====

export interface GloomhavenGameState {
  campaign: CampaignState;
  scenario: ActiveScenarioState | null;
  characters: Map<string, Character>;
  party: PartyState;
  city: CityState;
  gamePhase: GamePhase;
}

export enum GamePhase {
  CAMPAIGN_MANAGEMENT = 'campaign',
  SCENARIO_SETUP = 'setup', 
  SCENARIO_PLAY = 'play',
  SCENARIO_CLEANUP = 'cleanup'
}

// ===== MAP AND BOARD SYSTEM =====

/**
 * Map tile definition for scenario construction
 */
export interface MapTile {
  id: string;          // e.g., "L1a", "I1b"
  name: string;        // Display name
  size: TileSize;      // Dimensions
  hexes: GameHex[];    // All hexes in this tile
  doors: Door[];       // Door connections
  overlays: Overlay[]; // Special overlays
}

/**
 * Tile size specifications
 */
export interface TileSize {
  width: number;   // Number of columns
  height: number;  // Number of rows
  offset: Hex;     // Offset for positioning
}

/**
 * Door connection between map tiles or rooms
 */
export interface Door {
  id: string;
  position: Hex;
  direction: DoorDirection;
  isOpen: boolean;
  connectsTo?: string; // Connected room/tile ID
}

export enum DoorDirection {
  NORTH = 'north',
  NORTHEAST = 'northeast',
  SOUTHEAST = 'southeast',
  SOUTH = 'south',
  SOUTHWEST = 'southwest',
  NORTHWEST = 'northwest'
}

/**
 * Special overlay objects on the map
 */
export interface Overlay {
  id: string;
  type: OverlayType;
  position: Hex;
  properties?: Record<string, unknown>;
}

/**
 * Complete game board state
 */
export interface GameBoard {
  id: string;
  scenario: string;
  tiles: Map<string, MapTile>;  // Tile ID -> MapTile
  hexes: Map<string, GameHex>;  // Hex key -> GameHex
  bounds: BoardBounds;
  metadata: BoardMetadata;
}

/**
 * Board boundaries for rendering
 */
export interface BoardBounds {
  minQ: number;
  maxQ: number;
  minR: number;
  maxR: number;
}

/**
 * Board metadata
 */
export interface BoardMetadata {
  name: string;
  difficulty: number;
  recommendedLevel: number;
  maxPlayers: number;
  objectives: string[];
}

// ===== CHARACTER SYSTEM =====

export interface Character {
  id: string;
  class: CharacterClass;
  level: number;
  experience: number;
  currentHP: number;
  maxHP: number;
  handSize: number;
  availableCards: AbilityCard[];
  activeCards: AbilityCard[];
  discardPile: AbilityCard[];
  lostPile: AbilityCard[];
  attackModifierDeck: AttackModifierDeck;
  equipment: Equipment;
  conditions: Condition[];
  personalQuest: PersonalQuest;
  battleGoal: BattleGoal | null;
  gold: number;
  checkmarks: number;
  perks: Perk[];
  position?: Hex;
}

export enum CharacterClass {
  BRUTE = 'brute',
  TINKERER = 'tinkerer',
  SPELLWEAVER = 'spellweaver',
  SCOUNDREL = 'scoundrel',
  CRAGHEART = 'cragheart',
  MINDTHIEF = 'mindthief'
}

export interface AbilityCard {
  id: string;
  name: string;
  level: number;
  initiative: number;
  topAction: Action;
  bottomAction: Action;
  isLost?: boolean;
}

export interface Action {
  id: string;
  type: ActionType;
  effects: Effect[];
  targets?: Target[];
  range?: number;
}

export enum ActionType {
  ATTACK = 'attack',
  MOVE = 'move',
  HEAL = 'heal',
  SHIELD = 'shield',
  RETALIATE = 'retaliate',
  LOOT = 'loot',
  SPECIAL = 'special'
}

export interface Effect {
  id: string;
  type: EffectType;
  value?: number;
  condition?: Condition;
  element?: Element;
}

export enum EffectType {
  DAMAGE = 'damage',
  HEAL = 'heal',
  MOVE = 'move',
  PUSH = 'push',
  PULL = 'pull',
  CONDITION = 'condition',
  ELEMENT = 'element',
  SHIELD = 'shield'
}

export interface Target {
  type: TargetType;
  count: number;
  range?: number;
}

export enum TargetType {
  SELF = 'self',
  ADJACENT = 'adjacent',
  ENEMY = 'enemy',
  ALLY = 'ally',
  HEX = 'hex'
}

// ===== CONDITIONS SYSTEM =====

export interface Condition {
  type: ConditionType;
  value?: number;
  duration?: number;
  source?: string;
}

export enum ConditionType {
  POISON = 'poison',
  WOUND = 'wound',
  IMMOBILIZE = 'immobilize',
  DISARM = 'disarm',
  STUN = 'stun',
  MUDDLE = 'muddle',
  INVISIBLE = 'invisible',
  STRENGTHEN = 'strengthen',
  BLESS = 'bless',
  CURSE = 'curse'
}

// ===== ELEMENTS SYSTEM =====

export enum Element {
  FIRE = 'fire',
  ICE = 'ice',
  AIR = 'air',
  EARTH = 'earth',
  LIGHT = 'light',
  DARK = 'dark'
}

export enum ElementState {
  INERT = 'inert',
  WANING = 'waning',
  STRONG = 'strong'
}

export interface ElementTracker {
  [Element.FIRE]: ElementState;
  [Element.ICE]: ElementState;
  [Element.AIR]: ElementState;
  [Element.EARTH]: ElementState;
  [Element.LIGHT]: ElementState;
  [Element.DARK]: ElementState;
}

// ===== ATTACK MODIFIER SYSTEM =====

export interface AttackModifierDeck {
  cards: AttackModifierCard[];
  discardPile: AttackModifierCard[];
  blessings: number;
  curses: number;
}

export interface AttackModifierCard {
  id: string;
  modifier: number;
  type: ModifierType;
  effects?: Effect[];
  isRolling?: boolean;
}

export enum ModifierType {
  MULTIPLY = 'multiply',
  ADD = 'add',
  NULL = 'null',
  MISS = 'miss',
  BLESS = 'bless',
  CURSE = 'curse'
}

// ===== ROUND AND INITIATIVE SYSTEM =====

export interface Round {
  number: number;
  phase: RoundPhase;
  initiativeOrder: InitiativeEntry[];
  activePlayerIndex: number;
  elementTracker: ElementTracker;
}

export enum RoundPhase {
  CARD_SELECTION = 'card_selection',
  INITIATIVE_REVEAL = 'initiative_reveal', 
  ACTIONS = 'actions',
  END_OF_ROUND = 'end_of_round'
}

export interface InitiativeEntry {
  figureId: string;
  figureType: 'player' | 'monster';
  initiative: number;
  leadingCard?: AbilityCard;
  isLongRest: boolean;
}

// ===== MONSTER SYSTEM =====

export interface Monster {
  id: string;
  type: MonsterType;
  level: number;
  isElite: boolean;
  currentHP: number;
  maxHP: number;
  attack: number;
  move: number;
  range: number;
  conditions: Condition[];
  position?: Hex;
  abilities: MonsterAbility[];
}

export interface MonsterType {
  name: string;
  baseStats: MonsterStats;
  abilities: MonsterAbility[];
  immunities: ConditionType[];
}

export interface MonsterStats {
  health: number[];
  move: number[];
  attack: number[];
  range: number[];
}

export interface MonsterAbility {
  id: string;
  name: string;
  initiative: number;
  actions: Action[];
}

// ===== EQUIPMENT SYSTEM =====

export interface Equipment {
  head?: Item;
  chest?: Item;
  legs?: Item;
  oneHand?: Item[];
  twoHand?: Item;
  smallItems?: Item[];
}

export interface Item {
  id: string;
  name: string;
  cost: number;
  slot: ItemSlot;
  effects: ItemEffect[];
  count?: number;
}

export enum ItemSlot {
  HEAD = 'head',
  CHEST = 'chest',
  LEGS = 'legs',
  ONE_HAND = 'oneHand',
  TWO_HAND = 'twoHand',
  SMALL_ITEM = 'smallItem'
}

export interface ItemEffect {
  type: EffectType;
  value?: number;
  trigger?: string;
}

// ===== CAMPAIGN SYSTEM =====

export interface CampaignState {
  name: string;
  reputation: number;
  prosperity: number;
  donations: number;
  scenariosCompleted: Set<number>;
  scenariosUnlocked: Set<number>;
  achievementsUnlocked: Set<string>;
  retirements: RetiredCharacter[];
}

export interface PartyState {
  location: string;
  members: string[]; // Character IDs
  achievements: Set<string>;
  reputation: number;
  notes: string;
}

export interface CityState {
  events: CityEvent[];
  shop: ShopState;
  enhancements: Enhancement[];
}

export interface RetiredCharacter {
  id: string;
  class: CharacterClass;
  name: string;
  level: number;
  personalQuest: PersonalQuest;
  retirementBenefit: string;
}

// ===== SCENARIO SYSTEM =====

export interface ActiveScenarioState {
  id: number;
  level: number;
  mapState: GameBoard;
  monsters: Map<string, Monster>;
  elements: ElementTracker;
  round: number;
  initiative: InitiativeEntry[];
  phase: RoundPhase;
  objectives: Objective[];
  treasures: Treasure[];
}

export interface Objective {
  id: string;
  type: ObjectiveType;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
}

export enum ObjectiveType {
  KILL_ALL = 'kill_all',
  KILL_TARGET = 'kill_target',
  ESCORT = 'escort',
  LOOT = 'loot',
  SURVIVE = 'survive',
  REACH_EXIT = 'reach_exit'
}

export interface Treasure {
  id: string;
  position: Hex;
  isLooted: boolean;
  contents: TreasureContent;
}

export interface TreasureContent {
  gold?: number;
  experience?: number;
  item?: string;
  enhancement?: string;
}

// ===== PATH FINDING =====

export interface PathResult {
  path: Hex[];
  cost: number;
  isValid: boolean;
}

export interface MovementOptions {
  range: number;
  canFly: boolean;
  canJump: boolean;
  ignoreDifficultTerrain: boolean;
  ignoreObstacles: boolean;
  ignoreFigures: boolean;
}

// ===== PLACEHOLDER INTERFACES =====

export interface PersonalQuest {
  id: string;
  name: string;
  description: string;
  progress: number;
  requirement: number;
}

export interface BattleGoal {
  id: string;
  name: string;
  description: string;
  checkmarks: number;
}

export interface Perk {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface CityEvent {
  id: string;
  name: string;
  description: string;
  options: EventOption[];
}

export interface EventOption {
  id: string;
  text: string;
  requirements?: string[];
  outcomes: EventOutcome[];
}

export interface EventOutcome {
  text: string;
  effects: Effect[];
}

export interface ShopState {
  availableItems: Set<string>;
  soldItems: Set<string>;
  prosperity: number;
}

export interface Enhancement {
  cardId: string;
  position: string;
  enhancement: string;
  cost: number;
}

// ===== CONSTANTS =====

export const LEVEL_EXPERIENCE_THRESHOLDS = [0, 45, 95, 150, 210, 275, 345, 420, 500];
export const LEVEL_PERK_COUNTS = [0, 1, 1, 2, 2, 3, 3, 4, 4]; // Cumulative perks available

// Five Player Modifications
export const FIVE_PLAYER_DIFFICULTY_MODIFIER = 2;
export const FIVE_PLAYER_REWARD_MODIFIER = -2;