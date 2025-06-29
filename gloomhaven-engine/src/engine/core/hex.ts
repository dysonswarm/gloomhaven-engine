/**
 * Hexagonal coordinate system utilities for the Gloomhaven game engine
 * Uses axial coordinates (q, r) for efficient storage and calculations
 */

import { Hex, PathResult, MovementOptions, TerrainType, GameHex } from './types'

// ===== BASIC HEX OPERATIONS =====

/**
 * Calculate distance between two hexes using axial coordinates
 * @param hex1 - First hex position
 * @param hex2 - Second hex position
 * @returns Distance in hex units
 */
export const hexDistance = (hex1: Hex, hex2: Hex): number => {
  return (Math.abs(hex1.q - hex2.q) + 
          Math.abs(hex1.q + hex1.r - hex2.q - hex2.r) + 
          Math.abs(hex1.r - hex2.r)) / 2
}

/**
 * Add two hex coordinates
 * @param hex1 - First hex
 * @param hex2 - Second hex
 * @returns Sum of the two hexes
 */
export const hexAdd = (hex1: Hex, hex2: Hex): Hex => ({
  q: hex1.q + hex2.q,
  r: hex1.r + hex2.r
})

/**
 * Subtract two hex coordinates
 * @param hex1 - First hex
 * @param hex2 - Second hex
 * @returns Difference of the two hexes
 */
export const hexSubtract = (hex1: Hex, hex2: Hex): Hex => ({
  q: hex1.q - hex2.q,
  r: hex1.r - hex2.r
})

/**
 * Check if two hexes are equal
 * @param hex1 - First hex
 * @param hex2 - Second hex
 * @returns True if hexes have same coordinates
 */
export const hexEquals = (hex1: Hex, hex2: Hex): boolean => {
  return hex1.q === hex2.q && hex1.r === hex2.r
}

/**
 * Convert hex to string key for maps/sets
 * @param hex - Hex to convert
 * @returns String representation "q,r"
 */
export const hexToKey = (hex: Hex): string => {
  return `${hex.q},${hex.r}`
}

/**
 * Convert string key back to hex
 * @param key - String key in format "q,r"
 * @returns Hex coordinates
 */
export const keyToHex = (key: string): Hex => {
  const [q, r] = key.split(',').map(Number)
  return { q, r }
}

// ===== NEIGHBOR OPERATIONS =====

/**
 * Direction vectors for the 6 hex neighbors
 */
const HEX_DIRECTIONS: Hex[] = [
  { q: 1, r: 0 },   // East
  { q: 1, r: -1 },  // Northeast
  { q: 0, r: -1 },  // Northwest
  { q: -1, r: 0 },  // West
  { q: -1, r: 1 },  // Southwest
  { q: 0, r: 1 }    // Southeast
]

/**
 * Get all neighboring hexes (6 directions)
 * @param hex - Center hex
 * @returns Array of 6 neighboring hexes
 */
export const getNeighbors = (hex: Hex): Hex[] => {
  return HEX_DIRECTIONS.map(dir => hexAdd(hex, dir))
}

/**
 * Get neighbor in specific direction (0-5)
 * @param hex - Center hex
 * @param direction - Direction index (0=East, 1=NE, 2=NW, 3=West, 4=SW, 5=SE)
 * @returns Neighboring hex in that direction
 */
export const getNeighbor = (hex: Hex, direction: number): Hex => {
  const dir = HEX_DIRECTIONS[direction % 6]
  return hexAdd(hex, dir)
}

/**
 * Get all hexes within a specific range
 * @param center - Center hex
 * @param range - Maximum distance
 * @returns Array of all hexes within range (including center)
 */
export const getHexesInRange = (center: Hex, range: number): Hex[] => {
  const hexes: Hex[] = []
  
  for (let q = -range; q <= range; q++) {
    const r1 = Math.max(-range, -q - range)
    const r2 = Math.min(range, -q + range)
    
    for (let r = r1; r <= r2; r++) {
      hexes.push({ q: center.q + q, r: center.r + r })
    }
  }
  
  return hexes
}

/**
 * Get hexes in a ring at specific distance
 * @param center - Center hex
 * @param radius - Distance from center
 * @returns Array of hexes at exactly that distance
 */
