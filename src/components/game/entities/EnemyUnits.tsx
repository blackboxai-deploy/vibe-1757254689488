import { Unit, UnitType, UnitFaction, Position, UnitStats, AIState, AIUnitData } from "../types/GameTypes";

export class EnemyUnits {
  private unitIdCounter: number = 0;

  createUnit(type: UnitType, position: Position): Unit & { aiData: AIUnitData } {
    this.unitIdCounter++;
    const stats = this.getUnitStats(type);

    const baseUnit: Unit = {
      id: `enemy_${type}_${this.unitIdCounter}`,
      type,
      faction: UnitFaction.AXIS,
      position,
      rotation: Math.PI, // Face towards player spawn
      stats,
      isSelected: false,
      isMoving: false,
      isAttacking: false,
      lastAttack: 0,
      experienceLevel: 1,
      killCount: 0,
      morale: 85, // Slightly lower than player units
      ammunition: 100,
      fuel: 100,
      speed: stats.speed
    };

    const aiData: AIUnitData = {
      state: AIState.PATROLLING,
      lastDecision: 0,
      patrolPoints: this.generatePatrolPoints(position),
      currentPatrolIndex: 0,
      alertLevel: 0
    };

    return { ...baseUnit, aiData };
  }

  createInitialForces(scenarioId: number): (Unit & { aiData: AIUnitData })[] {
    const units: (Unit & { aiData: AIUnitData })[] = [];
    
    switch (scenarioId) {
      case 0: // Operation Overlord - German Beach Defenses
        units.push(
          this.createUnit(UnitType.GERMAN_INFANTRY, { x: 800, y: 200 }),
          this.createUnit(UnitType.GERMAN_INFANTRY, { x: 900, y: 180 }),
          this.createUnit(UnitType.GERMAN_INFANTRY, { x: 1000, y: 220 }),
          this.createUnit(UnitType.GERMAN_INFANTRY, { x: 850, y: 160 }),
          this.createUnit(UnitType.PANZER_IV, { x: 950, y: 120 }),
          this.createUnit(UnitType.PANZER_IV, { x: 1050, y: 140 }),
          this.createUnit(UnitType.ANTI_TANK, { x: 750, y: 250 }),
          this.createUnit(UnitType.ANTI_TANK, { x: 1100, y: 200 }),
          this.createUnit(UnitType.STUKA, { x: 600, y: 50 })
        );
        break;
        
      case 1: // Battle of Stalingrad - German Urban Assault
        units.push(
          this.createUnit(UnitType.GERMAN_INFANTRY, { x: 1000, y: 300 }),
          this.createUnit(UnitType.GERMAN_INFANTRY, { x: 1050, y: 280 }),
          this.createUnit(UnitType.GERMAN_INFANTRY, { x: 1100, y: 320 }),
          this.createUnit(UnitType.GERMAN_INFANTRY, { x: 950, y: 260 }),
          this.createUnit(UnitType.GERMAN_INFANTRY, { x: 1020, y: 340 }),
          this.createUnit(UnitType.PANZER_IV, { x: 900, y: 200 }),
          this.createUnit(UnitType.PANZER_IV, { x: 1000, y: 180 }),
          this.createUnit(UnitType.PANZER_IV, { x: 1100, y: 220 }),
          this.createUnit(UnitType.ANTI_TANK, { x: 1150, y: 300 }),
          this.createUnit(UnitType.STUKA, { x: 800, y: 100 }),
          this.createUnit(UnitType.STUKA, { x: 1200, y: 80 })
        );
        break;
        
      case 2: // Operation Barbarossa - German Blitzkrieg
        units.push(
          this.createUnit(UnitType.PANZER_IV, { x: 900, y: 150 }),
          this.createUnit(UnitType.PANZER_IV, { x: 1000, y: 120 }),
          this.createUnit(UnitType.PANZER_IV, { x: 1100, y: 180 }),
          this.createUnit(UnitType.PANZER_IV, { x: 950, y: 200 }),
          this.createUnit(UnitType.GERMAN_INFANTRY, { x: 850, y: 250 }),
          this.createUnit(UnitType.GERMAN_INFANTRY, { x: 950, y: 280 }),
          this.createUnit(UnitType.GERMAN_INFANTRY, { x: 1050, y: 260 }),
          this.createUnit(UnitType.GERMAN_INFANTRY, { x: 1150, y: 290 }),
          this.createUnit(UnitType.ANTI_TANK, { x: 800, y: 300 }),
          this.createUnit(UnitType.STUKA, { x: 700, y: 50 }),
          this.createUnit(UnitType.STUKA, { x: 1200, y: 60 })
        );
        break;
        
      default:
        // Default enemy force
        units.push(
          this.createUnit(UnitType.GERMAN_INFANTRY, { x: 900, y: 200 }),
          this.createUnit(UnitType.PANZER_IV, { x: 950, y: 150 }),
          this.createUnit(UnitType.ANTI_TANK, { x: 1000, y: 250 })
        );
    }

    return units;
  }

