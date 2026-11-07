"""
app/services/simulator.py
─────────────────────────
Sensor simulator: generates realistic temperature readings per unit.
Scenarios: NORMAL, DOOR_OPEN, POWER_FAILURE, SENSOR_OFFLINE,
           FREEZER_WARMING, RECOVER.
1 tick = 1 simulated minute.
"""
import random
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class UnitSimulator:
    """State for one storage unit's simulated sensor."""
    unit_id: int
    base_temp: float = 5.0          # target normal temperature
    temp: float = 5.0               # current simulated temperature
    scenario: str = "normal"        # current scenario
    door_steps: int = 0             # countdown steps for door-open spike
    # critical flag is set by the scenario injector
    is_critical: bool = False

    def set_scenario(self, name: str) -> None:
        """Switch to a new scenario (called from the API)."""
        self.scenario = name
        if name == "door_open":
            self.door_steps = 4     # spike lasts ~4 minutes then auto-recovers
        elif name == "recover":
            self.scenario = "normal"

    def step(self) -> Optional[float]:
        """
        Advance one simulated minute.
        Returns the temperature reading, or None if sensor is offline.
        """
        if self.scenario == "sensor_offline":
            return None                        # no data – sensor is offline

        if self.scenario == "door_open":
            # Rapid rise towards 12 C, then self-recover
            target = 12.0
            self.temp += (target - self.temp) * 0.4 + random.uniform(-0.1, 0.1)
            self.door_steps -= 1
            if self.door_steps <= 0:
                self.scenario = "normal"       # door closed automatically

        elif self.scenario == "power_failure":
            # Slow steady rise ~0.1 C/minute (like a real power cut)
            self.temp += 0.1 + random.uniform(-0.05, 0.05)

        elif self.scenario == "freezer_warming":
            # Slower rise for a freezer
            self.temp += 0.05 + random.uniform(-0.02, 0.02)

        else:
            # Normal: oscillate around the base temperature
            self.temp += (self.base_temp - self.temp) * 0.3 + random.uniform(-0.2, 0.2)

        return round(self.temp, 2)


class SimulatorManager:
    """
    Manages simulators for all storage units.
    The monitoring engine calls tick() every second (adjustable speed).
    """

    def __init__(self):
        # unit_id → UnitSimulator
        self._units: dict[int, UnitSimulator] = {}
        self.speed: int = 1          # ticks per real second (1-20)
        self.paused: bool = False

    def register(self, unit_id: int, base_temp: float = 5.0) -> None:
        """Register a unit so the simulator generates readings for it."""
        if unit_id not in self._units:
            self._units[unit_id] = UnitSimulator(unit_id=unit_id, base_temp=base_temp, temp=base_temp)

    def inject(self, unit_id: int, scenario: str) -> None:
        """Inject a fault scenario for a unit (called from the simulator API)."""
        if unit_id in self._units:
            self._units[unit_id].set_scenario(scenario)

    def tick(self, unit_id: int) -> Optional[float]:
        """Return one reading for the unit (None = offline)."""
        if unit_id not in self._units:
            return None
        return self._units[unit_id].step()

    def reset(self, unit_id: int) -> None:
        """Reset a unit simulator to normal."""
        if unit_id in self._units:
            u = self._units[unit_id]
            u.temp = u.base_temp
            u.scenario = "normal"
            u.door_steps = 0

    def reset_all(self) -> None:
        for uid in self._units:
            self.reset(uid)

    def get_state(self) -> dict:
        return {
            "speed": self.speed,
            "paused": self.paused,
            "units": {
                uid: {"scenario": u.scenario, "temp": round(u.temp, 2)}
                for uid, u in self._units.items()
            },
        }


# Global singleton shared between the monitoring engine and the API router
simulator_manager = SimulatorManager()

