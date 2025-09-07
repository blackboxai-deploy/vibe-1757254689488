import { Unit, Projectile, Explosion, Position, CombatEvent } from "../types/GameTypes";

interface CombatResult {
  playerUnitsChanged: boolean;
  enemyUnitsChanged: boolean;
  updatedPlayerUnits: Unit[];
  updatedEnemyUnits: Unit[];
  combatEvents: CombatEvent[];
  projectiles: Projectile[];
  explosions: Explosion[];
}

export class CombatSystem {
  private projectiles: Projectile[] = [];
  private explosions: Explosion[] = [];
  private combatEvents: CombatEvent[] = [];
  private projectileIdCounter: number = 0;
  private explosionIdCounter: number = 0;
  private eventIdCounter: number = 0;

  update(playerUnits: Unit[], enemyUnits: Unit[], deltaTime: number): CombatResult {
    let updatedPlayerUnits = [...playerUnits];
    let updatedEnemyUnits = [...enemyUnits];
    let playerUnitsChanged = false;
    let enemyUnitsChanged = false;

    // Process existing projectiles
    this.updateProjectiles(deltaTime);

    // Check for projectile hits
    const hitResults = this.checkProjectileHits(updatedPlayerUnits, updatedEnemyUnits);
    if (hitResults.playerUnitsChanged) {
      updatedPlayerUnits = hitResults.updatedPlayerUnits;
      playerUnitsChanged = true;
    }
    if (hitResults.enemyUnitsChanged) {
      updatedEnemyUnits = hitResults.updatedEnemyUnits;
      enemyUnitsChanged = true;
    }

    // Process player unit attacks
    updatedPlayerUnits.forEach((unit, index) => {
      if (unit.isAttacking && this.canUnitAttack(unit)) {
        const attackResult = this.processUnitAttack(unit, updatedEnemyUnits);
        if (attackResult.projectile) {
          this.addProjectile(attackResult.projectile);
        }
        if (attackResult.combatEvent) {
          this.addCombatEvent(attackResult.combatEvent);
        }
        
        // Update unit after attack
        updatedPlayerUnits[index] = {
          ...unit,
          isAttacking: false,
          lastAttack: Date.now(),
          ammunition: unit.ammunition - 1
        };
        playerUnitsChanged = true;
      }
    });

    // Process enemy unit attacks
    updatedEnemyUnits.forEach((unit, index) => {
      if (unit.isAttacking && this.canUnitAttack(unit)) {
        const attackResult = this.processUnitAttack(unit, updatedPlayerUnits);
        if (attackResult.projectile) {
          this.addProjectile(attackResult.projectile);
        }
        if (attackResult.combatEvent) {
          this.addCombatEvent(attackResult.combatEvent);
        }
        
        // Update unit after attack
        updatedEnemyUnits[index] = {
          ...unit,
          isAttacking: false,
          lastAttack: Date.now(),
          ammunition: unit.ammunition - 1
        };
        enemyUnitsChanged = true;
      }
    });

    // Update explosions
    this.updateExplosions(deltaTime);

    // Clean up old events
    this.cleanupOldEvents();

    return {
      playerUnitsChanged,
      enemyUnitsChanged,
      updatedPlayerUnits,
      updatedEnemyUnits,
      combatEvents: [...this.combatEvents],
      projectiles: [...this.projectiles],
      explosions: [...this.explosions]
    };
  }

  private canUnitAttack(unit: Unit): boolean {
    const cooldownPassed = Date.now() - unit.lastAttack >= this.getAttackCooldown(unit);
    return unit.ammunition > 0 && 
           unit.fuel > 0 && 
           unit.stats.health > 0 && 
           unit.morale > 10 &&
           cooldownPassed;
  }

