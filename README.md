# Southlake UI — Angular Frontend

The Angular 22 frontend for the **Southlake Insurance** platform. Provides the complete user interface for authentication (email + OTP), user management, role and permission configuration, chart of accounts, and master data — all communicating with the `southlake_service` NestJS backend.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup on a New Device](#setup-on-a-new-device)
  - [Step 1 — Install Node.js](#step-1--install-nodejs)
  - [Step 2 — Install Dependencies](#step-2--install-dependencies)
  - [Step 3 — Configure the API URL](#step-3--configure-the-api-url)
  - [Step 4 — Start the Dev Server](#step-4--start-the-dev-server)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Application Features](#application-features)
- [Routing Map](#routing-map)
- [Authentication Flow](#authentication-flow)
- [Permissions and Route Protection](#permissions-and-route-protection)
- [Design System](#design-system)
- [Key Components](#key-components)
- [Code Quality](#code-quality)
- [Generating New Components](#generating-new-components)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer        | Choice                                              |
|--------------|-----------------------------------------------------|
| Framework    | Angular 22 (standalone components throughout)       |
| Language     | TypeScript >= 6.0                                   |
| Runtime      | Node.js >= 24.0.0                                   |
| Styling      | Custom SCSS per component (no Angular Material)     |
| Forms        | Angular Reactive Forms                              |
| HTTP         | Angular `HttpClient` with functional interceptors   |
| Routing      | Angular Router with lazy-loaded feature routes      |
| Auth         | Email OTP + JWT session token stored in `localStorage` |
| Linting      | ESLint 9 (flat config) + `angular-eslint` + Prettier 3 |

---

## Project Structure

This app follows a **feature-sliced architecture**: everything a feature owns — its API
calls, RxJS state, ag-Grid config, forms, sub-components, and models — lives inside that
feature's own folder. `core/` holds only things genuinely shared by every feature (auth,
guards, interceptors, cross-feature models). When a service or model is used by more than
one feature, it lives inside whichever feature is its most natural owner, and the other
features import it from there — it does **not** get centralized into `core/` just because
more than one feature needs it (see `ChartOfAccountsApi`, `MastersApi`, `ReinsuranceApi`
below for examples of this).

```
southlake_ui/
├── angular.json                          Angular workspace config
├── tsconfig.json / tsconfig.spec.json    App and test TypeScript configs
├── vitest.config.ts                      Vitest + coverage configuration
├── package.json
│
└── src/
    ├── main.ts                           Bootstrap entry point
    ├── test-setup.ts                     Vitest + Angular TestBed environment setup
    ├── index.html
    ├── styles.scss                       Global reset + @use partials
    │
    ├── styles/                           Global design tokens & shared styles
    │   ├── _variables.scss               CSS custom properties (:root)
    │   ├── _auth.scss                    Login / OTP / invite screens
    │   ├── _layout.scss                  Sidebar, header, app shell
    │   ├── _components.scss              Toast, modals, buttons, badges
    │   └── _user-management.scss         Tables, stats cards, permission matrix
    │
    ├── environments/
    │   ├── environment.ts                Development config (apiUrl)
    │   └── environment.prod.ts           Production config (apiUrl)
    │
    └── app/
        ├── app.config.ts                 provideRouter, provideHttpClient + interceptors
        ├── app.routes.ts                 Top-level routes (lazy feature routes + guards)
        ├── app.component.ts / .html
        │
        ├── core/                         Global singletons only — nothing feature-specific
        │   ├── models/
        │   │   ├── chart-of-account.model.ts   Used by chart-of-accounts, journal-entries,
        │   │   │                               masters, gl-mappings — genuinely cross-feature
        │   │   └── session.model.ts
        │   ├── services/
        │   │   ├── auth.service.ts       Login, OTP, session/localStorage, permission checks —
        │   │   │                         used by guards, the interceptor, and every feature
        │   │   └── ag-grid-config.service.ts   Shared default ag-Grid options
        │   ├── guards/
        │   │   ├── auth.guard.ts         Redirects unauthenticated users to /auth/login
        │   │   └── permission.guard.ts   Fetches /auth/me on navigation, enforces view access
        │   └── interceptors/
        │       └── auth.interceptor.ts   Attaches Bearer token; handles 401 auto-logout
        │
        ├── shared/                       Pure, stateless reusable components
        │   └── components/
        │       ├── toast/                Success / error / info toast notifications
        │       ├── confirm-dialog/       Generic confirmation modal
        │       ├── loading-spinner/      Full-screen loading overlay
        │       ├── dropdown-search/      Generic searchable select (works with any item type)
        │       └── grid-renderers/       Reusable ag-Grid cell renderers
        │           ├── avatar-cell/
        │           ├── status-badge-cell/
        │           └── action-buttons-cell/
        │
        ├── layout/                       App shell
        │   ├── state/
        │   │   └── sidebar.state.ts      Sidebar collapsed/expanded UI state
        │   ├── main-layout/              Router outlet wrapper
        │   ├── sidebar/                  Navigation with dynamic permission-based visibility
        │   └── header/                   Topbar with user menu
        │
        └── features/                     Lazy-loaded, feature-sliced modules
            ├── auth/
            │   ├── login/                Email entry page
            │   ├── otp/                  6-digit OTP input
            │   └── session-conflict/     Single-device conflict resolution
            │
            ├── dashboard/                Main landing page after login
            │
            ├── chart-of-accounts/        COA hierarchy view
            │   ├── components/
            │   │   └── coa-grid-cell-renderer/   Single variant-driven renderer for all
            │   │                                 4 COA grid cell types (badge/tree-name/
            │   │                                 balance-badge/actions)
            │   ├── models/               TreeAccount (page-local; ChartOfAccount is core)
            │   └── services/
            │       └── chart-of-accounts-api.ts  Consumed cross-feature by journal-entries
            │                                     and masters too
            │
            ├── journal-entries/
            │   ├── models/               JournalEntry, JournalEntryBatch, form-row types
            │   └── services/
            │       └── journal-entries-api.ts
            │
            ├── masters/                  Master data management (states, MGAs, treaties,
            │   │                         reinsurers, risk companies, LOBs, COBs, brokers,
            │   │                         products, locked periods, document types, ...)
            │   ├── models/               master.model.ts, gl-mapping.model.ts
            │   └── services/
            │       ├── masters-api.ts          Consumed cross-feature by journal-entries
            │       │                           and reinsurance-calculations too
            │       └── gl-mappings-api.ts
            │
            ├── reinsurance-calculations/
            │   ├── models/               reinsurance.model.ts (Workbook, StateExhibit)
            │   └── services/
            │       └── reinsurance-api.ts      Consumed cross-feature by masters too
            │
            ├── test-balance/
            │   ├── models/
            │   └── services/
            │       ├── test-balance-api.ts     HTTP calls
            │       └── test-balance-state.ts   RxJS BehaviorSubject state layer
            │
            └── user-management/
                ├── models/               role.model.ts, user.model.ts, permission.model.ts
                ├── services/             roles-api.ts, users-api.ts, permissions-api.ts
                │                         (shared across the roles/ and users/ sub-features)
                ├── roles/                Role cards, permission matrix modal
                ├── users/                User list, invite panel, user detail panel
                └── activity-logs/        Audit log table with filters
                    ├── models/           activity-log.model.ts (exclusive to this sub-feature)
                    └── services/
                        └── activity-logs-api.ts
```

### Naming conventions

| Thing          | Convention        | Example                      |
|----------------|--------------------|-------------------------------|
| Components     | no `.component.` suffix, `kebab-case` file, `PascalCase` class (matches `ng generate`'s Angular 20+ default) | `masters.ts` / `class Masters` |
| API services   | `*-api.ts`         | `chart-of-accounts-api.ts`   |
| State services | `*-state.ts`       | `test-balance-state.ts`      |
| Grid services  | `*-grid.ts`        | (introduce when a feature's ag-Grid config grows large enough to extract) |
| Form services  | `*-form.ts`        | (introduce when a feature's reactive form grows large enough to extract) |
| Models         | `*.model.ts`       | `journal-entry.model.ts`     |

### Styling rule

No inline `style="..."` in templates and no inline `styles: [...]` in `@Component`
decorators. A style used by more than one component belongs in `src/styles/*.scss`; a
style specific to one component stays in that component's own `.scss` file.

### Adding a new feature

1. Create `features/<name>/` with `models/` and `services/` subfolders as needed —
   don't pre-create empty folders for concerns the feature doesn't have yet.
2. Put the main routed page component at `features/<name>/<name>.ts` (+ `.html`/`.scss`/
   `.spec.ts`). Sub-components go under `features/<name>/components/<sub-name>/`.
3. If the feature calls a backend endpoint, add `features/<name>/services/<name>-api.ts`.
   If it needs to be consumed by another feature, that's fine — the other feature imports
   it directly (see `ChartOfAccountsApi`, `MastersApi` above) rather than the endpoint
   being duplicated or hoisted into `core/`.
4. If the feature holds data that multiple parts of its own UI need to react to, add an
   RxJS `BehaviorSubject`-backed `features/<name>/services/<name>-state.ts` between the
   component and the API service (see `TestBalanceState` for the pattern).
5. Add the route to `app.routes.ts` (or the feature's own `<name>.routes.ts` if it has
   sub-routes) using `loadComponent`/`loadChildren` — every route is lazy-loaded.
6. Write specs alongside every new file. Run `npm run test:coverage` before committing.

---

## Prerequisites

| Tool           | Version   | Download / Install                                              |
|----------------|-----------|-----------------------------------------------------------------|
| Node.js        | >= 24.0.0 | https://nodejs.org                                              |
| NVM (optional) | Latest    | https://github.com/coreybutler/nvm-windows/releases             |
| Angular CLI    | >= 22.0.0 | `npm install -g @angular/cli`                                   |
| Backend        | Running   | Start `southlake_service` first — see its README                |

---

## Setup on a New Device

### Step 1 — Install Node.js

**Using NVM (recommended):**

```bash
nvm install 24
nvm use 24

# Verify
node --version    # v24.x.x
npm --version
```

**Without NVM:** Download Node.js 24 from https://nodejs.org.

---

### Step 2 — Install Dependencies

```bash
cd southlake_ui
npm install
```

---

### Step 3 — Configure the API URL

Open `src/environments/environment.ts` and set `apiUrl` to point at your running backend:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'   // Default — backend on the same machine
};
```

**If the backend is on a different machine (same network):**

```typescript
apiUrl: 'http://192.168.1.100:3000'   // Replace with the backend machine's IP
```

**For production**, update `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com'
};
```

---

### Step 4 — Start the Dev Server

```bash
npm run start
```

The app opens at **http://localhost:4200**.

Unauthenticated users are automatically redirected to `/auth/login` by the auth guard.

---

## Environment Configuration

| File                            | Purpose                          |
|---------------------------------|----------------------------------|
| `src/environments/environment.ts`      | Development — points to `http://localhost:3000` |
| `src/environments/environment.prod.ts` | Production — set to your live API URL |

Only `apiUrl` needs to be changed. Angular's build system automatically swaps the correct file based on the `--configuration` flag.

---

## Available Scripts

| Script                   | Description                                            |
|--------------------------|--------------------------------------------------------|
| `npm run start`          | Start Angular dev server at http://localhost:4200      |
| `npm run build`          | Build for development                                  |
| `npm run build:prod`     | Build an optimized production bundle (output: `dist/`) |
| `npm run lint`           | Run ESLint (zero warnings policy)                      |
| `npm run lint:fix`       | Auto-fix all fixable ESLint violations                 |
| `npm run format`         | Auto-format all TS, HTML, and SCSS files with Prettier |
| `npm run format:check`   | Check formatting without writing changes               |
| `npm run test`           | Run the Vitest suite in watch mode                     |
| `npm run test:ci`        | Run the Vitest suite once, with JUnit output           |
| `npm run test:coverage`  | Run the suite once and generate an lcov/HTML coverage report |

A Husky `pre-commit` hook runs `lint-staged` (ESLint `--fix` + Prettier) on staged
files automatically — a commit is blocked until staged `.ts`/`.html`/`.scss` files are
clean.

---

## Application Features

| Module                  | Description                                                              |
|-------------------------|--------------------------------------------------------------------------|
| **Authentication**      | Email + OTP two-factor login with JWT session management                 |
| **User Invitations**    | New users receive an email link and set their password on first access   |
| **User Management**     | List, invite, view, edit, and deactivate user accounts                   |
| **Roles & Permissions** | Create roles and assign per-module view/create/edit/delete permissions   |
| **Chart of Accounts**   | Browse the full COA hierarchy with account type classifications           |
| **Masters**             | Manage master data records                                               |
| **Activity Logs**       | View a complete audit trail of all user actions                          |

---

## Routing Map

| Path                                  | Component                  | Guard(s)                            |
|---------------------------------------|----------------------------|-------------------------------------|
| `/auth/login`                         | `LoginComponent`           | None                                |
| `/auth/otp`                           | `OtpComponent`             | None                                |
| `/auth/session-conflict`              | `SessionConflictComponent` | None                                |
| `/dashboard`                          | `DashboardComponent`       | `authGuard`                         |
| `/user-management/users`              | `UsersComponent`           | `authGuard`, `permissionGuard`      |
| `/user-management/roles`              | `RolesComponent`           | `authGuard`, `permissionGuard`      |
| `/user-management/activity-logs`      | `ActivityLogsComponent`    | `authGuard`, `permissionGuard`      |
| `/chart-of-accounts`                  | `ChartOfAccountsComponent` | `authGuard`, `permissionGuard`      |
| `/masters`                            | `MastersComponent`         | `authGuard`, `permissionGuard`      |
| `/`                                   | —                          | Redirect to `/dashboard`            |

---

## Authentication Flow

```
1. /auth/login
   → User enters email
   → POST /auth/login (backend sends OTP)
   → Navigate to /auth/otp

2. /auth/otp
   → User enters 6-digit OTP
   → POST /auth/verify-otp
       • token_type = 'session'   → Store token in localStorage → Navigate to /dashboard
       • token_type = 'challenge' → Navigate to /auth/session-conflict

3. /auth/session-conflict
   → User already logged in on another device
   → "Sign in here" → POST /auth/resolve-challenge { accept: true }
                    → Store new token → Navigate to /dashboard
   → "Cancel"       → Back to /auth/login

```

> `AuthService.getInviteDetails()` / `acceptInvite()` exist for a first-time-user
> invite-acceptance flow, but there is currently no routed page consuming them — this
> is a known gap, not a documentation error.

Session token is stored as `sl_session_token` in `localStorage`.
The `authInterceptor` automatically attaches `Authorization: Bearer <token>` to all outgoing requests.
On a `401` response the interceptor clears localStorage and redirects to `/auth/login`.

---

## Permissions and Route Protection

The app uses **two guards** working together:

### `authGuard`
- Checks if a valid session token exists in localStorage.
- If not, redirects to `/auth/login`.

### `permissionGuard(module, action)`
- Calls `GET /auth/me` on **every route navigation** to fetch the latest permissions from the server.
- Updates localStorage with the fresh data.
- If the user lacks the required permission (e.g., `view` on `user_management`), they are redirected to `/dashboard`.
- This ensures that permission changes made by the Super Admin are **immediately enforced** — even if the user is already logged in.

### Sidebar Visibility
- The sidebar reads permissions from localStorage on each navigation.
- Menu items are hidden if the user lacks `view` access for that module.
- Super Admin always has full access and is never restricted.

---

## Design System

All design tokens are defined as CSS custom properties in `src/styles/_variables.scss`:

| Token          | Value     | Usage                                          |
|----------------|-----------|------------------------------------------------|
| `--navy`       | `#0d1b4b` | Primary brand, sidebar, active states, headings |
| `--coral`      | `#e05470` | CTAs, active tab underline, auth title          |
| `--bg`         | `#f2f4f7` | Page background                                |
| `--green`      | `#2e7d32` | Active status badges, success toasts            |
| `--orange`     | `#e65100` | Warning states, pending invite badges           |
| `--red`        | `#c62828` | Error toasts, destructive action buttons        |
| `--blue`       | `#1565c0` | Info states, read-access indicators            |

**Font stack:** `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`

---

## Key Components

### OTP Input (`features/auth/otp/`)
- Six individual `<input>` elements with `inputmode="numeric"` and `maxlength="1"`.
- Typing a digit auto-focuses the next input.
- Backspace on an empty field moves focus back.
- Pasting a 6-digit string fills all inputs at once.
- All six filled triggers auto-submit.

### Slide Panels (`features/user-management/users/invite-panel/`, `user-detail-panel/`)
- Fixed panels anchored to the right edge of the screen.
- Opens with a CSS transition (`right: 0`) and a blurred backdrop.
- Closing plays the reverse slide-out transition.

### Permission Checklist (`features/user-management/roles/role-permissions-modal/`, `users/user-detail-panel/`)
- Replaces the grid matrix layout with a vertical scrollable checklist of flat permissions.
- **Grouped & Modular Structure**: Dynamically parses the flat database permission actions and groups checkboxes under module/resource headers (e.g. Chart of Accounts, Master Data, Activity Logs, Users).
- Toggling checkboxes updates role-level assignments or saves explicit user `grant` / `revoke` overrides to the backend.

### Session Conflict Dialog (`features/auth/session-conflict/`)
- Shows information about the existing session (device label, IP, created date).
- "Sign in here" calls `POST /auth/resolve-challenge` to displace the old session.
- "Cancel" returns the user to the login screen.

### Sidebar (`layout/sidebar/`)
- Dynamically hides/shows menu items based on the user's current permissions.
- Permissions are re-read from localStorage on every route navigation.
- Super Admin always sees all items.

---

## Code Quality

```bash
# Check for lint errors (zero warnings policy)
npm run lint

# Auto-fix all fixable lint violations
npm run lint:fix

# Format all TypeScript, HTML, and SCSS files
npm run format

# Check formatting without writing changes
npm run format:check

# Run unit tests once (CI mode) and generate coverage
npm run test:coverage
```

Every new file should ship with a spec. API services get `HttpTestingController`-based
specs (see `chart-of-accounts-api.spec.ts` for the pattern); components get
`TestBed`-based specs; RxJS state services get specs asserting on the observable
values after calling their methods (see `test-balance-state.spec.ts`).

**Recommended VS Code extensions:**

```bash
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension Angular.ng-template
```

The `.vscode/settings.json` enables:
- `editor.formatOnSave: true` (via Prettier)
- `source.fixAll.eslint: "explicit"` (ESLint auto-fix on save)
- `eslint.useFlatConfig: true` (ESLint 9 flat config mode)

---

## Generating New Components

Always use the Angular CLI so the correct file structure is created:

```bash
# Feature component
ng generate component features/my-feature/my-component

# Sub-component nested under a feature
ng generate component features/my-feature/components/my-widget

# Shared component
ng generate component shared/components/my-widget

# Layout component
ng generate component layout/my-panel
```

This Angular version's default schematic (matching the no-suffix convention used
throughout this codebase — see [Naming conventions](#project-structure)) creates four
files without a `.component.` infix:
- `my-widget.ts` — class + metadata (class name `MyWidget`, no `Component` suffix)
- `my-widget.html` — template
- `my-widget.scss` — component styles
- `my-widget.spec.ts` — unit test shell

Do not pass `--standalone` or `--style=scss` — both are already the project defaults
(`angular.json` → `schematics`).

---

## Troubleshooting

### App shows blank screen or fails to load

**Check:**
1. Make sure `southlake_service` backend is running on port 3000.
2. Verify `apiUrl` in `src/environments/environment.ts` is correct.
3. Open the browser DevTools (F12) → Console for error messages.

---

### CORS error in the browser console

**Fix:**
1. Confirm the backend is running.
2. Make sure `apiUrl` matches the backend's actual host and port (no trailing slash).
3. If backend and frontend run on **different machines**, use the backend machine's IP address — not `localhost`.

---

### Permissions not updating after Super Admin makes changes

**Fix:**
1. The affected user should click any sidebar link to trigger a route navigation.
2. The `permissionGuard` automatically calls `/auth/me` on every navigation to fetch fresh permissions.
3. If still not reflected, the user can hard-refresh with **Ctrl + Shift + R**.

---

### npm install fails

```bash
npm cache clean --force
npm install
```

Verify the Node.js version:

```bash
node --version   # Must be v24.x.x or higher
```

---

### Cannot find module error after pulling changes

```bash
npm install
```

New dependencies may have been added by another developer.

---

### Multiple Carriers, Reinsurers, & MGA Filters (Added June 2026)
* **Multiple Carriers & Reinsurers**: The Treaty creation and edit modals now support dynamic addition of multiple Carrier Companies (with individual retention percentages) and Reinsurer Companies (with cession percentages).
* **MGA filter dropdown**: A select dropdown was added on the Treaties master list to quickly filter records client-side by active underwriters.
* **Truncated Writing States list**: Treaties with large lists of writing states are now cleanly truncated after 5 states (e.g. `3, 51, 6 (+26 more)`) with a native hover tooltip showing the complete list to keep list tables compact.

---

---

## Documentation

| File | Description |
|------|-------------|
| [`docs/view-modal-data-flow-analysis.pdf`](./docs/view-modal-data-flow-analysis.pdf) | Complete data flow trace of the View modal feature across all 11 Masters entities (15-page PDF) |
| [`docs/view-modal-data-flow-analysis.md`](./docs/view-modal-data-flow-analysis.md) | Same analysis in Markdown format |

*Last updated: July 2026*