export const getHexRing = (center: Hex, radius: number): Hex[] => {
  if (radius === 0) return [center]
  
  const results: Hex[] = []
  let hex = hexAdd(center, { q: 0, r: -radius })
  
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < radius; j++) {
      results.push(hex)
      hex = getNeighbor(hex, i)
    }
  }
  
  return results
}

// ===== PATH FINDING =====

/**
 * Find shortest path between two hexes using A* algorithm
 * @param start - Starting hex
 * @param goal - Target hex
 * @param gameMap - Map of all game hexes
 * @param options - Movement options (flying, jumping, etc.)
 * @returns Path result with route and cost
 */
export const findPath = (
  start: Hex, 
  goal: Hex, 
  gameMap: Map<string, GameHex>, 
  options: MovementOptions
): PathResult => {
  // Quick check if goal is reachable
  if (hexDistance(start, goal) > options.range) {
    return { path: [], cost: Infinity, isValid: false }
  }
  
  // A* algorithm implementation
  const openSet = new Set([hexToKey(start)])
  const cameFrom = new Map<string, string>()
  const gScore = new Map<string, number>()
  const fScore = new Map<string, number>()
  
  gScore.set(hexToKey(start), 0)
  fScore.set(hexToKey(start), hexDistance(start, goal))
  
  while (openSet.size > 0) {
    // Find node with lowest fScore
    let current = ''
    let lowestF = Infinity
    
    for (const node of openSet) {
      const f = fScore.get(node) ?? Infinity
      if (f < lowestF) {
        lowestF = f
        current = node
      }
    }
    
    const currentHex = keyToHex(current)
    
    // Check if we reached the goal
    if (hexEquals(currentHex, goal)) {
      return reconstructPath(cameFrom, current, gScore.get(current) ?? 0)
    }
    
    openSet.delete(current)
    
    // Check all neighbors
    for (const neighbor of getNeighbors(currentHex)) {
      const neighborKey = hexToKey(neighbor)
      const neighborHex = gameMap.get(neighborKey)
      
      // Skip if hex doesn't exist or is impassable
      if (!neighborHex || !isPassable(neighborHex, options)) {
        continue
      }
      
      const moveCost = getMovementCost(neighborHex, options)
      const tentativeG = (gScore.get(current) ?? Infinity) + moveCost
      
      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, current)
        gScore.set(neighborKey, tentativeG)
        fScore.set(neighborKey, tentativeG + hexDistance(neighbor, goal))
        
        if (!openSet.has(neighborKey)) {
          openSet.add(neighborKey)
        }
      }
    }
  }
  
  // No path found
  return { path: [], cost: Infinity, isValid: false }
}

/**
 * Check if a hex is passable given movement options
 * @param hex - Game hex to check
 * @param options - Movement options
 * @returns True if the hex can be moved through
 */
const isPassable = (hex: GameHex, options: MovementOptions): boolean => {
  // Flying ignores most ground obstacles
  if (options.canFly) {
    return hex.terrain !== TerrainType.WALL && hex.terrain !== TerrainType.OBSTACLE
  }
  
  // Jumping ignores ground obstacles and figures
  if (options.canJump) {
    return hex.terrain !== TerrainType.WALL
  }
  
  // Normal movement
  if (hex.terrain === TerrainType.WALL || hex.terrain === TerrainType.OBSTACLE) {
    return options.ignoreObstacles
  }
  
  // Check for occupying figures
  if (hex.occupant && !options.ignoreFigures) {
    return false
  }
  
  return true
}

/**
 * Get movement cost for entering a hex
 * @param hex - Game hex
 * @param options - Movement options
 * @returns Movement cost (usually 1 or 2)
 */
const getMovementCost = (hex: GameHex, options: MovementOptions): number => {
  if (options.canFly) {
    return 1 // Flying has uniform cost
  }
  
  if (hex.terrain === TerrainType.DIFFICULT && !options.ignoreDifficultTerrain) {
    return 2
  }
  
  return 1
}

/**
 * Reconstruct path from A* algorithm result
 * @param cameFrom - Map of parent relationships
 * @param current - Current node key
 * @param totalCost - Total movement cost
 * @returns Path result
 */
