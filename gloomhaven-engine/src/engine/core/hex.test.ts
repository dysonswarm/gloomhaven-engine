import { describe, it, expect } from 'vitest'
import {
  hexDistance,
  hexAdd,
  hexSubtract,
  hexEquals,
  hexToKey,
  keyToHex,
  getNeighbors,
  getNeighbor,
  getHexesInRange,
  getHexRing,
  findPath,
  hasLineOfSight,
  getHexLine,
  getValidTargets,
  isAdjacent
} from './hex'
import { Hex, GameHex, TerrainType, MovementOptions } from './types'

describe('Hex Coordinate System', () => {
  describe('Basic Operations', () => {
    it('should calculate distance correctly', () => {
      const origin: Hex = { q: 0, r: 0 }
      const hex1: Hex = { q: 1, r: 0 }
      const hex2: Hex = { q: 0, r: 1 }
      const hex3: Hex = { q: 2, r: -1 }
      
      expect(hexDistance(origin, origin)).toBe(0)
      expect(hexDistance(origin, hex1)).toBe(1)
      expect(hexDistance(origin, hex2)).toBe(1)
      expect(hexDistance(origin, hex3)).toBe(2)
      expect(hexDistance(hex1, hex2)).toBe(1)
    })

    it('should add hexes correctly', () => {
      const hex1: Hex = { q: 1, r: 2 }
      const hex2: Hex = { q: 3, r: -1 }
      const result = hexAdd(hex1, hex2)
      
      expect(result).toEqual({ q: 4, r: 1 })
    })

    it('should subtract hexes correctly', () => {
      const hex1: Hex = { q: 5, r: 3 }
      const hex2: Hex = { q: 2, r: 1 }
      const result = hexSubtract(hex1, hex2)
      
      expect(result).toEqual({ q: 3, r: 2 })
    })

    it('should check equality correctly', () => {
      const hex1: Hex = { q: 1, r: 2 }
      const hex2: Hex = { q: 1, r: 2 }
      const hex3: Hex = { q: 1, r: 3 }
      
      expect(hexEquals(hex1, hex2)).toBe(true)
      expect(hexEquals(hex1, hex3)).toBe(false)
    })

    it('should convert to key and back', () => {
      const hex: Hex = { q: -2, r: 5 }
      const key = hexToKey(hex)
      const converted = keyToHex(key)
      
      expect(key).toBe('-2,5')
      expect(converted).toEqual(hex)
    })
  })

  describe('Neighbor Operations', () => {
    it('should get all 6 neighbors', () => {
      const center: Hex = { q: 0, r: 0 }
      const neighbors = getNeighbors(center)
      
      expect(neighbors).toHaveLength(6)
      expect(neighbors).toContainEqual({ q: 1, r: 0 })
      expect(neighbors).toContainEqual({ q: 1, r: -1 })
      expect(neighbors).toContainEqual({ q: 0, r: -1 })
      expect(neighbors).toContainEqual({ q: -1, r: 0 })
      expect(neighbors).toContainEqual({ q: -1, r: 1 })
      expect(neighbors).toContainEqual({ q: 0, r: 1 })
    })

    it('should get specific neighbor by direction', () => {
      const center: Hex = { q: 0, r: 0 }
      
      expect(getNeighbor(center, 0)).toEqual({ q: 1, r: 0 }) // East
      expect(getNeighbor(center, 1)).toEqual({ q: 1, r: -1 }) // Northeast
      expect(getNeighbor(center, 2)).toEqual({ q: 0, r: -1 }) // Northwest
      expect(getNeighbor(center, 3)).toEqual({ q: -1, r: 0 }) // West
      expect(getNeighbor(center, 4)).toEqual({ q: -1, r: 1 }) // Southwest
      expect(getNeighbor(center, 5)).toEqual({ q: 0, r: 1 }) // Southeast
    })

    it('should check adjacency correctly', () => {
      const center: Hex = { q: 0, r: 0 }
      const adjacent: Hex = { q: 1, r: 0 }
      const distant: Hex = { q: 2, r: 0 }
      
      expect(isAdjacent(center, adjacent)).toBe(true)
      expect(isAdjacent(center, distant)).toBe(false)
    })
  })

  describe('Range Operations', () => {
    it('should get hexes in range correctly', () => {
      const center: Hex = { q: 0, r: 0 }
      
      const range0 = getHexesInRange(center, 0)
      expect(range0).toHaveLength(1)
      expect(range0).toContainEqual(center)
      
      const range1 = getHexesInRange(center, 1)
      expect(range1).toHaveLength(7) // center + 6 neighbors
      
      const range2 = getHexesInRange(center, 2)
      expect(range2).toHaveLength(19) // center + 6 + 12
    })

    it('should get hex ring correctly', () => {
      const center: Hex = { q: 0, r: 0 }
      
      const ring0 = getHexRing(center, 0)
      expect(ring0).toEqual([center])
      
      const ring1 = getHexRing(center, 1)
      expect(ring1).toHaveLength(6)
      
      const ring2 = getHexRing(center, 2)
      expect(ring2).toHaveLength(12)
    })
  })

  describe('Line of Sight', () => {
    const createTestMap = (): Map<string, GameHex> => {
      const map = new Map<string, GameHex>()
      
      // Create a simple test map
      for (let q = -3; q <= 3; q++) {
        for (let r = -3; r <= 3; r++) {
          const hex: GameHex = {
            id: `hex-${q}-${r}`,
            q,
            r,
            terrain: TerrainType.NORMAL
          }
          map.set(hexToKey({ q, r }), hex)
        }
      }
      
      // Add a wall in the middle
      const wallHex = map.get(hexToKey({ q: 1, r: 0 }))!
      wallHex.terrain = TerrainType.WALL
      
      return map
    }

    it('should have line of sight for adjacent hexes', () => {
      const map = createTestMap()
      const start: Hex = { q: 0, r: 0 }
      const end: Hex = { q: 1, r: 0 }
      
      expect(hasLineOfSight(start, end, map)).toBe(true)
    })

    it('should block line of sight with walls', () => {
      const map = createTestMap()
      const start: Hex = { q: 0, r: 0 }
      const end: Hex = { q: 2, r: 0 }
      
      // Wall at (1,0) should block line of sight
      expect(hasLineOfSight(start, end, map)).toBe(false)
    })

    it('should calculate hex line correctly', () => {
      const start: Hex = { q: 0, r: 0 }
      const end: Hex = { q: 2, r: 0 }
      const line = getHexLine(start, end)
      
      expect(line).toEqual([
        { q: 0, r: 0 },
        { q: 1, r: 0 },
        { q: 2, r: 0 }
      ])
    })
  })

  describe('Path Finding', () => {
    const createTestMap = (): Map<string, GameHex> => {
      const map = new Map<string, GameHex>()
      
      // Create a 5x5 test map
      for (let q = 0; q < 5; q++) {
        for (let r = 0; r < 5; r++) {
          const hex: GameHex = {
            id: `hex-${q}-${r}`,
            q,
            r,
            terrain: TerrainType.NORMAL
          }
          map.set(hexToKey({ q, r }), hex)
        }
      }
      
      return map
    }

    it('should find simple path', () => {
      const map = createTestMap()
      const start: Hex = { q: 0, r: 0 }
      const goal: Hex = { q: 2, r: 0 }
      const options: MovementOptions = {
        range: 5,
        canFly: false,
        canJump: false,
        ignoreDifficultTerrain: false,
        ignoreObstacles: false,
        ignoreFigures: false
      }
      
      const result = findPath(start, goal, map, options)
      
      expect(result.isValid).toBe(true)
      expect(result.path).toHaveLength(3)
      expect(result.path[0]).toEqual(start)
      expect(result.path[result.path.length - 1]).toEqual(goal)
    })

    it('should fail when goal is out of range', () => {
      const map = createTestMap()
      const start: Hex = { q: 0, r: 0 }
      const goal: Hex = { q: 4, r: 4 }
      const options: MovementOptions = {
        range: 2,
        canFly: false,
        canJump: false,
        ignoreDifficultTerrain: false,
        ignoreObstacles: false,
        ignoreFigures: false
      }
      
      const result = findPath(start, goal, map, options)
      
      expect(result.isValid).toBe(false)
      expect(result.cost).toBe(Infinity)
    })

    it('should handle difficult terrain correctly', () => {
      const map = createTestMap()
      const start: Hex = { q: 0, r: 0 }
      const goal: Hex = { q: 2, r: 0 }
      
      // Make middle hex difficult terrain
      const middleHex = map.get(hexToKey({ q: 1, r: 0 }))!
      middleHex.terrain = TerrainType.DIFFICULT
      
      const options: MovementOptions = {
        range: 5,
        canFly: false,
        canJump: false,
        ignoreDifficultTerrain: false,
        ignoreObstacles: false,
        ignoreFigures: false
      }
      
      const result = findPath(start, goal, map, options)
      
      expect(result.isValid).toBe(true)
      expect(result.cost).toBe(3) // 1 + 2 (difficult) + 0 = 3
    })
  })

  describe('Target Selection', () => {
    const createTestMap = (): Map<string, GameHex> => {
      const map = new Map<string, GameHex>()
      
      // Create test map with occupants
      const hexes = [
        { q: 0, r: 0, occupant: 'attacker' },
        { q: 1, r: 0, occupant: 'target1' },
        { q: 0, r: 1, occupant: 'target2' },
        { q: 2, r: 0, occupant: 'target3' },
        { q: 1, r: 1, occupant: undefined }
      ]
      
      hexes.forEach(data => {
        const hex: GameHex = {
          id: `hex-${data.q}-${data.r}`,
          q: data.q,
          r: data.r,
          terrain: TerrainType.NORMAL,
          occupant: data.occupant
        }
        map.set(hexToKey({ q: data.q, r: data.r }), hex)
      })
      
      return map
    }

    it('should find valid melee targets', () => {
      const map = createTestMap()
      const attacker: Hex = { q: 0, r: 0 }
      
      const targets = getValidTargets(attacker, 0, map) // Melee range
      
      expect(targets).toHaveLength(2)
      expect(targets.some(t => t.occupant === 'target1')).toBe(true)
      expect(targets.some(t => t.occupant === 'target2')).toBe(true)
    })

    it('should find valid ranged targets', () => {
      const map = createTestMap()
      const attacker: Hex = { q: 0, r: 0 }
      
      const targets = getValidTargets(attacker, 2, map) // Range 2
      
      expect(targets).toHaveLength(3)
      expect(targets.some(t => t.occupant === 'target1')).toBe(true)
      expect(targets.some(t => t.occupant === 'target2')).toBe(true)
      expect(targets.some(t => t.occupant === 'target3')).toBe(true)
    })
  })
})