import { Unit, Building, GameState, ObjectiveStatus, Position } from "../types/GameTypes";

interface ObjectiveCheckResult {
  gameOver: boolean;
  victory: boolean;
  score?: number;
  completedObjectives?: ObjectiveStatus[];
  newObjectives?: ObjectiveStatus[];
}

export class ObjectiveSystem {
  private objectives: ObjectiveStatus[] = [];
  private objectiveIdCounter: number = 0;
  private gameStartTime: number = 0;

  initializeObjectives(scenarioId: number): Building[] {
    this.gameStartTime = Date.now();
    this.objectives = [];
    
    const buildings: Building[] = [];

    switch (scenarioId) {
      case 0: // Operation Overlord - Beach Landing
        this.objectives = [
          this.createObjective('capture', 'Secure Radar Station', 1, 1),
          this.createObjective('capture', 'Control Atlantic Wall Bunkers', 2, 2),
          this.createObjective('destroy', 'Eliminate German Artillery', 3, 3),
          this.createObjective('survive', 'Hold positions for 10 minutes', 1, 600000) // 10 minutes
        ];

        buildings.push(
          this.createBuilding('objective', { x: 700, y: 150 }, { width: 60, height: 40 }, 'axis'), // Radar
          this.createBuilding('bunker', { x: 800, y: 200 }, { width: 80, height: 50 }, 'axis'),     // Bunker 1
          this.createBuilding('bunker', { x: 900, y: 180 }, { width: 80, height: 50 }, 'axis'),     // Bunker 2
          this.createBuilding('objective', { x: 1000, y: 250 }, { width: 50, height: 30 }, 'axis'), // Artillery
          this.createBuilding('headquarters', { x: 100, y: 750 }, { width: 100, height: 60 }, 'allied') // Player HQ
        );
        break;

      case 1: // Battle of Stalingrad - Urban Defense
        this.objectives = [
          this.createObjective('defend', 'Hold Stalingrad Factory', 1, 1),
          this.createObjective('destroy', 'Destroy German Panzers', 5, 5),
          this.createObjective('capture', 'Retake Train Station', 1, 1),
          this.createObjective('survive', 'Survive for 15 minutes', 1, 900000) // 15 minutes
        ];

        buildings.push(
          this.createBuilding('factory', { x: 300, y: 400 }, { width: 120, height: 80 }, 'allied'),   // Factory to defend
          this.createBuilding('objective', { x: 800, y: 350 }, { width: 100, height: 70 }, 'axis'),  // Train Station
          this.createBuilding('depot', { x: 150, y: 600 }, { width: 60, height: 40 }, 'allied'),     // Supply depot
          this.createBuilding('bunker', { x: 600, y: 300 }, { width: 70, height: 45 }, 'axis'),      // German bunker
          this.createBuilding('headquarters', { x: 50, y: 700 }, { width: 90, height: 50 }, 'allied') // Soviet HQ
        );
        break;

      case 2: // Operation Barbarossa - Eastern Front
        this.objectives = [
          this.createObjective('destroy', 'Stop German Advance', 8, 8),
          this.createObjective('capture', 'Secure Supply Depot', 1, 1),
          this.createObjective('defend', 'Protect Command Center', 1, 1),
          this.createObjective('survive', 'Hold for 20 minutes', 1, 1200000) // 20 minutes
        ];

        buildings.push(
          this.createBuilding('depot', { x: 650, y: 300 }, { width: 80, height: 50 }, 'axis'),        // German depot
          this.createBuilding('headquarters', { x: 200, y: 500 }, { width: 100, height: 60 }, 'allied'), // Soviet Command
          this.createBuilding('bunker', { x: 500, y: 200 }, { width: 70, height: 45 }, 'axis'),       // German bunker
          this.createBuilding('factory', { x: 900, y: 150 }, { width: 90, height: 60 }, 'axis'),      // German factory
          this.createBuilding('objective', { x: 750, y: 400 }, { width: 60, height: 40 }, 'axis')     // Strategic point
        );
        break;

      default:
        // Default objectives
        this.objectives = [
          this.createObjective('destroy', 'Eliminate all enemies', 5, 5),
          this.createObjective('survive', 'Survive for 5 minutes', 1, 300000)
        ];

        buildings.push(
          this.createBuilding('objective', { x: 800, y: 200 }, { width: 60, height: 40 }, 'axis'),
          this.createBuilding('headquarters', { x: 150, y: 650 }, { width: 80, height: 50 }, 'allied')
        );
    }

    return buildings;
  }

