# southlake-ui

Angular 22 frontend for the **Southlake Insurance** accounting platform.
Covers the **User Management** domain: login (email OTP), single-device conflict handling, user list, invite flow, roles and permissions matrix, and activity audit log.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Angular 22 (standalone components throughout) |
| Styling | Custom SCSS per component (no Angular Material) |
| Forms | Angular Reactive Forms |
| HTTP | Angular HttpClient with functional interceptor |
| Routing | Angular Router with lazy-loaded feature routes |
| Auth | Email OTP + opaque session token (stored in `localStorage`) |
| Linting | ESLint 9 (flat config) + `angular-eslint` + Prettier 3 |

---

## Prerequisites

- Node.js >= 24
- Angular CLI >= 22 (`npm install -g @angular/cli@^22`)
- `southlake_service` backend running at `http://localhost:3000`

---

## Quick start

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Start the dev server
npm start
```

The app is available at `http://localhost:4200`.
Unauthenticated users are redirected to `/auth/login` by the auth guard.

For production:
```bash
npm run build:prod
# Output in dist/southlake_ui/
```

---

## Generating new components

Always use the Angular CLI to generate new components so the correct file structure is created automatically:

```bash
# Feature component
ng generate component features/auth/my-feature --standalone --style=scss

# Shared component
ng generate component shared/components/my-widget --standalone --style=scss

# Layout component
ng generate component layout/my-panel --standalone --style=scss
```

Each `ng generate component` call creates four files:
- `my-component.component.ts` (class + metadata pointing at `templateUrl` / `styleUrl`)
- `my-component.component.html` (template)
- `my-component.component.scss` (styles)
- `my-component.component.spec.ts` (unit test)

---

## Environment config

| File | `apiUrl` |
|---|---|
| `src/environments/environment.ts` | `http://localhost:3000/api` |
| `src/environments/environment.prod.ts` | Set to your production API URL |

Edit `src/environments/environment.ts` to point at a different backend.

---

## Project structure

Every component follows the Angular CLI scaffold pattern:
`<name>.component.ts` + `<name>.component.html` + `<name>.component.scss` + `<name>.component.spec.ts`

```
src/
├── main.ts                               Bootstrap entry point
├── index.html
├── styles.scss                           Global reset + @use partials
├── styles/
│   ├── _variables.scss                   All CSS custom properties (:root)
│   ├── _auth.scss                        Two-panel login / OTP / conflict pages
│   ├── _layout.scss                      Sidebar, header, app shell
│   ├── _components.scss                  Toast, slide panels, modals, buttons, badges
│   └── _user-management.scss             Stats grid, table, permission matrix
│
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
│
└── app/
    ├── app.config.ts                     provideRouter, provideHttpClient (+ interceptor)
    ├── app.routes.ts                     Top-level routes (lazy feature routes)
    ├── app.component.ts / .html / .scss / .spec.ts
    │
    ├── core/
    │   ├── models/                       TypeScript interfaces
    │   │   ├── user.model.ts
    │   │   ├── role.model.ts
    │   │   ├── permission.model.ts
    │   │   ├── session.model.ts
    │   │   └── activity-log.model.ts
    │   ├── services/                     Injectable API service wrappers
    │   │   ├── auth.service.ts
    │   │   ├── users.service.ts
    │   │   ├── roles.service.ts
    │   │   ├── permissions.service.ts
    │   │   └── activity-logs.service.ts
    │   ├── guards/
    │   │   └── auth.guard.ts             Functional CanActivateFn
    │   └── interceptors/
    │       └── auth.interceptor.ts       Attaches Bearer token; redirects on 401
    │
    ├── shared/
    │   └── components/
    │       ├── toast/
    │       │   ├── toast.service.ts
    │       │   ├── toast.component.ts
    │       │   ├── toast.component.html
    │       │   ├── toast.component.scss
    │       │   └── toast.component.spec.ts
    │       ├── confirm-dialog/
    │       │   ├── confirm-dialog.component.ts
    │       │   ├── confirm-dialog.component.html
    │       │   ├── confirm-dialog.component.scss
    │       │   └── confirm-dialog.component.spec.ts
    │       └── loading-spinner/
    │           ├── loading-spinner.component.ts
    │           ├── loading-spinner.component.html
    │           ├── loading-spinner.component.scss
    │           └── loading-spinner.component.spec.ts
    │
    ├── layout/
    │   ├── main-layout/
    │   │   ├── main-layout.component.ts
    │   │   ├── main-layout.component.html
    │   │   ├── main-layout.component.scss
    │   │   └── main-layout.component.spec.ts
    │   ├── sidebar/
    │   │   ├── sidebar.component.ts
    │   │   ├── sidebar.component.html
    │   │   ├── sidebar.component.scss
    │   │   └── sidebar.component.spec.ts
    │   └── header/
    │       ├── header.component.ts
    │       ├── header.component.html
    │       ├── header.component.scss
    │       └── header.component.spec.ts
    │
    └── features/
        ├── auth/
        │   ├── auth.routes.ts
        │   ├── login/
        │   │   ├── login.component.ts
        │   │   ├── login.component.html
        │   │   ├── login.component.scss
        │   │   └── login.component.spec.ts
        │   ├── otp/
        │   │   ├── otp.component.ts
        │   │   ├── otp.component.html
        │   │   ├── otp.component.scss
        │   │   └── otp.component.spec.ts
        │   └── session-conflict/
        │       ├── session-conflict.component.ts
        │       ├── session-conflict.component.html
        │       ├── session-conflict.component.scss
        │       └── session-conflict.component.spec.ts
        │
        ├── dashboard/
        │   ├── dashboard.component.ts
        │   ├── dashboard.component.html
        │   ├── dashboard.component.scss
        │   └── dashboard.component.spec.ts
        │
        └── user-management/
            ├── user-management.routes.ts
            ├── users/
            │   ├── users.component.ts            Stats cards, tab bar, search/filter
            │   ├── users.component.html
            │   ├── users.component.scss
            │   ├── users.component.spec.ts
            │   ├── users-table/
            │   │   ├── users-table.component.ts  Table with avatar, role badge, bulk select
            │   │   ├── users-table.component.html
            │   │   ├── users-table.component.scss
            │   │   └── users-table.component.spec.ts
            │   ├── invite-panel/
            │   │   ├── invite-panel.component.ts  468px slide panel, reactive form
            │   │   ├── invite-panel.component.html
            │   │   ├── invite-panel.component.scss
            │   │   └── invite-panel.component.spec.ts
            │   ├── user-detail-panel/
            │   │   ├── user-detail-panel.component.ts  Profile + Permissions tabs
            │   │   ├── user-detail-panel.component.html
            │   │   ├── user-detail-panel.component.scss
            │   │   └── user-detail-panel.component.spec.ts
            │   └── user-status-badge/
            │       ├── user-status-badge.component.ts   active / inactive / pending pills
            │       ├── user-status-badge.component.html
            │       ├── user-status-badge.component.scss
            │       └── user-status-badge.component.spec.ts
            ├── roles/
            │   ├── roles.component.ts             Card grid, create / edit / delete
            │   ├── roles.component.html
            │   ├── roles.component.scss
            │   ├── roles.component.spec.ts
            │   └── role-permissions-modal/
            │       ├── role-permissions-modal.component.ts  12-action x 9-module matrix
            │       ├── role-permissions-modal.component.html
            │       ├── role-permissions-modal.component.scss
            │       └── role-permissions-modal.component.spec.ts
            └── activity-logs/
                ├── activity-logs.component.ts     Table, pagination, action filters
                ├── activity-logs.component.html
                ├── activity-logs.component.scss
                └── activity-logs.component.spec.ts
```