  private getAttackCooldown(unit: Unit): number {
    // Different cooldowns based on unit type
    if (unit.type.includes('tank')) {
      return 2500; // 2.5 seconds for tanks
    } else if (unit.type.includes('artillery')) {
      return 4000; // 4 seconds for artillery
    } else if (unit.type.includes('anti_tank')) {
      return 3000; // 3 seconds for anti-tank
    } else if (unit.type.includes('infantry')) {
      return 1000; // 1 second for infantry
    } else if (unit.type.includes('stuka')) {
      return 8000; // 8 seconds for aircraft
    }
    return 1500; // Default cooldown
  }

  private processUnitAttack(attacker: Unit, targets: Unit[]): { 
    projectile?: Projectile; 
    combatEvent?: CombatEvent;
  } {
    // Find best target within range
    const target = this.findBestTarget(attacker, targets);
    if (!target) return {};

    const distance = this.getDistance(attacker.position, target.position);
    if (distance > attacker.stats.range) return {};

    // Calculate accuracy
    const accuracy = this.calculateAccuracy(attacker, target, distance);
    const hitRoll = Math.random();
    const isHit = hitRoll <= accuracy;

    // Create projectile
    const projectile = this.createProjectile(attacker, target, isHit);
    
    // Create combat event
    const combatEvent: CombatEvent = {
      id: `event_${this.eventIdCounter++}`,
      type: isHit ? 'hit' : 'miss',
      attacker,
      target,
      damage: isHit ? this.calculateDamage(attacker, target) : 0,
      position: target.position,
      timestamp: Date.now()
    };

    return { projectile, combatEvent };
  }

  private findBestTarget(attacker: Unit, targets: Unit[]): Unit | null {
    let bestTarget: Unit | null = null;
    let bestScore = 0;

    for (const target of targets) {
      if (target.stats.health <= 0) continue;

      const distance = this.getDistance(attacker.position, target.position);
      if (distance > attacker.stats.range) continue;

      // Scoring system for target selection
      let score = 0;
      
      // Prefer closer targets
      score += (attacker.stats.range - distance) / attacker.stats.range * 30;
      
      // Prefer weaker targets
      const healthPercent = target.stats.health / target.stats.maxHealth;
      score += (1 - healthPercent) * 20;
      
      // Prefer high-value targets
      if (target.type.includes('tank')) score += 25;
      else if (target.type.includes('artillery')) score += 30;
      else if (target.type.includes('anti_tank')) score += 20;
      else if (target.type.includes('infantry')) score += 15;

      // Consider threat level
      if (target.isAttacking && target.targetEnemy?.id === attacker.id) {
        score += 40; // High priority for units attacking us
      }

      if (score > bestScore) {
        bestScore = score;
        bestTarget = target;
      }
    }

    return bestTarget;
  }

  private calculateAccuracy(attacker: Unit, target: Unit, distance: number): number {
    let accuracy = attacker.stats.accuracy;

    // Distance penalty
    const distanceFactor = 1 - (distance / attacker.stats.range * 0.3);
    accuracy *= distanceFactor;

    // Unit condition modifiers
    const healthFactor = attacker.stats.health / attacker.stats.maxHealth;
    accuracy *= (0.5 + healthFactor * 0.5);

    // Morale modifier
    const moraleFactor = attacker.morale / 100;
    accuracy *= (0.7 + moraleFactor * 0.3);

    // Target movement penalty
    if (target.isMoving) {
      accuracy *= 0.7;
    }

    // Experience bonus
    accuracy *= (1 + attacker.experienceLevel * 0.05);

    // Unit type modifiers
    if (attacker.type.includes('anti_tank') && target.type.includes('tank')) {
      accuracy *= 1.2; // Anti-tank guns are more accurate against tanks
    }

    if (attacker.type.includes('artillery')) {
      accuracy *= 0.8; // Artillery is less accurate
    }

    return Math.max(0.1, Math.min(0.95, accuracy));
  }

