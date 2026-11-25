# CriSync — Humanitarian Crisis Aid & Emergency Coordination Platform

**Module:** SE205.3 Software Architecture — Coursework 2026  
**Architecture Style:** Clean Modular Monolith (`ReliefCoord.Domain`, `ReliefCoord.Application`, `ReliefCoord.Infrastructure`, `ReliefCoord.Api`, `ReliefCoord.Tests`)  
**Technology Stack:** C# ASP.NET Core 9.0 Web API + Entity Framework Core (SQL Server & SQLite Dual-Provider) + React 18 / TypeScript / Vite / Tailwind CSS + Leaflet / OpenStreetMap

---

## 1. Project Structure

```text
HCP Project/
├── HumanitarianCrisisPlatform.slnx
├── backend/
│   ├── ReliefCoord.Domain/           # Enterprise Entities (27 Tables), Enums, Domain Events
│   ├── ReliefCoord.Application/      # Use-Case Orchestration, DTOs, Interfaces, Allocation Strategies
│   ├── ReliefCoord.Infrastructure/   # EF Core DbContext, Repositories, AI/OSM/SMS Adapters, Async Event & Retry Worker
│   ├── ReliefCoord.Api/              # REST Controllers, PBKDF2 Auth, JWT Security, Rate Limiting, RBAC, Swagger/OpenAPI
│   └── ReliefCoord.Tests/            # 22 xUnit Unit & WebApplicationFactory Integration Tests
├── frontend/                         # React + TypeScript + Tailwind CSS + Leaflet Interactive Client
├── postman/
│   └── CriSync_API_Collection.json   # Complete API Verification & Demo Collection (Postman v2.1)
└── database/
    └── schema_sqlserver.sql          # Full T-SQL DDL Schema for Microsoft SQL Server (27 Tables)
```

---

## 2. Architecture Selection & Justification (Why Clean Modular Monolith)

**CriSync** implements a **4-Layer Clean Architecture Modular Monolith** (`Domain` -> `Application` -> `Infrastructure` -> `Api`) rather than distributed Microservices or heavyweight ESB-based SOA:

1. **ACID Transactional Invariants (Functional):** Allocating scarce medical/food stock across competing cases and assigning wheelchair-accessible shelter beds concurrently require strict atomic database transactions (`IUnitOfWork.ExecuteInTransactionAsync` + `SemaphoreSlim` + `[ConcurrencyCheck]`). A modular monolith enforces zero-over-allocation in a single ACID commit without distributed Two-Phase Commit (2PC) complexity.
2. **Low-Latency Humanitarian Performance (Non-Functional):** Direct in-process calls between controllers, AI explainable triage heuristics, and multi-constraint allocation strategies avoid network serialization latency between internal bounded contexts during disaster spikes.
3. **Fault Isolation Without Service Sprawl (Reliability):** Unreliable external dependencies (OSRM routing, Nominatim geocoding, SMS/Push/Email gateways, external AI) are isolated behind abstract ports (`IMappingProviderService`, `INotificationChannelFactory`, `IAiProviderFactory`), `IServiceResilienceMonitor` circuit breakers, and an in-process `BackgroundService` (`AsynchronousDomainEventWorker`) with `IdempotencyKey` deduplication.
4. **Parallel Team Delivery & Future Extraction (Maintainability):** Clear layer and interface contracts allowed six contributors to develop Citizen, Coordinator, AI Governance, Logistics/Shelter, Volunteer/Donor, and Infrastructure modules in parallel, while keeping any heavy module (e.g., AI inference) trivially extractable behind existing interfaces later.

---

## 3. Quick-Start Installation & Execution

### Prerequisites
- **.NET SDK 9.0+**
- **Node.js 18+** and **npm**
- **SQL Server / LocalDB** *(Optional — the API defaults to zero-configuration local SQLite `reliefcoord_platform.db` and switches to SQL Server via `appsettings.json`).*

### Step 1: Run Automated Unit & Integration Tests (22 xUnit Tests)
```powershell
dotnet test backend/ReliefCoord.Tests/ReliefCoord.Tests.csproj
```

### Step 2: Start the C# ASP.NET Core Web API Backend
[launchSettings.json](backend/ReliefCoord.Api/Properties/launchSettings.json) configures `ASPNETCORE_ENVIRONMENT=Development` and `http://localhost:5080` automatically for local runs. In **Production**, set `JWT_SECRET_KEY` via environment variable or user secrets:
```powershell
cd backend/ReliefCoord.Api
dotnet run
```
- **API Base URL:** `http://localhost:5080/api`
- **Swagger / OpenAPI UI:** `http://localhost:5080/swagger`
- **Postman Collection:** Import [`postman/CriSync_API_Collection.json`](postman/CriSync_API_Collection.json) (automatically saves the Bearer JWT token on Login).

