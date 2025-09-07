import { Building, Position, Size, UnitFaction } from "../types/GameTypes";

export class Buildings {
  private buildingIdCounter: number = 0;

  createBuilding(
    type: 'headquarters' | 'factory' | 'depot' | 'bunker' | 'objective',
    position: Position,
    size: Size,
    faction: UnitFaction
  ): Building {
    this.buildingIdCounter++;

    return {
      id: `building_${type}_${this.buildingIdCounter}`,
      type,
      position,
      size,
      health: this.getBuildingMaxHealth(type),
      maxHealth: this.getBuildingMaxHealth(type),
      faction,
      isObjective: type === 'objective',
      isControlled: faction === UnitFaction.ALLIED,
      controlProgress: faction === UnitFaction.ALLIED ? 100 : 0
    };
  }

  private getBuildingMaxHealth(type: 'headquarters' | 'factory' | 'depot' | 'bunker' | 'objective'): number {
    const healthMap = {
      headquarters: 500,
      factory: 400,
      depot: 200,
      bunker: 600,
      objective: 300
    };
    return healthMap[type];
  }

  getBuildingDescription(type: 'headquarters' | 'factory' | 'depot' | 'bunker' | 'objective'): string {
    const descriptions = {
      headquarters: "Command center providing strategic bonuses and reinforcement coordination",
      factory: "Production facility that generates additional income and can produce units",
      depot: "Supply depot providing fuel and ammunition replenishment for nearby units",
      bunker: "Fortified defensive position offering protection and firing positions",
      objective: "Strategic control point that must be captured or defended to achieve victory"
    };
    return descriptions[type];
  }

  getBuildingStats(type: 'headquarters' | 'factory' | 'depot' | 'bunker' | 'objective') {
    const stats = {
      headquarters: {
        armor: 50,
        repairRate: 2,
        commandRadius: 200,
        reinforcementBonus: 0.3,
        resourceGeneration: { money: 25 }
      },
      factory: {
        armor: 40,
        repairRate: 1,
        productionBonus: 0.2,
        resourceGeneration: { money: 50 }
      },
      depot: {
        armor: 20,
        repairRate: 3,
        supplyRadius: 150,
        resourceGeneration: { fuel: 10, ammunition: 10 }
      },
      bunker: {
        armor: 80,
        repairRate: 0.5,
        defenseBonus: 2.0,
        firepower: 60
      },
      objective: {
        armor: 30,
        repairRate: 1,
        captureRadius: 80,
        strategicValue: 100
      }
    };
    return stats[type];
  }

  canBuildingBeRepaired(building: Building): boolean {
    return building.health < building.maxHealth && building.health > 0;
  }

  repairBuilding(building: Building, repairAmount: number): Building {
    if (!this.canBuildingBeRepaired(building)) {
      return building;
    }

    const newHealth = Math.min(building.maxHealth, building.health + repairAmount);
    
    return {
      ...building,
      health: newHealth
    };
  }

  damageBuilding(building: Building, damage: number): Building {
    const newHealth = Math.max(0, building.health - damage);
    
    return {
      ...building,
      health: newHealth
    };
  }

  isBuildingDestroyed(building: Building): boolean {
    return building.health <= 0;
  }

  isBuildingCriticallyDamaged(building: Building): boolean {
    return building.health / building.maxHealth < 0.25;
  }

  getBuildingEfficiency(building: Building): number {
    if (building.health <= 0) return 0;
    
    const healthRatio = building.health / building.maxHealth;
    const controlRatio = building.controlProgress / 100;
    
    return healthRatio * controlRatio;
  }

  updateBuildingControl(
    building: Building, 
    nearbyAlliedUnits: number, 
    nearbyEnemyUnits: number, 
    deltaTime: number
  ): Building {
    if (!building.isObjective || building.health <= 0) {
      return building;
    }

    let newControlProgress = building.controlProgress;
    let newIsControlled = building.isControlled;
    let newFaction = building.faction;

    const timeDelta = deltaTime / 1000; // Convert to seconds
    const baseControlRate = 15; // Points per second per unit

    if (nearbyAlliedUnits > nearbyEnemyUnits) {
      // Allied forces are capturing
      const controlRate = (nearbyAlliedUnits - nearbyEnemyUnits) * baseControlRate * timeDelta;
      newControlProgress = Math.min(100, newControlProgress + controlRate);
      
      if (newControlProgress >= 100 && !newIsControlled) {
        newIsControlled = true;
        newFaction = UnitFaction.ALLIED;
      }
    } else if (nearbyEnemyUnits > nearbyAlliedUnits) {
      // Enemy forces are capturing
      const controlRate = (nearbyEnemyUnits - nearbyAlliedUnits) * baseControlRate * timeDelta;
      newControlProgress = Math.max(0, newControlProgress - controlRate);
      
      if (newControlProgress <= 0 && newIsControlled) {
        newIsControlled = false;
        newFaction = UnitFaction.AXIS;
      }
    }

    return {
      ...building,
      controlProgress: newControlProgress,
      isControlled: newIsControlled,
      faction: newFaction
    };
  }