  private calculateDamage(attacker: Unit, target: Unit): number {
    let damage = attacker.stats.damage;

    // Random variance
    const variance = 0.2;
    const multiplier = 1 + (Math.random() - 0.5) * variance;
    damage *= multiplier;

    // Armor reduction
    const armorReduction = target.stats.armor / (target.stats.armor + 100);
    damage *= (1 - armorReduction);

    // Unit type effectiveness
    if (attacker.type.includes('anti_tank') && target.type.includes('tank')) {
      damage *= 1.5; // Anti-tank guns are effective against tanks
    }
    
    if (attacker.type.includes('artillery')) {
      if (target.type.includes('infantry')) {
        damage *= 1.3; // Artillery effective against infantry
      } else if (target.type.includes('tank')) {
        damage *= 0.8; // Less effective against tanks
      }
    }

    if (attacker.type.includes('tank') && target.type.includes('infantry')) {
      damage *= 1.2; // Tanks are effective against infantry
    }

    // Experience modifier
    damage *= (1 + attacker.experienceLevel * 0.1);

    // Critical hit chance
    const criticalChance = 0.05 + (attacker.experienceLevel * 0.02);
    if (Math.random() < criticalChance) {
      damage *= 2;
    }

    return Math.max(1, Math.floor(damage));
  }

  private createProjectile(attacker: Unit, target: Unit, willHit: boolean): Projectile {
    const velocity = this.calculateProjectileVelocity(attacker.position, target.position, willHit);
    
    return {
      id: `projectile_${this.projectileIdCounter++}`,
      position: { ...attacker.position },
      velocity,
      damage: willHit ? this.calculateDamage(attacker, target) : 0,
      range: attacker.stats.range,
      distanceTraveled: 0,
      source: attacker,
      target: willHit ? target : undefined,
      type: this.getProjectileType(attacker)
    };
  }

  private getProjectileType(unit: Unit): 'bullet' | 'shell' | 'rocket' {
    if (unit.type.includes('tank') || unit.type.includes('artillery') || unit.type.includes('anti_tank')) {
      return 'shell';
    } else if (unit.type.includes('stuka')) {
      return 'rocket';
    } else {
      return 'bullet';
    }
  }

  private calculateProjectileVelocity(start: Position, target: Position, willHit: boolean): { x: number; y: number } {
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return { x: 0, y: 0 };

    let speed = 400; // Base projectile speed
    
    // Add inaccuracy for misses
    if (!willHit) {
      const inaccuracyAngle = (Math.random() - 0.5) * 0.3; // ±0.15 radians
      const angle = Math.atan2(dy, dx) + inaccuracyAngle;
      return {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      };
    }

    return {
      x: (dx / distance) * speed,
      y: (dy / distance) * speed
    };
  }

  private updateProjectiles(deltaTime: number): void {
    this.projectiles = this.projectiles.filter(projectile => {
      // Update position
      projectile.position.x += projectile.velocity.x * (deltaTime / 1000);
      projectile.position.y += projectile.velocity.y * (deltaTime / 1000);
      
      // Update distance traveled
      const frameDistance = Math.sqrt(
        projectile.velocity.x * projectile.velocity.x + 
        projectile.velocity.y * projectile.velocity.y
      ) * (deltaTime / 1000);
      projectile.distanceTraveled += frameDistance;

      // Remove if out of range or off screen
      if (projectile.distanceTraveled > projectile.range ||
          projectile.position.x < -100 || projectile.position.x > 1300 ||
          projectile.position.y < -100 || projectile.position.y > 900) {
        return false;
      }

      return true;
    });
  }