### Step 3: Start the React Web Client
```powershell
cd frontend
npm run dev
```
- **Web Client URL:** `http://localhost:5173` *(CORS restricted by `Cors:AllowedOrigins` in `appsettings.json`).*

### Switching to Microsoft SQL Server
1. Execute `database/schema_sqlserver.sql` on your SQL Server instance.
2. In `backend/ReliefCoord.Api/appsettings.json`, change `"DatabaseProvider": "Sqlite"` to `"DatabaseProvider": "SqlServer"` and configure `"SqlServerConnection"`.

---

## 4. External Service Integration, Privacy & Resilience Matrix

| External Service | Primary Integration Mode | Data Shared / Privacy Minimisation | Timeout, Retry & Circuit Breaker | Guaranteed Offline Fallback |
| :--- | :--- | :--- | :--- | :--- |
| **OpenStreetMap / OSRM / Nominatim** | Live HTTP REST (`router.project-osrm.org`, `/search` geocode, `/reverse` reverse geocode) | Coordinates (`lat, lon`) or district query string only — no PII or names transmitted | 3s HTTP timeout (`CancellationTokenSource`), 2-attempt exponential backoff, trips Mapping circuit | `LocalHaversineFallbackEngine` (road factor 1.28×) & `OfflineGazetteerFallback` |
| **AI Decision-Support Engine** | Ensemble Rule Classifier with optional configurable `ExternalServices:AiEndpoint` | Anonymised category, urgency, affected count, text snippet, and coordinates | Instant circuit-breaker toggle & confidence scoring stored alongside explainable weights | `ResilientLocalHeuristicFallback` + strict Human-in-the-Loop approval gate |
| **SMS / Push / Email Gateways** | Adapter Factory (`Twilio`, `FCM`, `SendGrid` / configurable `ExternalServices:SmtpHost`) | Recipient contact/language + alert body scoped by `IdempotencyKey` deduplication | Channel `BackgroundService` (`AsynchronousDomainEventWorker`) sweeps `FailedPendingRetry` every 15s (max 3 attempts) | Notifications queued safely in SQLite/SQL Server and re-delivered on recovery |
| **Sandbox Payment Gateway** | Deterministic payment gateway adapter for humanitarian relief pledges | Card last-4 mask & pledge metadata only — zero full PAN or CVV stored | AML/KYC compliance hold automatically triggered at configurable `HighValueDonationThresholdUsd` | Flagged gifts remain `FlaggedPendingHumanReview` until verified or rejected by a Donor Officer |

---

## 5. Security Architecture & Platform Roles

- **Password Security:** `PBKDF2-HMAC-SHA256` (100,000 iterations, 16-byte cryptographic salt per user) with `CryptographicOperations.FixedTimeEquals` constant-time verification.
- **Trusted-Device Quick Unlock (Multi-Device Pattern / PIN / WebAuthn Biometrics):** Users (including System Admins) may independently bind up to 5 trusted browsers/devices via `My Profile` (such as Laptop on `localhost` and Phone via HTTPS/ngrok) using a 3×3 Pattern, 6-digit PIN, and optional OS platform biometrics (`Fingerprint / Face ID / Windows Hello` via WebAuthn). Per-device tokens and unlock secrets are PBKDF2-hashed server-side, single-use biometric challenges prevent replay, and 3 failed attempts trigger automatic lockout + `AuditEventRecord` logging.
- **Endpoint & Upload Hardening:** Global IP + `auth` fixed-window rate limiting, strict CORS origin allowlist, `UseHttpsRedirection` outside Development/Testing, DataAnnotation DTO validation, and magic-byte + MIME verification for evidence uploads persisted under `App_Data/uploads/`.
- **Operational & Public Credentials:** Standard roles use `Crisync@2026` (**Sign In**); Admin accounts use `Admin@Crisync2026` (**Admin Login**).

