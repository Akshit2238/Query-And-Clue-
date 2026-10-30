# Query & Clue — Staging Environment Guide

This document defines the architecture, setup procedure, and verification checklist for the isolated staging environment.

---

## 1. Environment Architecture

| Component | Production | Staging |
|---|---|---|
| **Frontend** | `query-and-clue-frontend` (or custom static URL) | `query-and-clue-staging-frontend` |
| **Backend** | `https://query-and-clue.onrender.com` | `https://query-and-clue-staging.onrender.com` |
| **Spring Profile** | `default` | `staging` (`SPRING_PROFILES_ACTIVE=staging`) |
| **Database** | Production TiDB / MySQL cluster | Separate staging database schema (`query_clue_staging`) |
| **Datasource Env** | `DB_URL`, `DB_USER`, `DB_PASSWORD` | `STAGING_DB_URL`, `STAGING_DB_USER`, `STAGING_DB_PASSWORD` |

---

## 2. Deploying Staging on Render

### Option A: Using `render.yaml` Blueprint (Recommended)
1. Go to the [Render Dashboard](https://dashboard.render.com).
2. Click **Blueprints** $\rightarrow$ **New Blueprint Instance**.
3. Connect the repository: `Akshit2238/Query-And-Clue-`.
4. Render detects `render.yaml` and lists the services.
5. In the Staging section, provide:
   - `STAGING_DB_URL`
   - `STAGING_DB_USER`
   - `STAGING_DB_PASSWORD`
   - `GROQ_API_KEY`
6. Click **Apply**.

### Option B: Manual Service Creation
1. **Staging Backend (Web Service):**
   - Environment: `Docker`
   - Docker Command / Context: `backend/Dockerfile` with context `backend`
   - Health Check Path: `/health`
   - Environment Variables:
     - `SPRING_PROFILES_ACTIVE`: `staging`
     - `STAGING_DB_URL`: your staging JDBC URL
     - `STAGING_DB_USER`: staging DB username
     - `STAGING_DB_PASSWORD`: staging DB password
     - `GROQ_API_KEY`: Groq API key
2. **Staging Frontend (Static Site):**
   - Publish directory: `frontend`
   - Build command: (leave empty)

---

## 3. Staging Acceptance Checklist

Execute these 9 verification steps once staging services are live:

1. [ ] **Boot sequence:** Open staging frontend URL; boot screen completes and navigates to Welcome or Desktop.
2. [ ] **Case list loads:** Open Case Directory; case count matches staging database records.
3. [ ] **Case briefing displays text:** Briefing overlay renders real case title, difficulty, date, and narrative (not "Loading description...").
4. [ ] **Suspects render:** Suspects window populates with columns matching DB (`suspect_id`, `name`, `age`, `occupation`, `relationship_to_victim`, `alibi`).
5. [ ] **Starter SQL query executes:** Run `SELECT * FROM suspects;` in SQL Workbench; table returns expected rows and column headers.
6. [ ] **Clue explorer opens:** Click at least one clue card; Forensic Evidence Viewer modal opens with full evidence details.
7. [ ] **Arrest form loads:** Open Arrest Warrant; form displays suspect picker and evidence checkboxes.
8. [ ] **Invalid responses show useful feedback:** Running an invalid query (e.g. `DROP TABLE suspects`) shows clear policy denial feedback, not an infinite spinner.
9. [ ] **Browser console clean:** DevTools console contains 0 unhandled `TypeError` or `ReferenceError` exceptions.

---

*Status Note: Staging configuration and Blueprint templates are prepared in the repository. Staging services must be provisioned in the Render account to mark staging as live.*
