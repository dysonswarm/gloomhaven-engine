'use client'

/**
 * Main game board component that renders the hex grid and handles player interactions
 * Uses SVG for rendering hexagonal tiles with click events for movement
 */

import React, { useCallback, useMemo } from 'react'
import { hexDistance, hexToKey } from '../../engine/core/hex'
import { GameHex, Hex, OverlayType, TerrainType } from '../../engine/core/types'
import { useGameStore } from '../../store/gameStore'

// Hex geometry constants
const HEX_SIZE = 30
const HEX_HEIGHT = HEX_SIZE * Math.sqrt(3)
const HEX_VERTICAL_SPACING = HEX_HEIGHT * 0.75

interface HexTileProps {
  hex: GameHex
  x: number
  y: number
  isSelected: boolean
  isValidMove: boolean
  isInRange: boolean
  onClick: (hex: Hex) => void
}

const HexTile: React.FC<HexTileProps> = React.memo(({ 
  hex, 
  x, 
  y, 
  isSelected, 
  isValidMove, 
  isInRange, 
  onClick 
}) => {
  const handleClick = useCallback(() => {
    onClick({ q: hex.q, r: hex.r })
  }, [hex.q, hex.r, onClick])

  // Create hex path
  const hexPath = useMemo(() => {
    const points = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const pointX = x + HEX_SIZE * Math.cos(angle)
      const pointY = y + HEX_SIZE * Math.sin(angle)
      points.push(`${pointX},${pointY}`)
    }
    return `M ${points.join(' L ')} Z`
  }, [x, y])

  // Determine hex colors based on state
  const getHexColors = () => {
    if (isSelected) return { fill: '#4ade80', stroke: '#22c55e' }
    if (isValidMove) return { fill: '#60a5fa', stroke: '#3b82f6' }
    if (isInRange) return { fill: '#fbbf24', stroke: '#f59e0b' }
    
    switch (hex.terrain) {
      case TerrainType.DIFFICULT:
        return { fill: '#d97706', stroke: '#b45309' }
      case TerrainType.OBSTACLE:
        return { fill: '#7c2d12', stroke: '#451a03' }
      case TerrainType.WALL:
        return { fill: '#374151', stroke: '#1f2937' }
      case TerrainType.WATER:
        return { fill: '#0ea5e9', stroke: '#0284c7' }
      default:
        return { fill: '#f3f4f6', stroke: '#d1d5db' }
    }
  }

  const colors = getHexColors()

  return (
    <g>
      <path
        d={hexPath}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="2"
        className="cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleClick}
      />
      
      {/* Hex coordinates (for debugging) */}
      <text
        x={x}
        y={y - 5}
        textAnchor="middle"
        className="text-xs fill-gray-600 pointer-events-none"
      >
        {hex.q},{hex.r}
      </text>
      
      {/* Character indicator */}
      {hex.occupant && (
        <circle
          cx={x}
          cy={y + 5}
          r="8"
          fill="#ef4444"
          stroke="#dc2626"
          strokeWidth="2"
          className="pointer-events-none"
        />
      )}
      
      {/* Terrain indicators */}
      {hex.overlay === OverlayType.TREASURE && (
        <text
          x={x}
          y={y + 15}
          textAnchor="middle"
          className="text-sm fill-yellow-600 pointer-events-none"
        >
          💰
        </text>
      )}
    </g>
  )
})

HexTile.displayName = 'HexTile'

interface GameBoardProps {
  className?: string
}

