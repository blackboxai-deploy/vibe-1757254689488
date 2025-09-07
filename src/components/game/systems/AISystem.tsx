import { Unit, Position, AIState, AIUnitData } from "../types/GameTypes";

export class AISystem {
  private lastUpdateTime: number = 0;
  private decisionInterval: number = 100; // AI decisions every 100ms

  update(enemyUnits: (Unit & { aiData: AIUnitData })[], playerUnits: Unit[], deltaTime: number): (Unit & { aiData: AIUnitData })[] {
    const currentTime = Date.now();
    
    // Throttle AI updates for performance
    if (currentTime - this.lastUpdateTime < this.decisionInterval) {
      // Still update unit positions even if not making new decisions
      return enemyUnits.map(unit => this.updateUnitMovement(unit, deltaTime));
    }

    this.lastUpdateTime = currentTime;

    return enemyUnits.map(unit => {
      if (unit.stats.health <= 0) return unit;

      // Update AI state machine
      let updatedUnit = this.updateAIState(unit, playerUnits, deltaTime);
      
      // Execute current AI action
      updatedUnit = this.executeAIAction(updatedUnit, playerUnits, deltaTime);
      
      // Update unit movement
      updatedUnit = this.updateUnitMovement(updatedUnit, deltaTime);

      // Update unit resources and status
      updatedUnit = this.updateUnitStatus(updatedUnit, deltaTime);

      return updatedUnit;
    });
  }

