# Gloomhaven Digital Game Engine: Complete Technical Specification

## Executive Summary

This comprehensive specification details the implementation of a complete Gloomhaven game engine in React/TypeScript, supporting all core mechanics, campaign management, and modified for 5-player support. The engine covers combat mechanics, character progression, party management, campaign systems, and all rule complexities found in the official game.

## Core Architecture Overview

### Primary Game State Structure

```typescript
interface GloomhavenGameState {
  campaign: CampaignState;
  scenario: ActiveScenarioState | null;
  characters: Map<string, Character>;
  party: PartyState;
  city: CityState;
  gamePhase: GamePhase;
}

enum GamePhase {
  CAMPAIGN_MANAGEMENT = 'campaign',
  SCENARIO_SETUP = 'setup', 
  SCENARIO_PLAY = 'play',
  SCENARIO_CLEANUP = 'cleanup'
}
```

## Game Setup System

### Scenario Setup Process

**Setup Sequence Implementation:**
```typescript
interface ScenarioSetup {
  mapTiles: MapTile[];
  monsterGroups: MonsterGroup[];
  overlayTiles: OverlayTile[];
  treasures: TreasureTile[];
  specialRules: SpecialRule[];
  difficultyLevel: number;
}

const calculateScenarioLevel = (party: Character[]): number => {
  const averageLevel = party.reduce((sum, char) => sum + char.level, 0) / party.length;
  return Math.max(0, Math.floor(averageLevel / 2));
};

const setupScenario = (scenarioId: number, party: Character[]): ScenarioState => {
  const scenario = SCENARIOS[scenarioId];
  const difficultyLevel = calculateScenarioLevel(party);
  
  // Apply 5-player modification: +2 difficulty
  const adjustedLevel = party.length === 5 ? difficultyLevel + 2 : difficultyLevel;
  
  return {
    id: scenarioId,
    level: adjustedLevel,
    mapState: constructMap(scenario.layout),
    monsters: initializeMonsters(scenario.monsters, adjustedLevel),
    elements: initializeElements(),
    round: 0,
    initiative: [],
    phase: 'card_selection'
  };
};
```

### Character Setup and Hand Management

```typescript
interface Character {
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
}

const LEVEL_EXPERIENCE_THRESHOLDS = [0, 45, 95, 150, 210, 275, 345, 420, 500];
const LEVEL_PERK_COUNTS = [0, 1, 1, 2, 2, 3, 3, 4, 4]; // Cumulative perks available
```

## Turn Structure and Initiative System

### Round Flow Implementation

```typescript
interface Round {
  number: number;
  phase: RoundPhase;
  initiativeOrder: InitiativeEntry[];
  activePlayerIndex: number;
  elementTracker: ElementTracker;
}

enum RoundPhase {
  CARD_SELECTION = 'card_selection',
  INITIATIVE_REVEAL = 'initiative_reveal', 
  ACTIONS = 'actions',
  END_OF_ROUND = 'end_of_round'
}

interface InitiativeEntry {
  figureId: string;
  figureType: 'player' | 'monster';
  initiative: number;
  leadingCard?: AbilityCard;
  isLongRest: boolean;
}

const processRound = async (gameState: GameState): Promise<GameState> => {
  // 1. Card Selection Phase
  const selectedCards = await collectPlayerCardSelections(gameState.characters);
  
  // 2. Initiative Determination
  const initiatives = calculateInitiativeOrder(selectedCards, gameState.monsters);
  
  // 3. Action Phase - Process each figure in initiative order
  for (const entry of initiatives) {
    if (entry.figureType === 'player') {
      await processPlayerTurn(entry.figureId, selectedCards[entry.figureId]);
    } else {
      await processMonsterTurn(entry.figureId);
    }
  }
  
  // 4. End of Round - Element decay, cleanup
  return processEndOfRound(gameState);
};
```

### Initiative Tie-Breaking

```typescript
const resolveInitiativeTies = (entries: InitiativeEntry[]): InitiativeEntry[] => {
  return entries.sort((a, b) => {
    // Primary: Initiative value (lower goes first)
    if (a.initiative !== b.initiative) {
      return a.initiative - b.initiative;
    }
    
    // Tie-breaker 1: Players win ties vs monsters
    if (a.figureType !== b.figureType) {
      return a.figureType === 'player' ? -1 : 1;
    }
    
    // Tie-breaker 2: For players, use non-leading card initiative
    if (a.figureType === 'player' && b.figureType === 'player') {
      const aNonLeading = getNonLeadingCardInitiative(a.figureId);
      const bNonLeading = getNonLeadingCardInitiative(b.figureId);
      if (aNonLeading !== bNonLeading) {
        return aNonLeading - bNonLeading;
      }
      // Final tie-breaker: Player choice
      return 0; // Let UI handle player choice
    }
    
    return 0;
  });
};
```

## Combat System Implementation

### Attack Resolution Engine

