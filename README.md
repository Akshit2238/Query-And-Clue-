# Query & Clue — SQL Detective Game

**Every query reveals a clue.**

Query & Clue is an interactive detective investigation game where players solve fictional cases by exploring crime records and using SQL queries to uncover connections between suspects, evidence, timelines, phone records, and transactions.

Instead of simply reading clues, players investigate the case database, compare information, and submit a final accusation supported by their findings.

## Live Demo

- **Website:** https://query-and-clue-9sag.onrender.com/
- **Chapter Selection:** https://query-and-clue-9sag.onrender.com/welcome.html

## Features

- **SQL investigation:** Search case records with SQL queries.
- **Case files:** Select and investigate cases.
- **Suspect investigation:** Review suspect information and alibis.
- **Forensic clues:** Inspect evidence connected to an investigation.
- **Investigation records:** Work with timeline events, access logs, phone records, and transactions.
- **Query history:** Review previous searches.
- **Notepad:** Keep track of theories and contradictions.
- **Final accusation:** Submit a suspect and explain the reasoning behind the decision.
- **AI case generation:** The project includes an AI case-generation flow using the Groq API, with generated data intended to be validated before being saved.

> Feature availability may depend on the current deployment and backend status.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Java, Spring Boot
- **Database:** TiDB Cloud (MySQL-compatible cloud database)
- **Query language:** SQL
- **AI integration:** Groq API
- **Application deployment:** Render
- **Source control:** GitHub

## Database Overview

The database is designed around related investigation records, including:

- Users
- Cases
- Victims
- Suspects
- Crime scenes
- Evidence
- Timeline events
- Access logs
- Phone records
- Transactions
- Query history
- Player progress
- Final accusations

Primary keys and foreign keys connect related records so players can investigate information across a case. TiDB Cloud provides the hosted database; the application backend connects to it using its configured database connection.

## How It Works

1. Open the website and select an investigation.
2. Read the case information and inspect available clues.
3. Run SQL queries to search the case database.
4. Compare records and investigate inconsistencies.
5. Record theories in the notepad.
6. Submit a final accusation with an explanation.

## Running Locally

The deployed database is hosted on TiDB Cloud, so a local database installation is not necessarily required to run the application if you have access to the configured cloud database.

1. Clone this repository.
2. Configure the Spring Boot backend to connect to your TiDB Cloud cluster using the connection details and credentials from TiDB Cloud.
3. Set required environment variables, including `GROQ_API_KEY` if using AI case generation.
4. Run the Spring Boot backend using the project's configured build setup.
5. Serve or open the frontend using the setup included in the repository.

Exact commands and configuration values depend on the files and build configuration in the repository. Never commit database passwords, API keys, or other secrets to GitHub.

## Configuration and Security

- Keep API keys and database credentials out of source control.
- Store secrets in environment variables or an appropriate local configuration file excluded from Git.
- Use the appropriate TiDB Cloud connection settings and credentials.
- SQL execution should be restricted to permitted queries and handled by the backend; the browser should never connect directly to the database.

## Project Goal

Query & Clue combines practical SQL learning with detective-style problem solving. The goal is to make database exploration more engaging by giving each query a purpose in the investigation.

## Author

Developed as a college project.
