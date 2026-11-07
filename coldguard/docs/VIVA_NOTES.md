# 🎓 ColdGuard: Viva & Presentation Reference Notes

> Project: Autonomous Cold-Chain Monitoring and Escalation Agent for Vaccine Storage  
> Tech Stack: Python 3.11+, FastAPI, SQLAlchemy 2.0, SQLite/PostgreSQL, WebSockets, React 18, Vite, Tailwind CSS.

---

## 1. High-Level Architecture Explanation

ColdGuard is designed according to **Event-Driven Micro-Architecture** principles:
- **FastAPI Core**: Serves REST APIs and provides an asynchronous WebSocket event channel (`/ws`) for zero-latency telemetry streaming.
- **Monitoring Engine (`monitoring_engine.py`)**: An asynchronous background loop that evaluates temperature packets against WHO standard rules every tick (1 tick = 1 simulated minute).
- **Escalation Agent (`escalation_agent.py`)**: An autonomous State Machine (`OPEN` ➔ `ESCALATED_L2` ➔ `ESCALATED_L3` ➔ `ACKNOWLEDGED` / `RESOLVED`).
- **Telemetry Ingestion**: Supports both internal simulated hardware scenarios and real external **ESP32 + DS18B20** digital probes posting via `POST /api/readings/ingest` with API key authentication.
- **Audit Logging**: Every status transition, reminder, and user acknowledgement is permanently recorded in `alert_events`.

---

## 2. Key Cold-Chain Business Rules

1. **Optimal Safe Range (2.0°C to 8.0°C)**:
   - Vaccines degrade if exposed to heat (>8°C) or freezing temperatures (<0°C).
   - Freezing irreversible precipitates aluminum adjuvants in vaccines like DTP, Hepatitis B, and HPV.
2. **5-Minute Excursion Filter**:
   - Opening the refrigerator door to grab a vial causes a brief 2-3 minute spike.
   - To prevent false alarms and operator fatigue, an alert is ONLY created if the temperature stays outside 2-8°C for **5 consecutive minutes**.
3. **Escalation Tiers**:
   - **Level 1 (Store Staff)**: Alerted immediately after 5 minutes outside range.
   - **Level 2 (Store Manager)**: Alerted if unacknowledged after 10 minutes.
   - **Level 3 (Medical Officer)**: Alerted if unacknowledged after 20 minutes OR immediately if temperature is critical (<0°C or >10°C).
4. **Acknowledgement Mechanics**:
   - When any authenticated user acknowledges an alert, escalation stops immediately.
   - When the temperature returns to normal, the system automatically marks the alert `RESOLVED`.
5. **Sensor Offline Detection**:
   - If no telemetry packet is received for 10 minutes, a `SENSOR_OFFLINE` alert is triggered.

---

## 3. Mean Kinetic Temperature (MKT) Formula

**Mean Kinetic Temperature** is defined by the **United States Pharmacopeia (USP)** as the single calculated temperature that represents the total thermal degradation experienced by a pharmaceutical over time:

$$T_{k} = \frac{\frac{-\Delta H}{R}}{\ln\left(\frac{1}{n}\sum_{i=1}^{n}\exp\left(\frac{-\Delta H}{R \cdot T_{i}}\right)\right)}$$

Where:
- $\Delta H$ = Activation energy for decomposition (standard pharma value = $83.144\text{ kJ/mol}$)
- $R$ = Universal gas constant ($8.314\text{ J/(mol}\cdot\text{K)}$)
- $T_{i}$ = Temperature of each reading in Kelvin ($T_{\text{Celsius}} + 273.15$)
- $n$ = Number of readings

**Why not simple average?**
Chemical reaction rates increase exponentially with temperature (Arrhenius equation). A high temperature spike causes significantly more degradation than a proportional cold dip. Therefore, **MKT is always higher than the arithmetic mean**.

---

## 4. Key Project Files

| File | Purpose |
| :--- | :--- |
| `app/main.py` | FastAPI application setup, CORS, lifespan background task manager, API routers. |
| `app/models/` | SQLAlchemy ORM database models (`User`, `StorageUnit`, `Reading`, `Alert`, `AlertEvent`, `Notification`, `ContactPerson`, `Setting`). |
| `app/services/monitoring_engine.py` | Background engine evaluating safe ranges, excursion buffers, and calling the escalation agent. |
| `app/services/escalation_agent.py` | Escalation State Machine (L1 ➔ L2 ➔ L3, reminders, and acknowledgements). |
| `app/services/mkt.py` | Exact logarithmic Arrhenius implementation of Mean Kinetic Temperature. |
| `app/services/simulator.py` | Physical fridge simulation with realistic noise, door open spikes, power failure, and sensor offline states. |
| `app/services/notifier.py` | Multi-channel dispatcher (Console, Telegram Bot, SMTP Email). |
| `app/services/report_pdf.py` | WHO-compliant PDF generator with signature lines using `fpdf2`. |

---

## 5. 25 Likely Viva Questions & Model Answers

### Q1: What problem does this project solve?
**A:** Vaccines are temperature-sensitive biological products that lose potency if exposed to improper temperatures. ColdGuard automates monitoring, detects excursions, and escalates emergencies before stock is spoiled.

### Q2: Why use FastAPI instead of Flask or Django?
**A:** FastAPI provides native asynchronous concurrency (`async`/`await`), built-in WebSocket support, automatic OpenAPI/Swagger documentation, and high performance powered by Starlette and Pydantic.