```typescript
interface AttackResolution {
  baseAttack: number;
  modifierCards: AttackModifierCard[];
  advantage: boolean;
  disadvantage: boolean;
  pierce: number;
  effects: AttackEffect[];
  finalDamage: number;
  conditions: Condition[];
}

const resolveAttack = (
  attacker: Figure, 
  target: Figure, 
  attackValue: number,
  effects: AttackEffect[] = []
): AttackResolution => {
  
  // Determine advantage/disadvantage
  const hasAdvantage = calculateAdvantage(attacker, target, effects);
  const hasDisadvantage = calculateDisadvantage(attacker, target, effects);
  
  // Draw attack modifier cards
  const modifierCards = drawAttackModifiers(
    attacker.attackModifierDeck,
    hasAdvantage,
    hasDisadvantage
  );
  
  // Calculate final attack value
  let finalAttack = attackValue;
  let rollingEffects: Effect[] = [];
  
  for (const card of modifierCards) {
    if (card.value === 'null') {
      finalAttack = 0;
      break;
    } else if (card.value === '2x') {
      finalAttack *= 2;
    } else {
      finalAttack += card.value as number;
    }
    
    if (card.effects) {
      rollingEffects.push(...card.effects);
    }
    
    if (!card.rolling) break;
  }
  
  // Apply shield and calculate damage
  const pierce = calculatePierce(effects);
  const shield = calculateShield(target, pierce);
  const finalDamage = Math.max(0, finalAttack - shield);
  
  // Process attack effects and conditions
  const attackEffects = [...effects, ...rollingEffects];
  const conditions = extractConditions(attackEffects);
  
  return {
    baseAttack: attackValue,
    modifierCards,
    advantage: hasAdvantage && !hasDisadvantage,
    disadvantage: hasDisadvantage && !hasAdvantage,
    pierce,
    effects: attackEffects,
    finalDamage,
    conditions
  };
};
```

### Attack Modifier Deck Management

```typescript
interface AttackModifierDeck {
  cards: AttackModifierCard[];
  discardPile: AttackModifierCard[];
  blessCards: number; // Temporary cards
  curseCards: number; // Temporary cards
  needsReshuffle: boolean;
}

interface AttackModifierCard {
  id: string;
  value: number | 'null' | '2x';
  effects?: Effect[];
  rolling: boolean;
  bless: boolean;
  curse: boolean;
}

const STANDARD_MODIFIER_DECK: AttackModifierCard[] = [
  // 1x Null
  { id: 'null', value: 'null', rolling: false, bless: false, curse: false },
  // 1x Critical
  { id: 'crit', value: '2x', rolling: false, bless: false, curse: false },
  // 5x -1
  ...Array(5).fill(null).map((_, i) => ({ 
    id: `minus1_${i}`, value: -1, rolling: false, bless: false, curse: false 
  })),
  // 1x -2
  { id: 'minus2', value: -2, rolling: false, bless: false, curse: false },
  // 6x +0
  ...Array(6).fill(null).map((_, i) => ({ 
    id: `plus0_${i}`, value: 0, rolling: false, bless: false, curse: false 
  })),
  // 5x +1
  ...Array(5).fill(null).map((_, i) => ({ 
    id: `plus1_${i}`, value: 1, rolling: false, bless: false, curse: false 
  })),
  // 1x +2
  { id: 'plus2', value: 2, rolling: false, bless: false, curse: false }
];

const drawAttackModifiers = (
  deck: AttackModifierDeck,
  advantage: boolean,
  disadvantage: boolean
): AttackModifierCard[] => {
  if (advantage && disadvantage) {
    return [drawSingleModifier(deck)];
  }
  
  if (advantage || disadvantage) {
    const card1 = drawSingleModifier(deck);
    const card2 = drawSingleModifier(deck);
    
    return advantage 
      ? [selectBetterCard(card1, card2)]
      : [selectWorseCard(card1, card2)];
  }
  
  return [drawSingleModifier(deck)];
};

const drawSingleModifier = (deck: AttackModifierDeck): AttackModifierCard => {
  if (deck.cards.length === 0) {
    reshuffleDeck(deck);
  }
  
  const card = deck.cards.pop()!;
  
  // Handle special cards
  if (card.bless || card.curse) {
    // Remove from deck after drawing
    if (card.bless) deck.blessCards--;
    if (card.curse) deck.curseCards--;
  } else {
    deck.discardPile.push(card);
  }
  
  // Check for reshuffle trigger
  if (card.value === 'null' || card.value === '2x') {
    deck.needsReshuffle = true;
  }
  
  return card;
};
```

## Movement and Positioning System

### Hex-Based Map Implementation

```typescript
interface Hex {
  q: number; // Axial coordinate
  r: number; // Axial coordinate
  terrain: TerrainType;
  figure: Figure | null;
  overlay: OverlayTile | null;
}

enum TerrainType {
  NORMAL = 'normal',
  OBSTACLE = 'obstacle', 
  TRAP = 'trap',
  HAZARDOUS = 'hazardous',
  WALL = 'wall'
}

interface MovementRules {
  canMoveThrough: (hex: Hex, movementType: MovementType) => boolean;
  canEndMovementOn: (hex: Hex, figure: Figure) => boolean;
  calculatePath: (start: Hex, end: Hex, movementType: MovementType) => Hex[] | null;
}

enum MovementType {
  NORMAL = 'normal',
  JUMP = 'jump',
  FLYING = 'flying',
  TELEPORT = 'teleport'
}

const validateMovement = (
  figure: Figure,
  targetHex: Hex,
  movementValue: number,
  movementType: MovementType = MovementType.NORMAL
): boolean => {
  const path = calculatePath(figure.hex, targetHex, movementType);
  
  if (!path) return false;
  
  const movementCost = calculateMovementCost(path, movementType);
  
  return movementCost <= movementValue && canEndMovementOn(targetHex, figure);
};

const calculateDistance = (hex1: Hex, hex2: Hex): number => {
  return (Math.abs(hex1.q - hex2.q) + 
          Math.abs(hex1.q + hex1.r - hex2.q - hex2.r) + 
          Math.abs(hex1.r - hex2.r)) / 2;
};
```

### Line of Sight Implementation