  getBuildingControlStatus(building: Building): 'allied' | 'contested' | 'enemy' | 'neutral' {
    if (!building.isObjective) {
      return building.faction === UnitFaction.ALLIED ? 'allied' : 'enemy';
    }

    if (building.controlProgress >= 100) {
      return 'allied';
    } else if (building.controlProgress <= 0) {
      return 'enemy';
    } else if (building.controlProgress > 30 && building.controlProgress < 70) {
      return 'contested';
    } else {
      return building.controlProgress > 50 ? 'allied' : 'enemy';
    }
  }

  getBuildingProduction(building: Building): { money?: number; fuel?: number; ammunition?: number } {
    if (building.health <= 0 || !building.isControlled) {
      return {};
    }

    const efficiency = this.getBuildingEfficiency(building);
    const stats = this.getBuildingStats(building.type);

    const production: { money?: number; fuel?: number; ammunition?: number } = {};

    if ('resourceGeneration' in stats) {
      const resourceGen = stats.resourceGeneration as any;
      if (resourceGen.money) {
        production.money = resourceGen.money * efficiency;
      }
      if (resourceGen.fuel) {
        production.fuel = resourceGen.fuel * efficiency;
      }
      if (resourceGen.ammunition) {
        production.ammunition = resourceGen.ammunition * efficiency;
      }
    }

    return production;
  }

  isUnitNearBuilding(unitPosition: Position, building: Building, radius: number): boolean {
    const dx = unitPosition.x - building.position.x;
    const dy = unitPosition.y - building.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= radius;
  }

  getBuildingsInRange(buildings: Building[], position: Position, range: number): Building[] {
    return buildings.filter(building => 
      this.isUnitNearBuilding(position, building, range)
    );
  }

  getStrategicBuildings(buildings: Building[]): Building[] {
    return buildings.filter(building => 
      building.type === 'headquarters' || 
      building.type === 'factory' || 
      building.isObjective
    );
  }

  getAlliedBuildings(buildings: Building[]): Building[] {
    return buildings.filter(building => building.faction === UnitFaction.ALLIED);
  }

  getEnemyBuildings(buildings: Building[]): Building[] {
    return buildings.filter(building => building.faction === UnitFaction.AXIS);
  }

  getContestedBuildings(buildings: Building[]): Building[] {
    return buildings.filter(building => 
      building.isObjective && 
      building.controlProgress > 0 && 
      building.controlProgress < 100
    );
  }

  getBuildingRepairCost(building: Building): number {
    const damagePercent = 1 - (building.health / building.maxHealth);
    const baseCost = 50;
    return Math.floor(baseCost * damagePercent * building.maxHealth / 100);
  }

  canAffordRepair(building: Building, availableMoney: number): boolean {
    return availableMoney >= this.getBuildingRepairCost(building);
  }

  getBuildingDisplayName(type: 'headquarters' | 'factory' | 'depot' | 'bunker' | 'objective'): string {
    const names = {
      headquarters: "Command Headquarters",
      factory: "Production Factory",
      depot: "Supply Depot",
      bunker: "Defensive Bunker",
      objective: "Strategic Point"
    };
    return names[type];
  }

  getBuildingPriority(building: Building): number {
    let priority = 0;

    // Base priority by type
    const typePriorities = {
      headquarters: 100,
      factory: 80,
      objective: 90,
      depot: 60,
      bunker: 50
    };
    priority += typePriorities[building.type];

    // Health priority (lower health = higher priority)
    const healthRatio = building.health / building.maxHealth;
    priority += (1 - healthRatio) * 50;

    // Control priority for objectives
    if (building.isObjective) {
      if (building.controlProgress < 50) {
        priority += 40; // High priority if losing control
      } else if (building.controlProgress > 70) {
        priority += 20; // Medium priority if controlling
      }
    }

    // Strategic value
    if (building.faction === UnitFaction.ALLIED) {
      priority += 30; // Protect allied buildings
    }

    return priority;
  }

  // Utility methods for game logic
  getTotalBuildingValue(buildings: Building[], faction: UnitFaction): number {
    return buildings
      .filter(b => b.faction === faction)
      .reduce((total, building) => {
        const stats = this.getBuildingStats(building.type);
        const baseValue = building.maxHealth;
        const strategicValue = 'strategicValue' in stats ? (stats as any).strategicValue : 50;
        return total + baseValue + strategicValue;
      }, 0);
  }

  getBuildingMaintenanceCost(buildings: Building[]): number {
    return buildings
      .filter(b => b.faction === UnitFaction.ALLIED && b.health > 0)
      .reduce((total, building) => {
        const maintenanceRate = building.maxHealth * 0.01; // 1% of max health per update
        return total + maintenanceRate;
      }, 0);
  }
}