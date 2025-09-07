"use client";

import { useRef, useEffect, useCallback } from "react";
import { Unit, Building, Position, GameState, Camera, Viewport } from "./types/GameTypes";

interface GameRendererProps {
  playerUnits: Unit[];
  enemyUnits: Unit[];
  buildings: Building[];
  selectedUnits: Unit[];
  camera: Camera;
  viewport: Viewport;
  onUnitSelect: (position: Position, isMultiSelect: boolean) => void;
  onMoveCommand: (position: Position) => void;
  onAttackCommand: (position: Position) => void;
  gameState: GameState;
}

export default function GameRenderer({
  playerUnits,
  enemyUnits,
  buildings,
  selectedUnits,
  camera,
  viewport,
  onUnitSelect,
  onMoveCommand,
  onAttackCommand,
  gameState
}: GameRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number>();
  const lastRenderTime = useRef<number>(0);

  // Mouse and interaction state
  const mousePosition = useRef<Position>({ x: 0, y: 0 });
  const isRightClick = useRef<boolean>(false);
  const selectionBox = useRef<{ start: Position; end: Position } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    contextRef.current = context;
    canvas.width = 1200;
    canvas.height = 800;

    // Set up high DPI rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = 1200 * devicePixelRatio;
    canvas.height = 800 * devicePixelRatio;
    canvas.style.width = '1200px';
    canvas.style.height = '800px';
    context.scale(devicePixelRatio, devicePixelRatio);

    // Start render loop
    startRenderLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startRenderLoop = () => {
    const render = (currentTime: number) => {
      if (currentTime - lastRenderTime.current >= 16.67) { // 60 FPS cap
        renderFrame();
        lastRenderTime.current = currentTime;
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };
    animationFrameRef.current = requestAnimationFrame(render);
  };

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    context.save();

    // Apply camera transform
    context.translate(-camera.x, -camera.y);
    context.scale(camera.zoom, camera.zoom);

    // Render battlefield background
    renderBackground(context);

    // Render buildings and objectives
    buildings.forEach(building => renderBuilding(context, building));

    // Render units (enemy first, then player)
    enemyUnits.forEach(unit => renderUnit(context, unit, false));
    playerUnits.forEach(unit => renderUnit(context, unit, true));

    // Render selection indicators
    selectedUnits.forEach(unit => renderSelectionIndicator(context, unit));

    // Render range indicators for selected units
    selectedUnits.forEach(unit => renderRangeIndicator(context, unit));

    // Render health bars
    [...playerUnits, ...enemyUnits].forEach(unit => renderHealthBar(context, unit));

    // Restore context state
    context.restore();

    // Render UI elements (not affected by camera)
    if (selectionBox.current) {
      renderSelectionBox(context, selectionBox.current);
    }

    // Render minimap
    renderMinimap(context);
  }, [playerUnits, enemyUnits, buildings, selectedUnits, camera, selectionBox.current]);

  const renderBackground = (context: CanvasRenderingContext2D) => {
    // Battlefield background with grass texture
    const gradient = context.createLinearGradient(0, 0, 1200, 800);
    gradient.addColorStop(0, '#3a5f3a');
    gradient.addColorStop(0.5, '#4a6b4a');
    gradient.addColorStop(1, '#5a7b5a');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1200, 800);

    // Add battlefield details (trenches, roads, craters)
    context.strokeStyle = '#2d4a2d';
    context.lineWidth = 2;
    
    // Draw some trench lines
    context.beginPath();
    context.moveTo(100, 200);
    context.lineTo(500, 180);
    context.lineTo(800, 220);
    context.stroke();

    // Draw roads
    context.strokeStyle = '#6b5b3d';
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(0, 400);
    context.lineTo(1200, 450);
    context.stroke();

    // Add battle damage (craters)
    context.fillStyle = '#2a3a2a';
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * 1200;
      const y = Math.random() * 800;
      const radius = 15 + Math.random() * 25;
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
  };

  const renderUnit = (context: CanvasRenderingContext2D, unit: Unit, isPlayer: boolean) => {
    const { x, y } = unit.position;
    
    context.save();
    context.translate(x, y);
    context.rotate(unit.rotation);

    // Unit body based on type
    if (unit.type.includes('tank')) {
      renderTank(context, unit, isPlayer);
    } else if (unit.type.includes('infantry')) {
      renderInfantry(context, unit, isPlayer);
    } else if (unit.type.includes('artillery')) {
      renderArtillery(context, unit, isPlayer);
    }

    context.restore();

    // Unit status indicators
    if (unit.isMoving) {
      renderMovementTrail(context, unit);
    }
  };

  const renderTank = (context: CanvasRenderingContext2D, unit: Unit, isPlayer: boolean) => {
    const color = isPlayer ? '#4a7c59' : '#7c4a4a';
    const size = 24;

    // Tank body
    context.fillStyle = color;
    context.fillRect(-size/2, -size/2, size, size);

    // Tank turret
    context.fillStyle = isPlayer ? '#5a8c69' : '#8c5a5a';
    context.beginPath();
    context.arc(0, 0, size/3, 0, Math.PI * 2);
    context.fill();

    // Tank barrel
    context.strokeStyle = '#333';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(size/2 + 10, 0);
    context.stroke();

    // Tank tracks
    context.strokeStyle = '#333';
    context.lineWidth = 2;
    context.strokeRect(-size/2 - 2, -size/2 - 2, size + 4, size + 4);

    // Unit identification
    context.fillStyle = 'white';
    context.font = '10px Arial';
    context.textAlign = 'center';
    context.fillText(unit.type.includes('sherman') ? 'M4' : unit.type.includes('t34') ? 'T34' : 'PzIV', 0, -size/2 - 8);
  };

  const renderInfantry = (context: CanvasRenderingContext2D, unit: Unit, isPlayer: boolean) => {
    const color = isPlayer ? '#4a7c59' : '#7c4a4a';
    const size = 12;

    // Infantry squad representation (3 soldiers)
    for (let i = 0; i < 3; i++) {
      const offsetX = (i - 1) * 8;
      const offsetY = (i % 2) * 4;

      context.fillStyle = color;
      context.beginPath();
      context.arc(offsetX, offsetY, size/3, 0, Math.PI * 2);
      context.fill();

      // Weapon
      context.strokeStyle = '#333';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(offsetX, offsetY);
      context.lineTo(offsetX + size/2, offsetY - 2);
      context.stroke();
    }
  };

  const renderArtillery = (context: CanvasRenderingContext2D, unit: Unit, isPlayer: boolean) => {
    const color = isPlayer ? '#6a5c3a' : '#5c3a3a';
    const size = 20;

    // Artillery piece
    context.fillStyle = color;
    context.fillRect(-size/2, -size/3, size, size/1.5);

    // Barrel
    context.strokeStyle = '#333';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(size/2, 0);
    context.lineTo(size + 15, -5);
    context.stroke();

    // Wheels
    context.strokeStyle = '#333';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(-size/3, size/3, 6, 0, Math.PI * 2);
    context.arc(size/3, size/3, 6, 0, Math.PI * 2);
    context.stroke();
  };

  const renderBuilding = (context: CanvasRenderingContext2D, building: Building) => {
    const { x, y } = building.position;
    const { width, height } = building.size;

    context.save();
    
    // Building color based on control
    let color = '#666';
    if (building.isObjective) {
      color = building.isControlled ? '#4a7c59' : '#7c4a4a';
    }

    context.fillStyle = color;
    context.fillRect(x - width/2, y - height/2, width, height);

    // Building details
    context.strokeStyle = '#333';
    context.lineWidth = 2;
    context.strokeRect(x - width/2, y - height/2, width, height);

    // Objective flag
    if (building.isObjective) {
      context.fillStyle = building.isControlled ? '#5a8c69' : '#8c5a5a';
      context.beginPath();
      context.moveTo(x, y - height/2);
      context.lineTo(x + 20, y - height/2 - 15);
      context.lineTo(x + 20, y - height/2 - 5);
      context.closePath();
      context.fill();

      // Flag pole
      context.strokeStyle = '#333';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(x, y - height/2);
      context.lineTo(x, y + height/2);
      context.stroke();
    }

    context.restore();
  };

  const renderSelectionIndicator = (context: CanvasRenderingContext2D, unit: Unit) => {
    const { x, y } = unit.position;
    const radius = 30;

    context.strokeStyle = '#ffff00';
    context.lineWidth = 2;
    context.setLineDash([5, 5]);
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  };

  const renderRangeIndicator = (context: CanvasRenderingContext2D, unit: Unit) => {
    const { x, y } = unit.position;
    const range = unit.stats.range;

    context.strokeStyle = 'rgba(255, 255, 0, 0.3)';
    context.lineWidth = 1;
    context.setLineDash([3, 3]);
    context.beginPath();
    context.arc(x, y, range, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  };

  const renderHealthBar = (context: CanvasRenderingContext2D, unit: Unit) => {
    const { x, y } = unit.position;
    const barWidth = 30;
    const barHeight = 4;
    const yOffset = -35;

    const healthPercent = unit.stats.health / unit.stats.maxHealth;

    // Background
    context.fillStyle = '#333';
    context.fillRect(x - barWidth/2, y + yOffset, barWidth, barHeight);

    // Health bar
    const healthColor = healthPercent > 0.6 ? '#4a7c59' : healthPercent > 0.3 ? '#7c7c4a' : '#7c4a4a';
    context.fillStyle = healthColor;
    context.fillRect(x - barWidth/2, y + yOffset, barWidth * healthPercent, barHeight);

    // Border
    context.strokeStyle = '#000';
    context.lineWidth = 1;
    context.strokeRect(x - barWidth/2, y + yOffset, barWidth, barHeight);
  };

  const renderMovementTrail = (context: CanvasRenderingContext2D, unit: Unit) => {
    if (!unit.targetPosition) return;

    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    context.lineWidth = 2;
    context.setLineDash([5, 5]);
    context.beginPath();
    context.moveTo(unit.position.x, unit.position.y);
    context.lineTo(unit.targetPosition.x, unit.targetPosition.y);
    context.stroke();
    context.setLineDash([]);
  };

  const renderSelectionBox = (context: CanvasRenderingContext2D, selection: { start: Position; end: Position }) => {
    const x = Math.min(selection.start.x, selection.end.x);
    const y = Math.min(selection.start.y, selection.end.y);
    const width = Math.abs(selection.end.x - selection.start.x);
    const height = Math.abs(selection.end.y - selection.start.y);

    context.strokeStyle = '#ffff00';
    context.lineWidth = 1;
    context.setLineDash([3, 3]);
    context.strokeRect(x, y, width, height);
    context.setLineDash([]);

    context.fillStyle = 'rgba(255, 255, 0, 0.1)';
    context.fillRect(x, y, width, height);
  };

  const renderMinimap = (context: CanvasRenderingContext2D) => {
    const minimapSize = 150;
    const minimapX = 1200 - minimapSize - 20;
    const minimapY = 20;
    const scaleX = minimapSize / 1200;
    const scaleY = minimapSize / 800;

    // Minimap background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(minimapX, minimapY, minimapSize, minimapSize);

    // Minimap border
    context.strokeStyle = '#ffff00';
    context.lineWidth = 2;
    context.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

    // Render units on minimap
    playerUnits.forEach(unit => {
      const x = minimapX + unit.position.x * scaleX;
      const y = minimapY + unit.position.y * scaleY;
      context.fillStyle = '#4a7c59';
      context.fillRect(x - 1, y - 1, 2, 2);
    });

    enemyUnits.forEach(unit => {
      const x = minimapX + unit.position.x * scaleX;
      const y = minimapY + unit.position.y * scaleY;
      context.fillStyle = '#7c4a4a';
      context.fillRect(x - 1, y - 1, 2, 2);
    });

    // Camera viewport indicator
    const viewX = minimapX + (camera.x * scaleX);
    const viewY = minimapY + (camera.y * scaleY);
    const viewWidth = (1200 / camera.zoom) * scaleX;
    const viewHeight = (800 / camera.zoom) * scaleY;

    context.strokeStyle = '#ffffff';
    context.lineWidth = 1;
    context.strokeRect(viewX, viewY, viewWidth, viewHeight);
  };

  // Mouse event handlers
  const handleMouseDown = (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left + camera.x;
    const y = event.clientY - rect.top + camera.y;

    mousePosition.current = { x, y };
    isRightClick.current = event.button === 2;

    if (event.button === 0) { // Left click
      selectionBox.current = { start: { x, y }, end: { x, y } };
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left + camera.x;
    const y = event.clientY - rect.top + camera.y;

    if (selectionBox.current && event.buttons === 1) {
      selectionBox.current.end = { x, y };
    }
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left + camera.x;
    const y = event.clientY - rect.top + camera.y;

    if (isRightClick.current) {
      // Right click - move or attack command
      const targetEnemy = enemyUnits.find(enemy => {
        const dx = enemy.position.x - x;
        const dy = enemy.position.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 30;
      });

      if (targetEnemy) {
        onAttackCommand({ x, y });
      } else {
        onMoveCommand({ x, y });
      }
    } else if (selectionBox.current) {
      // Left click - unit selection
      const isBoxSelection = Math.abs(selectionBox.current.end.x - selectionBox.current.start.x) > 10 ||
                           Math.abs(selectionBox.current.end.y - selectionBox.current.start.y) > 10;

      if (isBoxSelection) {
        // Box selection logic would go here
      } else {
        onUnitSelect({ x, y }, event.ctrlKey);
      }
    }

    selectionBox.current = null;
    isRightClick.current = false;
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
    />
  );
}