```typescript
interface LineOfSightCalculator {
  hasLineOfSight: (fromHex: Hex, toHex: Hex, walls: Wall[]) => boolean;
  getHexCorners: (hex: Hex) => Point[];
  lineIntersectsWalls: (start: Point, end: Point, walls: Wall[]) => boolean;
}

const checkLineOfSight = (attacker: Hex, target: Hex, map: HexMap): boolean => {
  const attackerCorners = getHexCorners(attacker);
  const targetCorners = getHexCorners(target);
  
  // Try all corner-to-corner combinations
  for (const attackerCorner of attackerCorners) {
    for (const targetCorner of targetCorners) {
      if (!lineIntersectsWalls(attackerCorner, targetCorner, map.walls)) {
        return true;
      }
    }
  }
  
  return false;
};

const getHexCorners = (hex: Hex): Point[] => {
  const center = hexToPixel(hex);
  const corners: Point[] = [];
  
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    corners.push({
      x: center.x + HEX_RADIUS * Math.cos(angle),
      y: center.y + HEX_RADIUS * Math.sin(angle)
    });
  }
  
  return corners;
};
```

## Monster AI System

### Focus Determination Algorithm

```typescript
interface MonsterAI {
  determineFocus: (monster: Monster, enemies: Character[]) => Character | null;
  calculateOptimalPosition: (monster: Monster, focus: Character) => Hex;
  executeAbilities: (monster: Monster) => void;
}

const monsterFocusAlgorithm = (monster: Monster, enemies: Character[]): Character | null => {
  // Filter valid targets (not invisible unless monster has special sight)
  const validTargets = enemies.filter(enemy => 
    !enemy.conditions.some(c => c.type === 'invisible') ||
    monster.abilities.some(a => a.ignoresInvisible)
  );
  
  if (validTargets.length === 0) return null;
  
  const focusCandidates = validTargets.map(enemy => ({
    enemy,
    canAttackThisTurn: canMonsterAttackTarget(monster, enemy),
    movementRequired: calculateMovementToOptimalPosition(monster, enemy),
    disadvantageousHexes: countDisadvantageousHexesInPath(monster.hex, enemy.hex),
    initiative: enemy.initiative
  }));
  
  // Sort by focus priority
  focusCandidates.sort((a, b) => {
    // Priority 1: Can attack this turn
    if (a.canAttackThisTurn !== b.canAttackThisTurn) {
      return a.canAttackThisTurn ? -1 : 1;
    }
    
    // Priority 2: Minimum movement required
    if (a.movementRequired !== b.movementRequired) {
      return a.movementRequired - b.movementRequired;
    }
    
    // Priority 3: Fewest disadvantageous hexes
    if (a.disadvantageousHexes !== b.disadvantageousHexes) {
      return a.disadvantageousHexes - b.disadvantageousHexes;
    }
    
    // Priority 4: Earliest initiative
    return a.initiative - b.initiative;
  });
  
  return focusCandidates[0].enemy;
};

const calculateMonsterMovement = (monster: Monster, focus: Character): Hex => {
  const abilities = monster.currentAbilities;
  const moveAbility = abilities.find(a => a.type === 'move');
  const attackAbility = abilities.find(a => a.type === 'attack');
  
  if (!moveAbility) return monster.hex;
  
  const moveValue = moveAbility.value;
  const attackRange = attackAbility?.range || 1;
  
  // Find optimal position within movement range
  const possiblePositions = getHexesWithinDistance(monster.hex, moveValue);
  
  const scoredPositions = possiblePositions.map(hex => ({
    hex,
    score: scorePosition(hex, focus, attackRange, monster.hex)
  }));
  
  scoredPositions.sort((a, b) => b.score - a.score);
  
  return scoredPositions[0].hex;
};
```

## Element System

### Element Tracking Implementation

```typescript
interface ElementTracker {
  fire: ElementState;
  ice: ElementState;
  air: ElementState;
  earth: ElementState;
  light: ElementState;
  dark: ElementState;
}

enum ElementState {
  INERT = 'inert',
  WANING = 'waning',
  STRONG = 'strong'
}

interface ElementSystem {
  tracker: ElementTracker;
  infuseElement: (element: ElementType) => void;
  consumeElement: (element: ElementType) => boolean;
  processEndOfRound: () => void;
}

const processElementInfusion = (element: ElementType, tracker: ElementTracker): void => {
  // Elements move to Strong at end of figure's turn
  tracker[element] = ElementState.STRONG;
};

const processElementConsumption = (element: ElementType, tracker: ElementTracker): boolean => {
  if (tracker[element] === ElementState.STRONG || tracker[element] === ElementState.WANING) {
    tracker[element] = ElementState.INERT;
    return true;
  }
  return false;
};

const processEndOfRoundElements = (tracker: ElementTracker): void => {
  for (const element of Object.keys(tracker) as ElementType[]) {
    switch (tracker[element]) {
      case ElementState.STRONG:
        tracker[element] = ElementState.WANING;
        break;
      case ElementState.WANING:
        tracker[element] = ElementState.INERT;
        break;
      // INERT stays INERT
    }
  }
};
```

## Conditions and Status Effects System

### Comprehensive Condition Implementation