  private updateAIState(unit: Unit & { aiData: AIUnitData }, playerUnits: Unit[], deltaTime: number): Unit & { aiData: AIUnitData } {
    const currentTime = Date.now();
    const timeSinceLastDecision = currentTime - unit.aiData.lastDecision;

    // Make decisions based on alert level and unit type
    const decisionInterval = this.getDecisionInterval(unit);
    
    if (timeSinceLastDecision < decisionInterval) {
      return unit;
    }

    const nearestEnemy = this.findNearestEnemy(unit, playerUnits);
    const distanceToEnemy = nearestEnemy ? this.getDistance(unit.position, nearestEnemy.position) : Infinity;
    const detectionRange = this.getDetectionRange(unit);

    let newState = unit.aiData.state;
    let newTarget = unit.aiData.target;
    let newAlertLevel = unit.aiData.alertLevel;

    // Evaluate current situation
    const isEnemyInRange = nearestEnemy && distanceToEnemy <= unit.stats.range;
    const isEnemyDetected = nearestEnemy && distanceToEnemy <= detectionRange;
    const isUnderAttack = this.isUnitUnderAttack(unit, playerUnits);
    const shouldRetreat = this.shouldRetreat(unit);
    const canEngageEffectively = this.canEngageEffectively(unit, nearestEnemy);

    // State machine transitions
    switch (unit.aiData.state) {
      case AIState.IDLE:
        if (isUnderAttack || isEnemyInRange) {
          newState = canEngageEffectively ? AIState.ATTACKING : AIState.RETREATING;
          newTarget = nearestEnemy;
          newAlertLevel = Math.min(100, newAlertLevel + 40);
        } else if (isEnemyDetected) {
          newState = AIState.PATROLLING;
          newAlertLevel = Math.min(100, newAlertLevel + 20);
        }
        break;

      case AIState.PATROLLING:
        if (isUnderAttack || (isEnemyInRange && canEngageEffectively)) {
          newState = AIState.ATTACKING;
          newTarget = nearestEnemy;
          newAlertLevel = Math.min(100, newAlertLevel + 30);
        } else if (shouldRetreat) {
          newState = AIState.RETREATING;
          newTarget = undefined;
        } else if (isEnemyDetected) {
          newState = AIState.DEFENDING;
          newAlertLevel = Math.min(100, newAlertLevel + 15);
        }
        break;

      case AIState.ATTACKING:
        if (shouldRetreat || !canEngageEffectively) {
          newState = AIState.RETREATING;
          newTarget = undefined;
          newAlertLevel = Math.max(0, newAlertLevel - 10);
        } else if (!nearestEnemy || distanceToEnemy > unit.stats.range * 2) {
          newState = AIState.DEFENDING;
          newTarget = undefined;
        } else {
          newTarget = nearestEnemy; // Update target
        }
        break;

      case AIState.DEFENDING:
        if (isUnderAttack || (isEnemyInRange && canEngageEffectively)) {
          newState = AIState.ATTACKING;
          newTarget = nearestEnemy;
          newAlertLevel = Math.min(100, newAlertLevel + 25);
        } else if (shouldRetreat) {
          newState = AIState.RETREATING;
          newTarget = undefined;
        } else if (!isEnemyDetected && newAlertLevel < 30) {
          newState = AIState.PATROLLING;
          newAlertLevel = Math.max(0, newAlertLevel - 10);
        }
        break;

      case AIState.RETREATING:
        if (this.isInSafePosition(unit, playerUnits) && unit.stats.health > unit.stats.maxHealth * 0.4) {
          newState = AIState.REGROUPING;
        } else if (isEnemyInRange && !shouldRetreat && canEngageEffectively) {
          // Desperate counter-attack
          newState = AIState.ATTACKING;
          newTarget = nearestEnemy;
        }
        newAlertLevel = Math.max(0, newAlertLevel - 5);
        break;

      case AIState.REGROUPING:
        if (unit.stats.health > unit.stats.maxHealth * 0.7 && unit.ammunition > 50) {
          newState = isEnemyDetected ? AIState.DEFENDING : AIState.PATROLLING;
        } else if (isUnderAttack && canEngageEffectively) {
          newState = AIState.ATTACKING;
          newTarget = nearestEnemy;
          newAlertLevel = Math.min(100, newAlertLevel + 20);
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

  private executeAIAction(unit: Unit & { aiData: AIUnitData }, playerUnits: Unit[], deltaTime: number): Unit & { aiData: AIUnitData } {
    switch (unit.aiData.state) {
      case AIState.IDLE:
        return this.executeIdle(unit, deltaTime);
        
      case AIState.PATROLLING:
        return this.executePatrol(unit, deltaTime);
        
      case AIState.ATTACKING:
        return this.executeAttack(unit, playerUnits, deltaTime);
        
      case AIState.DEFENDING:
        return this.executeDefend(unit, playerUnits, deltaTime);
        
      case AIState.RETREATING:
        return this.executeRetreat(unit, playerUnits, deltaTime);
        
      case AIState.REGROUPING:
        return this.executeRegroup(unit, deltaTime);
        
      default:
        return unit;
    }
  }

  private executeIdle(unit: Unit & { aiData: AIUnitData }, deltaTime: number): Unit & { aiData: AIUnitData } {
    return {
      ...unit,
      isMoving: false,
      isAttacking: false
    };
  }

  private executePatrol(unit: Unit & { aiData: AIUnitData }, deltaTime: number): Unit & { aiData: AIUnitData } {
    if (!unit.aiData.patrolPoints || unit.aiData.patrolPoints.length === 0) {
      return unit;
    }

    const currentTarget = unit.aiData.patrolPoints[unit.aiData.currentPatrolIndex];
    const distance = this.getDistance(unit.position, currentTarget);

    if (distance <= 30) {
      // Reached patrol point, move to next one
      const nextIndex = (unit.aiData.currentPatrolIndex + 1) % unit.aiData.patrolPoints.length;
      return {
        ...unit,
        aiData: {
          ...unit.aiData,
          currentPatrolIndex: nextIndex
        },
        isMoving: true
      };
    } else {
      // Set target position for movement
      return {
        ...unit,
        targetPosition: currentTarget,
        isMoving: true
      };
    }
  }

  private executeAttack(unit: Unit & { aiData: AIUnitData }, playerUnits: Unit[], deltaTime: number): Unit & { aiData: AIUnitData } {
    if (!unit.aiData.target || unit.aiData.target.stats.health <= 0) {
      // Find new target
      const newTarget = this.findBestTarget(unit, playerUnits);
      if (!newTarget) {
        return {
          ...unit,
          isAttacking: false,
          isMoving: false
        };
      }
      unit.aiData.target = newTarget;
    }

    const target = unit.aiData.target;
    const distance = this.getDistance(unit.position, target.position);

    if (distance <= unit.stats.range) {
      // In range - attack
      const canAttack = this.canUnitAttack(unit);
      
      if (canAttack) {
        // Face the target
        const rotation = Math.atan2(
          target.position.y - unit.position.y,
          target.position.x - unit.position.x
        );

        return {
          ...unit,
          rotation,
          isAttacking: true,
          isMoving: false,
          targetEnemy: target
        };
      } else {
        return {
          ...unit,
          isAttacking: false,
          isMoving: false
        };
      }
    } else {
      // Move closer to target
      const optimalRange = unit.stats.range * 0.8; // Stay slightly within range
      
      if (distance > optimalRange) {
        return {
          ...unit,
          targetPosition: this.getPositionTowards(unit.position, target.position, distance - optimalRange),
          isMoving: true,
          isAttacking: false
        };
      }
    }

    return unit;
  }

  private executeDefend(unit: Unit & { aiData: AIUnitData }, playerUnits: Unit[], deltaTime: number): Unit & { aiData: AIUnitData } {
    // Take a defensive position and watch for enemies
    const nearestEnemy = this.findNearestEnemy(unit, playerUnits);
    
    if (nearestEnemy) {
      const distance = this.getDistance(unit.position, nearestEnemy.position);
      
      if (distance <= unit.stats.range && this.canUnitAttack(unit)) {
        // Can attack from current position
        const rotation = Math.atan2(
          nearestEnemy.position.y - unit.position.y,
          nearestEnemy.position.x - unit.position.x
        );

        return {
          ...unit,
          rotation,
          isAttacking: true,
          isMoving: false,
          targetEnemy: nearestEnemy
        };
      }
    }

    return {
      ...unit,
      isMoving: false,
      isAttacking: false
    };
  }

  private executeRetreat(unit: Unit & { aiData: AIUnitData }, playerUnits: Unit[], deltaTime: number): Unit & { aiData: AIUnitData } {
    const retreatPosition = this.findRetreatPosition(unit, playerUnits);
    
    return {
      ...unit,
      targetPosition: retreatPosition,
      isMoving: true,
      isAttacking: false
    };
  }

  private executeRegroup(unit: Unit & { aiData: AIUnitData }, deltaTime: number): Unit & { aiData: AIUnitData } {
    // Move to a safe position and recover
    const regroupPosition = this.findRegroupPosition(unit);
    const distance = this.getDistance(unit.position, regroupPosition);

    let updatedUnit = { ...unit };

    if (distance > 50) {
      updatedUnit.targetPosition = regroupPosition;
      updatedUnit.isMoving = true;
    } else {
      updatedUnit.isMoving = false;
    }

    // Gradual recovery while regrouping
    updatedUnit.morale = Math.min(100, updatedUnit.morale + deltaTime * 0.02);
    if (updatedUnit.ammunition < 100) {
      updatedUnit.ammunition = Math.min(100, updatedUnit.ammunition + deltaTime * 0.05);
    }

    return updatedUnit;
  }

  private updateUnitMovement(unit: Unit & { aiData: AIUnitData }, deltaTime: number): Unit & { aiData: AIUnitData } {
    if (!unit.targetPosition || !unit.isMoving) {
      return unit;
    }

    const dx = unit.targetPosition.x - unit.position.x;
    const dy = unit.targetPosition.y - unit.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= 5) {
      // Reached target
      return {
        ...unit,
        position: unit.targetPosition,
        targetPosition: undefined,
        isMoving: false
      };
    }

    // Move towards target
    const speed = this.getMovementSpeed(unit) * (deltaTime / 1000);
    const moveX = (dx / distance) * speed;
    const moveY = (dy / distance) * speed;

    return {
      ...unit,
      position: {
        x: unit.position.x + moveX,
        y: unit.position.y + moveY
      },
      rotation: Math.atan2(dy, dx),
      fuel: Math.max(0, unit.fuel - deltaTime * 0.001)
    };
  }

  private updateUnitStatus(unit: Unit & { aiData: AIUnitData }, deltaTime: number): Unit & { aiData: AIUnitData } {
    let updatedUnit = { ...unit };

    // Gradual morale changes
    if (unit.aiData.alertLevel > 70) {
      updatedUnit.morale = Math.max(0, updatedUnit.morale - deltaTime * 0.005);
    } else if (unit.aiData.alertLevel < 30) {
      updatedUnit.morale = Math.min(100, updatedUnit.morale + deltaTime * 0.002);
    }

    // Reduce alert level over time
    if (unit.aiData.alertLevel > 0) {
      updatedUnit.aiData.alertLevel = Math.max(0, unit.aiData.alertLevel - deltaTime * 0.01);
    }

    return updatedUnit;
  }

  // Helper methods
  private getDecisionInterval(unit: Unit & { aiData: AIUnitData }): number {
    const baseInterval = 1000; // 1 second base
    const alertFactor = 1 - (unit.aiData.alertLevel / 100) * 0.7;
    return Math.max(300, baseInterval * alertFactor);
  }

  private getDetectionRange(unit: Unit & { aiData: AIUnitData }): number {
    let range = unit.stats.range * 1.5;
    
    // Unit type modifiers
    if (unit.type.includes('infantry')) {
      range *= 0.8; // Infantry has shorter detection range
    } else if (unit.type.includes('stuka')) {
      range *= 2.0; // Aircraft can see farther
    }

    // Alert level affects detection
    range *= (0.7 + (unit.aiData.alertLevel / 100) * 0.3);

    return range;
  }

  private findNearestEnemy(unit: Unit & { aiData: AIUnitData }, playerUnits: Unit[]): Unit | null {
    let nearest: Unit | null = null;
    let nearestDistance = Infinity;

    for (const enemy of playerUnits) {
      if (enemy.stats.health <= 0) continue;

      const distance = this.getDistance(unit.position, enemy.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = enemy;
      }
    }

    return nearest;
  }

  private findBestTarget(unit: Unit & { aiData: AIUnitData }, playerUnits: Unit[]): Unit | null {
    let bestTarget: Unit | null = null;
    let bestScore = 0;

    for (const target of playerUnits) {
      if (target.stats.health <= 0) continue;

      const distance = this.getDistance(unit.position, target.position);
      const detectionRange = this.getDetectionRange(unit);
      
      if (distance > detectionRange) continue;

      let score = 0;

      // Distance scoring (prefer closer targets)
      score += Math.max(0, (detectionRange - distance) / detectionRange * 40);

      // Health scoring (prefer wounded targets)
      const healthPercent = target.stats.health / target.stats.maxHealth;
      score += (1 - healthPercent) * 30;

      // Threat scoring (prefer dangerous units)
      if (target.type.includes('tank')) score += 35;
      else if (target.type.includes('artillery')) score += 40;
      else if (target.type.includes('anti_tank')) score += 30;
      else if (target.type.includes('infantry')) score += 20;

      // Unit advantage scoring
      if (this.hasAdvantageAgainst(unit, target)) {
        score += 25;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTarget = target;
      }
    }

    return bestTarget;
  }

  private hasAdvantageAgainst(attacker: Unit & { aiData: AIUnitData }, target: Unit): boolean {
    if (attacker.type.includes('panzer') && target.type.includes('infantry')) return true;
    if (attacker.type.includes('infantry') && target.type.includes('artillery')) return true;
    if (attacker.type.includes('stuka')) return true; // Air superiority
    return false;
  }

  private canUnitAttack(unit: Unit & { aiData: AIUnitData }): boolean {
    return unit.ammunition > 0 && 
           unit.fuel > 0 && 
           unit.stats.health > 0 && 
           unit.morale > 15 &&
           Date.now() - unit.lastAttack > 1500;
  }

  private shouldRetreat(unit: Unit & { aiData: AIUnitData }): boolean {
    const healthPercent = unit.stats.health / unit.stats.maxHealth;
    const lowHealth = healthPercent < 0.3;
    const lowMorale = unit.morale < 25;
    const lowResources = unit.ammunition < 15 || unit.fuel < 20;
    const highAlert = unit.aiData.alertLevel > 85;

    return lowHealth || (lowMorale && highAlert) || lowResources;
  }

  private canEngageEffectively(unit: Unit & { aiData: AIUnitData }, target: Unit | null): boolean {
    if (!target) return false;
    
    const hasResources = unit.ammunition > 10 && unit.fuel > 10;
    const hasHealth = unit.stats.health > unit.stats.maxHealth * 0.2;
    const hasMorale = unit.morale > 20;
    
    return hasResources && hasHealth && hasMorale;
  }

  private isUnitUnderAttack(unit: Unit & { aiData: AIUnitData }, playerUnits: Unit[]): boolean {
    // Check if any player unit is targeting this unit
    return playerUnits.some(playerUnit => 
      playerUnit.targetEnemy?.id === unit.id && 
      playerUnit.isAttacking &&
      this.getDistance(playerUnit.position, unit.position) <= playerUnit.stats.range
    );
  }

  private isInSafePosition(unit: Unit & { aiData: AIUnitData }, playerUnits: Unit[]): boolean {
    const nearestEnemy = this.findNearestEnemy(unit, playerUnits);
    if (!nearestEnemy) return true;
    
    const distance = this.getDistance(unit.position, nearestEnemy.position);
    return distance > unit.stats.range * 2;
  }

  private findRetreatPosition(unit: Unit & { aiData: AIUnitData }, playerUnits: Unit[]): Position {
    const nearestEnemy = this.findNearestEnemy(unit, playerUnits);
    
    if (nearestEnemy) {
      // Move away from the nearest enemy
      const dx = unit.position.x - nearestEnemy.position.x;
      const dy = unit.position.y - nearestEnemy.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const retreatDistance = 200;
        return {
          x: Math.max(50, Math.min(1150, unit.position.x + (dx / distance) * retreatDistance)),
          y: Math.max(50, Math.min(750, unit.position.y + (dy / distance) * retreatDistance))
        };
      }
    }

    // Default retreat towards the back of the map
    return {
      x: Math.max(600, unit.position.x + 100),
      y: Math.max(50, unit.position.y - 50)
    };
  }

  private findRegroupPosition(unit: Unit & { aiData: AIUnitData }): Position {
    // Move to a relatively safe area at the back
    return {
      x: Math.min(1100, Math.max(700, unit.position.x)),
      y: Math.min(200, Math.max(50, unit.position.y))
    };
  }

  private getMovementSpeed(unit: Unit & { aiData: AIUnitData }): number {
    let speed = unit.speed;
    
    // Apply various modifiers
    const healthFactor = unit.stats.health / unit.stats.maxHealth;
    const fuelFactor = unit.fuel / 100;
    const moraleFactor = Math.max(0.5, unit.morale / 100);
    
    speed *= healthFactor * fuelFactor * moraleFactor;

    // State-based modifiers
    if (unit.aiData.state === AIState.RETREATING) {
      speed *= 1.2; // Faster when retreating
    } else if (unit.aiData.state === AIState.ATTACKING) {
      speed *= 0.9; // Slightly slower when focusing on attack
    }

    return speed;
  }

  private getPositionTowards(from: Position, to: Position, distance: number): Position {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);
    
    if (currentDistance === 0) return from;
    
    const ratio = distance / currentDistance;
    
    return {
      x: Math.max(50, Math.min(1150, from.x + dx * ratio)),
      y: Math.max(50, Math.min(750, from.y + dy * ratio))
    };
  }

  private getDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Debug and utility methods
  getAIStatistics(): {
    totalUnits: number;
    stateDistribution: Record<AIState, number>;
    averageAlertLevel: number;
  } {
    // This would be called with current enemy units for debugging
    return {
      totalUnits: 0,
      stateDistribution: {
        [AIState.IDLE]: 0,
        [AIState.PATROLLING]: 0,
        [AIState.ATTACKING]: 0,
        [AIState.DEFENDING]: 0,
        [AIState.RETREATING]: 0,
        [AIState.REGROUPING]: 0
      },
      averageAlertLevel: 0
    };
  }
}