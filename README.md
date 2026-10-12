# 🕵️ Query & Clue — Minor Crimes OS

[![Live Demo](https://img.shields.io/badge/Demo-Live_on_Render-blue?style=flat&logo=render)](https://query-and-clue-9sag.onrender.com/welcome.html)
[![Java 21](https://img.shields.io/badge/Java-21-orange?style=flat&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-brightgreen?style=flat&logo=springboot)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=flat&logo=mysql)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)

> *"In the city of Bits & Bytes, the truth isn't found in confessions — it's found in the tables."*

**Query & Clue** is an interactive, retro Windows XP–themed detective game where you solve criminal cases by writing **real SQL queries** against actual databases. Analyze crime scenes, cross-reference suspect alibis, track phone records, and file arrest warrants when you've cracked the case.

---

## 🌐 Live Demo

- **Game Desktop:** [https://query-and-clue-9sag.onrender.com/](https://query-and-clue-9sag.onrender.com/)
- **Case Select:** [https://query-and-clue-9sag.onrender.com/welcome.html](https://query-and-clue-9sag.onrender.com/welcome.html)

*(Note: Render free tier instances spin down after 15 minutes of inactivity. If the first query takes ~40s to load, please allow the backend container a moment to wake up).*

---

## 📸 Key Features

| Feature | Description |
|---|---|
| 🖥️ **Retro Windows XP OS** | Authentic draggable & resizable windows, taskbar, start menu, Bliss wallpaper, and sound effects. |
| 🔍 **Live SQL Engine** | Execute real `SELECT` queries against case databases with sub-second execution timing. |
| 📑 **5 Multi-Tab Query Console** | Work like a real developer with 5 persistent query tabs and saved query history. |
| 📂 **Suspect & Clue Explorer** | Dedicated evidence viewer, victim reports, and suspect profile cards. |
| ⚖️ **Arrest Warrant System** | Accuse suspects, provide motive and evidence, and get instant verdict verification. |
| 🤖 **AI Case Generator** | Generate fresh, dynamic mystery cases using Google Gemini / Groq AI (5/day quota). |
| 🎵 **8-bit Detective Synth** | Built-in retro audio player with authentic chiptune detective tracks. |
| 📝 **Detective Notepad** | In-OS persistent scratchpad to write notes, clues, and SQL snippets. |

---

## 🎮 How to Play

1. **Pick a Case**: Start at the Case Select screen and choose an active case report.
2. **Read the Evidence**: Open the **Clues** window to read the incident briefing, victim details, and crime scenes.
3. **Inspect the Suspects**: Open the **Suspects** window to view everyone connected to the incident.
4. **Query the Database**: Open **Search Tables** and write SQL queries to discover contradictions in alibis, phone records, and access logs.
5. **Issue the Warrant**: Open **Arrest Warrant**, select the guilty suspect, explain their motive and method, and submit!

### Available Database Tables
```sql
-- Check suspect details & alibis
SELECT * FROM suspects WHERE case_id = 1;

-- Check security door logs
SELECT * FROM access_logs WHERE case_id = 1 ORDER BY access_time ASC;

-- Check call records
SELECT * FROM phone_records WHERE case_id = 1;

-- Cross-reference evidence
SELECT * FROM evidence WHERE case_id = 1;
```
> ⚠️ **Note**: Only `SELECT` statements are permitted. Mutation queries (`INSERT`, `UPDATE`, `DELETE`, `DROP`) are strictly blocked by the AST policy engine.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Windows XP Design System), Vanilla JavaScript (No heavyweight frameworks).
- **Backend**: Java 21, Spring Boot 3, Spring Data JPA, JSqlParser (SQL AST Validator).
- **Database**: MySQL 8.0 / TiDB Cloud (Dual-datasource architecture: Read-Write for game state, Read-Only for player queries).
- **AI Integration**: AI case generation with automated case schema validation.
- **Deployment**: Dockerized multi-stage build hosted on Render.

---

## 🚀 Running Locally

### Prerequisites
- Java 21+ JDK
- MySQL 8.0+ (or TiDB Cloud connection)
- Maven (or use included `./mvnw`)

### 1. Clone the repository
```bash
git clone https://github.com/Akshit2238/Query-And-Clue-.git
cd Query-And-Clue-
```

### 2. Configure Database & Environment
Create a database named `query_clue` in MySQL and set the environment variables:
```bash
export DB_URL="jdbc:mysql://localhost:3306/query_clue"
export DB_USER="root"
export DB_PASSWORD="your_password"
export GEMINI_API_KEY="your_api_key"  # Optional, for AI case generator
```

### 3. Run the Backend
```bash
cd backend
./mvnw spring-boot:run
```
*(On Windows PowerShell: `.\mvnw.cmd spring-boot:run`)*

### 4. Launch the Frontend
Open `frontend/welcome.html` in any modern web browser or serve via a local web server:
```bash
npx serve frontend
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cases` | List all available detective cases |
| `GET` | `/api/cases/{id}` | Get full case dossier and victim briefing |
| `GET` | `/api/cases/{id}/suspects` | Get list of suspects for a case |
| `GET` | `/api/cases/{id}/evidence` | Get discovered physical and forensic evidence |
| `GET` | `/api/cases/{id}/crime-scenes` | Get crime scene locations |
| `POST` | `/api/query/execute` | Execute player SQL query with policy validation |
| `POST` | `/api/cases/{id}/accusation` | Submit arrest warrant accusation |
| `POST` | `/api/generated-case/generate-and-save` | Procedurally generate an AI mystery case |

---

## 🛡️ Security & Sandboxing

- **AST SQL Parsing**: Incoming queries are parsed into Abstract Syntax Trees using `JSqlParser` to enforce strict `SELECT`-only permissions and prevent SQL injection or table escapes.
- **Read-Only Datasource**: Player queries run through a dedicated read-only connection pool.
- **Dual Connection Pool**: Game metadata and player queries are isolated to prevent cross-contamination.
- **Rate Limiting**: AI case generation is capped to prevent abuse.

---

## 📜 License
MIT License. Created by [Akshit](https://github.com/Akshit2238). Happy investigating! 🔍