```typescript
interface Condition {
  type: ConditionType;
  duration: ConditionDuration;
  source?: string;
  value?: number; // For conditions with numeric effects
}

enum ConditionType {
  POISON = 'poison',
  WOUND = 'wound',
  IMMOBILIZE = 'immobilize',
  DISARM = 'disarm',
  STUN = 'stun',
  MUDDLE = 'muddle',
  INVISIBLE = 'invisible',
  STRENGTHEN = 'strengthen',
  BRITTLE = 'brittle',
  BANE = 'bane',
  REGENERATE = 'regenerate',
  WARD = 'ward'
}

enum ConditionDuration {
  END_OF_NEXT_TURN = 'end_of_next_turn',
  END_OF_SCENARIO = 'end_of_scenario',
  UNTIL_HEALED = 'until_healed',
  PERMANENT = 'permanent'
}

const CONDITION_EFFECTS: Record<ConditionType, ConditionEffect> = {
  [ConditionType.POISON]: {
    onTurnStart: (figure: Figure) => {
      figure.takeDamage(1);
    },
    onHeal: (condition: Condition, figure: Figure) => {
      figure.removeCondition(condition);
    }
  },
  
  [ConditionType.WOUND]: {
    onTurnStart: (figure: Figure) => {
      figure.takeDamage(1);
    },
    onHeal: (condition: Condition, figure: Figure) => {
      figure.removeCondition(condition);
    }
  },
  
  [ConditionType.IMMOBILIZE]: {
    onMoveAttempt: (figure: Figure) => false // Prevent movement
  },
  
  [ConditionType.DISARM]: {
    onAttackAttempt: (figure: Figure) => false // Prevent attacks
  },
  
  [ConditionType.STUN]: {
    onTurnStart: (figure: Figure) => {
      figure.skipTurn = true;
      figure.removeCondition(ConditionType.STUN);
    }
  },
  
  [ConditionType.MUDDLE]: {
    onAttack: (attack: Attack) => {
      attack.disadvantage = true;
    }
  },
  
  [ConditionType.INVISIBLE]: {
    onTargeted: (figure: Figure) => false // Cannot be targeted by enemies
  },
  
  [ConditionType.STRENGTHEN]: {
    onAttack: (attack: Attack) => {
      attack.advantage = true;
    }
  },
  
  [ConditionType.BRITTLE]: {
    onDamageTaken: (damage: number, figure: Figure) => {
      const doubleDamage = damage * 2;
      figure.removeCondition(ConditionType.BRITTLE);
      return doubleDamage;
    }
  }
};
```

## Character Progression System

### Experience and Leveling

```typescript
interface CharacterProgression {
  experience: number;
  level: number;
  availablePerks: Perk[];
  appliedPerks: Perk[];
  battleGoalCheckmarks: number;
  personalQuest: PersonalQuest;
}

const EXPERIENCE_THRESHOLDS = [0, 45, 95, 150, 210, 275, 345, 420, 500];

const processLevelUp = (character: Character): Character => {
  const currentThreshold = EXPERIENCE_THRESHOLDS[character.level];
  const nextThreshold = EXPERIENCE_THRESHOLDS[character.level + 1];
  
  if (character.experience >= nextThreshold && character.level < 9) {
    return {
      ...character,
      level: character.level + 1,
      maxHP: calculateMaxHP(character.class, character.level + 1),
      availablePerks: [...character.availablePerks, getNewPerk(character.class)],
      // Add new ability card to pool (player choice)
    };
  }
  
  return character;
};

interface Perk {
  id: string;
  description: string;
  modifierDeckChanges: ModifierDeckChange[];
  otherEffects?: Effect[];
}

interface ModifierDeckChange {
  action: 'add' | 'remove' | 'replace';
  fromCards?: AttackModifierCard[];
  toCards?: AttackModifierCard[];
  count: number;
}

const applyPerk = (character: Character, perk: Perk): Character => {
  let updatedDeck = { ...character.attackModifierDeck };
  
  for (const change of perk.modifierDeckChanges) {
    switch (change.action) {
      case 'remove':
        updatedDeck = removeDeckCards(updatedDeck, change.fromCards!, change.count);
        break;
      case 'add':
        updatedDeck = addDeckCards(updatedDeck, change.toCards!, change.count);
        break;
      case 'replace':
        updatedDeck = replaceDeckCards(updatedDeck, change.fromCards!, change.toCards!, change.count);
        break;
    }
  }
  
  return {
    ...character,
    attackModifierDeck: updatedDeck,
    appliedPerks: [...character.appliedPerks, perk]
  };
};
```

### Personal Quests and Retirement

```typescript
interface PersonalQuest {
  id: string;
  name: string;
  description: string;
  requirements: QuestRequirement[];
  progress: number;
  isCompleted: boolean;
  reward: RetirementReward;
}

interface QuestRequirement {
  type: 'kill_monsters' | 'complete_scenarios' | 'exhaust_times' | 'gold_collected' | 'loot_treasures';
  target: string | number;
  count: number;
  locations?: string[];
  current: number;
}

interface RetirementReward {
  unlockedClass: string;
  cityEvents: number[];
  roadEvents: number[];
  prosperityIncrease: number;
}

const updatePersonalQuestProgress = (
  character: Character, 
  action: GameAction
): Character => {
  const quest = character.personalQuest;
  let updatedProgress = quest.progress;
  
  for (const requirement of quest.requirements) {
    switch (requirement.type) {
      case 'kill_monsters':
        if (action.type === 'monster_killed' && 
            requirement.target === action.monsterType) {
          requirement.current++;
        }
        break;
      case 'complete_scenarios':
        if (action.type === 'scenario_completed' &&
            (!requirement.locations || 
             requirement.locations.includes(action.scenario.location))) {
          requirement.current++;
        }
        break;
      case 'exhaust_times':
        if (action.type === 'character_exhausted' &&
            action.characterId === character.id) {
          requirement.current++;
        }
        break;
    }
  }
  
  const isCompleted = quest.requirements.every(req => req.current >= req.count);
  
  return {
    ...character,
    personalQuest: {
      ...quest,
      progress: updatedProgress,
      isCompleted
    }
  };
};

const processRetirement = (character: Character, campaign: CampaignState): CampaignState => {
  if (!character.personalQuest.isCompleted) {
    throw new Error('Cannot retire character with incomplete personal quest');
  }
  
  const reward = character.personalQuest.reward;
  
  return {
    ...campaign,
    unlockedClasses: [...campaign.unlockedClasses, reward.unlockedClass],
    prosperity: campaign.prosperity + reward.prosperityIncrease,
    cityEvents: [...campaign.cityEvents, ...reward.cityEvents],
    roadEvents: [...campaign.roadEvents, ...reward.roadEvents],
    // Return character items to shop
    availableItems: returnItemsToShop(campaign.availableItems, character.equipment)
  };
};
```