  getUnitStats(type: UnitType): UnitStats {
    const baseStats: Record<UnitType, UnitStats> = {
      // Player units (included for reference)
      [UnitType.INFANTRY]: {
        health: 80,
        maxHealth: 80,
        armor: 5,
        damage: 25,
        range: 120,
        speed: 60,
        cost: 100,
        accuracy: 0.75
      },
      [UnitType.TANK_SHERMAN]: {
        health: 200,
        maxHealth: 200,
        armor: 40,
        damage: 65,
        range: 180,
        speed: 45,
        cost: 300,
        accuracy: 0.85
      },
      [UnitType.TANK_T34]: {
        health: 180,
        maxHealth: 180,
        armor: 35,
        damage: 60,
        range: 175,
        speed: 50,
        cost: 280,
        accuracy: 0.80
      },
      [UnitType.ARTILLERY]: {
        health: 60,
        maxHealth: 60,
        armor: 10,
        damage: 120,
        range: 300,
        speed: 25,
        cost: 250,
        accuracy: 0.70
      },
      [UnitType.ANTI_TANK]: {
        health: 70,
        maxHealth: 70,
        armor: 15,
        damage: 85,
        range: 200,
        speed: 40,
        cost: 200,
        accuracy: 0.90
      },
      [UnitType.ENGINEER]: {
        health: 60,
        maxHealth: 60,
        armor: 8,
        damage: 15,
        range: 80,
        speed: 55,
        cost: 150,
        accuracy: 0.65
      },
      // Enemy units
      [UnitType.PANZER_IV]: {
        health: 220,
        maxHealth: 220,
        armor: 45,
        damage: 70,
        range: 190,
        speed: 42,
        cost: 350,
        accuracy: 0.88
      },
      [UnitType.GERMAN_INFANTRY]: {
        health: 75,
        maxHealth: 75,
        armor: 7,
        damage: 28,
        range: 125,
        speed: 65,
        cost: 120,
        accuracy: 0.82
      },
      [UnitType.STUKA]: {
        health: 40,
        maxHealth: 40,
        armor: 2,
        damage: 150,
        range: 250,
        speed: 120,
        cost: 400,
        accuracy: 0.75
      }
    };

    return { ...baseStats[type] };
  }

  generatePatrolPoints(centerPosition: Position): Position[] {
    const points: Position[] = [];
    const radius = 150;
    const numPoints = 4;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const x = centerPosition.x + Math.cos(angle) * radius;
      const y = centerPosition.y + Math.sin(angle) * radius;
      
      // Ensure points stay within battlefield bounds
      points.push({
        x: Math.max(50, Math.min(1150, x)),
        y: Math.max(50, Math.min(750, y))
      });
    }