  private checkProjectileHits(playerUnits: Unit[], enemyUnits: Unit[]): {
    playerUnitsChanged: boolean;
    enemyUnitsChanged: boolean;
    updatedPlayerUnits: Unit[];
    updatedEnemyUnits: Unit[];
  } {
    let updatedPlayerUnits = [...playerUnits];
    let updatedEnemyUnits = [...enemyUnits];
    let playerUnitsChanged = false;
    let enemyUnitsChanged = false;

    this.projectiles = this.projectiles.filter(projectile => {
      if (!projectile.target) return true; // Keep projectiles without targets

      // Check if projectile reached target
      const distance = this.getDistance(projectile.position, projectile.target.position);
      if (distance <= 20) { // Hit threshold
        // Apply damage
        if (projectile.target.faction === 'allied') {
          const unitIndex = updatedPlayerUnits.findIndex(u => u.id === projectile.target!.id);
          if (unitIndex !== -1) {
            updatedPlayerUnits[unitIndex] = this.applyDamage(updatedPlayerUnits[unitIndex], projectile.damage);
            playerUnitsChanged = true;
          }
        } else {
          const unitIndex = updatedEnemyUnits.findIndex(u => u.id === projectile.target!.id);
          if (unitIndex !== -1) {
            updatedEnemyUnits[unitIndex] = this.applyDamage(updatedEnemyUnits[unitIndex], projectile.damage);
            enemyUnitsChanged = true;
          }
        }

        // Create explosion
        this.createExplosion(projectile.position, projectile.type);
        
        return false; // Remove projectile
      }

      return true; // Keep projectile
    });

    return {
      playerUnitsChanged,
      enemyUnitsChanged,
      updatedPlayerUnits,
      updatedEnemyUnits
    };
  }

  private applyDamage(unit: Unit, damage: number): Unit {
    const newHealth = Math.max(0, unit.stats.health - damage);
    const isDestroyed = newHealth === 0 && unit.stats.health > 0;

    const updatedUnit = {
      ...unit,
      stats: {
        ...unit.stats,
        health: newHealth
      }
    };

    // Apply morale penalties for taking damage
    if (damage > 0) {
      const moraleDamage = Math.min(20, damage / 5);
      updatedUnit.morale = Math.max(0, updatedUnit.morale - moraleDamage);
    }

    // Create combat event
    if (isDestroyed) {
      this.addCombatEvent({
        id: `event_${this.eventIdCounter++}`,
        type: 'destroy',
        attacker: unit, // Temp placeholder
        target: unit,
        damage,
        position: unit.position,
        timestamp: Date.now()
      });
    }

    return updatedUnit;
  }

  private createExplosion(position: Position, projectileType: 'bullet' | 'shell' | 'rocket'): void {
    const explosionTypes: Record<typeof projectileType, 'small' | 'medium' | 'large'> = {
      'bullet': 'small',
      'shell': 'medium',
      'rocket': 'large'
    };

    const explosion: Explosion = {
      id: `explosion_${this.explosionIdCounter++}`,
      position: { ...position },
      radius: projectileType === 'rocket' ? 60 : projectileType === 'shell' ? 40 : 20,
      damage: projectileType === 'rocket' ? 80 : projectileType === 'shell' ? 40 : 10,
      duration: projectileType === 'rocket' ? 1000 : projectileType === 'shell' ? 800 : 500,
      elapsed: 0,
      type: explosionTypes[projectileType]
    };

    this.explosions.push(explosion);
  }

  private updateExplosions(deltaTime: number): void {
    this.explosions = this.explosions.filter(explosion => {
      explosion.elapsed += deltaTime;
      return explosion.elapsed < explosion.duration;
    });
  }

  private addProjectile(projectile: Projectile): void {
    this.projectiles.push(projectile);
  }

  private addCombatEvent(event: CombatEvent): void {
    this.combatEvents.push(event);
  }

  private cleanupOldEvents(): void {
    const now = Date.now();
    this.combatEvents = this.combatEvents.filter(event => 
      now - event.timestamp < 5000 // Keep events for 5 seconds
    );
  }

  private getDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Public getters for rendering
  getProjectiles(): Projectile[] {
    return [...this.projectiles];
  }

  getExplosions(): Explosion[] {
    return [...this.explosions];
  }

  getRecentCombatEvents(): CombatEvent[] {
    return [...this.combatEvents];
  }

  // Debug methods
  getCombatStatistics(): {
    totalProjectiles: number;
    activeExplosions: number;
    recentEvents: number;
  } {
    return {
      totalProjectiles: this.projectiles.length,
      activeExplosions: this.explosions.length,
      recentEvents: this.combatEvents.length
    };
  }
}