## Campaign Management System

### Scenario Management

```typescript
interface CampaignState {
  scenarios: Map<number, ScenarioState>;
  completedScenarios: Set<number>;
  availableScenarios: Set<number>;
  globalAchievements: Set<string>;
  partyAchievements: Set<string>;
  prosperity: number;
  reputation: number;
  donations: number;
  unlockedClasses: Set<string>;
  sealedContent: Map<string, boolean>;
}

interface ScenarioState {
  id: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  completionRewards: ScenarioReward[];
  linkedScenarios: number[]; // No road events when traveling between these
}

interface ScenarioReward {
  type: 'gold' | 'experience' | 'prosperity' | 'reputation' | 'item' | 'scenario_unlock' | 'achievement';
  value: number | string;
  individual?: boolean; // Individual vs party reward
}

const processScenarioCompletion = (
  scenarioId: number,
  success: boolean,
  campaign: CampaignState,
  party: Character[]
): CampaignState => {
  
  if (!success) {
    return campaign; // No rewards for failed scenarios
  }
  
  const scenario = SCENARIOS[scenarioId];
  let updatedCampaign = { ...campaign };
  
  // Mark scenario as completed
  updatedCampaign.completedScenarios.add(scenarioId);
  
  // Process rewards
  for (const reward of scenario.completionRewards) {
    switch (reward.type) {
      case 'prosperity':
        updatedCampaign.prosperity += reward.value as number;
        break;
      case 'reputation':
        updatedCampaign.reputation = Math.max(-20, Math.min(20, 
          updatedCampaign.reputation + (reward.value as number)));
        break;
      case 'scenario_unlock':
        updatedCampaign.availableScenarios.add(reward.value as number);
        break;
      case 'achievement':
        updatedCampaign.globalAchievements.add(reward.value as string);
        break;
    }
  }
  
  // Check for sealed content unlocks
  updatedCampaign = checkSealedContentUnlocks(updatedCampaign);
  
  return updatedCampaign;
};
```

### City and Road Events System

```typescript
interface EventCard {
  id: number;
  type: 'city' | 'road';
  title: string;
  description: string;
  options: EventOption[];
  requirements?: EventRequirement[];
  addedToDeck?: TriggerCondition[];
  removeAfterUse: boolean;
}

interface EventOption {
  text: string;
  outcomes: EventOutcome[];
}

interface EventOutcome {
  condition?: string; // "reputation >= 5", "Scoundrel present", etc.
  effects: EventEffect[];
}

interface EventEffect {
  type: 'gold' | 'item' | 'reputation' | 'prosperity' | 'damage' | 'condition' | 'scenario_unlock';
  value: number | string;
  target: 'party' | 'individual' | 'character_class';
  characterClass?: string;
}

const processEvent = (
  eventCard: EventCard,
  selectedOption: number,
  party: Character[],
  campaign: CampaignState
): { updatedCampaign: CampaignState, updatedParty: Character[] } => {
  
  const option = eventCard.options[selectedOption];
  let updatedCampaign = { ...campaign };
  let updatedParty = [...party];
  
  // Find applicable outcome based on conditions
  const applicableOutcome = option.outcomes.find(outcome => 
    !outcome.condition || evaluateCondition(outcome.condition, party, campaign)
  ) || option.outcomes[0]; // Default to first outcome
  
  // Apply effects
  for (const effect of applicableOutcome.effects) {
    switch (effect.type) {
      case 'reputation':
        updatedCampaign.reputation = Math.max(-20, Math.min(20,
          updatedCampaign.reputation + (effect.value as number)));
        break;
      case 'prosperity':
        updatedCampaign.prosperity += effect.value as number;
        break;
      case 'gold':
        if (effect.target === 'party') {
          updatedParty = updatedParty.map(char => ({
            ...char,
            gold: char.gold + (effect.value as number)
          }));
        }
        break;
      case 'item':
        // Add item to available shop items or give to specific character
        break;
    }
  }
  
  // Remove event from deck if specified
  if (eventCard.removeAfterUse) {
    removeEventFromDeck(eventCard.id, eventCard.type, updatedCampaign);
  }
  
  return { updatedCampaign, updatedParty };
};
```

## Item System Implementation

### Equipment and Shop Management