  checkObjectives(
    playerUnits: Unit[], 
    enemyUnits: Unit[], 
    buildings: Building[], 
    gameState: GameState
  ): ObjectiveCheckResult {
    let gameOver = false;
    let victory = false;
    let score = gameState.score;
    const completedObjectives: ObjectiveStatus[] = [];
    const newObjectives: ObjectiveStatus[] = [];

    // Update objective progress
    this.objectives.forEach(objective => {
      if (objective.completed) return;

      let progress = objective.progress;
      const currentTime = Date.now();

      switch (objective.type) {
        case 'capture':
          progress = this.checkCaptureProgress(buildings, objective);
          break;

        case 'destroy':
          progress = this.checkDestroyProgress(enemyUnits, objective);
          break;

        case 'defend':
          progress = this.checkDefendProgress(buildings, playerUnits, objective);
          break;

        case 'survive':
          if (objective.timeLimit) {
            const timeElapsed = currentTime - this.gameStartTime;
            progress = Math.min(1, timeElapsed / objective.timeLimit);
          }
          break;
      }

      objective.progress = progress;

      // Check if objective is completed
      if (progress >= objective.required && !objective.completed) {
        objective.completed = true;
        completedObjectives.push(objective);
        score += this.getObjectiveScore(objective);

        // Check if this completion unlocks new objectives
        const unlocked = this.checkForUnlockedObjectives(objective);
        newObjectives.push(...unlocked);
      }

      // Update time remaining for timed objectives
      if (objective.timeLimit) {
        const timeElapsed = currentTime - this.gameStartTime;
        objective.timeRemaining = Math.max(0, objective.timeLimit - timeElapsed);
      }
    });

    // Check win conditions
    const allObjectivesComplete = this.objectives.every(obj => obj.completed);
    const primaryObjectivesComplete = this.objectives
      .filter(obj => obj.type !== 'survive')
      .every(obj => obj.completed);

    if (allObjectivesComplete) {
      victory = true;
      gameOver = true;
      score += this.getVictoryBonus(gameState);
    }

    // Check lose conditions
    const allPlayerUnitsDestroyed = playerUnits.length === 0 || playerUnits.every(unit => unit.stats.health <= 0);
    const criticalObjectiveFailed = this.checkCriticalObjectiveFailure(buildings);
    const timeExpired = this.checkTimeExpiration();

    if (allPlayerUnitsDestroyed || criticalObjectiveFailed || timeExpired) {
      victory = false;
      gameOver = true;
    }

    // Check for partial victory (primary objectives complete but not all)
    if (primaryObjectivesComplete && !allObjectivesComplete && !gameOver) {
      // Continue playing but award partial victory points
      score += Math.floor(this.getVictoryBonus(gameState) * 0.7);
    }

    return {
      gameOver,
      victory,
      score,
      completedObjectives,
      newObjectives
    };
  }

  private createObjective(
    type: 'capture' | 'destroy' | 'defend' | 'survive',
    description: string,
    required: number,
    timeLimit?: number
  ): ObjectiveStatus {
    return {
      id: `obj_${this.objectiveIdCounter++}`,
      type,
      description,
      completed: false,
      progress: 0,
      required,
      timeLimit,
      timeRemaining: timeLimit
    };
  }

  private createBuilding(
    type: 'headquarters' | 'factory' | 'depot' | 'bunker' | 'objective',
    position: Position,
    size: { width: number; height: number },
    faction: 'allied' | 'axis'
  ): Building {
    return {
      id: `building_${Date.now()}_${Math.random()}`,
      type,
      position,
      size,
      health: this.getBuildingMaxHealth(type),
      maxHealth: this.getBuildingMaxHealth(type),
      faction: faction as any,
      isObjective: type === 'objective',
      isControlled: faction === 'allied',
      controlProgress: faction === 'allied' ? 100 : 0
    };
  }

  private getBuildingMaxHealth(type: string): number {
    const healthMap: Record<string, number> = {
      headquarters: 500,
      factory: 400,
      depot: 200,
      bunker: 600,
      objective: 300
    };
    return healthMap[type] || 250;
  }

  private checkCaptureProgress(buildings: Building[], objective: ObjectiveStatus): number {
    const objectiveBuildings = buildings.filter(b => b.isObjective && b.faction !== 'allied');
    const capturedBuildings = buildings.filter(b => b.isObjective && b.isControlled);
    
    return Math.min(objective.required, capturedBuildings.length);
  }

  private checkDestroyProgress(enemyUnits: Unit[], objective: ObjectiveStatus): number {
    const destroyedEnemies = this.getTotalEnemiesDestroyed(enemyUnits);
    return Math.min(objective.required, destroyedEnemies);
  }

  private checkDefendProgress(buildings: Building[], playerUnits: Unit[], objective: ObjectiveStatus): number {
    const criticalBuildings = buildings.filter(b => 
      (b.type === 'headquarters' || b.type === 'factory') && b.faction === 'allied'
    );
    
    const survivingBuildings = criticalBuildings.filter(b => b.health > 0);
    
    // Progress is based on buildings still standing and time survived
    if (survivingBuildings.length === 0) {
      return 0; // Failed
    }
    
    return survivingBuildings.length >= objective.required ? 1 : 0;
  }

  private getTotalEnemiesDestroyed(currentEnemyUnits: Unit[]): number {
    // This would need to track initial enemy count vs current
    // For now, we'll use a simple heuristic
    const aliveEnemies = currentEnemyUnits.filter(unit => unit.stats.health > 0).length;
    const estimatedInitial = 15; // Based on scenario setup
    return Math.max(0, estimatedInitial - aliveEnemies);
  }