---

## Authentication flow

```
/auth/login
  POST /api/auth/request-otp { email }
  navigate to /auth/otp (email in router state)

/auth/otp
  POST /api/auth/verify-otp { email, otp, device_label }
  token_type === 'session'   -> store token, navigate to /user-management/users
  token_type === 'challenge' -> navigate to /auth/session-conflict (challenge data in state)

/auth/session-conflict
  "Sign in here" -> POST /api/auth/resolve-challenge { challenge_token, accept: true }
                 -> store new token, navigate to /user-management/users
  "Cancel"       -> navigate back to /auth/login
```

Session token is stored as `sl_session_token` in `localStorage`.
The `AuthInterceptor` adds `Authorization: Bearer <token>` to every outbound request.
On a `401` response the interceptor clears storage and redirects to `/auth/login`.

---

## Design system

All visual tokens live in `src/styles/_variables.scss` as CSS custom properties:

| Token | Value | Usage |
|---|---|---|
| `--navy` | `#0d1b4b` | Primary brand, sidebar active, headings |
| `--coral` | `#e05470` | CTAs, active tab underline, auth title |
| `--bg` | `#f2f4f7` | Page background |
| `--green` | `#2e7d32` | Active status, success toasts |
| `--orange` | `#e65100` | Warning, pending invites |
| `--red` | `#c62828` | Error toasts, destructive actions |
| `--blue` | `#1565c0` | Info, read-access badges |

Font stack: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`

---

## Key component notes

### OTP inputs (`otp/otp.component.ts`)
Six individual `<input>` elements with `inputmode="numeric"` and `maxlength="1"`.
- Typing a digit auto-focuses the next input.
- Backspace on an empty input moves focus back.
- Pasting a 6-digit string distributes digits across all inputs.
- All six filled triggers auto-submit.

### Slide panels (`invite-panel/`, `user-detail-panel/`)
Fixed panel anchored to the right, off-screen by default (`right: -500px`).
Opens with a CSS transition (`right: 0`) and a blurred backdrop overlay.
Closing plays the reverse transition.

### Permission matrix (`role-permissions-modal/`)
Rows are modules (9), columns are actions (12: view, create, edit, approve, export, post, file, lock, override, reconcile, void, reverse).
Each row has **Full / Read / None** preset buttons.
Four summary cards at the top count modules by access level.

### Single-device conflict dialog (`session-conflict/`)
Receives `{ challenge_token, existing_device: { label, ip_address, created_at } }` via router state.
"Sign in here" calls `POST /api/auth/resolve-challenge` with `accept: true`, displacing the old session.

---

## Routing map

| Path | Component | Guard |
|---|---|---|
| `/auth/login` | `LoginComponent` | none |
| `/auth/otp` | `OtpComponent` | none |
| `/auth/session-conflict` | `SessionConflictComponent` | none |
| `/user-management/users` | `UsersComponent` | `authGuard` |
| `/user-management/roles` | `RolesComponent` | `authGuard` |
| `/user-management/activity-logs` | `ActivityLogsComponent` | `authGuard` |
| `/` | redirect | to `/user-management/users` |

---

## Code quality

```bash
# Check for lint errors (zero warnings policy)
npm run lint

# Auto-fix all fixable lint violations
npm run lint:fix

# Format all TS, HTML, and SCSS files with Prettier
npm run format

# Check formatting without writing
npm run format:check
```

VSCode auto-formats and auto-fixes on save. Install the recommended extensions once:

```bash
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension Angular.ng-template
```

The `.vscode/settings.json` in this repo enables:
- `editor.formatOnSave: true` (Prettier)
- `source.fixAll.eslint: "explicit"` (ESLint auto-fix on save)
- ESLint flat config mode (`eslint.useFlatConfig: true`)
