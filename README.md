# 🕵️‍♂️ Query & Clue — Minor Crimes OS

[![Live Demo](https://img.shields.io/badge/Demo-Live_on_Render-blue?style=flat&logo=render)](https://query-and-clue-9sag.onrender.com/welcome.html)
[![Java 17](https://img.shields.io/badge/Java-17-orange?style=flat&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-brightgreen?style=flat&logo=springboot)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=flat&logo=mysql)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)

> *"In the city of Bits & Bytes, the truth isn't found in confessions — it's found in the tables."*

**Query & Clue** (branded as *Minor Crimes OS*) is an interactive, retro Windows XP–themed detective game where you solve criminal cases by writing **real SQL queries** against actual databases. Analyze crime scenes, cross-reference suspect alibis, track phone records, examine badge swipes, and file arrest warrants when you've cracked the case.

---

## 🌐 Live Deployments

- **Primary Production:** [https://query-and-clue-9sag.onrender.com/](https://query-and-clue-9sag.onrender.com/)
- **Chapter Select / Handbook:** [https://query-and-clue-9sag.onrender.com/welcome.html](https://query-and-clue-9sag.onrender.com/welcome.html)
- **Staging / Test Instance:** [https://query-and-clueeee.onrender.com/](https://query-and-clueeee.onrender.com/)
- **Backend Service:** [https://query-and-clue.onrender.com/health](https://query-and-clue.onrender.com/health)

*(Note: Render free tier instances spin down after 15 minutes of inactivity. If the first query takes ~30s to load, please allow the backend container a moment to wake up).*

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| 🪟 **Retro Windows XP OS** | Authentic draggable & resizable windows, taskbar, start menu, Bliss wallpaper, peeking officer mascot, and CRT scanlines. |
| 🔍 **Live SQL Engine** | Execute real `SELECT` queries against case databases with sub-second execution timing and strict AST security policy enforcement. |
| 📁 **Quick Schema Cheat Sheet** | Built-in database schema drawer inside the SQL Workbench with clickable column pills that paste directly into your query. |
| ⌨️ **Terminal Query History** | Up/Down arrow query history recall in the SQL editor with `Ctrl + Enter` / `Cmd + Enter` quick execution. |
| 🪟 **Taskbar Tiling & Cascade** | Authentic Windows XP taskbar controls to instantly tile windows into a 2x2 investigative quadrant or cascade diagonally. |
| 📂 **Suspect & Forensic Clues Locker** | Dedicated evidence viewer with CRT oscilloscope/UV scanner animations, victim reports, and suspect alibi cards. |
| 🗣️ **Dynamic Interrogation Dialogue** | Interrogate suspects on alibis, motives, and relationships with contextual dialogue grounded in real case data. |
| ⚖️ **Dynamic Warrant System** | Unique server-generated apprehension order IDs (`MC-xxx-Wyyyyyy`) with category-specific contradiction feedback. |
| 🖨️ **Printable Solved Dossier** | Post-case debriefing with Master Detective (S/A/B) efficiency ranks, query counts, and printable police report card. |
| 🤖 **AI Case Generator** | Procedurally generate fresh mystery cases using Groq AI with automatic relational schema validation. |
| 🎵 **8-bit Detective Synth** | Built-in retro audio player with volume control and persistent settings in `localStorage`. |
| 📝 **Detective Notepad** | In-OS persistent scratchpad to write notes, clues, and SQL snippets. |

---

## 🎮 How to Play

1. **Pick a Case**: Start at the Chapter Select screen and choose an active case file.
2. **Read the Dossier**: The case briefing overlay outlines the crime, date, location, victim, and objectives.
3. **Inspect Clues & Suspects**: Check recovered physical evidence and review suspect alibis.
4. **Query the Database**: Open **Search Tables** and run SQL queries to cross-reference timestamps, access badges, and transactions.
5. **Interrogate Suspects**: Question suspects on their motives, alibis, and relationships to uncover contradictions.
6. **Submit the Arrest Warrant**: Select the culprit, attach evidence, state the motive, and reveal the confession!
7. **Review Case Debrief**: Review your Efficiency Rank (S, A, or B), elapsed investigation time, and print the official case dossier.

### Available Database Tables
```sql
-- Check suspect details & alibis
SELECT suspect_id, name, occupation, motive, alibi FROM suspects WHERE case_id = 1;

-- Check security door logs
SELECT a.log_id, s.name, a.location, a.access_time, a.exit_time 
FROM access_logs a JOIN suspects s ON a.suspect_id = s.suspect_id 
WHERE a.case_id = 1 ORDER BY a.access_time ASC;

-- Check suspicious financial transactions
SELECT t.transaction_id, s.name, t.amount, t.transaction_date, t.description 
FROM transactions t JOIN suspects s ON t.suspect_id = s.suspect_id 
WHERE t.case_id = 1;

-- Cross-reference evidence
SELECT * FROM evidence WHERE case_id = 1;
```
> ⚠️ **Security Policy**: Only `SELECT` statements are permitted. Destructive queries (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`) are blocked by the `SqlPolicyValidator` AST policy engine.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Windows XP Luna Design System), Vanilla JavaScript (No heavyweight frameworks).
- **Backend**: Java 17, Spring Boot 3.2.5, Spring Data JPA, JSqlParser (SQL AST Policy Validator).
- **Database**: MySQL 8.0 / TiDB Cloud (HikariCP connection pool with dual-datasource isolation).
- **AI Integration**: Groq API (`openai/gpt-oss-120b`) with JSON Schema enforcement.
- **Deployment**: Dockerized build on Render with Blueprint orchestration (`render.yaml`).

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Lightweight service liveness check |
| `GET` | `/health/db` | Database connectivity readiness check (`SELECT 1`) |
| `GET` | `/api/cases` | List all available detective cases |
| `GET` | `/api/cases/{id}` | Get case dossier and incident briefing |
| `GET` | `/api/cases/{id}/suspects` | Get suspects associated with a case |
| `GET` | `/api/cases/{id}/evidence` | Get physical and forensic evidence |
| `GET` | `/api/cases/{id}/crime-scenes` | Get crime scene locations |
| `GET` | `/api/cases/{id}/warrant` | Generate unique server-side warrant reference number |
| `POST` | `/api/query/execute` | Execute player SQL query with policy validation |
| `POST` | `/api/cases/{id}/accusation` | Submit arrest warrant accusation |
| `POST` | `/api/generated-case/generate-and-save` | Procedurally generate an AI mystery case |
| `PUT` | `/api/admin/case/{id}` | Update case metadata (Admin authenticated) |

---

## 🛡️ Security & Sandboxing

- **AST SQL Parsing**: All player input is parsed by `JSqlParser` into an Abstract Syntax Tree before hitting the database, rejecting comments, sub-queries escaping case bounds, and mutation statements.
- **Read-Only Datasource**: Player queries run through a dedicated read-only connection pool.
- **Connection Health**: HikariCP connection timeouts (`10s`) and keep-alive pings (`SELECT 1`) prevent cold-start hangs.
- **Solution Shielding**: Incorrect accusations return category contradiction feedback without leaking the true culprit.

---

## 📜 License
MIT License. Created by [Akshit](https://github.com/Akshit2238). Happy investigating! 🔍
