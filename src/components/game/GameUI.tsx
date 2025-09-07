"use client";

import { Unit, GameState, Resources, UnitType, Camera, Viewport } from "./types/GameTypes";

interface GameUIProps {
  gameState: GameState;
  resources: Resources;
  selectedUnits: Unit[];
  scenario: {
    id: number;
    name: string;
    description: string;
    location: string;
    date: string;
    objective: string;
    difficulty: string;
  };
  fps: number;
  onTogglePause: () => void;
  onUnitProduction: (unitType: UnitType) => void;
  onBackToMenu: () => void;
  onCameraMove: (camera: Camera) => void;
  camera: Camera;
  viewport: Viewport;
}

export default function GameUI({
  gameState,
  resources,
  selectedUnits,
  scenario,
  fps,
  onTogglePause,
  onUnitProduction,
  onBackToMenu
}: GameUIProps) {

  const getUnitCost = (unitType: UnitType): number => {
    const costs = {
      [UnitType.INFANTRY]: 100,
      [UnitType.TANK_SHERMAN]: 300,
      [UnitType.TANK_T34]: 280,
      [UnitType.ARTILLERY]: 250,
      [UnitType.ANTI_TANK]: 200,
      [UnitType.ENGINEER]: 150
    };
    return costs[unitType] || 100;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top HUD - Mission Info */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 pointer-events-auto">
        <div className="flex justify-between items-center">
          {/* Mission Title */}
          <div className="flex items-center space-x-4">
            <h2 className="military-font text-xl font-bold text-amber-300 stencil-text">
              {scenario.name}
            </h2>
            <div className="text-sm text-gray-300">
              <span className="text-amber-400">Objective:</span> {scenario.objective}
            </div>
          </div>

          {/* Game Controls */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300">
              FPS: <span className="text-amber-400">{Math.round(fps)}</span>
            </div>
            <button
              onClick={onTogglePause}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-bold py-2 px-4 rounded military-font transition-all duration-300"
            >
              {gameState.isPaused ? 'RESUME' : 'PAUSE'}
            </button>
            <button
              onClick={onBackToMenu}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-2 px-4 rounded military-font transition-all duration-300"
            >
              MENU
            </button>
          </div>
        </div>
      </div>

      {/* Left Side - Resources Panel */}
      <div className="absolute top-20 left-4 bg-black bg-opacity-80 rounded-lg border-2 border-amber-600 p-4 min-w-64 pointer-events-auto">
        <h3 className="military-font text-lg font-bold text-amber-300 stencil-text mb-3 text-center">
          COMMAND CENTER
        </h3>
        
        {/* Resources Display */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 military-font">💰 Money:</span>
            <span className="text-amber-400 font-bold">${resources.money}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 military-font">⛽ Fuel:</span>
            <span className="text-blue-400 font-bold">{resources.fuel}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 military-font">🔫 Ammo:</span>
            <span className="text-red-400 font-bold">{resources.ammunition}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 military-font">🎖️ Reinforcements:</span>
            <span className="text-green-400 font-bold">{resources.reinforcements}</span>
          </div>
        </div>

        {/* Game Status */}
        <div className="border-t border-gray-600 pt-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 military-font">Wave:</span>
            <span className="text-amber-400 font-bold">{gameState.currentWave}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 military-font">Enemies:</span>
            <span className="text-red-400 font-bold">{gameState.enemiesRemaining}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 military-font">Score:</span>
            <span className="text-amber-400 font-bold">{gameState.score}</span>
          </div>
        </div>
      </div>

      {/* Bottom Left - Unit Production Panel */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-80 rounded-lg border-2 border-amber-600 p-4 pointer-events-auto">
        <h3 className="military-font text-lg font-bold text-amber-300 stencil-text mb-3 text-center">
          UNIT PRODUCTION
        </h3>
        
        <div className="grid grid-cols-3 gap-2">
          {/* Infantry */}
          <button
            onClick={() => onUnitProduction(UnitType.INFANTRY)}
            disabled={resources.money < getUnitCost(UnitType.INFANTRY)}
            className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-2 rounded text-xs military-font transition-all duration-300 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <div className="text-lg mb-1">👥</div>
              <div>INFANTRY</div>
              <div className="text-amber-300">${getUnitCost(UnitType.INFANTRY)}</div>
            </div>
          </button>

          {/* Sherman Tank */}
          <button
            onClick={() => onUnitProduction(UnitType.TANK_SHERMAN)}
            disabled={resources.money < getUnitCost(UnitType.TANK_SHERMAN)}
            className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-2 rounded text-xs military-font transition-all duration-300 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <div className="text-lg mb-1">🚗</div>
              <div>SHERMAN</div>
              <div className="text-amber-300">${getUnitCost(UnitType.TANK_SHERMAN)}</div>
            </div>
          </button>

          {/* Artillery */}
          <button
            onClick={() => onUnitProduction(UnitType.ARTILLERY)}
            disabled={resources.money < getUnitCost(UnitType.ARTILLERY)}
            className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-2 rounded text-xs military-font transition-all duration-300 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <div className="text-lg mb-1">💥</div>
              <div>ARTILLERY</div>
              <div className="text-amber-300">${getUnitCost(UnitType.ARTILLERY)}</div>
            </div>
          </button>

          {/* Anti-Tank */}
          <button
            onClick={() => onUnitProduction(UnitType.ANTI_TANK)}
            disabled={resources.money < getUnitCost(UnitType.ANTI_TANK)}
            className="bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-2 rounded text-xs military-font transition-all duration-300 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <div className="text-lg mb-1">🎯</div>
              <div>ANTI-TANK</div>
              <div className="text-amber-300">${getUnitCost(UnitType.ANTI_TANK)}</div>
            </div>
          </button>

          {/* T-34 Tank */}
          <button
            onClick={() => onUnitProduction(UnitType.TANK_T34)}
            disabled={resources.money < getUnitCost(UnitType.TANK_T34)}
            className="bg-gradient-to-r from-orange-700 to-orange-800 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-2 rounded text-xs military-font transition-all duration-300 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <div className="text-lg mb-1">🛡️</div>
              <div>T-34</div>
              <div className="text-amber-300">${getUnitCost(UnitType.TANK_T34)}</div>
            </div>
          </button>

          {/* Engineer */}
          <button
            onClick={() => onUnitProduction(UnitType.ENGINEER)}
            disabled={resources.money < getUnitCost(UnitType.ENGINEER)}
            className="bg-gradient-to-r from-yellow-700 to-yellow-800 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-2 rounded text-xs military-font transition-all duration-300 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <div className="text-lg mb-1">🔧</div>
              <div>ENGINEER</div>
              <div className="text-amber-300">${getUnitCost(UnitType.ENGINEER)}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Center - Selected Unit Info */}
      {selectedUnits.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 rounded-lg border-2 border-amber-600 p-4 min-w-96 pointer-events-auto">
          <h3 className="military-font text-lg font-bold text-amber-300 stencil-text mb-3 text-center">
            SELECTED UNITS ({selectedUnits.length})
          </h3>
          
          {selectedUnits.length === 1 ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 military-font">Type:</span>
                <span className="text-amber-400 font-bold">{selectedUnits[0].type.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 military-font">Health:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 h-3 bg-gray-700 rounded overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-300"
                      style={{ width: `${(selectedUnits[0].stats.health / selectedUnits[0].stats.maxHealth) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-sm">
                    {selectedUnits[0].stats.health}/{selectedUnits[0].stats.maxHealth}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 military-font">Damage:</span>
                <span className="text-red-400 font-bold">{selectedUnits[0].stats.damage}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 military-font">Range:</span>
                <span className="text-blue-400 font-bold">{selectedUnits[0].stats.range}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 military-font">Armor:</span>
                <span className="text-gray-400 font-bold">{selectedUnits[0].stats.armor}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 military-font">Experience:</span>
                <span className="text-purple-400 font-bold">Level {selectedUnits[0].experienceLevel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 military-font">Kills:</span>
                <span className="text-amber-400 font-bold">{selectedUnits[0].killCount}</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-300">
              <p className="military-font">Multiple units selected</p>
              <div className="grid grid-cols-3 gap-4 mt-2 text-xs">
                <div>
                  <span className="text-amber-400">Total Health:</span><br/>
                  {selectedUnits.reduce((sum, unit) => sum + unit.stats.health, 0)}
                </div>
                <div>
                  <span className="text-red-400">Avg Damage:</span><br/>
                  {Math.round(selectedUnits.reduce((sum, unit) => sum + unit.stats.damage, 0) / selectedUnits.length)}
                </div>
                <div>
                  <span className="text-purple-400">Total Kills:</span><br/>
                  {selectedUnits.reduce((sum, unit) => sum + unit.killCount, 0)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Right Side - Control Instructions */}
      <div className="absolute top-20 right-4 bg-black bg-opacity-80 rounded-lg border-2 border-amber-600 p-4 w-64 pointer-events-auto">
        <h3 className="military-font text-lg font-bold text-amber-300 stencil-text mb-3 text-center">
          CONTROLS
        </h3>
        
        <div className="space-y-2 text-sm text-gray-300">
          <div><strong className="text-amber-400">Left Click:</strong> Select unit/area</div>
          <div><strong className="text-amber-400">Right Click:</strong> Move/Attack</div>
          <div><strong className="text-amber-400">Ctrl + Click:</strong> Multi-select</div>
          <div><strong className="text-amber-400">Spacebar:</strong> Pause game</div>
          <div><strong className="text-amber-400">Q/W/E/R:</strong> Quick build</div>
          <div><strong className="text-amber-400">1-5:</strong> Unit groups</div>
        </div>

        <div className="border-t border-gray-600 pt-3 mt-3">
          <h4 className="military-font text-sm font-bold text-amber-300 mb-2">STRATEGY TIPS</h4>
          <div className="space-y-1 text-xs text-gray-400">
            <div>• Use combined arms tactics</div>
            <div>• Protect artillery with infantry</div>
            <div>• Flank enemy positions</div>
            <div>• Control strategic points</div>
            <div>• Manage resources wisely</div>
          </div>
        </div>
      </div>
    </div>
  );
}