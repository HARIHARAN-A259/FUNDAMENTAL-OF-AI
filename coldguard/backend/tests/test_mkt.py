"""
tests/test_mkt.py
Tests Mean Kinetic Temperature (MKT) calculation accuracy.
"""
from app.services.mkt import calculate_mkt


def test_mkt_empty():
    assert calculate_mkt([]) == 0.0


def test_mkt_constant_temperature():
    # If temperature is consistently 5.0 C, MKT should be 5.0 C
    temps = [5.0] * 50
    res = calculate_mkt(temps)
    assert abs(res - 5.0) < 0.05


def test_mkt_higher_than_arithmetic_mean():
    # Because higher temperatures accelerate degradation exponentially,
    # MKT of variable temps is always higher than the arithmetic average.
    temps = [2.0, 4.0, 6.0, 8.0, 10.0]
    avg = sum(temps) / len(temps)
    mkt = calculate_mkt(temps)
    assert mkt > avg