### Q3: What is the purpose of the 5-minute excursion delay?
**A:** When staff open the fridge door for normal stock retrieval, temperature rises briefly for 2-3 minutes. The 5-minute delay prevents false alarms and notification fatigue.

### Q4: Why is freezing (<0°C) critical for vaccines?
**A:** Freezing irreversibly damages aluminum adjuvant structures in vaccines, rendering them ineffective. That is why temperatures below 0°C trigger immediate Level 3 escalation.

### Q5: How is MKT different from arithmetic mean temperature?
**A:** Arithmetic mean assumes a linear degradation rate. MKT uses the Arrhenius equation to weight higher temperatures exponentially, correctly reflecting biological degradation.

### Q6: How does the Escalation State Machine work?
**A:** It tracks open alerts through states: `OPEN` (Level 1, Staff) ➔ `ESCALATED_L2` (Level 2, Manager at 10m) ➔ `ESCALATED_L3` (Level 3, Medical Officer at 20m or critical) ➔ `ACKNOWLEDGED` ➔ `RESOLVED`.

### Q7: What happens when an alert is acknowledged?
**A:** Future escalation timer transitions and repeat reminders are halted immediately. The incident remains active until the unit temperature returns to the safe 2-8°C band.

### Q8: What happens when temperature returns to normal?
**A:** The monitoring engine detects the safe temperature and automatically marks the alert as `RESOLVED`, recording the resolution timestamp in the audit trail.

### Q9: How are real IoT sensors integrated into ColdGuard?
**A:** Real sensors (such as an ESP32 with DS18B20 digital probes) issue HTTP POST requests with temperature telemetry to `/api/readings/ingest` authenticated by an `X-API-Key` header.

### Q10: How does the rate-of-change diagnostic identify the probable cause?
**A:** A rapid rise (>2°C within 5 minutes) points to a door left open. A steady, gradual rise (~0.1°C per minute) indicates mechanical cooling failure or power loss.

### Q11: How does the predictive warning calculate minutes-to-limit?
**A:** It computes the linear temperature gradient ($\Delta T / \Delta t$) across recent readings and projects when the upper boundary (8.0°C) will be crossed if the trajectory continues.

### Q12: How are real-time updates pushed to the frontend without polling?
**A:** The backend establishes a persistent WebSocket connection (`/ws`). When a new reading or alert state transition occurs, the connection manager broadcasts a JSON payload directly to all connected clients.

### Q13: What authentication and security measures are implemented?
**A:** Passwords hashed with bcrypt, stateless JWT bearer tokens with expiration, role-based authorization (Admin, Manager, Medical Officer, Staff), and CORS origin protection.

### Q14: What roles exist and what can they do?
**A:**
- **Staff**: View dashboards and acknowledge alerts.
- **Manager**: All Staff permissions plus report export (PDF/CSV).
- **Medical Officer**: Critical incident reviewer.
- **Admin**: Full access to add/edit storage units, modify contacts, and configure timing parameters.

### Q15: How does ColdGuard handle missing credentials for Telegram or Email?
**A:** The notifier service uses a graceful fallback pattern: if bot tokens or SMTP keys are unset in `.env`, it falls back to console logging without raising an exception or crashing the pipeline.

### Q16: How is data persisted?
**A:** In a relational database using SQLAlchemy 2.0 ORM. It runs by default on SQLite (`coldguard.db`) and can switch to PostgreSQL with one configuration string in `.env`.

### Q17: What is stored in the Audit Log?
**A:** Every state change: alert opened, level escalated, reminder dispatched, staff acknowledged (with user ID and optional note), and auto-resolved.

### Q18: What is the purpose of the daily PDF report?
**A:** To provide an official compliance record with MKT, min/max metrics, excursion logs, and physical signature lines for store staff and managers, meeting WHO PQS inspection standards.

### Q19: What happens if a sensor stops transmitting data?
**A:** If no reading is received for 10 minutes, the monitoring engine triggers a `SENSOR_OFFLINE` warning alert.

### Q20: What is the simulation speed multiplier?
**A:** In demo mode, 1 tick corresponds to 1 simulated minute. Setting speed to 10x processes 10 simulated minutes every second, enabling rapid verification of escalation timelines.

### Q21: What frontend stack was chosen and why?
**A:** React 18 with TypeScript for type safety, Vite for fast compilation, Tailwind CSS for clean healthcare UI, Recharts for responsive SVG temperature curves, and Zustand for auth state.

### Q22: How does the frontend handle audible alarms?
**A:** When an unacknowledged critical alert is present in the cache, the Web Audio API generates an 880 Hz audible alert tone unless muted by the operator.

### Q23: How are database migrations managed?
**A:** Alembic tracks database schema revisions, allowing forward and backward migrations across environments.

### Q24: What are the main limitations of the current implementation?
**A:**
- SQLite database is file-based (addressed by switching to PostgreSQL in production).
- Simulated clock uses tick steps rather than true distributed RTC time.

### Q25: What is the future scope for this product?
**A:**
- Direct MQTT broker integration for large hospital networks with hundreds of fridges.
- GSM/SMS gateway hardware for rural clinics without internet connectivity.
- Mobile application (React Native / PWA) with push notifications.
- AI-driven predictive compressor failure detection using vibration and power draw sensors.