  private checkForUnlockedObjectives(completedObjective: ObjectiveStatus): ObjectiveStatus[] {
    const newObjectives: ObjectiveStatus[] = [];

    // Example: Completing capture objectives might unlock bonus objectives
    if (completedObjective.type === 'capture' && completedObjective.description.includes('Bunkers')) {
      newObjectives.push(
        this.createObjective('destroy', 'Destroy German Reinforcements', 3, 300000)
      );
    }

    return newObjectives;
  }

  private getObjectiveScore(objective: ObjectiveStatus): number {
    const baseScores: Record<string, number> = {
      capture: 500,
      destroy: 300,
      defend: 400,
      survive: 200
    };

    let score = baseScores[objective.type] || 200;
    
    // Bonus for difficult objectives
    if (objective.required > 3) {
      score += objective.required * 50;
    }

    // Time bonus for timed objectives
    if (objective.timeLimit && objective.timeRemaining) {
      const timeBonus = Math.floor((objective.timeRemaining / objective.timeLimit) * 200);
      score += timeBonus;
    }

    return score;
  }

  private getVictoryBonus(gameState: GameState): number {
    let bonus = 1000;

    // Wave bonus
    bonus += gameState.currentWave * 200;

    // Perfect victory bonus
    if (gameState.enemiesRemaining === 0) {
      bonus += 500;
    }

    return bonus;
  }

  private checkCriticalObjectiveFailure(buildings: Building[]): boolean {
    // Check if critical buildings (HQ, factories) are destroyed
    const criticalBuildings = buildings.filter(b => 
      (b.type === 'headquarters' || b.type === 'factory') && b.faction === 'allied'
    );

    return criticalBuildings.some(b => b.health <= 0);
  }

  private checkTimeExpiration(): boolean {
    // Check if any critical time-limited objectives have expired
    return this.objectives.some(obj => 
      obj.type === 'survive' && 
      obj.timeLimit && 
      (Date.now() - this.gameStartTime) > obj.timeLimit &&
      !obj.completed
    );
  }

  // Public getters
  getCurrentObjectives(): ObjectiveStatus[] {
    return [...this.objectives];
  }

  getCompletedObjectives(): ObjectiveStatus[] {
    return this.objectives.filter(obj => obj.completed);
  }

  getActiveObjectives(): ObjectiveStatus[] {
    return this.objectives.filter(obj => !obj.completed);
  }

  getObjectiveProgress(): { completed: number; total: number; percentage: number } {
    const completed = this.objectives.filter(obj => obj.completed).length;
    const total = this.objectives.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { completed, total, percentage };
  }

  // Building control methods
  updateBuildingControl(
    buildings: Building[], 
    playerUnits: Unit[], 
    deltaTime: number
  ): Building[] {
    return buildings.map(building => {
      if (!building.isObjective) return building;

      const nearbyPlayerUnits = this.getUnitsNearBuilding(playerUnits, building, 80);
      const nearbyEnemyUnits = 0; // Would need enemy units to calculate properly

      if (nearbyPlayerUnits.length > nearbyEnemyUnits) {
        // Player is capturing
        const captureRate = nearbyPlayerUnits.length * (deltaTime / 1000) * 20; // 20% per second per unit
        building.controlProgress = Math.min(100, building.controlProgress + captureRate);
        
        if (building.controlProgress >= 100) {
          building.isControlled = true;
          building.faction = 'allied';
        }
      } else if (nearbyEnemyUnits > nearbyPlayerUnits.length) {
        // Enemy is recapturing
        const captureRate = nearbyEnemyUnits * (deltaTime / 1000) * 15; // Slightly slower for AI
        building.controlProgress = Math.max(0, building.controlProgress - captureRate);
        
        if (building.controlProgress <= 0) {
          building.isControlled = false;
          building.faction = 'axis';
        }
      }

      return building;
    });
  }

  private getUnitsNearBuilding(units: Unit[], building: Building, radius: number): Unit[] {
    return units.filter(unit => {
      if (unit.stats.health <= 0) return false;
      
      const dx = unit.position.x - building.position.x;
      const dy = unit.position.y - building.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance <= radius;
    });
  }

  // Utility methods
  addDynamicObjective(objective: ObjectiveStatus): void {
    this.objectives.push(objective);
  }

  removeObjective(objectiveId: string): void {
    this.objectives = this.objectives.filter(obj => obj.id !== objectiveId);
  }

  updateObjectiveDescription(objectiveId: string, newDescription: string): void {
    const objective = this.objectives.find(obj => obj.id === objectiveId);
    if (objective) {
      objective.description = newDescription;
    }
  }

  resetObjectives(): void {
    this.objectives = [];
    this.objectiveIdCounter = 0;
    this.gameStartTime = Date.now();
  }

  // Debug methods
  getObjectiveDebugInfo(): {
    totalObjectives: number;
    completedCount: number;
    activeCount: number;
    gameTimeElapsed: number;
  } {
    const now = Date.now();
    return {
      totalObjectives: this.objectives.length,
      completedCount: this.objectives.filter(obj => obj.completed).length,
      activeCount: this.objectives.filter(obj => !obj.completed).length,
      gameTimeElapsed: now - this.gameStartTime
    };
  }
}