const reconstructPath = (
  cameFrom: Map<string, string>, 
  current: string, 
  totalCost: number
): PathResult => {
  const path: Hex[] = []
  let currentKey = current
  
  while (currentKey) {
    path.unshift(keyToHex(currentKey))
    const parent = cameFrom.get(currentKey)
    if (!parent) break
    currentKey = parent
  }
  
  return { path, cost: totalCost, isValid: true }
}

// ===== LINE OF SIGHT =====

/**
 * Check if there's line of sight between two hexes
 * @param start - Starting hex
 * @param end - Target hex
 * @param gameMap - Map of all game hexes
 * @returns True if line of sight is clear
 */
export const hasLineOfSight = (
  start: Hex, 
  end: Hex, 
  gameMap: Map<string, GameHex>
): boolean => {
  // Same hex always has line of sight
  if (hexEquals(start, end)) {
    return true
  }
  
  // Get all hexes along the line
  const line = getHexLine(start, end)
  
  // Check each hex in the line (excluding start and end)
  for (let i = 1; i < line.length - 1; i++) {
    const hex = gameMap.get(hexToKey(line[i]))
    if (!hex) continue
    
    // Walls and obstacles block line of sight
    if (hex.terrain === TerrainType.WALL || hex.terrain === TerrainType.OBSTACLE) {
      return false
    }
  }
  
  return true
}

/**
 * Get all hexes along a line between two points
 * @param start - Starting hex
 * @param end - Ending hex
 * @returns Array of hexes along the line
 */
export const getHexLine = (start: Hex, end: Hex): Hex[] => {
  const distance = hexDistance(start, end)
  const results: Hex[] = []
  
  for (let i = 0; i <= distance; i++) {
    const t = distance === 0 ? 0 : i / distance
    const x = start.q + (end.q - start.q) * t
    const y = start.r + (end.r - start.r) * t
    results.push(hexRound({ q: x, r: y }))
  }
  
  return results
}

/**
 * Round fractional hex coordinates to nearest hex
 * @param hex - Fractional hex coordinates
 * @returns Rounded hex coordinates
 */
const hexRound = (hex: { q: number; r: number }): Hex => {
  const s = -hex.q - hex.r
  let rq = Math.round(hex.q)
  let rr = Math.round(hex.r)
  const rs = Math.round(s)
  
  const qDiff = Math.abs(rq - hex.q)
  const rDiff = Math.abs(rr - hex.r)
  const sDiff = Math.abs(rs - s)
  
  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs
  } else if (rDiff > sDiff) {
    rr = -rq - rs
  }
  
  return { q: rq, r: rr }
}

// ===== RANGE AND AREA CALCULATIONS =====

/**
 * Get all valid attack targets within range
 * @param attacker - Attacking figure position
 * @param range - Attack range
 * @param gameMap - Map of all game hexes
 * @returns Array of valid target hexes
 */
export const getValidTargets = (
  attacker: Hex, 
  range: number, 
  gameMap: Map<string, GameHex>
): GameHex[] => {
  if (range === 0) {
    // Melee range - only adjacent hexes
    return getNeighbors(attacker)
      .map(hex => gameMap.get(hexToKey(hex)))
      .filter((hex): hex is GameHex => hex !== undefined)
      .filter(hex => hex.occupant) // Only hexes with figures
  }
  
  // Ranged attack - check line of sight within range
  const hexesInRange = getHexesInRange(attacker, range)
  return hexesInRange
    .map(hex => gameMap.get(hexToKey(hex)))
    .filter((hex): hex is GameHex => hex !== undefined)
    .filter(hex => hex.occupant) // Only hexes with figures
    .filter(hex => !hexEquals(attacker, hex)) // Exclude attacker's position
    .filter(hex => hasLineOfSight(attacker, hex, gameMap))
}

/**
 * Check if a hex is adjacent to another hex
 * @param hex1 - First hex
 * @param hex2 - Second hex
 * @returns True if hexes are adjacent
 */
export const isAdjacent = (hex1: Hex, hex2: Hex): boolean => {
  return hexDistance(hex1, hex2) === 1
}