"""Streamlit dashboard. Run with:  streamlit run app.py"""
import time
from datetime import datetime, timedelta

import pandas as pd
import streamlit as st

from coldchain import (SAFE_MIN, SAFE_MAX, ColdChainAgent, Database, Simulator)

st.set_page_config(page_title="Cold-Chain Monitor", page_icon="❄️", layout="wide")
st.title("❄️ Vaccine Cold-Chain Monitoring & Escalation Agent")

# ---- one-time setup (kept between page refreshes) ----
if "db" not in st.session_state:
    st.session_state.db = Database(":memory:")
    st.session_state.sim = Simulator()
    st.session_state.log = []
    st.session_state.now = datetime(2026, 11, 7, 8, 0)
    st.session_state.running = False

    def notify(ts, level, who, msg):
        st.session_state.log.append(f"[{ts:%H:%M}] {who}: {msg}")

    st.session_state.agent = ColdChainAgent(st.session_state.db, notify)

db, sim, agent = st.session_state.db, st.session_state.sim, st.session_state.agent

# ---- sidebar controls ----
st.sidebar.header("Controls")
st.session_state.running = st.sidebar.toggle("Run simulation", st.session_state.running)
st.sidebar.subheader("Inject a fault")
if st.sidebar.button("✅ Normal"):
    sim.set_scenario("normal")
if st.sidebar.button("🚪 Door open (brief)"):
    sim.set_scenario("door_open")
if st.sidebar.button("⚡ Power failure"):
    sim.set_scenario("power_failure")
if st.sidebar.button("📡 Sensor offline"):
    sim.set_scenario("sensor_offline")
st.sidebar.caption(f"Current scenario: **{sim.scenario}**")
name = st.sidebar.text_input("Your name", "Store Staff")

# ---- advance one simulated minute per refresh ----
if st.session_state.running:
    agent.process(st.session_state.now, sim.step())
    st.session_state.now += timedelta(minutes=1)

# ---- status ----
_, rows = db.query("SELECT ts, temp FROM readings ORDER BY ts")
open_alerts = {k: v for k, v in agent.alerts.items() if v}
c1, c2, c3 = st.columns(3)
if rows:
    last = rows[-1][1]
    c1.metric("Current temperature", f"{last} °C")
c2.metric("Simulated time", f"{st.session_state.now:%H:%M}")
if open_alerts:
    c3.error(f"🚨 {len(open_alerts)} active alert(s)")
else:
    c3.success("✅ All normal")

# ---- chart ----
if rows:
    df = pd.DataFrame(rows, columns=["time", "temp"])
    df["min safe"], df["max safe"] = SAFE_MIN, SAFE_MAX
    st.line_chart(df.set_index("time")[["temp", "min safe", "max safe"]])

# ---- active alerts + acknowledge ----
st.subheader("Active alerts")
if not open_alerts:
    st.info("No active alerts.")
for kind, a in open_alerts.items():
    col1, col2 = st.columns([4, 1])
    status = "acknowledged" if a["acked"] else f"Level {a['level']} - notified {a['level'] and ['', 'Staff', 'Manager', 'Medical Officer'][a['level']]}"
    col1.warning(f"**#{a['id']} {kind}** - {a['msg']} ({status})")
    if not a["acked"] and col2.button("Acknowledge", key=f"ack{a['id']}"):
        agent.acknowledge(kind, name, st.session_state.now)
        st.rerun()

# ---- notification log + history ----
left, right = st.columns(2)
with left:
    st.subheader("Notification log")
    st.code("\n".join(st.session_state.log[-15:][::-1]) or "No notifications yet")
with right:
    st.subheader("Alert history")
    cols, data = db.query("SELECT id,type,opened,closed,level,acked_by FROM alerts")
    st.dataframe(pd.DataFrame(data, columns=cols), use_container_width=True)

# ---- CSV export (daily temperature log) ----
if rows:
    st.download_button("⬇ Download temperature log (CSV)",
                       pd.DataFrame(rows, columns=["time", "temp"]).to_csv(index=False),
                       "temperature_log.csv", "text/csv")

# ---- auto refresh ----
if st.session_state.running:
    time.sleep(1)
    st.rerun()
