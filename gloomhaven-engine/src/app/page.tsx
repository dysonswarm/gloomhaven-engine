'use client'

import React from 'react'
import { GameBoard } from '../components/game/GameBoard'
import { useGameStore } from '../store/gameStore'
import { CharacterClass, GamePhase } from '../engine/core/types'

export default function Home() {
  const { gameState, addCharacter, addToParty, startScenario, setGamePhase } = useGameStore()
  
  const handleStartDemo = () => {
    // Create a demo character
    const demoCharacter = {
      id: 'demo-char-1',
      class: CharacterClass.BRUTE,
      level: 2,
      experience: 50,
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
      },
      equipment: {},
      conditions: [],
      personalQuest: {
        id: 'pq-demo',
        name: 'Demo Quest',
        description: 'A demonstration quest',
        progress: 0,
        requirement: 10
      },
      battleGoal: null,
      gold: 50,
      checkmarks: 2,
      perks: []
    }
    
    // Add character and start scenario
    addCharacter(demoCharacter)
    addToParty('demo-char-1')
    startScenario(1, ['demo-char-1'])
  }
  
  const handleReturnToCampaign = () => {
    setGamePhase(GamePhase.CAMPAIGN_MANAGEMENT)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Gloomhaven Digital Game Engine
          </h1>
          <p className="text-gray-600">
            A comprehensive implementation of the Gloomhaven board game with 5-player support
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2" role="main" aria-label="Game board area">
            <GameBoard />
          </div>
          
          {/* Control Panel */}
          <div className="space-y-4" role="complementary" aria-label="Game controls and status">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-3">Game Status</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Phase:</span>{' '}
                  <span className="capitalize">{gameState.gamePhase}</span>
                </div>
                <div>
                  <span className="font-medium">Characters:</span>{' '}
                  {gameState.characters.size}
                </div>
                <div>
                  <span className="font-medium">Party Members:</span>{' '}
                  {gameState.party.members.length}
                </div>
                {gameState.scenario && (
                  <>
                    <div>
                      <span className="font-medium">Scenario:</span>{' '}
                      {gameState.scenario.id}
                    </div>
                    <div>
                      <span className="font-medium">Difficulty:</span>{' '}
                      {gameState.scenario.level}
                    </div>
                    <div>
                      <span className="font-medium">Round:</span>{' '}
                      {gameState.scenario.round}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-3">Controls</h3>
              <div className="space-y-2">
                {gameState.gamePhase === GamePhase.CAMPAIGN_MANAGEMENT ? (
                  <button
                    onClick={handleStartDemo}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                    aria-label="Start demo scenario with one character"
                  >
                    Start Demo Scenario
                  </button>
                ) : (
                  <button
                    onClick={handleReturnToCampaign}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
                    aria-label="Return to campaign management mode"
                  >
                    Return to Campaign
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-3">Implementation Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Core Types</span>
                  <span className="text-green-700 font-medium">✓ Complete</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hex Grid System</span>
                  <span className="text-green-700 font-medium">✓ Complete</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Game State Store</span>
                  <span className="text-green-700 font-medium">✓ Complete</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Basic Game Board</span>
                  <span className="text-green-700 font-medium">✓ Complete</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Combat System</span>
                  <span className="text-amber-700 font-medium">⚠ Pending</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Character System</span>
                  <span className="text-amber-700 font-medium">⚠ Pending</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-3">About Phase 1</h3>
              <p className="text-sm text-gray-600">
                Phase 1 establishes the core foundation with type definitions, 
                hex coordinate system, state management, and basic board rendering. 
                This provides the essential infrastructure for building the complete 
                game engine.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}