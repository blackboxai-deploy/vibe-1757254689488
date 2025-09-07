import { Resources, Unit, Building } from "../types/GameTypes";

interface ResourceConfig {
  moneyGenerationRate: number;
  fuelConsumptionRate: number;
  ammoConsumptionRate: number;
  reinforcementCooldown: number;
  maxResources: Resources;
}

export class ResourceSystem {
  private config: ResourceConfig;
  private lastUpdate: number = 0;
  private reinforcementTimer: number = 0;

  constructor() {
    this.config = {
      moneyGenerationRate: 50, // Money per second
      fuelConsumptionRate: 0.1, // Fuel per second per unit
      ammoConsumptionRate: 0.05, // Ammo per second per unit
      reinforcementCooldown: 30000, // 30 seconds for new reinforcement
      maxResources: {
        money: 5000,
        fuel: 100,
        ammunition: 100,
        reinforcements: 10,
        supply: 100
      }
    };
  }

  update(currentResources: Resources, deltaTime: number, units?: Unit[], buildings?: Building[]): Resources {
    const now = Date.now();
    if (this.lastUpdate === 0) this.lastUpdate = now;
    
    const timeDelta = deltaTime / 1000; // Convert to seconds
    let updatedResources = { ...currentResources };

    // Generate money over time
    updatedResources.money = Math.min(
      this.config.maxResources.money,
      updatedResources.money + (this.config.moneyGenerationRate * timeDelta)
    );

    // Fuel consumption based on active units
    if (units) {
      const movingUnits = units.filter(unit => unit.isMoving).length;
      const fuelConsumption = movingUnits * this.config.fuelConsumptionRate * timeDelta;
      updatedResources.fuel = Math.max(0, updatedResources.fuel - fuelConsumption);
    }

    // Ammunition consumption
    if (units) {
      const attackingUnits = units.filter(unit => unit.isAttacking).length;
      const ammoConsumption = attackingUnits * this.config.ammoConsumptionRate * timeDelta;
      updatedResources.ammunition = Math.max(0, updatedResources.ammunition - ammoConsumption);
    }

    // Reinforcement generation
    this.reinforcementTimer += deltaTime;
    if (this.reinforcementTimer >= this.config.reinforcementCooldown) {
      updatedResources.reinforcements = Math.min(
        this.config.maxResources.reinforcements,
        updatedResources.reinforcements + 1
      );
      this.reinforcementTimer = 0;
    }

    // Supply regeneration (slower for balance)
    if (updatedResources.supply < this.config.maxResources.supply) {
      updatedResources.supply = Math.min(
        this.config.maxResources.supply,
        updatedResources.supply + (10 * timeDelta) // 10 supply per second
      );
    }

    // Building-based resource bonuses
    if (buildings) {
      const controlledBuildings = buildings.filter(b => b.isControlled && b.faction === 'allied');
      
      controlledBuildings.forEach(building => {
        switch (building.type) {
          case 'factory':
            // Factory increases money generation
            updatedResources.money = Math.min(
              this.config.maxResources.money,
              updatedResources.money + (25 * timeDelta)
            );
            break;
            
          case 'depot':
            // Depot provides fuel and ammo
            updatedResources.fuel = Math.min(
              this.config.maxResources.fuel,
              updatedResources.fuel + (5 * timeDelta)
            );
            updatedResources.ammunition = Math.min(
              this.config.maxResources.ammunition,
              updatedResources.ammunition + (5 * timeDelta)
            );
            break;
            
          case 'headquarters':
            // HQ provides reinforcements faster
            if (this.reinforcementTimer >= this.config.reinforcementCooldown * 0.7) {
              updatedResources.reinforcements = Math.min(
                this.config.maxResources.reinforcements,
                updatedResources.reinforcements + 1
              );
              this.reinforcementTimer = 0;
            }
            break;
        }
      });
    }

    this.lastUpdate = now;
    return updatedResources;
  }

  // Resource spending methods
  spendMoney(currentResources: Resources, amount: number): { success: boolean; newResources: Resources } {
    if (currentResources.money >= amount) {
      return {
        success: true,
        newResources: {
          ...currentResources,
          money: currentResources.money - amount
        }
      };
    }
    return { success: false, newResources: currentResources };
  }

  spendFuel(currentResources: Resources, amount: number): { success: boolean; newResources: Resources } {
    if (currentResources.fuel >= amount) {
      return {
        success: true,
        newResources: {
          ...currentResources,
          fuel: currentResources.fuel - amount
        }
      };
    }
    return { success: false, newResources: currentResources };
  }

  spendAmmunition(currentResources: Resources, amount: number): { success: boolean; newResources: Resources } {
    if (currentResources.ammunition >= amount) {
      return {
        success: true,
        newResources: {
          ...currentResources,
          ammunition: currentResources.ammunition - amount
        }
      };
    }
    return { success: false, newResources: currentResources };
  }