```typescript
interface Item {
  id: number;
  name: string;
  cost: number;
  slot: EquipmentSlot;
  level?: number; // For small items
  effects: ItemEffect[];
  usageType: 'unlimited' | 'spent' | 'consumed';
  maxUses?: number;
  modifierCards?: AttackModifierCard[]; // Cards added to deck when equipped
}

enum EquipmentSlot {
  HEAD = 'head',
  BODY = 'body', 
  LEGS = 'legs',
  ONE_HAND = 'one_hand',
  TWO_HAND = 'two_hand',
  SMALL_ITEM = 'small_item'
}

interface Equipment {
  head: Item | null;
  body: Item | null;
  legs: Item | null;
  hands: Item[]; // Max 2 one-hand OR 1 two-hand
  smallItems: Item[]; // Max = character level / 2 (rounded up)
}

interface Shop {
  availableItems: Map<number, number>; // itemId -> quantity
  prosperityLevel: number;
  
  getAvailableItems(): Item[] {
    return ITEMS.filter(item => 
      this.availableItems.has(item.id) &&
      this.availableItems.get(item.id)! > 0 &&
      this.isUnlockedAtProsperity(item, this.prosperityLevel)
    );
  }
  
  calculatePrice(item: Item, reputation: number): number {
    const reputationModifier = this.getReputationPriceModifier(reputation);
    return Math.max(1, item.cost + reputationModifier);
  }
  
  private getReputationPriceModifier(reputation: number): number {
    if (reputation >= 18) return -5;
    if (reputation >= 14) return -4;
    if (reputation >= 10) return -3;
    if (reputation >= 6) return -2;
    if (reputation >= 2) return -1;
    if (reputation >= -2) return 0;
    if (reputation >= -6) return 1;
    if (reputation >= -10) return 2;
    if (reputation >= -14) return 3;
    if (reputation >= -18) return 4;
    return 5;
  }
}

const equipItem = (character: Character, item: Item): Character => {
  // Validate equipment constraints
  if (!canEquipItem(character, item)) {
    throw new Error(`Cannot equip ${item.name}: constraints not met`);
  }
  
  let updatedEquipment = { ...character.equipment };
  let updatedDeck = { ...character.attackModifierDeck };
  
  // Add to appropriate slot
  switch (item.slot) {
    case EquipmentSlot.HEAD:
      updatedEquipment.head = item;
      break;
    case EquipmentSlot.TWO_HAND:
      updatedEquipment.hands = [item];
      break;
    case EquipmentSlot.ONE_HAND:
      if (updatedEquipment.hands.length < 2) {
        updatedEquipment.hands.push(item);
      }
      break;
    case EquipmentSlot.SMALL_ITEM:
      if (updatedEquipment.smallItems.length < Math.ceil(character.level / 2)) {
        updatedEquipment.smallItems.push(item);
      }
      break;
  }
  
  // Add modifier cards if item has them
  if (item.modifierCards) {
    updatedDeck.cards.push(...item.modifierCards);
  }
  
  return {
    ...character,
    equipment: updatedEquipment,
    attackModifierDeck: updatedDeck
  };
};
```

### Enhancement System

```typescript
interface Enhancement {
  type: 'attack' | 'move' | 'range' | 'shield' | 'retaliate' | 'heal' | 'push' | 'pull' | 'pierce' | 'element' | 'condition';
  value?: number;
  element?: ElementType;
  condition?: ConditionType;
  slot: 'square' | 'circle' | 'diamond';
}

interface EnhancementCost {
  base: number;
  level: number;
  previous: number; // Cost increase from previous enhancements
}

const ENHANCEMENT_COSTS: Record<string, EnhancementCost> = {
  '+1_attack': { base: 30, level: 10, previous: 75 },
  '+1_move': { base: 30, level: 20, previous: 50 },
  '+1_range': { base: 30, level: 15, previous: 30 },
  'element': { base: 50, level: 20, previous: 25 },
  'condition': { base: 75, level: 25, previous: 75 },
  'jump': { base: 60, level: 20, previous: 50 }
};

const calculateEnhancementCost = (
  enhancement: Enhancement,
  cardLevel: number,
  previousEnhancements: number
): number => {
  const costData = ENHANCEMENT_COSTS[`${enhancement.type}_${enhancement.value || ''}`] || 
                   ENHANCEMENT_COSTS[enhancement.type];
  
  if (!costData) throw new Error(`Unknown enhancement type: ${enhancement.type}`);
  
  return costData.base + 
         (costData.level * cardLevel) + 
         (costData.previous * previousEnhancements);
};

const enhanceAbilityCard = (
  card: AbilityCard,
  enhancement: Enhancement,
  character: Character,
  campaign: CampaignState
): { updatedCard: AbilityCard, updatedCharacter: Character } => {
  
  const cost = calculateEnhancementCost(enhancement, card.level, card.enhancements.length);
  
  if (character.gold < cost) {
    throw new Error('Insufficient gold for enhancement');
  }
  
  // Check prosperity limit
  const totalEnhancements = countTotalEnhancements(character);
  if (totalEnhancements >= campaign.prosperity) {
    throw new Error('Enhancement limit reached (prosperity constraint)');
  }
  
  const updatedCard = {
    ...card,
    enhancements: [...card.enhancements, enhancement]
  };
  
  const updatedCharacter = {
    ...character,
    gold: character.gold - cost
  };
  
  return { updatedCard, updatedCharacter };
};
```

## Five-Player Support Implementation

### Core Modifications for 5-Player Support

```typescript
interface FivePlayerModifications {
  maxPartySize: 5;
  difficultyAdjustment: 2; // +2 to scenario level
  rewardPenalty: 2; // -2 to reward calculations
  monsterScaling: 'standard'; // Use 4-player monster counts
  additionalRequirements: {
    fifthAttackModifierDeck: true;
    extendedGameTime: true;
  };
}

const adjustForFivePlayer = (gameState: GameState): GameState => {
  if (gameState.party.characters.length !== 5) {
    return gameState;
  }
  
  // Adjust scenario difficulty
  const adjustedLevel = gameState.scenario.level + 2;
  
  // Modify monster stats for higher level
  const adjustedMonsters = gameState.scenario.monsters.map(monster => 
    adjustMonsterForLevel(monster, adjustedLevel)
  );
  
  // Reduce reward calculations
  const adjustedRewards = gameState.scenario.rewards.map(reward => {
    if (reward.type === 'gold' || reward.type === 'experience') {
      return {
        ...reward,
        value: Math.max(1, reward.value - 2)
      };
    }
    return reward;
  });
  
  return {
    ...gameState,
    scenario: {
      ...gameState.scenario,
      level: adjustedLevel,
      monsters: adjustedMonsters,
      rewards: adjustedRewards
    }
  };
};

// Additional attack modifier deck for 5th player
const createFifthPlayerDeck = (): AttackModifierDeck => {
  return {
    cards: [...STANDARD_MODIFIER_DECK],
    discardPile: [],
    blessCards: 0,
    curseCards: 0,
    needsReshuffle: false
  };
};

// Extended initiative management for 5 players
const manageFivePlayerInitiative = (initiatives: InitiativeEntry[]): InitiativeEntry[] => {
  // Standard initiative rules apply, but with more complex tie resolution
  // due to additional players
  return resolveComplexInitiativeTies(initiatives);
};
```

