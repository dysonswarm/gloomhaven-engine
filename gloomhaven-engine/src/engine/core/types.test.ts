import { describe, expect, it } from 'vitest'
import {
    CharacterClass,
    Element,
    ElementState,
    FIVE_PLAYER_DIFFICULTY_MODIFIER,
    FIVE_PLAYER_REWARD_MODIFIER,
    GamePhase,
    LEVEL_EXPERIENCE_THRESHOLDS,
    LEVEL_PERK_COUNTS,
    OverlayType,
    TerrainType,
    TokenType
} from './types'

describe('Core Types', () => {
  describe('Enums', () => {
    it('should have correct TerrainType values', () => {
      expect(TerrainType.NORMAL).toBe('normal')
      expect(TerrainType.DIFFICULT).toBe('difficult')
      expect(TerrainType.OBSTACLE).toBe('obstacle')
      expect(TerrainType.WALL).toBe('wall')
    })

    it('should have correct GamePhase values', () => {
      expect(GamePhase.CAMPAIGN_MANAGEMENT).toBe('campaign')
      expect(GamePhase.SCENARIO_SETUP).toBe('setup')
      expect(GamePhase.SCENARIO_PLAY).toBe('play')
      expect(GamePhase.SCENARIO_CLEANUP).toBe('cleanup')
    })

    it('should have correct CharacterClass values', () => {
      expect(CharacterClass.BRUTE).toBe('brute')
      expect(CharacterClass.TINKERER).toBe('tinkerer')
      expect(CharacterClass.SPELLWEAVER).toBe('spellweaver')
      expect(CharacterClass.SCOUNDREL).toBe('scoundrel')
      expect(CharacterClass.CRAGHEART).toBe('cragheart')
      expect(CharacterClass.MINDTHIEF).toBe('mindthief')
    })

    it('should have correct Element values', () => {
      expect(Element.FIRE).toBe('fire')
      expect(Element.ICE).toBe('ice')
      expect(Element.AIR).toBe('air')
      expect(Element.EARTH).toBe('earth')
      expect(Element.LIGHT).toBe('light')
      expect(Element.DARK).toBe('dark')
    })

    it('should have correct ElementState values', () => {
      expect(ElementState.INERT).toBe('inert')
      expect(ElementState.WANING).toBe('waning')
      expect(ElementState.STRONG).toBe('strong')
    })
  })

  describe('Constants', () => {
    it('should have correct experience thresholds', () => {
      expect(LEVEL_EXPERIENCE_THRESHOLDS).toEqual([0, 45, 95, 150, 210, 275, 345, 420, 500])
      expect(LEVEL_EXPERIENCE_THRESHOLDS.length).toBe(9)
    })

    it('should have correct perk counts', () => {
      expect(LEVEL_PERK_COUNTS).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4])
      expect(LEVEL_PERK_COUNTS.length).toBe(9)
    })

    it('should have correct five player modifiers', () => {
      expect(FIVE_PLAYER_DIFFICULTY_MODIFIER).toBe(2)
      expect(FIVE_PLAYER_REWARD_MODIFIER).toBe(-2)
    })
  })

  describe('Interface structure validation', () => {
    it('should allow valid Hex coordinates', () => {
      const hex = { q: 0, r: 0 }
      expect(hex.q).toBe(0)
      expect(hex.r).toBe(0)
    })

    it('should allow valid GameHex with required properties', () => {
      const gameHex = {
        id: 'hex-0-0',
        q: 0,
        r: 0,
        terrain: TerrainType.NORMAL,
        overlay: OverlayType.TREASURE,
        occupant: 'player-1',
        items: ['item-1', 'item-2'],
        tokens: [TokenType.COIN, TokenType.LUMBER]
      }
      
      expect(gameHex.id).toBe('hex-0-0')
      expect(gameHex.terrain).toBe(TerrainType.NORMAL)
      expect(gameHex.overlay).toBe(OverlayType.TREASURE)
      expect(gameHex.occupant).toBe('player-1')
      expect(gameHex.items).toEqual(['item-1', 'item-2'])
      expect(gameHex.tokens).toEqual([TokenType.COIN, TokenType.LUMBER])
    })
  })
})