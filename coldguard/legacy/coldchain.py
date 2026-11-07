"""
Cold-Chain Monitoring and Escalation Agent (core logic)
Run a text demo with:  python coldchain.py
"""
import random
import sqlite3
from datetime import datetime, timedelta

# ---------------- RULES (change these as you like) ----------------
SAFE_MIN, SAFE_MAX = 2.0, 8.0        # safe vaccine range in deg C
CRIT_MIN, CRIT_MAX = 0.0, 10.0       # beyond this = critical
EXCURSION_MIN = 5                    # minutes outside range before alert
OFFLINE_MIN = 10                     # minutes without data = sensor offline
ESCALATE_L2_MIN = 10                 # minutes unacknowledged -> manager
ESCALATE_L3_MIN = 20                 # minutes unacknowledged -> medical officer

RECIPIENTS = {1: "Store Staff", 2: "Store Manager", 3: "Medical Officer"}


# ---------------- DATABASE ----------------
class Database:
    def __init__(self, path="coldchain.db"):
        self.conn = sqlite3.connect(path, check_same_thread=False)
        self.conn.executescript("""
        CREATE TABLE IF NOT EXISTS readings(ts TEXT, temp REAL);
        CREATE TABLE IF NOT EXISTS alerts(
            id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, opened TEXT,
            closed TEXT, level INTEGER, acked_by TEXT, acked_at TEXT, message TEXT);
        CREATE TABLE IF NOT EXISTS notifications(
            ts TEXT, alert_id INTEGER, level INTEGER, recipient TEXT, message TEXT);
        """)

    def reset(self):
        for t in ("readings", "alerts", "notifications"):
            self.conn.execute(f"DELETE FROM {t}")
        self.conn.commit()

    def add_reading(self, ts, temp):
        self.conn.execute("INSERT INTO readings VALUES(?,?)", (ts.isoformat(" "), temp))
        self.conn.commit()

    def add_alert(self, type_, opened, message):
        cur = self.conn.execute(
            "INSERT INTO alerts(type,opened,level,message) VALUES(?,?,1,?)",
            (type_, opened.isoformat(" "), message))
        self.conn.commit()
        return cur.lastrowid

    def update_alert(self, alert_id, **fields):
        for k, v in fields.items():
            if isinstance(v, datetime):
                v = v.isoformat(" ")
            self.conn.execute(f"UPDATE alerts SET {k}=? WHERE id=?", (v, alert_id))
        self.conn.commit()

    def add_notification(self, ts, alert_id, level, recipient, message):
        self.conn.execute("INSERT INTO notifications VALUES(?,?,?,?,?)",
                          (ts.isoformat(" "), alert_id, level, recipient, message))
        self.conn.commit()

    def query(self, sql):
        cur = self.conn.execute(sql)
        cols = [c[0] for c in cur.description]
        return cols, cur.fetchall()


# ---------------- SENSOR SIMULATOR ----------------
class Simulator:
    """Pretends to be a fridge temperature sensor (one reading per minute)."""

    def __init__(self):
        self.temp = 5.0
        self.scenario = "normal"
        self.door_steps = 0

    def set_scenario(self, name):
        self.scenario = name
        self.door_steps = 3 if name == "door_open" else 0

    def step(self):
        if self.scenario == "sensor_offline":
            return None                       # no data
        if self.scenario == "door_open":
            target, rate = 12.0, 0.3
            self.door_steps -= 1
            if self.door_steps <= 0:
                self.scenario = "normal"      # door closed again
        elif self.scenario == "power_failure":
            self.temp += 0.1 + random.uniform(-0.05, 0.05)   # warms ~0.1 C per minute
            return round(self.temp, 2)
        else:
            target, rate = 5.0, 0.3
        self.temp += (target - self.temp) * rate + random.uniform(-0.2, 0.2)
        return round(self.temp, 2)


