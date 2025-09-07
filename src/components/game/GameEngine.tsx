"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import GameRenderer from "./GameRenderer";
import GameUI from "./GameUI";
import { Unit, UnitType, Position, GameState } from "./types/GameTypes";
import { PlayerUnits } from "./entities/PlayerUnits";
import { EnemyUnits } from "./entities/EnemyUnits";
import { CombatSystem } from "./systems/CombatSystem";
import { AISystem } from "./systems/AISystem";
import { ResourceSystem } from "./systems/ResourceSystem";
import { ObjectiveSystem } from "./systems/ObjectiveSystem";
import { AudioManager } from "./audio/AudioManager";

interface GameEngineProps {
  scenario: {
    id: number;
    name: string;
    description: string;
    location: string;
    date: string;
    objective: string;
    difficulty: string;
  };
  onGameStateChange: (state: string) => void;
  onBackToMenu: () => void;
}

export default function GameEngine({ scenario, onGameStateChange, onBackToMenu }: GameEngineProps) {
  // Core game state
  const [gameState, setGameState] = useState<GameState>({
    isPaused: false,
    isGameOver: false,
    victory: false,
    currentWave: 1,
    enemiesRemaining: 15,
    score: 0
  });

  // Resources state
  const [resources, setResources] = useState({
    money: 1000,
    fuel: 100,
    ammunition: 100,
    reinforcements: 3
  });

  // Units arrays
  const [playerUnits, setPlayerUnits] = useState<Unit[]>([]);
  const [enemyUnits, setEnemyUnits] = useState<Unit[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<Unit[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);

  // Camera and viewport
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [viewport, setViewport] = useState({ width: 1200, height: 800 });

  // Game systems
  const combatSystemRef = useRef(new CombatSystem());
  const aiSystemRef = useRef(new AISystem());
  const resourceSystemRef = useRef(new ResourceSystem());
  const objectiveSystemRef = useRef(new ObjectiveSystem());
  const audioManagerRef = useRef(new AudioManager());
  const playerUnitsRef = useRef(new PlayerUnits());
  const enemyUnitsRef = useRef(new EnemyUnits());

  // Game loop
  const gameLoopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const fpsRef = useRef<number>(60);

  // Initialize game
  useEffect(() => {
    initializeGame();
    startGameLoop();
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      audioManagerRef.current.cleanup();
    };
  }, [scenario]);

  const initializeGame = () => {
    // Initialize audio
    audioManagerRef.current.initialize();
    audioManagerRef.current.playBackgroundMusic('combat');

    // Create initial player units based on scenario
    const initialPlayerUnits = playerUnitsRef.current.createInitialForces(scenario.id);
    const initialEnemyUnits = enemyUnitsRef.current.createInitialForces(scenario.id);

    setPlayerUnits(initialPlayerUnits);
    setEnemyUnits(initialEnemyUnits);

    // Initialize objectives based on scenario
    const objectives = objectiveSystemRef.current.initializeObjectives(scenario.id);
    setBuildings(objectives);

    // Play scenario intro sound
    audioManagerRef.current.playSound('missionStart');
  };

  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;
    fpsRef.current = 1000 / deltaTime;

    if (!gameState.isPaused && !gameState.isGameOver) {
      // Update AI system
      const updatedEnemyUnits = aiSystemRef.current.update(enemyUnits, playerUnits, deltaTime);
      setEnemyUnits(updatedEnemyUnits);

      // Update combat system
      const combatResult = combatSystemRef.current.update(playerUnits, enemyUnits, deltaTime);
      if (combatResult.playerUnitsChanged) {
        setPlayerUnits(combatResult.updatedPlayerUnits);
      }
      if (combatResult.enemyUnitsChanged) {
        setEnemyUnits(combatResult.updatedEnemyUnits);
      }

      // Update resources
      const updatedResources = resourceSystemRef.current.update(resources, deltaTime);
      setResources(updatedResources);

      // Check objectives
      const objectiveResult = objectiveSystemRef.current.checkObjectives(
        playerUnits,
        enemyUnits,
        buildings,
        gameState
      );

      if (objectiveResult.gameOver) {
        setGameState(prev => ({
          ...prev,
          isGameOver: true,
          victory: objectiveResult.victory
        }));
        
        if (objectiveResult.victory) {
          audioManagerRef.current.playSound('victory');
          onGameStateChange('victory');
        } else {
          audioManagerRef.current.playSound('defeat');
          onGameStateChange('defeat');
        }
      } else {
        setGameState(prev => ({
          ...prev,
          enemiesRemaining: enemyUnits.length,
          score: objectiveResult.score || prev.score
        }));
      }

      // Update unit positions
      updateUnitPositions(deltaTime);
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, playerUnits, enemyUnits, resources, buildings]);

  const startGameLoop = () => {
    lastTimeRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const updateUnitPositions = (deltaTime: number) => {
    // Update player units
    setPlayerUnits(prev => prev.map(unit => {
      if (unit.targetPosition && unit.isMoving) {
        const dx = unit.targetPosition.x - unit.position.x;
        const dy = unit.targetPosition.y - unit.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
          const speed = unit.speed * deltaTime / 1000;
          const moveX = (dx / distance) * speed;
          const moveY = (dy / distance) * speed;

          return {
            ...unit,
            position: {
              x: unit.position.x + moveX,
              y: unit.position.y + moveY
            }
          };
        } else {
          return {
            ...unit,
            position: unit.targetPosition,
            isMoving: false,
            targetPosition: undefined
          };
        }
      }
      return unit;
    }));
  };

  // Input handlers
  const handleUnitSelection = (position: Position, isMultiSelect: boolean) => {
    const clickedUnit = playerUnits.find(unit => {
      const dx = unit.position.x - position.x;
      const dy = unit.position.y - position.y;
      return Math.sqrt(dx * dx + dy * dy) < 30;
    });

    if (clickedUnit) {
      if (isMultiSelect) {
        setSelectedUnits(prev => {
          const isAlreadySelected = prev.some(u => u.id === clickedUnit.id);
          if (isAlreadySelected) {
            return prev.filter(u => u.id !== clickedUnit.id);
          } else {
            return [...prev, clickedUnit];
          }
        });
      } else {
        setSelectedUnits([clickedUnit]);
      }
      audioManagerRef.current.playSound('unitSelect');
    } else if (!isMultiSelect) {
      setSelectedUnits([]);
    }
  };

  const handleMoveCommand = (position: Position) => {
    if (selectedUnits.length > 0) {
      selectedUnits.forEach((selectedUnit, index) => {
        const offsetX = (index % 3 - 1) * 40;
        const offsetY = (Math.floor(index / 3) - 1) * 40;
        
        setPlayerUnits(prev => prev.map(unit => 
          unit.id === selectedUnit.id 
            ? {
                ...unit,
                targetPosition: {
                  x: position.x + offsetX,
                  y: position.y + offsetY
                },
                isMoving: true
              }
            : unit
        ));
      });
      
      audioManagerRef.current.playSound('moveCommand');
    }
  };

  const handleAttackCommand = (targetPosition: Position) => {
    if (selectedUnits.length > 0) {
      const targetEnemy = enemyUnits.find(enemy => {
        const dx = enemy.position.x - targetPosition.x;
        const dy = enemy.position.y - targetPosition.y;
        return Math.sqrt(dx * dx + dy * dy) < 30;
      });

      if (targetEnemy) {
        selectedUnits.forEach(selectedUnit => {
          setPlayerUnits(prev => prev.map(unit =>
            unit.id === selectedUnit.id
              ? {
                  ...unit,
                  targetEnemy: targetEnemy,
                  isAttacking: true
                }
              : unit
          ));
        });
        
        audioManagerRef.current.playSound('attackCommand');
      }
    }
  };

  const handleUnitProduction = (unitType: UnitType) => {
    const unitCost = playerUnitsRef.current.getUnitCost(unitType);
    
    if (resources.money >= unitCost && playerUnits.length < 20) {
      const newUnit = playerUnitsRef.current.createUnit(unitType, {
        x: 100 + Math.random() * 100,
        y: viewport.height - 150 + Math.random() * 50
      });

      setPlayerUnits(prev => [...prev, newUnit]);
      setResources(prev => ({
        ...prev,
        money: prev.money - unitCost
      }));
      
      audioManagerRef.current.playSound('unitProduced');
    } else {
      audioManagerRef.current.playSound('error');
    }
  };

  const togglePause = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    if (gameState.isPaused) {
      audioManagerRef.current.resumeBackgroundMusic();
    } else {
      audioManagerRef.current.pauseBackgroundMusic();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      {/* Game Canvas */}
      <GameRenderer
        playerUnits={playerUnits}
        enemyUnits={enemyUnits}
        buildings={buildings}
        selectedUnits={selectedUnits}
        camera={camera}
        viewport={viewport}
        onUnitSelect={handleUnitSelection}
        onMoveCommand={handleMoveCommand}
        onAttackCommand={handleAttackCommand}
        gameState={gameState}
      />

      {/* Game UI Overlay */}
      <GameUI
        gameState={gameState}
        resources={resources}
        selectedUnits={selectedUnits}
        scenario={scenario}
        fps={fpsRef.current}
        onTogglePause={togglePause}
        onUnitProduction={handleUnitProduction}
        onBackToMenu={onBackToMenu}
        onCameraMove={setCamera}
        camera={camera}
        viewport={viewport}
      />

      {/* Pause Overlay */}
      {gameState.isPaused && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 border-2 border-amber-600 rounded-lg p-8 text-center">
            <h2 className="military-font text-3xl font-bold text-amber-300 stencil-text mb-4">
              GAME PAUSED
            </h2>
            <button
              onClick={togglePause}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-bold py-3 px-6 rounded-lg military-font stencil-text transition-all duration-300"
            >
              RESUME
            </button>
          </div>
        </div>
      )}
    </div>
  );
}