  useReinforcement(currentResources: Resources): { success: boolean; newResources: Resources } {
    if (currentResources.reinforcements > 0) {
      return {
        success: true,
        newResources: {
          ...currentResources,
          reinforcements: currentResources.reinforcements - 1
        }
      };
    }
    return { success: false, newResources: currentResources };
  }

  // Resource checking methods
  canAfford(resources: Resources, cost: { money?: number; fuel?: number; ammunition?: number; reinforcements?: number }): boolean {
    return (cost.money ? resources.money >= cost.money : true) &&
           (cost.fuel ? resources.fuel >= cost.fuel : true) &&
           (cost.ammunition ? resources.ammunition >= cost.ammunition : true) &&
           (cost.reinforcements ? resources.reinforcements >= cost.reinforcements : true);
  }

  getResourceEfficiency(resources: Resources): number {
    // Calculate overall resource efficiency (0-1)
    const moneyRatio = resources.money / this.config.maxResources.money;
    const fuelRatio = resources.fuel / this.config.maxResources.fuel;
    const ammoRatio = resources.ammunition / this.config.maxResources.ammunition;
    const reinforcementRatio = resources.reinforcements / this.config.maxResources.reinforcements;

    return (moneyRatio + fuelRatio + ammoRatio + reinforcementRatio) / 4;
  }

  // Configuration methods
  setDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'expert'): void {
    const difficultyMultipliers = {
      easy: 1.5,
      medium: 1.0,
      hard: 0.7,
      expert: 0.5
    };

    const multiplier = difficultyMultipliers[difficulty];
    
    this.config.moneyGenerationRate *= multiplier;
    this.config.reinforcementCooldown /= multiplier;
  }

  // Emergency resource methods
  emergencySupply(currentResources: Resources): Resources {
    // Emergency supply drop - costs reinforcements
    if (currentResources.reinforcements >= 2) {
      return {
        ...currentResources,
        fuel: Math.min(this.config.maxResources.fuel, currentResources.fuel + 30),
        ammunition: Math.min(this.config.maxResources.ammunition, currentResources.ammunition + 30),
        reinforcements: currentResources.reinforcements - 2
      };
    }
    return currentResources;
  }

  sellEquipment(currentResources: Resources, unit: Unit): Resources {
    // Sell a unit for partial money refund
    const refundValue = Math.floor(unit.stats.cost * 0.6);
    
    return {
      ...currentResources,
      money: Math.min(this.config.maxResources.money, currentResources.money + refundValue)
    };
  }

  // Utility methods
  getResourceStatus(resources: Resources): {
    money: 'critical' | 'low' | 'medium' | 'high';
    fuel: 'critical' | 'low' | 'medium' | 'high';
    ammunition: 'critical' | 'low' | 'medium' | 'high';
    reinforcements: 'critical' | 'low' | 'medium' | 'high';
  } {
    const getStatus = (current: number, max: number) => {
      const ratio = current / max;
      if (ratio < 0.15) return 'critical';
      if (ratio < 0.4) return 'low';
      if (ratio < 0.8) return 'medium';
      return 'high';
    };

    return {
      money: getStatus(resources.money, this.config.maxResources.money),
      fuel: getStatus(resources.fuel, this.config.maxResources.fuel),
      ammunition: getStatus(resources.ammunition, this.config.maxResources.ammunition),
      reinforcements: getStatus(resources.reinforcements, this.config.maxResources.reinforcements)
    };
  }

  getNextReinforcementTime(): number {
    return Math.max(0, this.config.reinforcementCooldown - this.reinforcementTimer);
  }

  getResourcePrediction(currentResources: Resources, timeSeconds: number): Resources {
    // Predict resource levels after specified time
    return {
      money: Math.min(
        this.config.maxResources.money,
        currentResources.money + (this.config.moneyGenerationRate * timeSeconds)
      ),
      fuel: currentResources.fuel, // Depends on unit activity
      ammunition: currentResources.ammunition, // Depends on combat
      reinforcements: currentResources.reinforcements + Math.floor(timeSeconds / (this.config.reinforcementCooldown / 1000)),
      supply: Math.min(this.config.maxResources.supply, currentResources.supply + (10 * timeSeconds))
    };
  }

  // Debug methods
  getResourceGenerationRates(): {
    moneyPerSecond: number;
    reinforcementCooldownSeconds: number;
  } {
    return {
      moneyPerSecond: this.config.moneyGenerationRate,
      reinforcementCooldownSeconds: this.config.reinforcementCooldown / 1000
    };
  }

  forceResourceUpdate(newResources: Resources): Resources {
    // For debugging or special events
    return {
      money: Math.min(this.config.maxResources.money, Math.max(0, newResources.money)),
      fuel: Math.min(this.config.maxResources.fuel, Math.max(0, newResources.fuel)),
      ammunition: Math.min(this.config.maxResources.ammunition, Math.max(0, newResources.ammunition)),
      reinforcements: Math.min(this.config.maxResources.reinforcements, Math.max(0, newResources.reinforcements)),
      supply: Math.min(this.config.maxResources.supply, Math.max(0, newResources.supply))
    };
  }
}