### Performance Optimizations for 5-Player Games

```typescript
interface PerformanceOptimizations {
  // Parallel processing for AI calculations
  parallelMonsterAI: boolean;
  // Pre-calculated movement options
  cachedMovementPaths: Map<string, Hex[]>;
  // Optimized state updates
  batchedStateUpdates: boolean;
}

const optimizeForFivePlayer = (gameState: GameState): GameState => {
  // Pre-calculate monster movements to reduce turn time
  const monsterMovements = new Map();
  
  gameState.scenario.monsters.forEach(monster => {
    const possibleMoves = calculateAllPossibleMoves(monster);
    monsterMovements.set(monster.id, possibleMoves);
  });
  
  return {
    ...gameState,
    preCalculatedData: {
      monsterMovements,
      lineOfSightCache: new Map(),
      pathfindingCache: new Map()
    }
  };
};
```

## Edge Cases and Rule Clarifications

### Critical Edge Cases Implementation

```typescript
interface EdgeCaseHandling {
  // Rolling modifiers with advantage/disadvantage
  handleRollingModifiersWithAdvantage: (cards: AttackModifierCard[]) => AttackModifierCard;
  
  // Retaliate vs dead attackers
  processRetaliateAfterAttackerDeath: (attacker: Figure, defender: Figure) => boolean;
  
  // Push/pull into hazardous terrain
  handleForcedMovementIntoHazards: (figure: Figure, destination: Hex) => void;
  
  // Multiple conditions of same type
  handleConditionStacking: (figure: Figure, condition: Condition) => void;
  
  // Monster spawning mid-scenario
  handleMidScenarioSpawning: (monster: Monster, currentRound: number) => void;
}

// Rolling modifiers with advantage still follow advantage rules
const handleRollingAdvantage = (deck: AttackModifierDeck): AttackModifierCard[] => {
  const drawnCards: AttackModifierCard[] = [];
  
  // Draw two separate chains of rolling modifiers
  const chain1 = drawRollingChain(deck);
  const chain2 = drawRollingChain(deck);
  
  drawnCards.push(...chain1, ...chain2);
  
  // Select better final non-rolling card
  const finalCard1 = chain1[chain1.length - 1];
  const finalCard2 = chain2[chain2.length - 1];
  
  const betterCard = selectBetterCard(finalCard1, finalCard2);
  
  // Apply all rolling effects from the chosen chain
  const chosenChain = finalCard1 === betterCard ? chain1 : chain2;
  return chosenChain;
};

// Summons don't act on the round they're summoned
const handleSummonActivation = (summon: Summon, currentRound: number): boolean => {
  return summon.spawnedRound < currentRound;
};

// Area attacks don't affect allies unless specifically stated
const filterAoETargets = (targets: Figure[], attacker: Figure): Figure[] => {
  return targets.filter(target => {
    // Skip allies unless ability specifically targets allies
    if (target.team === attacker.team && !attacker.currentAbility.targetsAllies) {
      return false;
    }
    return true;
  });
};

// Invisible characters cannot be focused by monsters unless special rules
const canMonsterFocusInvisible = (monster: Monster, target: Character): boolean => {
  const isInvisible = target.conditions.some(c => c.type === 'invisible');
  const hasSpecialSight = monster.abilities.some(a => a.ignoresInvisible);
  
  return !isInvisible || hasSpecialSight;
};
```

## React Component Architecture

### Core Component Structure

```typescript
// Main game container
interface GloomhavenGameProps {
  gameState: GloomhavenGameState;
  onStateChange: (newState: GloomhavenGameState) => void;
}

const GloomhavenGame: React.FC<GloomhavenGameProps> = ({ gameState, onStateChange }) => {
  return (
    <div className="gloomhaven-game">
      {gameState.gamePhase === GamePhase.CAMPAIGN_MANAGEMENT && (
        <CampaignManagement 
          campaign={gameState.campaign}
          party={gameState.party}
          onPhaseChange={(phase) => onStateChange({ ...gameState, gamePhase: phase })}
        />
      )}
      
      {gameState.gamePhase === GamePhase.SCENARIO_PLAY && (
        <ScenarioPlay
          scenario={gameState.scenario!}
          characters={gameState.characters}
          onScenarioComplete={(result) => handleScenarioComplete(result)}
        />
      )}
    </div>
  );
};

// Scenario play component
const ScenarioPlay: React.FC<ScenarioPlayProps> = ({ scenario, characters }) => {
  return (
    <div className="scenario-play">
      <GameBoard 
        map={scenario.mapState}
        figures={getAllFigures(scenario, characters)}
        onHexClick={handleHexClick}
      />
      
      <InitiativeTracker 
        initiatives={scenario.initiative}
        currentPlayer={scenario.currentPlayer}
      />
      
      <ElementTracker 
        elements={scenario.elements}
        onElementUpdate={handleElementUpdate}
      />
      
      <CharacterPanels 
        characters={characters}
        onCardPlay={handleCardPlay}
        onAbilityUse={handleAbilityUse}
      />
      
      <MonsterPanels 
        monsters={scenario.monsters}
        onMonsterAction={handleMonsterAction}
      />
    </div>
  );
};
```

