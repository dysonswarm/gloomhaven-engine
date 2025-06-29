# CLAUDE.md - Gloomhaven Game Engine Implementation Instructions

## Project Overview

You are building a comprehensive Gloomhaven board game engine in React with TypeScript. The game should support all official rules with a modification to allow 5 players instead of 4. This is a complex tactical board game with deep mechanics.

## Project Setup

```bash
# Initialize the project
npx create-react-app gloomhaven-engine --template typescript
cd gloomhaven-engine

# Install required dependencies
npm install zustand immer
npm install react-hexgrid
npm install framer-motion
npm install react-dnd react-dnd-html5-backend
npm install lodash
npm install @types/lodash --save-dev

# Development dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
```

## Directory Structure

```
src/
├── components/
│   ├── game/
│   │   ├── GameBoard.tsx
│   │   ├── HexTile.tsx
│   │   ├── Figure.tsx
│   │   └── ...
│   ├── character/
│   │   ├── CharacterSheet.tsx
│   │   ├── AbilityCards.tsx
│   │   ├── ModifierDeck.tsx
│   │   └── ...
│   ├── monster/
│   │   ├── MonsterCard.tsx
│   │   ├── MonsterAI.tsx
│   │   └── ...
│   ├── campaign/
│   │   ├── CityView.tsx
│   │   ├── Shop.tsx
│   │   ├── EventCard.tsx
│   │   └── ...
│   └── ui/
│       ├── Initiative.tsx
│       ├── ElementTracker.tsx
│       └── ...
├── engine/
│   ├── core/
│   │   ├── gameState.ts
│   │   ├── hex.ts
│   │   ├── types.ts
│   │   └── constants.ts
│   ├── combat/
│   │   ├── attack.ts
│   │   ├── movement.ts
│   │   ├── conditions.ts
│   │   └── lineOfSight.ts
│   ├── character/
│   │   ├── character.ts
│   │   ├── abilities.ts
│   │   ├── progression.ts
│   │   └── equipment.ts
│   ├── monster/
│   │   ├── ai.ts
│   │   ├── focus.ts
│   │   └── abilities.ts
│   └── campaign/
│       ├── scenario.ts
│       ├── party.ts
│       ├── city.ts
│       └── events.ts
├── store/
│   ├── gameStore.ts
│   ├── characterStore.ts
│   └── campaignStore.ts
├── data/
│   ├── scenarios/
│   ├── characters/
│   ├── monsters/
│   ├── items/
│   └── events/
├── utils/
│   ├── helpers.ts
│   ├── validation.ts
│   └── calculations.ts
└── docs/
    ├── TECHNICAL_SPEC.md
    ├── AGILE_BREAKDOWN.md
    └── GAME_RULES.md
```

## Implementation Phases

### Phase 1: Core Foundation (Start Here)

1. **Create Basic Type System** (`src/engine/core/types.ts`)
```typescript
// Define all core interfaces: GameState, Hex, Figure, Character, Monster, etc.
// See TECHNICAL_SPEC.md for complete interface definitions
```

2. **Implement Hex Grid System** (`src/engine/core/hex.ts`)
```typescript
// Axial coordinate system
// Distance calculations
// Neighbor detection
// Path finding
```

3. **Create Game State Store** (`src/store/gameStore.ts`)
```typescript
// Use Zustand with Immer for immutable updates
// Define actions for state modifications
```

4. **Build Basic Game Board** (`src/components/game/GameBoard.tsx`)
```typescript
// Render hex grid
// Handle click events
// Basic zoom/pan
```

### Phase 2: Combat System

1. **Attack Resolution** (`src/engine/combat/attack.ts`)
   - Basic attack calculation
   - Attack modifier deck implementation
   - Advantage/disadvantage
   - Shield and pierce

2. **Movement System** (`src/engine/combat/movement.ts`)
   - Valid move calculation
   - Path finding with obstacles
   - Jump and flying movement

3. **Line of Sight** (`src/engine/combat/lineOfSight.ts`)
   - Corner-to-corner calculation
   - Wall blocking

4. **Conditions** (`src/engine/combat/conditions.ts`)
   - All condition types
   - Duration tracking
   - Effect application

