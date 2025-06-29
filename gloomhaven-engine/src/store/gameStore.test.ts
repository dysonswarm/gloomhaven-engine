import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'
import { 
  Character, 
  CharacterClass, 
  GamePhase, 
  Element, 
  ElementState,
  RoundPhase,
  AttackModifierDeck,
  Equipment
} from '../engine/core/types'

describe('Game Store', () => {
  // Helper function to create a test character
  const createTestCharacter = (id: string, level = 1): Character => ({
    id,
    class: CharacterClass.BRUTE,
    level,
    experience: 0,
    currentHP: 10,
    maxHP: 10,
    handSize: 10,
    availableCards: [],
    activeCards: [],
    discardPile: [],
    lostPile: [],
    attackModifierDeck: {
      cards: [],
      discardPile: [],
      blessings: 0,
      curses: 0
    } as AttackModifierDeck,
    equipment: {} as Equipment,
    conditions: [],
    personalQuest: {
      id: 'pq-1',
      name: 'Test Quest',
      description: 'A test personal quest',
      progress: 0,
      requirement: 10
    },
    battleGoal: null,
    gold: 0,
    checkmarks: 0,
    perks: [],
    position: { q: 0, r: 0 }
  })

  beforeEach(() => {
    // Reset store state before each test
    const currentState = useGameStore.getState()
    useGameStore.setState({ 
      gameState: {
        ...currentState.gameState,
        characters: new Map(),
        party: {
          location: 'Gloomhaven',
          members: [],
          achievements: new Set(),
          reputation: 0,
          notes: ''
        },
        scenario: null,
        gamePhase: GamePhase.CAMPAIGN_MANAGEMENT
      }
    })
  })

  describe('Character Management', () => {
    it('should add character to game state', () => {
      const character = createTestCharacter('char-1')
      const { addCharacter } = useGameStore.getState()
      
      addCharacter(character)
      
      const updatedState = useGameStore.getState().gameState
      expect(updatedState.characters.get('char-1')).toEqual(character)
    })

    it('should remove character from game state', () => {
      const character = createTestCharacter('char-1')
      const { addCharacter, removeCharacter } = useGameStore.getState()
      
      addCharacter(character)
      removeCharacter('char-1')
      
      const updatedState = useGameStore.getState().gameState
      expect(updatedState.characters.has('char-1')).toBe(false)
    })

    it('should update character properties', () => {
      const character = createTestCharacter('char-1')
      const { addCharacter, updateCharacter } = useGameStore.getState()
      
      addCharacter(character)
      updateCharacter('char-1', { currentHP: 5, gold: 100 })
      
      const updatedState = useGameStore.getState().gameState
      const updatedCharacter = updatedState.characters.get('char-1')
      expect(updatedCharacter?.currentHP).toBe(5)
      expect(updatedCharacter?.gold).toBe(100)
    })

    it('should move character to new position', () => {
      const character = createTestCharacter('char-1')
      const { addCharacter, startScenario, moveCharacter } = useGameStore.getState()
      
      addCharacter(character)
      startScenario(1, ['char-1'])
      
      const newPosition = { q: 2, r: 1 }
      moveCharacter('char-1', newPosition)
      
      const updatedState = useGameStore.getState().gameState
      const updatedCharacter = updatedState.characters.get('char-1')
      expect(updatedCharacter?.position).toEqual(newPosition)
    })
  })

  describe('Party Management', () => {
    it('should add character to party', () => {
      const character = createTestCharacter('char-1')
      const { addCharacter, addToParty } = useGameStore.getState()
      
      addCharacter(character)
      addToParty('char-1')
      
      const updatedState = useGameStore.getState().gameState
      expect(updatedState.party.members).toContain('char-1')
    })

    it('should remove character from party', () => {
      const character = createTestCharacter('char-1')
      const { addCharacter, addToParty, removeFromParty } = useGameStore.getState()
      
      addCharacter(character)
      addToParty('char-1')
      removeFromParty('char-1')
      
      const updatedState = useGameStore.getState().gameState
      expect(updatedState.party.members).not.toContain('char-1')
    })

    it('should update party location', () => {
      const { updatePartyLocation } = useGameStore.getState()
      
      updatePartyLocation('New Location')
      
      const updatedState = useGameStore.getState().gameState
      expect(updatedState.party.location).toBe('New Location')
    })

    it('should update party reputation within bounds', () => {
      const { updatePartyReputation } = useGameStore.getState()
      
      updatePartyReputation(25) // Should cap at 20
      expect(useGameStore.getState().gameState.party.reputation).toBe(20)
      
      updatePartyReputation(-50) // Should cap at -20
      expect(useGameStore.getState().gameState.party.reputation).toBe(-20)
    })
  })

  describe('Scenario Management', () => {
    it('should start scenario with correct difficulty calculation', () => {
      const char1 = createTestCharacter('char-1', 3)
      const char2 = createTestCharacter('char-2', 5)
      const { addCharacter, startScenario } = useGameStore.getState()
      
      addCharacter(char1)
      addCharacter(char2)
      startScenario(1, ['char-1', 'char-2'])
      
      const updatedState = useGameStore.getState().gameState
      expect(updatedState.scenario).toBeTruthy()
      expect(updatedState.scenario?.id).toBe(1)
      expect(updatedState.scenario?.level).toBe(2) // Floor((3+5)/2 / 2) = 2
      expect(updatedState.gamePhase).toBe(GamePhase.SCENARIO_PLAY)
    })

    it('should apply five-player difficulty modifier', () => {
      const characters = Array.from({ length: 5 }, (_, i) => 
        createTestCharacter(`char-${i + 1}`, 2)
      )
      const { addCharacter, startScenario } = useGameStore.getState()
      
      characters.forEach(char => addCharacter(char))
      const charIds = characters.map(char => char.id)
      startScenario(1, charIds)
      
      const updatedState = useGameStore.getState().gameState
      expect(updatedState.scenario?.level).toBe(3) // Floor(2/2) + 2 = 3
    })

    it('should end scenario and return to campaign', () => {
      const { startScenario, endScenario } = useGameStore.getState()
      
      startScenario(1, [])
      endScenario(true)
      
      const updatedState = useGameStore.getState().gameState
      expect(updatedState.scenario).toBeNull()
      expect(updatedState.gamePhase).toBe(GamePhase.CAMPAIGN_MANAGEMENT)
    })

    it('should update scenario phase', () => {
      const { startScenario, updateScenarioPhase } = useGameStore.getState()
      
      startScenario(1, [])
      updateScenarioPhase(RoundPhase.ACTIONS)
      
      const updatedState = useGameStore.getState().gameState
      expect(updatedState.scenario?.phase).toBe(RoundPhase.ACTIONS)
    })
  })

  describe('Element Management', () => {
    beforeEach(() => {
      const { startScenario } = useGameStore.getState()
      startScenario(1, [])
    })

    it('should infuse element to strong state', () => {
      const { infuseElement, isElementAvailable } = useGameStore.getState()
      
      infuseElement(Element.FIRE)
      
      const updatedState = useGameStore.getState().gameState
      expect(updatedState.scenario?.elements[Element.FIRE]).toBe(ElementState.STRONG)
      expect(isElementAvailable(Element.FIRE)).toBe(true)
    })

    it('should consume element and make it inert', () => {
      const { infuseElement, consumeElement, isElementAvailable } = useGameStore.getState()
      
      infuseElement(Element.FIRE)
      const consumed = consumeElement(Element.FIRE)
      
      expect(consumed).toBe(true)
      expect(isElementAvailable(Element.FIRE)).toBe(false)
      
      const updatedState = useGameStore.getState().gameState
      expect(updatedState.scenario?.elements[Element.FIRE]).toBe(ElementState.INERT)
    })

    it('should not consume inert element', () => {
      const { consumeElement } = useGameStore.getState()
      
      const consumed = consumeElement(Element.FIRE) // Fire starts inert
      
      expect(consumed).toBe(false)
    })

    it('should wane all elements correctly', () => {
      const { infuseElement, waneElements } = useGameStore.getState()
      
      // Set up elements in different states
      infuseElement(Element.FIRE) // Strong
      infuseElement(Element.ICE)  // Strong
      waneElements() // Fire and Ice become waning
      infuseElement(Element.AIR)  // Air becomes strong
      
      waneElements() // Fire/Ice become inert, Air becomes waning
      
      const updatedState = useGameStore.getState().gameState
      expect(updatedState.scenario?.elements[Element.FIRE]).toBe(ElementState.INERT)
      expect(updatedState.scenario?.elements[Element.ICE]).toBe(ElementState.INERT)
      expect(updatedState.scenario?.elements[Element.AIR]).toBe(ElementState.WANING)
    })
  })

  describe('Campaign Management', () => {
    it('should complete scenario', () => {
      const { completeScenario } = useGameStore.getState()
      
      completeScenario(1)
      
      const updatedState = useGameStore.getState().gameState
      expect(updatedState.campaign.scenariosCompleted.has(1)).toBe(true)
    })

    it('should unlock scenario', () => {
      const { unlockScenario } = useGameStore.getState()
      
      unlockScenario(2)
      
      const updatedState = useGameStore.getState().gameState
      expect(updatedState.campaign.scenariosUnlocked.has(2)).toBe(true)
    })

    it('should update reputation within bounds', () => {
      const { updateReputation } = useGameStore.getState()
      
      updateReputation(25) // Should cap at 20
      expect(useGameStore.getState().gameState.campaign.reputation).toBe(20)
      
      updateReputation(-50) // Should cap at -20
      expect(useGameStore.getState().gameState.campaign.reputation).toBe(-20)
    })

    it('should update prosperity with minimum of 1', () => {
      const { updateProsperity } = useGameStore.getState()
      
      updateProsperity(2)
      expect(useGameStore.getState().gameState.campaign.prosperity).toBe(3)
      
      updateProsperity(-5) // Should not go below 1
      expect(useGameStore.getState().gameState.campaign.prosperity).toBe(1)
    })
  })

  describe('Selectors', () => {
    it('should get active characters from party', () => {
      const char1 = createTestCharacter('char-1')
      const char2 = createTestCharacter('char-2')
      const { addCharacter, addToParty, getActiveCharacters } = useGameStore.getState()
      
      addCharacter(char1)
      addCharacter(char2)
      addToParty('char-1')
      addToParty('char-2')
      
      const activeCharacters = getActiveCharacters()
      expect(activeCharacters).toHaveLength(2)
      expect(activeCharacters.map(c => c.id)).toEqual(['char-1', 'char-2'])
    })

    it('should get character at position', () => {
      const character = createTestCharacter('char-1')
      const { addCharacter, startScenario, getCharacterAtPosition } = useGameStore.getState()
      
      addCharacter(character)
      startScenario(1, ['char-1'])
      
      const charAtPosition = getCharacterAtPosition({ q: 0, r: 0 })
      expect(charAtPosition?.id).toBe('char-1')
      
      const charAtEmptyPosition = getCharacterAtPosition({ q: 5, r: 5 })
      expect(charAtEmptyPosition).toBeUndefined()
    })
  })
})