| Role | Email | Password | Organisation | Access & Governance Policy |
| :--- | :--- | :--- | :--- | :--- |
| **Affected Citizen** | `citizen@crisync.org` | `Crisync@2026` | Public / Household | Self-registration; guided request wizard, evidence upload, household profile, personal alerts inbox |
| **Public Donor** | `publicdonor@crisync.org` | `Crisync@2026` | Public Contributor | Self-registration; fund relief appeals, view live donor transparency report, pledge material aid |
| **Field Volunteer** | `fieldvolunteer@crisync.org` | `Crisync@2026` | Field Responder | Self-registration starts `Pending`; manage shift availability, accept/decline/complete field missions |
| **Partner Officer** | `partner@crisync.org` | `Crisync@2026` | MSF Medical Rapid Team | Submit partnership proposals & coordinate cross-organisation mutual aid stock |
| **Emergency Coordinator** | `coordinator@crisync.org` | `Crisync@2026` | UN OCHA Regional Office | Declare crises & operational zones, override AI (HITL), invite staff, broadcast alerts |
| **Case Manager** | `casemanager@crisync.org` | `Crisync@2026` | National DMC | Invited role; verify/reject/assign requests, register offline citizens on behalf, merge duplicates |
| **Logistics Manager** | `logistics@crisync.org` | `Crisync@2026` | Sri Lanka Red Cross | Invited role; replenish warehouse stock, execute allocation strategies, confirm convoy delivery |
| **Shelter Administrator** | `shelter@crisync.org` | `Crisync@2026` | National DMC | Invited role; manage atomic shelter allocations & escalate shelter supply needs |
| **Volunteer Coordinator** | `volunteer@crisync.org` | `Crisync@2026` | Sri Lanka Red Cross | Invited role; verify `Pending` volunteers & assign AI-scored field missions |
| **Donor / Funding Officer** | `donor@crisync.org` | `Crisync@2026` | UN OCHA Regional Office | Appointed exclusively by Global System Admin; approve/reject flagged gifts & record relief expenditures |
| **Organization Admin** | `orgadmin@crisync.org` | `Admin@Crisync2026` | UN OCHA Regional Office | Admin tier; manage org staff accounts, approve partner requests, view security audit logs |
| **Global System Admin** | `admin@crisync.org` | `Admin@Crisync2026` | UN OCHA Regional Office | Top admin tier (Min 2 / Max 3 policy); exclusive Donor Officer appointment, system governance & integrations |

---

## 6. Usability Testing, Evidence-Based Improvements & UAT Scenarios

| Observed Usability Finding | Evidence-Based Improvement Implemented |
| :--- | :--- |
| Citizens struggled navigating separate standalone tabs during urgent form submission | Built a 4-step **Guided Help Wizard** with live `%` completion indicator, validation checks, and quick templates |
| White text over photo hero banners & violet copy in Light Mode lost readability | Added gradient photo scrims (`crisync-photo-scrim-side`) and high-contrast light-mode overrides in `index.css` |
| Modal dialogs lacked keyboard Escape dismissal and screen-reader dialog roles | Added `Escape` key handlers, `role="dialog"`, `aria-modal="true"`, and a Skip-to-Main-Content landmark |
| Mobile/field users lose cellular connectivity intermittently in flood zones | Added an **Offline-First Request Outbox** (`localStorage`) that captures citizen requests offline and auto-syncs on reconnect |

### Repeatable End-to-End Verification Scenarios

1. **Human-in-the-Loop Governance & Audit Trail:** Review AI triage on `REQ-20261116-1042`, override or approve urgency with rationale, and verify immutable `HumanGovernanceDecision` and `AuditEventRecord` entries.
2. **Duplicate Detection Without Auto-Deletion:** Inspect `REQ-20261116-1051` (flagged at 86% similarity with `REQ-20261116-1042`) and click **Merge Duplicate** without deleting either database record.
3. **Multi-Constraint & Shortage Contention Allocation:** Compare `MultiConstraintOptimal`, `ShortageProportionalContention`, and `ProximityFirst` across competing medical cases, execute dispatch, and mark convoys `Delivered`.
4. **Notification Idempotency & Auto-Retry Recovery:** Send duplicate idempotency keys in **GIS Map & Resilience** to verify `SkippedDuplicate`, simulate a notification outage, and trigger/await background `RetryFailedNotificationsAsync` recovery.
5. **Donor Fund Accountability & Volunteer Completion Lifecycle:** Record a campaign expenditure and verify real-time Donor Transparency totals; update volunteer availability, accept a mission, and complete it to increment completed mission counts.

---

## 7. Known Limitations & Scope Boundaries
- Per coursework scope boundaries, no physical IoT sensors or hardware telemetry are used; coordinates and field updates are ingested via the web portal and OpenStreetMap integrations.
- External SMS (Twilio), Push (FCM), Email (SendGrid / SMTP), and Payment Gateway integrations operate in deterministic adapter mode by default so evaluators can run all workflows offline without paid third-party credentials.
