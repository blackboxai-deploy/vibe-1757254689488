import { Unit, UnitType, UnitFaction, Position, UnitStats } from "../types/GameTypes";

export class PlayerUnits {
  private unitIdCounter: number = 0;

  createUnit(type: UnitType, position: Position): Unit {
    this.unitIdCounter++;
    const stats = this.getUnitStats(type);

    return {
      id: `player_${type}_${this.unitIdCounter}`,
      type,
      faction: UnitFaction.ALLIED,
      position,
      rotation: 0,
      stats,
      isSelected: false,
      isMoving: false,
      isAttacking: false,
      lastAttack: 0,
      experienceLevel: 1,
      killCount: 0,
      morale: 100,
      ammunition: 100,
      fuel: 100,
      speed: stats.speed
    };
  }

  createInitialForces(scenarioId: number): Unit[] {
    const units: Unit[] = [];
    
    switch (scenarioId) {
      case 0: // Operation Overlord - Beach Landing
        units.push(
          this.createUnit(UnitType.INFANTRY, { x: 150, y: 700 }),
          this.createUnit(UnitType.INFANTRY, { x: 200, y: 720 }),
          this.createUnit(UnitType.INFANTRY, { x: 250, y: 700 }),
          this.createUnit(UnitType.TANK_SHERMAN, { x: 120, y: 650 }),
          this.createUnit(UnitType.TANK_SHERMAN, { x: 180, y: 630 }),
          this.createUnit(UnitType.ENGINEER, { x: 300, y: 680 }),
          this.createUnit(UnitType.ANTI_TANK, { x: 350, y: 660 })
        );
        break;
        
      case 1: // Battle of Stalingrad - Urban Defense
        units.push(
          this.createUnit(UnitType.INFANTRY, { x: 100, y: 600 }),
          this.createUnit(UnitType.INFANTRY, { x: 150, y: 620 }),
          this.createUnit(UnitType.INFANTRY, { x: 200, y: 600 }),
          this.createUnit(UnitType.TANK_T34, { x: 80, y: 550 }),
          this.createUnit(UnitType.TANK_T34, { x: 160, y: 570 }),
          this.createUnit(UnitType.ARTILLERY, { x: 50, y: 700 }),
          this.createUnit(UnitType.ANTI_TANK, { x: 250, y: 650 }),
          this.createUnit(UnitType.ENGINEER, { x: 300, y: 680 })
        );
        break;
        
      case 2: // Operation Barbarossa - Eastern Front
        units.push(
          this.createUnit(UnitType.INFANTRY, { x: 120, y: 650 }),
          this.createUnit(UnitType.INFANTRY, { x: 170, y: 670 }),
          this.createUnit(UnitType.TANK_T34, { x: 100, y: 600 }),
          this.createUnit(UnitType.TANK_T34, { x: 200, y: 580 }),
          this.createUnit(UnitType.ARTILLERY, { x: 60, y: 720 }),
          this.createUnit(UnitType.ARTILLERY, { x: 140, y: 740 }),
          this.createUnit(UnitType.ANTI_TANK, { x: 280, y: 650 })
        );
        break;
        
      default:
        // Default starting force
        units.push(
          this.createUnit(UnitType.INFANTRY, { x: 150, y: 700 }),
          this.createUnit(UnitType.TANK_SHERMAN, { x: 120, y: 650 }),
          this.createUnit(UnitType.ARTILLERY, { x: 80, y: 720 })
        );
    }

    return units;
  }