# ---------------- ESCALATION AGENT ----------------
class ColdChainAgent:
    def __init__(self, db, notify=None):
        self.db = db
        self.notify_fn = notify or (lambda ts, level, who, msg: print(f"[{ts:%H:%M}] -> {who}: {msg}"))
        self.out_since = None
        self.last_seen = None
        self.alerts = {"TEMPERATURE": None, "SENSOR": None}   # open alerts (dicts)

    # -- main entry: call once per reading --
    def process(self, now, temp):
        if self.last_seen is None:
            self.last_seen = now

        if temp is None:                                       # no data
            if (now - self.last_seen).total_seconds() / 60 >= OFFLINE_MIN:
                self._open("SENSOR", now, f"Sensor offline for {OFFLINE_MIN}+ minutes")
        else:
            self.last_seen = now
            self.db.add_reading(now, temp)
            self._close("SENSOR", now)
            self._check_temperature(now, temp)

        for kind in self.alerts:
            self._escalate(kind, now, temp)

    def _check_temperature(self, now, temp):
        if SAFE_MIN <= temp <= SAFE_MAX:
            self.out_since = None
            self._close("TEMPERATURE", now)
            return
        if self.out_since is None:
            self.out_since = now
        minutes_out = (now - self.out_since).total_seconds() / 60
        if minutes_out >= EXCURSION_MIN:
            self._open("TEMPERATURE", now, f"Temperature excursion: {temp} C (safe {SAFE_MIN}-{SAFE_MAX} C)")

    # -- alert helpers --
    def _open(self, kind, now, message):
        if self.alerts[kind]:
            return
        aid = self.db.add_alert(kind, now, message)
        self.alerts[kind] = {"id": aid, "opened": now, "level": 0, "acked": False, "msg": message}

    def _close(self, kind, now):
        a = self.alerts[kind]
        if a:
            self.db.update_alert(a["id"], closed=now)
            self.notify_fn(now, 0, "System", f"{kind} alert #{a['id']} resolved - back to normal")
            self.alerts[kind] = None

    def _escalate(self, kind, now, temp):
        a = self.alerts[kind]
        if not a or a["acked"]:
            return
        mins = (now - a["opened"]).total_seconds() / 60
        target = 1
        if mins >= ESCALATE_L2_MIN:
            target = 2
        if mins >= ESCALATE_L3_MIN:
            target = 3
        if kind == "TEMPERATURE" and temp is not None and (temp > CRIT_MAX or temp < CRIT_MIN):
            target = 3                                         # critical temperature
        if target > a["level"]:
            a["level"] = target
            who = RECIPIENTS[target]
            msg = f"ALERT #{a['id']} (Level {target}): {a['msg']}"
            self.db.update_alert(a["id"], level=target)
            self.db.add_notification(now, a["id"], target, who, msg)
            self.notify_fn(now, target, who, msg)

    def acknowledge(self, kind, name, now):
        a = self.alerts[kind]
        if a and not a["acked"]:
            a["acked"] = True
            self.db.update_alert(a["id"], acked_by=name, acked_at=now)
            self.notify_fn(now, 0, "System", f"Alert #{a['id']} acknowledged by {name} - escalation stopped")


# ---------------- TEXT DEMO ----------------
def demo():
    db = Database(":memory:")
    sim, agent = Simulator(), ColdChainAgent(db)
    now = datetime(2026, 11, 7, 8, 0)
    plan = {10: "door_open", 20: "power_failure", 100: "normal"}   # minute -> scenario
    print("=== Cold-chain demo (1 line = 1 simulated minute) ===")
    for minute in range(115):
        if minute in plan:
            print(f"\n*** Minute {minute}: scenario -> {plan[minute]} ***")
            sim.set_scenario(plan[minute])
        temp = sim.step()
        agent.process(now, temp)
        print(f"{now:%H:%M}  temp={temp}")
        if minute == 85 and agent.alerts["TEMPERATURE"]:
            agent.acknowledge("TEMPERATURE", "Ravi (Manager)", now)
        now += timedelta(minutes=1)


if __name__ == "__main__":
    demo()