### State Management with Redux/Zustand

```typescript
interface GameStore {
  gameState: GloomhavenGameState;
  
  // Actions
  startScenario: (scenarioId: number) => void;
  playCards: (characterId: string, cards: AbilityCard[]) => void;
  processAttack: (attackerId: string, targetId: string, attack: Attack) => void;
  processMovement: (figureId: string, destination: Hex) => void;
  endTurn: (figureId: string) => void;
  endRound: () => void;
  completeScenario: (success: boolean) => void;
  
  // Selectors
  getCurrentFigure: () => Figure | null;
  getAvailableActions: (figureId: string) => Action[];
  getValidMovementHexes: (figureId: string) => Hex[];
  getValidAttackTargets: (figureId: string) => Figure[];
}

const useGameStore = create<GameStore>((set, get) => ({
  gameState: initialGameState,
  
  startScenario: (scenarioId: number) => {
    const party = Array.from(get().gameState.characters.values());
    const scenario = setupScenario(scenarioId, party);
    
    set(state => ({
      gameState: {
        ...state.gameState,
        scenario,
        gamePhase: GamePhase.SCENARIO_PLAY
      }
    }));
  },
  
  playCards: (characterId: string, cards: AbilityCard[]) => {
    // Validate card selection
    // Update character state
    // Process card effects
    // Update initiative order
  },
  
  // ... other actions
}));
```

## Testing Strategy

### Unit Test Coverage

```typescript
describe('Attack Resolution System', () => {
  test('should handle null modifier correctly', () => {
    const attack = resolveAttack(mockAttacker, mockTarget, 5, []);
    expect(attack.finalDamage).toBe(0);
  });
  
  test('should apply advantage correctly with rolling modifiers', () => {
    const mockDeck = createMockDeck([
      { value: 1, rolling: true },
      { value: 0, rolling: false },
      { value: 2, rolling: false }
    ]);
    
    const result = drawAttackModifiers(mockDeck, true, false);
    expect(result.length).toBe(1);
    expect(result[0].value).toBe(2);
  });
  
  test('should handle 5-player difficulty adjustment', () => {
    const party = createMockParty(5);
    const scenario = setupScenario(1, party);
    
    expect(scenario.level).toBe(calculateScenarioLevel(party) + 2);
  });
});

describe('Monster AI System', () => {
  test('should focus closest enemy when multiple options', () => {
    const monster = createMockMonster();
    const enemies = [
      createMockCharacter({ position: { q: 2, r: 0 } }),
      createMockCharacter({ position: { q: 1, r: 0 } })
    ];
    
    const focus = monsterFocusAlgorithm(monster, enemies);
    expect(focus.hex.q).toBe(1);
  });
  
  test('should not focus invisible characters', () => {
    const monster = createMockMonster();
    const enemies = [
      createMockCharacter({ conditions: [{ type: 'invisible' }] }),
      createMockCharacter({ position: { q: 5, r: 0 } })
    ];
    
    const focus = monsterFocusAlgorithm(monster, enemies);
    expect(focus.hex.q).toBe(5);
  });
});
```

## Performance Considerations

### Optimization Strategies

```typescript
// Memoization for expensive calculations
const useMemoizedLineOfSight = () => {
  return useMemo(() => {
    const cache = new Map<string, boolean>();
    
    return (from: Hex, to: Hex): boolean => {
      const key = `${from.q},${from.r}-${to.q},${to.r}`;
      
      if (!cache.has(key)) {
        cache.set(key, calculateLineOfSight(from, to));
      }
      
      return cache.get(key)!;
    };
  }, []);
};

// Batch state updates for complex operations
const useBatchedUpdates = () => {
  const [pendingUpdates, setPendingUpdates] = useState<StateUpdate[]>([]);
  
  const batchUpdate = useCallback((update: StateUpdate) => {
    setPendingUpdates(prev => [...prev, update]);
  }, []);
  
  const flushUpdates = useCallback(() => {
    // Apply all pending updates in single operation
    const finalState = pendingUpdates.reduce(applyUpdate, currentState);
    setGameState(finalState);
    setPendingUpdates([]);
  }, [pendingUpdates]);
  
  return { batchUpdate, flushUpdates };
};

// Virtualization for large hex grids
const VirtualizedHexGrid: React.FC<HexGridProps> = ({ hexes, viewPort }) => {
  const visibleHexes = useMemo(() => {
    return hexes.filter(hex => isHexInViewport(hex, viewPort));
  }, [hexes, viewPort]);
  
  return (
    <div className="hex-grid">
      {visibleHexes.map(hex => (
        <HexTile key={`${hex.q}-${hex.r}`} hex={hex} />
      ))}
    </div>
  );
};
```

## Conclusion

This comprehensive specification provides the complete foundation for implementing a full-featured Gloomhaven digital game engine in React/TypeScript. The system supports all core mechanics including:

- **Complete combat system** with attack modifiers, conditions, and monster AI
- **Full campaign management** with character progression, retirement, and unlocking
- **Comprehensive item and enhancement systems**
- **Event management** for city and road events
- **5-player support** with proper difficulty scaling and component management
- **Edge case handling** for complex rule interactions

The architecture emphasizes type safety, performance optimization, and maintainable code structure while faithfully implementing the complex rule set of the original board game. This specification enables development of a digital version that captures the full depth and strategic complexity of Gloomhaven while providing the enhanced experience possible through digital implementation.

Key implementation priorities should focus on the core combat engine first, followed by character progression systems, then campaign management features. The modular architecture allows for incremental development while maintaining system integrity throughout the development process.s