/**
 * Main game state store using Zustand with Immer for immutable updates
 * Manages the core game state, characters, scenarios, and game flow
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { enableMapSet } from 'immer'

// Enable Map and Set support for Immer
enableMapSet()
import { 
  GloomhavenGameState, 
  GamePhase, 
  Character, 
  Hex,
  Element,
  ElementState,
  InitiativeEntry,
  RoundPhase
} from '../engine/core/types'
import { hexToKey } from '../engine/core/hex'

// ===== INITIAL STATE =====

const createInitialElementTracker = () => ({
  [Element.FIRE]: ElementState.INERT,
  [Element.ICE]: ElementState.INERT,
  [Element.AIR]: ElementState.INERT,
  [Element.EARTH]: ElementState.INERT,
  [Element.LIGHT]: ElementState.INERT,
  [Element.DARK]: ElementState.INERT
})

const createInitialGameState = (): GloomhavenGameState => ({
  campaign: {
    name: 'New Campaign',
    reputation: 0,
    prosperity: 1,
    donations: 0,
    scenariosCompleted: new Set(),
    scenariosUnlocked: new Set([1]), // Black Barrow always unlocked
    achievementsUnlocked: new Set(),
    retirements: []
  },
  scenario: null,
  characters: new Map(),
  party: {
    location: 'Gloomhaven',
    members: [],
    achievements: new Set(),
    reputation: 0,
    notes: ''
  },
  city: {
    events: [],
    shop: {
      availableItems: new Set(),
      soldItems: new Set(),
      prosperity: 1
    },
    enhancements: []
  },
  gamePhase: GamePhase.CAMPAIGN_MANAGEMENT
})

// ===== STORE INTERFACE =====

interface GameStore {
  // State
  gameState: GloomhavenGameState
  
  // Basic game flow actions
  setGamePhase: (phase: GamePhase) => void
  
  // Character management
  addCharacter: (character: Character) => void
  removeCharacter: (characterId: string) => void
  updateCharacter: (characterId: string, updates: Partial<Character>) => void
  moveCharacter: (characterId: string, targetHex: Hex) => void
  
  // Party management
  addToParty: (characterId: string) => void
  removeFromParty: (characterId: string) => void
  updatePartyLocation: (location: string) => void
  updatePartyReputation: (change: number) => void
  
  // Scenario management
  startScenario: (scenarioId: number, partyMembers: string[]) => void
  endScenario: (success: boolean) => void
  updateScenarioPhase: (phase: RoundPhase) => void
  
  // Initiative and turn management
  setInitiativeOrder: (order: InitiativeEntry[]) => void
  nextTurn: () => void
  endRound: () => void
  
  // Element management
  infuseElement: (element: Element) => void
  consumeElement: (element: Element) => boolean
  waneElements: () => void
  
  // Campaign management
  completeScenario: (scenarioId: number) => void
  unlockScenario: (scenarioId: number) => void
  updateReputation: (change: number) => void
  updateProsperity: (change: number) => void
  
  // Selectors
  getCurrentCharacter: () => Character | undefined
  getActiveCharacters: () => Character[]
  getCharacterAtPosition: (hex: Hex) => Character | undefined
  isElementAvailable: (element: Element) => boolean
}

// ===== STORE IMPLEMENTATION =====

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    gameState: createInitialGameState(),
    
    // ===== BASIC GAME FLOW =====
    
    setGamePhase: (phase: GamePhase) => {
      set((draft) => {
        draft.gameState.gamePhase = phase
      })
    },
    
    // ===== CHARACTER MANAGEMENT =====
    
    addCharacter: (character: Character) => {
      set((draft) => {
        draft.gameState.characters.set(character.id, character)
      })
    },
    
    removeCharacter: (characterId: string) => {
      set((draft) => {
        draft.gameState.characters.delete(characterId)
        // Remove from party if present
        const partyIndex = draft.gameState.party.members.indexOf(characterId)
        if (partyIndex > -1) {
          draft.gameState.party.members.splice(partyIndex, 1)
        }
      })
    },
    
    updateCharacter: (characterId: string, updates: Partial<Character>) => {
      set((draft) => {
        const character = draft.gameState.characters.get(characterId)
        if (character) {
          Object.assign(character, updates)
        }
      })
    },
    
    moveCharacter: (characterId: string, targetHex: Hex) => {
      set((draft) => {
        const character = draft.gameState.characters.get(characterId)
        if (character && draft.gameState.scenario) {
          // Remove character from old position
          if (character.position) {
            const oldHex = draft.gameState.scenario.mapState.hexes.get(hexToKey(character.position))
            if (oldHex && oldHex.occupant === characterId) {
              oldHex.occupant = undefined
            }
          }
          
          // Move to new position
          character.position = targetHex
          const newHex = draft.gameState.scenario.mapState.hexes.get(hexToKey(targetHex))
          if (newHex) {
            newHex.occupant = characterId
          }
        }
      })
    },
    
    // ===== PARTY MANAGEMENT =====
    
    addToParty: (characterId: string) => {
      set((draft) => {
        if (!draft.gameState.party.members.includes(characterId)) {
          draft.gameState.party.members.push(characterId)
        }
      })
    },
    
    removeFromParty: (characterId: string) => {
      set((draft) => {
        const index = draft.gameState.party.members.indexOf(characterId)
        if (index > -1) {
          draft.gameState.party.members.splice(index, 1)
        }
      })
    },
    
    updatePartyLocation: (location: string) => {
      set((draft) => {
        draft.gameState.party.location = location
      })
    },
    
    updatePartyReputation: (change: number) => {
      set((draft) => {
        draft.gameState.party.reputation = Math.max(-20, Math.min(20, 
          draft.gameState.party.reputation + change
        ))
      })
    },
    
    // ===== SCENARIO MANAGEMENT =====
    
    startScenario: (scenarioId: number, partyMembers: string[]) => {
      set((draft) => {
        // Calculate scenario difficulty
        const characters = partyMembers.map(id => draft.gameState.characters.get(id)).filter(Boolean) as Character[]
        const averageLevel = characters.reduce((sum, char) => sum + char.level, 0) / characters.length
        let scenarioLevel = Math.max(0, Math.floor(averageLevel / 2))
        
        // Apply 5-player modification
        if (partyMembers.length === 5) {
          scenarioLevel += 2
        }
        
        // Create basic hex map for testing
        const hexMap = new Map()
        const bounds = { minQ: -2, maxQ: 2, minR: -2, maxR: 2 }
        
        // Create a simple 5x5 hex grid for testing
        for (let q = bounds.minQ; q <= bounds.maxQ; q++) {
          for (let r = bounds.minR; r <= bounds.maxR; r++) {
            const hexKey = hexToKey({ q, r })
            hexMap.set(hexKey, {
              id: `hex-${q}-${r}`,
              q,
              r,
              terrain: 'normal' as const,
              occupant: undefined,
              items: [],
              tokens: []
            })
          }
        }
        
        // Place characters at starting positions
        partyMembers.forEach((characterId, index) => {
          const startPosition = { q: index - Math.floor(partyMembers.length / 2), r: 0 }
          const character = draft.gameState.characters.get(characterId)
          if (character) {
            character.position = startPosition
            const hex = hexMap.get(hexToKey(startPosition))
            if (hex) {
              hex.occupant = characterId
            }
          }
        })

        // Create initial scenario state
        draft.gameState.scenario = {
          id: scenarioId,
          level: scenarioLevel,
          mapState: {
            id: `scenario-${scenarioId}`,
            scenario: `Scenario ${scenarioId}`,
            tiles: new Map(),
            hexes: hexMap,
            bounds,
            metadata: {
              name: `Scenario ${scenarioId}`,
              difficulty: scenarioLevel,
              recommendedLevel: Math.floor(averageLevel),
              maxPlayers: 5,
              objectives: []
            }
          },
          monsters: new Map(),
          elements: createInitialElementTracker(),
          round: 1,
          initiative: [],
          phase: RoundPhase.CARD_SELECTION,
          objectives: [],
          treasures: []
        }
        
        draft.gameState.gamePhase = GamePhase.SCENARIO_PLAY
      })
    },
    
    endScenario: (success: boolean) => {
      set((draft) => {
        if (draft.gameState.scenario && success) {
          draft.gameState.campaign.scenariosCompleted.add(draft.gameState.scenario.id)
        }
        draft.gameState.scenario = null
        draft.gameState.gamePhase = GamePhase.CAMPAIGN_MANAGEMENT
      })
    },
    
    updateScenarioPhase: (phase: RoundPhase) => {
      set((draft) => {
        if (draft.gameState.scenario) {
          draft.gameState.scenario.phase = phase
        }
      })
    },
    
    // ===== INITIATIVE AND TURN MANAGEMENT =====
    
    setInitiativeOrder: (order: InitiativeEntry[]) => {
      set((draft) => {
        if (draft.gameState.scenario) {
          draft.gameState.scenario.initiative = order
        }
      })
    },
    
    nextTurn: () => {
      set((draft) => {
        if (draft.gameState.scenario) {
          const currentIndex = draft.gameState.scenario.initiative.findIndex(
            entry => entry.figureId === get().getCurrentCharacter()?.id
          )
          // Logic for advancing to next figure would go here
          // For now, just advancing the phase
          if (currentIndex >= draft.gameState.scenario.initiative.length - 1) {
            draft.gameState.scenario.phase = RoundPhase.END_OF_ROUND
          }
        }
      })
    },
    
    endRound: () => {
      set((draft) => {
        if (draft.gameState.scenario) {
          draft.gameState.scenario.round += 1
          draft.gameState.scenario.phase = RoundPhase.CARD_SELECTION
          draft.gameState.scenario.initiative = []
          
          // Wane elements
          for (const element of Object.values(Element)) {
            const currentState = draft.gameState.scenario.elements[element]
            if (currentState === ElementState.STRONG) {
              draft.gameState.scenario.elements[element] = ElementState.WANING
            } else if (currentState === ElementState.WANING) {
              draft.gameState.scenario.elements[element] = ElementState.INERT
            }
          }
        }
      })
    },
    
    // ===== ELEMENT MANAGEMENT =====
    
    infuseElement: (element: Element) => {
      set((draft) => {
        if (draft.gameState.scenario) {
          draft.gameState.scenario.elements[element] = ElementState.STRONG
        }
      })
    },
    
    consumeElement: (element: Element) => {
      const state = get().gameState.scenario?.elements[element]
      if (state === ElementState.STRONG || state === ElementState.WANING) {
        set((draft) => {
          if (draft.gameState.scenario) {
            draft.gameState.scenario.elements[element] = ElementState.INERT
          }
        })
        return true
      }
      return false
    },
    
    waneElements: () => {
      set((draft) => {
        if (draft.gameState.scenario) {
          for (const element of Object.values(Element)) {
            const currentState = draft.gameState.scenario.elements[element]
            if (currentState === ElementState.STRONG) {
              draft.gameState.scenario.elements[element] = ElementState.WANING
            } else if (currentState === ElementState.WANING) {
              draft.gameState.scenario.elements[element] = ElementState.INERT
            }
          }
        }
      })
    },
    
    // ===== CAMPAIGN MANAGEMENT =====
    
    completeScenario: (scenarioId: number) => {
      set((draft) => {
        draft.gameState.campaign.scenariosCompleted.add(scenarioId)
      })
    },
    
    unlockScenario: (scenarioId: number) => {
      set((draft) => {
        draft.gameState.campaign.scenariosUnlocked.add(scenarioId)
      })
    },
    
    updateReputation: (change: number) => {
      set((draft) => {
        draft.gameState.campaign.reputation = Math.max(-20, Math.min(20, 
          draft.gameState.campaign.reputation + change
        ))
      })
    },
    
    updateProsperity: (change: number) => {
      set((draft) => {
        draft.gameState.campaign.prosperity = Math.max(1, 
          draft.gameState.campaign.prosperity + change
        )
      })
    },
    
    // ===== SELECTORS =====
    
    getCurrentCharacter: () => {
      const state = get().gameState
      if (!state.scenario || state.scenario.initiative.length === 0) {
        return undefined
      }
      
      // For now, return the first character in initiative order
      // In a full implementation, this would track whose turn it is
      const currentEntry = state.scenario.initiative[0]
      if (currentEntry.figureType === 'player') {
        return state.characters.get(currentEntry.figureId)
      }
      return undefined
    },
    
    getActiveCharacters: () => {
      const state = get().gameState
      return state.party.members
        .map(id => state.characters.get(id))
        .filter((char): char is Character => char !== undefined)
    },
    
    getCharacterAtPosition: (hex: Hex) => {
      const state = get().gameState
      if (!state.scenario) return undefined
      
      const gameHex = state.scenario.mapState.hexes.get(hexToKey(hex))
      if (!gameHex?.occupant) return undefined
      
      return state.characters.get(gameHex.occupant)
    },
    
    isElementAvailable: (element: Element) => {
      const state = get().gameState
      if (!state.scenario) return false
      
      const elementState = state.scenario.elements[element]
      return elementState === ElementState.STRONG || elementState === ElementState.WANING
    }
  }))
)