  getUnitStats(type: UnitType): UnitStats {
    const baseStats: Record<UnitType, UnitStats> = {
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
      // Enemy units (shouldn't be used here but included for completeness)
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

  getUnitCost(type: UnitType): number {
    return this.getUnitStats(type).cost;
  }

  upgradeUnit(unit: Unit): Unit {
    const upgradedStats = { ...unit.stats };
    const levelMultiplier = 1 + (unit.experienceLevel * 0.1);

    upgradedStats.health = Math.floor(upgradedStats.maxHealth * levelMultiplier);
    upgradedStats.maxHealth = Math.floor(upgradedStats.maxHealth * levelMultiplier);
    upgradedStats.damage = Math.floor(upgradedStats.damage * levelMultiplier);
    upgradedStats.accuracy = Math.min(0.95, upgradedStats.accuracy + (unit.experienceLevel * 0.02));

    return {
      ...unit,
      stats: upgradedStats,
      experienceLevel: unit.experienceLevel + 1
    };
  }

  gainExperience(unit: Unit, experiencePoints: number): Unit {
    const newKillCount = unit.killCount + (experiencePoints / 10);
    const newExperienceLevel = Math.floor(newKillCount / 5) + 1;

    if (newExperienceLevel > unit.experienceLevel) {
      return this.upgradeUnit({
        ...unit,
        killCount: newKillCount,
        experienceLevel: newExperienceLevel
      });
    }

    return {
      ...unit,
      killCount: newKillCount
    };
  }

  repairUnit(unit: Unit, repairAmount: number): Unit {
    const newHealth = Math.min(unit.stats.maxHealth, unit.stats.health + repairAmount);
    
    return {
      ...unit,
      stats: {
        ...unit.stats,
        health: newHealth
      }
    };
  }

  resupplyUnit(unit: Unit): Unit {
    return {
      ...unit,
      ammunition: 100,
      fuel: 100,
      morale: Math.min(100, unit.morale + 20)
    };
  }

  getUnitEffectiveness(unit: Unit): number {
    const healthFactor = unit.stats.health / unit.stats.maxHealth;
    const moraleFactor = unit.morale / 100;
    const ammoFactor = unit.ammunition / 100;
    const fuelFactor = unit.fuel / 100;

    return (healthFactor * 0.4 + moraleFactor * 0.3 + ammoFactor * 0.2 + fuelFactor * 0.1);
  }

  canUnitAttack(unit: Unit): boolean {
    return unit.ammunition > 0 && 
           unit.fuel > 0 && 
           unit.stats.health > 0 && 
           unit.morale > 10 &&
           Date.now() - unit.lastAttack > 1000; // 1 second cooldown
  }

  getUnitDisplayName(type: UnitType): string {
    const names: Record<UnitType, string> = {
      [UnitType.INFANTRY]: "Allied Infantry",
      [UnitType.TANK_SHERMAN]: "M4 Sherman",
      [UnitType.TANK_T34]: "T-34 Medium Tank",
      [UnitType.ARTILLERY]: "Field Artillery",
      [UnitType.ANTI_TANK]: "Anti-Tank Gun",
      [UnitType.ENGINEER]: "Combat Engineers",
      [UnitType.PANZER_IV]: "Panzer IV",
      [UnitType.GERMAN_INFANTRY]: "Wehrmacht Infantry",
      [UnitType.STUKA]: "Ju 87 Stuka"
    };

    return names[type] || type;
  }

  getUnitDescription(type: UnitType): string {
    const descriptions: Record<UnitType, string> = {
      [UnitType.INFANTRY]: "Versatile foot soldiers effective against infantry and light vehicles. Can capture objectives and provide reconnaissance.",
      [UnitType.TANK_SHERMAN]: "Main battle tank with balanced armor, firepower, and mobility. Effective against most enemy units.",
      [UnitType.TANK_T34]: "Soviet medium tank known for reliability and sloped armor. Good balance of speed and protection.",
      [UnitType.ARTILLERY]: "Long-range indirect fire support. Devastating against infantry and structures but vulnerable to direct assault.",
      [UnitType.ANTI_TANK]: "Specialized anti-armor weapon with high penetration. Excellent against tanks but limited mobility.",
      [UnitType.ENGINEER]: "Support unit capable of repairs, construction, and demolition. Can remove obstacles and repair damaged units.",
      [UnitType.PANZER_IV]: "German medium tank with excellent firepower and armor protection.",
      [UnitType.GERMAN_INFANTRY]: "Well-trained Wehrmacht soldiers with superior equipment and tactics.",
      [UnitType.STUKA]: "Dive bomber aircraft providing close air support with devastating precision strikes."
    };

    return descriptions[type] || "Unknown unit type";
  }

  isUnitType(unit: Unit, targetType: UnitType): boolean {
    return unit.type === targetType;
  }

  isInfantryUnit(unit: Unit): boolean {
    return unit.type === UnitType.INFANTRY || 
           unit.type === UnitType.GERMAN_INFANTRY || 
           unit.type === UnitType.ENGINEER;
  }

  isVehicleUnit(unit: Unit): boolean {
    return unit.type === UnitType.TANK_SHERMAN || 
           unit.type === UnitType.TANK_T34 || 
           unit.type === UnitType.PANZER_IV ||
           unit.type === UnitType.ARTILLERY ||
           unit.type === UnitType.ANTI_TANK;
  }

  isAirUnit(unit: Unit): boolean {
    return unit.type === UnitType.STUKA;
  }

  getMovementSpeed(unit: Unit, terrain: string = 'normal'): number {
    let speedModifier = 1.0;
    
    // Terrain modifiers
    switch (terrain) {
      case 'forest':
        speedModifier = this.isInfantryUnit(unit) ? 0.8 : 0.6;
        break;
      case 'urban':
        speedModifier = this.isInfantryUnit(unit) ? 1.1 : 0.7;
        break;
      case 'mud':
        speedModifier = this.isInfantryUnit(unit) ? 0.7 : 0.4;
        break;
      case 'road':
        speedModifier = this.isVehicleUnit(unit) ? 1.3 : 1.1;
        break;
    }

    // Unit condition modifiers
    const fuelModifier = unit.fuel / 100;
    const healthModifier = Math.max(0.5, unit.stats.health / unit.stats.maxHealth);
    
    return unit.speed * speedModifier * fuelModifier * healthModifier;
  }
}