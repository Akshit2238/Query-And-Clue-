# Query & Clue — tasks.md (Ralph Loop task tracking)

Project convention (AGENTS.md): use `tasks.md` for the task list and `progress.txt` for status.

## Phase 0 — Ground truth & security hygiene
| # | Task | Status |
|---|------|--------|
| 0.1 | Confirm AI is Groq (`GROQ_API_KEY`, `api.groq.com`), `openai/gpt-oss-120b`, JDK `HttpClient` | Done |
| 0.2 | Confirm `pom.xml`: Java 17, Spring Boot 4.1.1, unused `google-genai` SDK, MySQL connector | Done |
| 0.3 | Confirm backend port 8081; plaintext `spring.datasource.password` in `application.properties` | Done |
| 0.4 | Confirm controllers: `GET /api/test`, `GET /api/cases`, `GET /api/cases/{id}`, `POST /api/generated-case/generate`, `POST /api/generated-case/generate-and-save` | Done |
| 0.5 | Confirm schema ground truth: `case_solutions.culprit_suspect_id NOT NULL`; `query_history`/`player_progress`/`final_accusations` `user_id NOT NULL` | Done |
| 0.6 | Confirm frontend state: `case.html` is an `<article>` fragment, `cases.html` missing, `index.html` hardcoded cards, `app.js` alerts, `investigation.html` placeholder | Done |

## Phase 1 — Configuration & security groundwork
| # | Task | Status |
|---|------|--------|
| 1.1 | Rotate datasource password; remove plaintext password from `application.properties` | Pending |
| 1.2 | Add `spring.datasource.password` → env var; add read-only datasource (`app`) for player queries | Pending |
| 1.3 | Remove unused `google-genai` dependency from `pom.xml`; add JSqlParser dependency | Pending |
| 1.4 | Add `js/config.js` for API base URL; configure CORS for frontend origin | Pending |

## Phase 2 — Frontend navigation fix
| # | Task | Status |
|---|------|--------|
| 2.1 | Fix `case.html` into a full page (or consolidate to `index.html`) | Pending |
| 2.2 | Remove `cases.html` references (nav, back button); repoint to existing pages | Pending |
| 2.3 | Replace `app.js` alert placeholders with real navigation to `investigation.html?caseId=` | Pending |
| 2.4 | Load case list dynamically from `GET /api/cases` into `index.html` case grid | Pending |
| 2.5 | Load case detail from `GET /api/cases/{id}` into `case.html` | Pending |

## Phase 3 — Safe read-only SQL query endpoint
| # | Task | Status |
|---|------|--------|
| 3.1 | Create `QueryRequest`/`QueryResult` DTOs | Pending |
| 3.2 | Implement `SqlPolicyValidator`: single statement, SELECT-only, table allowlist, case-scope `case_id` check | Pending |
| 3.3 | Implement `QueryService`: read-only DataSource, timeout, row cap, text cell conversion | Pending |
| 3.4 | Implement `QueryController.POST /api/query/execute` | Pending |
| 3.5 | Add `@ControllerAdvice` with safe structured error responses | Pending |
| 3.6 | Build query editor UI and results table on `investigation.html` | Pending |
| 3.7 | Wire frontend fetch; render results as `textContent` (no `innerHTML`) | Pending |
| 3.8 | Record query in `query_history` (after identity decision) | Pending |

## Phase 4 — Final accusation flow
| # | Task | Status |
|---|------|--------|
| 4.1 | Create `AccusationRequest`/`AccusationResult` DTOs | Pending |
| 4.2 | Implement `AccusationService` comparing against `case_solutions` | Pending |
| 4.3 | Implement `AccusationController.POST /api/cases/{id}/accusation` | Pending |
| 4.4 | Persist row in `final_accusations` (after identity decision) | Pending |
| 4.5 | Build accusation form UI and verdict display on `investigation.html` | Pending |

## Phase 5 — Tests & documentation
| # | Task | Status |
|---|------|--------|
| 5.1 | Unit tests for `SqlPolicyValidator` positive/negative cases | Pending |
| 5.2 | Integration tests for query endpoint (timeout, row cap, bad SQL) | Pending |
| 5.3 | Integration tests for accusation flow | Pending |
| 5.4 | Unit/integration tests for generated-case flow (valid/invalid) | Pending |
| 5.5 | Update documentation pack + test plan with evidence; mark test statuses accurately | Pending |

## Remaining open decisions (confirm before starting)
1. Player identity for `user_id NOT NULL` tables (`query_history`, `player_progress`, `final_accusations`).
2. SQL validation library: JSqlParser vs. hand-rolled grammar.
3. Case-scope enforcement: `case_id` predicate vs. per-case views.
4. Endpoint naming: `POST /api/query/execute`, `POST /api/cases/{id}/accusation`.
5. Fix `case.html` into a full page or consolidate to `index.html`.
6. Password rotation before deployment.
7. Remove unused `google-genai` dependency.