export const GameBoard: React.FC<GameBoardProps> = ({ className = '' }) => {
  const { 
    gameState, 
    getCurrentCharacter, 
    moveCharacter,
    getCharacterAtPosition 
  } = useGameStore()

  const [selectedHex, setSelectedHex] = React.useState<Hex | null>(null)

  // Convert hex coordinates to screen coordinates
  const hexToPixel = useCallback((hex: Hex): { x: number; y: number } => {
    const x = HEX_SIZE * (3/2 * hex.q)
    const y = HEX_SIZE * (Math.sqrt(3)/2 * hex.q + Math.sqrt(3) * hex.r)
    return { x: x + 200, y: y + 200 } // Offset for centering
  }, [])

  // Get all hexes to render
  const hexesToRender = useMemo(() => {
    if (!gameState.scenario?.mapState.hexes) return []
    
    return Array.from(gameState.scenario.mapState.hexes.values()).map(hex => {
      const { x, y } = hexToPixel(hex)
      return { hex, x, y }
    })
  }, [gameState.scenario?.mapState.hexes, hexToPixel])

  // Get current character for movement calculations
  const currentCharacter = getCurrentCharacter()
  
  // Calculate valid moves and ranges
  const { validMoves, inRangeHexes } = useMemo(() => {
    if (!currentCharacter?.position || !gameState.scenario?.mapState.hexes) {
      return { validMoves: new Set<string>(), inRangeHexes: new Set<string>() }
    }

    const validMoves = new Set<string>()
    const inRangeHexes = new Set<string>()
    const characterPos = currentCharacter.position
    const moveRange = 3 // Default move range

    // Calculate valid moves (adjacent hexes that are not occupied)
    gameState.scenario.mapState.hexes.forEach(hex => {
      const distance = hexDistance(characterPos, hex)
      const hexKey = hexToKey(hex)
      
      if (distance <= moveRange) {
        inRangeHexes.add(hexKey)
        
        // Can move if not occupied and not an obstacle
        if (!hex.occupant && 
            hex.terrain !== TerrainType.WALL && 
            hex.terrain !== TerrainType.OBSTACLE) {
          validMoves.add(hexKey)
        }
      }
    })

    return { validMoves, inRangeHexes }
  }, [currentCharacter?.position, gameState.scenario?.mapState.hexes])

  // Handle hex click
  const handleHexClick = useCallback((hex: Hex) => {
    const hexKey = hexToKey(hex)
    
    // If clicking on a character, select that hex
    const characterAtHex = getCharacterAtPosition(hex)
    if (characterAtHex) {
      setSelectedHex(hex)
      return
    }
    
    // If we have a selected character and this is a valid move, move there
    if (currentCharacter && validMoves.has(hexKey)) {
      moveCharacter(currentCharacter.id, hex)
      setSelectedHex(null)
      return
    }
    
    // Otherwise just select the hex
    setSelectedHex(hex)
  }, [currentCharacter, validMoves, moveCharacter, getCharacterAtPosition])

  // Calculate SVG viewbox
  const bounds = gameState.scenario?.mapState.bounds
  const svgWidth = bounds ? (bounds.maxQ - bounds.minQ + 3) * HEX_SIZE * 1.5 + 400 : 600
  const svgHeight = bounds ? (bounds.maxR - bounds.minR + 3) * HEX_VERTICAL_SPACING + 400 : 600

  if (!gameState.scenario) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-600">No active scenario. Start a scenario to see the game board.</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          {gameState.scenario.mapState.metadata.name}
        </h2>
        <p className="text-sm text-gray-600">
          Difficulty: {gameState.scenario.level} | Round: {gameState.scenario.round}
        </p>
      </div>
      
      <div 
        className="overflow-auto max-h-96 border rounded" 
        tabIndex={0}
        role="region"
        aria-label="Game board scroll area"
      >
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="bg-slate-50"
          role="img"
          aria-label={`Game board for ${gameState.scenario.mapState.metadata.name}`}
        >
          <title>Game board with hexagonal tiles</title>
          {hexesToRender.map(({ hex, x, y }) => {
            const hexKey = hexToKey(hex)
            const isSelected = selectedHex && hexToKey(selectedHex) === hexKey
            const isValidMove = validMoves.has(hexKey)
            const isInRange = inRangeHexes.has(hexKey)
            
            return (
              <HexTile
                key={hexKey}
                hex={hex}
                x={x}
                y={y}
                isSelected={!!isSelected}
                isValidMove={isValidMove}
                isInRange={isInRange}
                onClick={handleHexClick}
              />
            )
          })}
        </svg>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-400 rounded mr-2"></div>
            Valid Move
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-400 rounded mr-2"></div>
            In Range
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-400 rounded mr-2"></div>
            Selected
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            Character
          </div>
        </div>
      </div>
    </div>
  )
}