    return points;
  }

  updateAIState(unit: Unit & { aiData: AIUnitData }, playerUnits: Unit[], deltaTime: number): Unit & { aiData: AIUnitData } {
    const currentTime = Date.now();
    const timeSinceLastDecision = currentTime - unit.aiData.lastDecision;

    // Make decisions every 500ms to 2 seconds based on alert level
    const decisionInterval = Math.max(500, 2000 - (unit.aiData.alertLevel * 15));

    if (timeSinceLastDecision < decisionInterval) {
      return unit;
    }

    const nearestEnemy = this.findNearestEnemy(unit, playerUnits);
    const distanceToEnemy = nearestEnemy ? this.getDistance(unit.position, nearestEnemy.position) : Infinity;

    let newState = unit.aiData.state;
    let newTarget = unit.aiData.target;
    let newAlertLevel = unit.aiData.alertLevel;

    // State machine logic
    switch (unit.aiData.state) {
      case AIState.IDLE:
        if (nearestEnemy && distanceToEnemy <= unit.stats.range * 1.5) {
          newState = AIState.ATTACKING;
          newTarget = nearestEnemy;
          newAlertLevel = Math.min(100, newAlertLevel + 30);
        } else {
          newState = AIState.PATROLLING;
        }
        break;

      case AIState.PATROLLING:
        if (nearestEnemy && distanceToEnemy <= unit.stats.range) {
          newState = AIState.ATTACKING;
          newTarget = nearestEnemy;
          newAlertLevel = Math.min(100, newAlertLevel + 40);
        } else if (nearestEnemy && distanceToEnemy <= unit.stats.range * 2) {
          newState = AIState.DEFENDING;
          newAlertLevel = Math.min(100, newAlertLevel + 20);
        }
        break;

      case AIState.ATTACKING:
        if (!nearestEnemy || distanceToEnemy > unit.stats.range * 2) {
          if (unit.stats.health < unit.stats.maxHealth * 0.3) {
            newState = AIState.RETREATING;
          } else {
            newState = AIState.DEFENDING;
          }
          newTarget = undefined;
        } else if (unit.stats.health < unit.stats.maxHealth * 0.2) {
          newState = AIState.RETREATING;
          newTarget = undefined;
          newAlertLevel = Math.max(0, newAlertLevel - 10);
        }
        break;

      case AIState.DEFENDING:
        if (nearestEnemy && distanceToEnemy <= unit.stats.range) {
          newState = AIState.ATTACKING;
          newTarget = nearestEnemy;
          newAlertLevel = Math.min(100, newAlertLevel + 20);
        } else if (!nearestEnemy || distanceToEnemy > unit.stats.range * 3) {
          newState = AIState.PATROLLING;
          newAlertLevel = Math.max(0, newAlertLevel - 15);
        }
        break;

      case AIState.RETREATING:
        if (unit.stats.health > unit.stats.maxHealth * 0.6) {
          newState = AIState.REGROUPING;
        } else if (nearestEnemy && distanceToEnemy > unit.stats.range * 3) {
          newState = AIState.REGROUPING;
        }
        newAlertLevel = Math.max(0, newAlertLevel - 5);
        break;

      case AIState.REGROUPING:
        if (unit.stats.health > unit.stats.maxHealth * 0.8) {
          newState = AIState.DEFENDING;
        } else if (nearestEnemy && distanceToEnemy <= unit.stats.range) {
          newState = AIState.ATTACKING;
          newTarget = nearestEnemy;
          newAlertLevel = Math.min(100, newAlertLevel + 30);
        }
        break;
    }

    return {
      ...unit,
      aiData: {
        ...unit.aiData,
        state: newState,
        target: newTarget,
        alertLevel: newAlertLevel,
        lastDecision: currentTime,
        lastKnownEnemyPosition: nearestEnemy ? nearestEnemy.position : unit.aiData.lastKnownEnemyPosition
      }
    };
  }

  executeAIAction(unit: Unit & { aiData: AIUnitData }, deltaTime: number): Unit & { aiData: AIUnitData } {
    let updatedUnit = { ...unit };

    switch (unit.aiData.state) {
      case AIState.PATROLLING:
        updatedUnit = this.executePatrol(updatedUnit, deltaTime);
        break;

      case AIState.ATTACKING:
        updatedUnit = this.executeAttack(updatedUnit, deltaTime);
        break;

      case AIState.DEFENDING:
        updatedUnit = this.executeDefend(updatedUnit, deltaTime);
        break;

      case AIState.RETREATING:
        updatedUnit = this.executeRetreat(updatedUnit, deltaTime);
        break;

      case AIState.REGROUPING:
        updatedUnit = this.executeRegroup(updatedUnit, deltaTime);
        break;

      case AIState.IDLE:
        // Do nothing, just wait
        break;
    }

    return updatedUnit;
  }

  private executePatrol(unit: Unit & { aiData: AIUnitData }, deltaTime: number): Unit & { aiData: AIUnitData } {
    if (!unit.aiData.patrolPoints || unit.aiData.patrolPoints.length === 0) {
      return unit;
    }

    const currentTarget = unit.aiData.patrolPoints[unit.aiData.currentPatrolIndex];
    const distance = this.getDistance(unit.position, currentTarget);

    if (distance <= 30) {
      // Reached patrol point, move to next
      const nextIndex = (unit.aiData.currentPatrolIndex + 1) % unit.aiData.patrolPoints.length;
      return {
        ...unit,
        aiData: {
          ...unit.aiData,
          currentPatrolIndex: nextIndex
        }
      };
    } else {
      // Move towards patrol point
      return this.moveTowards(unit, currentTarget, deltaTime);
    }
  }

  private executeAttack(unit: Unit & { aiData: AIUnitData }, deltaTime: number): Unit & { aiData: AIUnitData } {
    if (!unit.aiData.target) {
      return unit;
    }

    const distance = this.getDistance(unit.position, unit.aiData.target.position);
    
    if (distance <= unit.stats.range) {
      // In range, attack
      const canAttack = unit.ammunition > 0 && 
                       unit.fuel > 0 && 
                       Date.now() - unit.lastAttack > 1500; // AI has slightly slower attack rate

      if (canAttack) {
        return {
          ...unit,
          isAttacking: true,
          lastAttack: Date.now(),
          ammunition: unit.ammunition - 1,
          rotation: Math.atan2(
            unit.aiData.target.position.y - unit.position.y,
            unit.aiData.target.position.x - unit.position.x
          )
        };
      }
    } else {
      // Move closer to target
      return this.moveTowards(unit, unit.aiData.target.position, deltaTime);
    }

    return unit;
  }

  private executeDefend(unit: Unit & { aiData: AIUnitData }, deltaTime: number): Unit & { aiData: AIUnitData } {
    // Take defensive position and wait for enemies
    return {
      ...unit,
      isMoving: false
    };
  }

  private executeRetreat(unit: Unit & { aiData: AIUnitData }, deltaTime: number): Unit & { aiData: AIUnitData } {
    // Move away from known enemy positions
    const retreatPosition = unit.aiData.lastKnownEnemyPosition ? {
      x: unit.position.x + (unit.position.x - unit.aiData.lastKnownEnemyPosition.x) * 0.5,
      y: unit.position.y + (unit.position.y - unit.aiData.lastKnownEnemyPosition.y) * 0.5
    } : {
      x: Math.max(600, unit.position.x + 100),
      y: Math.max(100, unit.position.y - 50)
    };

    return this.moveTowards(unit, retreatPosition, deltaTime);
  }

  private executeRegroup(unit: Unit & { aiData: AIUnitData }, deltaTime: number): Unit & { aiData: AIUnitData } {
    // Move to a safe position and recover
    const regroupPosition = {
      x: Math.min(1100, Math.max(700, unit.position.x)),
      y: Math.min(200, Math.max(50, unit.position.y))
    };

    const updatedUnit = this.moveTowards(unit, regroupPosition, deltaTime);
    
    // Slowly recover health and morale
    return {
      ...updatedUnit,
      morale: Math.min(100, updatedUnit.morale + deltaTime * 0.01),
      stats: {
        ...updatedUnit.stats,
        health: Math.min(updatedUnit.stats.maxHealth, updatedUnit.stats.health + deltaTime * 0.005)
      }
    };
  }

  private moveTowards(unit: Unit & { aiData: AIUnitData }, targetPosition: Position, deltaTime: number): Unit & { aiData: AIUnitData } {
    const dx = targetPosition.x - unit.position.x;
    const dy = targetPosition.y - unit.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= 5) {
      return {
        ...unit,
        isMoving: false
      };
    }

    const speed = unit.speed * (deltaTime / 1000) * (unit.fuel / 100);
    const moveX = (dx / distance) * speed;
    const moveY = (dy / distance) * speed;

    return {
      ...unit,
      position: {
        x: unit.position.x + moveX,
        y: unit.position.y + moveY
      },
      rotation: Math.atan2(dy, dx),
      isMoving: true,
      fuel: Math.max(0, unit.fuel - deltaTime * 0.001) // Consume fuel while moving
    };
  }

  private findNearestEnemy(unit: Unit & { aiData: AIUnitData }, playerUnits: Unit[]): Unit | null {
    if (playerUnits.length === 0) return null;

    let nearestEnemy: Unit | null = null;
    let nearestDistance = Infinity;

    for (const enemyUnit of playerUnits) {
      if (enemyUnit.stats.health <= 0) continue;

      const distance = this.getDistance(unit.position, enemyUnit.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemyUnit;
      }
    }

    return nearestEnemy;
  }

  private getDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getUnitDisplayName(type: UnitType): string {
    const names: Record<UnitType, string> = {
      [UnitType.PANZER_IV]: "Panzer IV Ausf. F",
      [UnitType.GERMAN_INFANTRY]: "Wehrmacht Infantry",
      [UnitType.STUKA]: "Ju 87 Stuka",
      [UnitType.INFANTRY]: "Allied Infantry",
      [UnitType.TANK_SHERMAN]: "M4 Sherman",
      [UnitType.TANK_T34]: "T-34",
      [UnitType.ARTILLERY]: "Field Artillery",
      [UnitType.ANTI_TANK]: "Anti-Tank Gun",
      [UnitType.ENGINEER]: "Engineers"
    };

    return names[type] || type;
  }

  isAggressive(unit: Unit & { aiData: AIUnitData }): boolean {
    return unit.aiData.alertLevel > 50 || 
           unit.aiData.state === AIState.ATTACKING || 
           unit.aiData.state === AIState.DEFENDING;
  }

  shouldRetreat(unit: Unit & { aiData: AIUnitData }): boolean {
    const healthPercent = unit.stats.health / unit.stats.maxHealth;
    const moraleThreshold = unit.morale < 30;
    const lowResources = unit.ammunition < 10 || unit.fuel < 20;
    
    return healthPercent < 0.25 || moraleThreshold || lowResources;
  }

  getFormationPosition(unit: Unit & { aiData: AIUnitData }, leaderPosition: Position, formationIndex: number): Position {
    const spacing = 50;
    const angle = unit.rotation;
    
    const offsetX = Math.cos(angle + Math.PI/2) * spacing * (formationIndex % 3 - 1);
    const offsetY = Math.sin(angle + Math.PI/2) * spacing * (Math.floor(formationIndex / 3) - 1);
    
    return {
      x: leaderPosition.x + offsetX,
      y: leaderPosition.y + offsetY
    };
  }
}