### Phase 3: Character System

1. **Character Management** (`src/engine/character/character.ts`)
   - Character creation
   - Stats tracking
   - Hand management

2. **Ability Cards** (`src/engine/character/abilities.ts`)
   - Card selection
   - Initiative calculation
   - Action execution

3. **Character Progression** (`src/engine/character/progression.ts`)
   - Experience tracking
   - Level up system
   - Perk application

### Phase 4: Monster AI

1. **Focus Algorithm** (`src/engine/monster/focus.ts`)
   - Focus determination
   - Path optimization

2. **AI Decision Making** (`src/engine/monster/ai.ts`)
   - Ability selection
   - Movement decisions
   - Action execution

### Phase 5: Scenarios & Campaign

1. **Scenario System** (`src/engine/campaign/scenario.ts`)
   - Map loading
   - Objective tracking
   - Completion handling

2. **Campaign Management** (`src/engine/campaign/party.ts`)
   - Party tracking
   - Reputation/prosperity
   - Unlocks

## Code Standards

### TypeScript Conventions
```typescript
// Use strict typing - no 'any' types
// Prefer interfaces over types for objects
// Use enums for fixed sets of values
// Document complex functions with JSDoc

// Example:
/**
 * Calculates the hexagonal distance between two hexes
 * @param hex1 - First hex position
 * @param hex2 - Second hex position
 * @returns Distance in hex units
 */
export const hexDistance = (hex1: Hex, hex2: Hex): number => {
  return (Math.abs(hex1.q - hex2.q) + 
          Math.abs(hex1.q + hex1.r - hex2.q - hex2.r) + 
          Math.abs(hex1.r - hex2.r)) / 2;
};
```

### React Component Patterns
```typescript
// Use functional components with hooks
// Implement proper memoization for performance
// Keep components focused and small
// Use custom hooks for complex logic

// Example:
export const HexTile: React.FC<HexTileProps> = React.memo(({ hex, onClick }) => {
  const { isValidMove, isInRange } = useHexState(hex);
  
  return (
    <div 
      className={cn('hex-tile', {
        'valid-move': isValidMove,
        'in-range': isInRange
      })}
      onClick={() => onClick(hex)}
    >
      {/* Hex content */}
    </div>
  );
});
```

### State Management
```typescript
// Use Zustand stores for global state
// Keep derived state in selectors
// Use Immer for complex updates

// Example:
export const useGameStore = create<GameStore>((set, get) => ({
  gameState: initialGameState,
  
  moveCharacter: (characterId: string, targetHex: Hex) => {
    set(produce((draft: GameState) => {
      const character = draft.characters.get(characterId);
      if (character && isValidMove(character, targetHex)) {
        character.position = targetHex;
      }
    }));
  },
  
  // Selectors
  getCurrentCharacter: () => {
    const state = get().gameState;
    return state.characters.get(state.currentTurn.characterId);
  }
}));
```

## Testing Requirements

### Unit Tests
```typescript
// Test all game rule implementations
// Test edge cases thoroughly
// Mock complex dependencies

// Example:
describe('Attack Resolution', () => {
  test('should apply advantage correctly', () => {
    const result = resolveAttack(mockAttacker, mockTarget, 3, { advantage: true });
    expect(result.modifierCards).toHaveLength(2);
    expect(result.finalDamage).toBeGreaterThanOrEqual(0);
  });
});
```

### Integration Tests
```typescript
// Test full game flows
// Test state transitions
// Test UI interactions
```

## Implementation Order

1. **Start with Phase 1** - Get basic board rendering
2. **Implement simple movement** - Click to move without combat
3. **Add basic attacks** - Click to attack with fixed damage
4. **Build character cards** - Display and selection
5. **Add monster AI** - Simple movement and attacks
6. **Iterate on each system** - Add complexity incrementally

## Key Implementation Notes

### Hex Grid
- Use axial coordinates (q, r) not cube coordinates
- Pre-calculate neighbor relationships
- Cache distance calculations for performance

### Attack Modifiers
- Deck starts with 20 cards (standard composition)
- Shuffle when null or 2x is drawn
- Bless/curse are removed after drawing

