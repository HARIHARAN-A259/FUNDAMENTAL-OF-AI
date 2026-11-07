"""
app/services/mkt.py
────────────────────
Mean Kinetic Temperature (MKT) calculation.

MKT is the single temperature equivalent to a variable temperature
exposure that produces the same chemical/biological degradation.
Formula:
    MKT = -Ea/R  /  ln( (1/n) * Σ exp(-Ea / R*Ti) )

Where:
    Ea = activation energy = 83,144 J/mol (standard for pharma)
    R  = universal gas constant = 8.314 J/(mol·K)
    Ti = temperature in Kelvin for each reading
    n  = number of readings
"""
import math
from typing import Sequence

Ea = 83_144.0   # Activation energy (J/mol) – standard pharma value
R  = 8.314      # Gas constant (J/(mol·K))


def calculate_mkt(temperatures_celsius: Sequence[float]) -> float:
    """
    Calculate MKT for a list of temperature readings (in Celsius).
    Returns MKT in Celsius. Returns 0.0 if the list is empty.
    """
    temps = list(temperatures_celsius)
    if not temps:
        return 0.0

    n = len(temps)
    # Convert each reading to Kelvin and compute exp(-Ea / R*T)
    exp_sum = sum(math.exp(-Ea / (R * (t + 273.15))) for t in temps)
    avg_exp = exp_sum / n

    # Inverse: T = -Ea/R / ln(avg_exp), then convert back to Celsius
    mkt_kelvin = -Ea / (R * math.log(avg_exp))
    return round(mkt_kelvin - 273.15, 2)