### Monster AI Priority
1. Can attack this turn
2. Minimum movement required  
3. Avoiding disadvantage
4. Initiative as tiebreaker

### Five Player Modifications
- Scenario level +2
- Gold/XP rewards -2 per player
- Use 4-player monster counts
- Add 5th attack modifier deck

### Performance Considerations
- Memoize expensive calculations
- Use virtual scrolling for large maps
- Batch state updates
- Pre-calculate AI decisions

## Common Pitfalls to Avoid

1. **Don't trust user input** - Validate all moves/actions
2. **Handle edge cases** - Invisible targets, dead figures, etc.
3. **Maintain rule accuracy** - Reference official FAQ
4. **Optimize early** - This is a complex game
5. **Test AI thoroughly** - Many edge cases in focus/movement

## Data Structure Examples

### Scenario Data
```typescript
{
  "id": 1,
  "name": "Black Barrow",
  "mapTiles": ["L1a", "I1b"],
  "monsters": [
    { "type": "bandit_guard", "position": { "q": 3, "r": 2 }, "elite": false }
  ],
  "objectives": [
    { "type": "kill_all_enemies" }
  ]
}
```

### Character Data
```typescript
{
  "class": "brute",
  "name": "Krarg",
  "level": 3,
  "xp": 95,
  "hp": { "current": 8, "max": 10 },
  "cards": ["trample", "eye_for_an_eye", "sweeping_blow"],
  "items": [1, 3, 14],
  "perks": ["remove_minus_one", "add_plus_three"]
}
```

## Iteration Strategy

1. **Build MVP first** - Basic combat on a single room
2. **Add features incrementally** - One system at a time
3. **Get feedback early** - Test with sample scenarios
4. **Refactor regularly** - Keep code clean
5. **Document decisions** - Comment complex rules

## When You're Stuck

1. **Check the game rules** - See docs/GAME_RULES.md for core rules summary
2. **Reference the technical spec** - See docs/TECHNICAL_SPEC.md for detailed implementation
3. **Check the agile breakdown** - See docs/AGILE_BREAKDOWN.md for feature list
4. **Look at edge cases** - Common edge cases are documented in TECHNICAL_SPEC.md
5. **Test with examples** - Use simple scenarios first

## Core Game Rules Summary

### Turn Structure
1. **Card Selection** - Players select 2 cards from hand
2. **Initiative Reveal** - All initiatives revealed, order determined
3. **Figure Turns** - Each figure acts in initiative order
4. **End of Round** - Element waning, cleanup

### Combat Rules
- **Attack** = Base Attack + Modifier Card - Shield
- **Advantage** = Draw 2 modifiers, use better
- **Disadvantage** = Draw 2 modifiers, use worse
- **Range** measured in hexes, requires line of sight
- **Retaliate** triggers after taking damage from adjacent attacker

### Movement Rules
- **Normal** movement cannot pass through obstacles/enemies
- **Jump** movement ignores ground obstacles/enemies
- **Flying** movement ignores all ground effects
- Movement cost = 1 per hex unless difficult terrain

### Character Rules
- **Hand Size** varies by class (8-12 cards)
- **Exhaustion** when no cards left or HP reaches 0
- **Rest** to recover discarded cards (lose 1)
- **Level Up** at XP thresholds (45, 95, 150, etc.)

### Monster AI Rules
1. **Focus** on closest enemy they can attack
2. **Move** minimum hexes to attack focus
3. **Attack** with all available attacks
4. **Special abilities** as written on card

### Conditions
- **Poison/Wound** - Take 1 damage at turn start, removed by Heal
- **Immobilize** - Cannot move
- **Disarm** - Cannot attack
- **Stun** - Skip next turn
- **Muddle** - Disadvantage on attacks
- **Invisible** - Cannot be focused/targeted
- **Strengthen** - Advantage on attacks

### Elements
- **Strong** → **Waning** → **Inert** (each round)
- Infused at end of figure's turn
- Consumed at any point during turn

Remember: Start simple, test often, and build incrementally. The full game is complex, but each piece can be built and tested independently.